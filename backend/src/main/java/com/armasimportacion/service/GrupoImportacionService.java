package com.armasimportacion.service;

import com.armasimportacion.dto.GrupoImportacionResumenDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionCupo;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.dto.GrupoImportacionCreateDTO;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.GrupoImportacionCupoRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.GrupoImportacionVendedorRepository;
import com.armasimportacion.repository.GrupoImportacionLimiteCategoriaRepository;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.GrupoImportacionVendedor;
import com.armasimportacion.model.GrupoImportacionLimiteCategoria;
import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoClienteGrupo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionService {
    
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final GrupoImportacionCupoRepository cupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final DocumentoClienteService documentoClienteService;
    private final PedidoArmasGrupoImportacionService pedidoArmasService;
    private final DocumentoGrupoImportacionService documentoGrupoImportacionService;
    private final com.armasimportacion.repository.LicenciaRepository licenciaRepository;
    private final com.armasimportacion.repository.TipoProcesoRepository tipoProcesoRepository;
    private final GrupoImportacionVendedorRepository grupoImportacionVendedorRepository;
    private final GrupoImportacionLimiteCategoriaRepository grupoImportacionLimiteCategoriaRepository;
    private final com.armasimportacion.repository.CategoriaArmaRepository categoriaArmaRepository;
    // CRUD Operations
    public GrupoImportacion crearGrupoDesdeDTO(GrupoImportacionCreateDTO dto, Long usuarioId) {
        log.info("Creando nuevo grupo de importación desde DTO: {}", dto.getNombre());
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        Licencia licencia = licenciaRepository.findById(dto.getLicenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada"));
        
        // Verificar que la licencia esté activa y no vencida
        // NOTA: Una licencia puede estar en múltiples grupos (tanto CUPO como JUSTIFICATIVO)
        // Por lo tanto, NO bloqueamos la licencia al crear un grupo
        if (Boolean.FALSE.equals(licencia.getEstado()) || licencia.isVencida()) {
            throw new BadRequestException("La licencia seleccionada no está activa o está vencida");
        }
        
        // Tipo de proceso: opcional - los grupos pueden tener cualquier tipo de cliente
        TipoProceso tipoProceso = null;
        if (dto.getTipoProcesoId() != null) {
            tipoProceso = tipoProcesoRepository.findById(dto.getTipoProcesoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de proceso no encontrado"));
            log.info("📋 Tipo de proceso asignado: {}", tipoProceso.getNombre());
        } else {
            log.info("ℹ️ No se asignó tipo de proceso - el grupo puede tener cualquier tipo de cliente");
        }
        
        // Calcular cupos desde la licencia
        int cupoTotal = (licencia.getCupoCivil() != null ? licencia.getCupoCivil() : 0) +
                       (licencia.getCupoMilitar() != null ? licencia.getCupoMilitar() : 0) +
                       (licencia.getCupoEmpresa() != null ? licencia.getCupoEmpresa() : 0) +
                       (licencia.getCupoDeportista() != null ? licencia.getCupoDeportista() : 0);
        
        // Fecha de inicio: usar la fecha actual si no se proporciona
        LocalDate fechaInicio = dto.getFechaInicio() != null ? dto.getFechaInicio() : LocalDate.now();
        
        GrupoImportacion grupo = new GrupoImportacion();
        grupo.setNombre(dto.getNombre());
        grupo.setDescripcion(dto.getDescripcion());
        grupo.setLicencia(licencia);
        grupo.setTipoProceso(tipoProceso);
        grupo.setFechaInicio(fechaInicio);
        grupo.setFechaFin(dto.getFechaFin()); // Se establecerá automáticamente al finalizar
        grupo.setCupoTotal(cupoTotal);
        grupo.setCupoDisponible(cupoTotal); // Inicialmente todo el cupo está disponible
        grupo.setObservaciones(dto.getObservaciones());
        
        // Generar código automático si no se proporciona
        if (dto.getCodigo() == null || dto.getCodigo().trim().isEmpty()) {
            grupo.setCodigo(generarCodigoAutomatico());
        } else {
            // Validar que el código no exista
            if (grupoImportacionRepository.existsByCodigo(dto.getCodigo())) {
                throw new BadRequestException("Ya existe un grupo con el código: " + dto.getCodigo());
            }
            grupo.setCodigo(dto.getCodigo());
        }
        
        grupo.setUsuarioCreador(usuario);
        grupo.setEstado(EstadoGrupoImportacion.EN_PREPARACION);
        grupo.setFechaCreacion(LocalDateTime.now());
        
        // Nuevos campos: tipo_grupo y tra
        if (dto.getTipoGrupo() != null && !dto.getTipoGrupo().trim().isEmpty()) {
            if (!dto.getTipoGrupo().equals("CUPO") && !dto.getTipoGrupo().equals("JUSTIFICATIVO")) {
                throw new BadRequestException("El tipo de grupo debe ser 'CUPO' o 'JUSTIFICATIVO'");
            }
            grupo.setTipoGrupo(dto.getTipoGrupo());
        } else {
            grupo.setTipoGrupo("CUPO"); // Valor por defecto
        }
        
        // Generar TRA si se proporciona
        if (dto.getTra() != null && !dto.getTra().trim().isEmpty()) {
            // Validar formato TRA-XXXXXXXXXX
            if (!dto.getTra().matches("TRA-\\d+")) {
                throw new BadRequestException("El formato de TRA debe ser TRA- seguido de números (ej: TRA-1212121212)");
            }
            // Verificar que no exista otro grupo con el mismo TRA
            if (grupoImportacionRepository.existsByTra(dto.getTra())) {
                throw new BadRequestException("Ya existe un grupo con el TRA: " + dto.getTra());
            }
            grupo.setTra(dto.getTra());
        }
        
        // NOTA: NO bloqueamos la licencia porque puede estar en múltiples grupos
        // (tanto CUPO como JUSTIFICATIVO). La licencia se mantiene DISPONIBLE.
        
        // Guardar el grupo primero para tener el ID
        GrupoImportacion grupoGuardado = grupoImportacionRepository.save(grupo);
        
        // Asignar vendedores si se proporcionan
        if (dto.getVendedores() != null && !dto.getVendedores().isEmpty()) {
            int sumaLimites = 0;
            
            for (GrupoImportacionCreateDTO.VendedorLimiteDTO vendedorLimite : dto.getVendedores()) {
                Usuario vendedor = usuarioRepository.findById(vendedorLimite.getVendedorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado con ID: " + vendedorLimite.getVendedorId()));
                
                // Verificar que el usuario tenga rol VENDOR
                boolean esVendedor = vendedor.getRoles().stream()
                    .anyMatch(rol -> "VENDOR".equals(rol.getCodigo()));
                
                if (!esVendedor) {
                    throw new BadRequestException("El usuario con ID " + vendedorLimite.getVendedorId() + " no es un vendedor");
                }
                
                // Validar límite de armas
                Integer limiteArmas = vendedorLimite.getLimiteArmas() != null ? vendedorLimite.getLimiteArmas() : 0;
                if (limiteArmas < 0) {
                    throw new BadRequestException("El límite de armas no puede ser negativo");
                }
                
                // Si es tipo CUPO, validar que la suma de límites no exceda el cupo total
                if ("CUPO".equals(grupoGuardado.getTipoGrupo())) {
                    sumaLimites += limiteArmas;
                    if (sumaLimites > grupoGuardado.getCupoTotal()) {
                        throw new BadRequestException(
                            String.format("La suma de límites de armas por vendedor (%d) excede el cupo total del grupo (%d)", 
                                sumaLimites, grupoGuardado.getCupoTotal()));
                    }
                }
                
                GrupoImportacionVendedor grupoVendedor = new GrupoImportacionVendedor();
                grupoVendedor.setGrupoImportacion(grupoGuardado);
                grupoVendedor.setVendedor(vendedor);
                grupoVendedor.setLimiteArmas(limiteArmas);
                grupoImportacionVendedorRepository.save(grupoVendedor);
            }
            log.info("✅ {} vendedor(es) asignado(s) al grupo con límites de armas", dto.getVendedores().size());
        }
        
        // Asignar límites por categoría si es tipo CUPO
        if ("CUPO".equals(grupoGuardado.getTipoGrupo()) && dto.getLimitesCategoria() != null && !dto.getLimitesCategoria().isEmpty()) {
            for (GrupoImportacionCreateDTO.LimiteCategoriaDTO limiteDTO : dto.getLimitesCategoria()) {
                CategoriaArma categoria = categoriaArmaRepository.findById(limiteDTO.getCategoriaArmaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría de arma no encontrada con ID: " + limiteDTO.getCategoriaArmaId()));
                
                GrupoImportacionLimiteCategoria limite = new GrupoImportacionLimiteCategoria();
                limite.setGrupoImportacion(grupoGuardado);
                limite.setCategoriaArma(categoria);
                limite.setLimiteMaximo(limiteDTO.getLimiteMaximo());
                grupoImportacionLimiteCategoriaRepository.save(limite);
            }
            log.info("✅ {} límite(s) de categoría asignado(s) al grupo", dto.getLimitesCategoria().size());
        }
        
        return grupoGuardado;
    }
    
    public GrupoImportacion crearGrupoImportacion(GrupoImportacion grupo, Long usuarioId) {
        log.info("Creando nuevo grupo de importación: {}", grupo.getCodigo());
        
        // Validaciones
        if (grupoImportacionRepository.existsByCodigo(grupo.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupo.getCodigo());
        }
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Generar código automático si no se proporciona
        if (grupo.getCodigo() == null || grupo.getCodigo().trim().isEmpty()) {
            grupo.setCodigo(generarCodigoAutomatico());
        }
        
        grupo.setUsuarioCreador(usuario);
        grupo.setEstado(EstadoGrupoImportacion.BORRADOR);
        grupo.setFechaCreacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    /**
     * Actualiza un grupo de importación desde un DTO (para edición de vendedores y límites)
     */
    public GrupoImportacion actualizarGrupoDesdeDTO(Long id, GrupoImportacionCreateDTO dto, Long usuarioId) {
        log.info("✏️ Actualizando grupo de importación ID {} desde DTO", id);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Actualizar campos básicos si se proporcionan
        if (dto.getNombre() != null && !dto.getNombre().trim().isEmpty()) {
            grupo.setNombre(dto.getNombre());
        }
        if (dto.getDescripcion() != null) {
            grupo.setDescripcion(dto.getDescripcion());
        }
        if (dto.getObservaciones() != null) {
            grupo.setObservaciones(dto.getObservaciones());
        }
        
        // Actualizar tipo_grupo si se proporciona
        if (dto.getTipoGrupo() != null && !dto.getTipoGrupo().trim().isEmpty()) {
            if (!dto.getTipoGrupo().equals("CUPO") && !dto.getTipoGrupo().equals("JUSTIFICATIVO")) {
                throw new BadRequestException("El tipo de grupo debe ser 'CUPO' o 'JUSTIFICATIVO'");
            }
            grupo.setTipoGrupo(dto.getTipoGrupo());
        }
        
        // Actualizar TRA si se proporciona
        if (dto.getTra() != null && !dto.getTra().trim().isEmpty()) {
            // Validar formato TRA-XXXXXXXXXX
            if (!dto.getTra().matches("TRA-\\d+")) {
                throw new BadRequestException("El formato de TRA debe ser TRA- seguido de números (ej: TRA-1212121212)");
            }
            // Verificar que no exista otro grupo con el mismo TRA (excepto el actual)
            Optional<GrupoImportacion> grupoConTra = grupoImportacionRepository.findByTra(dto.getTra());
            if (grupoConTra.isPresent() && !grupoConTra.get().getId().equals(id)) {
                throw new BadRequestException("Ya existe otro grupo con el TRA: " + dto.getTra());
            }
            grupo.setTra(dto.getTra());
        }
        
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        // Guardar cambios básicos
        GrupoImportacion grupoGuardado = grupoImportacionRepository.save(grupo);
        
        // Actualizar vendedores: eliminar todos y crear nuevos
        if (dto.getVendedores() != null) {
            // Eliminar vendedores existentes
            grupoImportacionVendedorRepository.deleteByGrupoImportacion(grupoGuardado);
            
            // Agregar nuevos vendedores con límites
            if (!dto.getVendedores().isEmpty()) {
                int sumaLimites = 0;
                
                for (GrupoImportacionCreateDTO.VendedorLimiteDTO vendedorLimite : dto.getVendedores()) {
                    Usuario vendedor = usuarioRepository.findById(vendedorLimite.getVendedorId())
                        .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado con ID: " + vendedorLimite.getVendedorId()));
                    
                    // Verificar que el usuario tenga rol VENDOR
                    boolean esVendedor = vendedor.getRoles().stream()
                        .anyMatch(rol -> "VENDOR".equals(rol.getCodigo()));
                    
                    if (!esVendedor) {
                        throw new BadRequestException("El usuario con ID " + vendedorLimite.getVendedorId() + " no es un vendedor");
                    }
                    
                    // Validar límite de armas
                    Integer limiteArmas = vendedorLimite.getLimiteArmas() != null ? vendedorLimite.getLimiteArmas() : 0;
                    if (limiteArmas < 0) {
                        throw new BadRequestException("El límite de armas no puede ser negativo");
                    }
                    
                    // Si es tipo CUPO, validar que la suma de límites no exceda el cupo total
                    if ("CUPO".equals(grupoGuardado.getTipoGrupo())) {
                        sumaLimites += limiteArmas;
                        if (sumaLimites > grupoGuardado.getCupoTotal()) {
                            throw new BadRequestException(
                                String.format("La suma de límites de armas por vendedor (%d) excede el cupo total del grupo (%d)", 
                                    sumaLimites, grupoGuardado.getCupoTotal()));
                        }
                    }
                    
                    GrupoImportacionVendedor grupoVendedor = new GrupoImportacionVendedor();
                    grupoVendedor.setGrupoImportacion(grupoGuardado);
                    grupoVendedor.setVendedor(vendedor);
                    grupoVendedor.setLimiteArmas(limiteArmas);
                    grupoImportacionVendedorRepository.save(grupoVendedor);
                }
                log.info("✅ {} vendedor(es) actualizado(s) en el grupo con límites de armas", dto.getVendedores().size());
            }
        }
        
        // Actualizar límites por categoría: eliminar todos y crear nuevos (solo para tipo CUPO)
        if ("CUPO".equals(grupoGuardado.getTipoGrupo()) && dto.getLimitesCategoria() != null) {
            // Eliminar límites existentes
            grupoImportacionLimiteCategoriaRepository.deleteByGrupoImportacion(grupoGuardado);
            
            // Agregar nuevos límites
            if (!dto.getLimitesCategoria().isEmpty()) {
                for (GrupoImportacionCreateDTO.LimiteCategoriaDTO limiteDTO : dto.getLimitesCategoria()) {
                    CategoriaArma categoria = categoriaArmaRepository.findById(limiteDTO.getCategoriaArmaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Categoría de arma no encontrada con ID: " + limiteDTO.getCategoriaArmaId()));
                    
                    GrupoImportacionLimiteCategoria limite = new GrupoImportacionLimiteCategoria();
                    limite.setGrupoImportacion(grupoGuardado);
                    limite.setCategoriaArma(categoria);
                    limite.setLimiteMaximo(limiteDTO.getLimiteMaximo());
                    grupoImportacionLimiteCategoriaRepository.save(limite);
                }
                log.info("✅ {} límite(s) de categoría actualizado(s) en el grupo", dto.getLimitesCategoria().size());
            }
        }
        
        return grupoGuardado;
    }
    
    public GrupoImportacion actualizarGrupoImportacion(Long id, GrupoImportacion grupoActualizado, Long usuarioId) {
        log.info("Actualizando grupo de importación con ID: {}", id);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar código único si cambió
        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }
        
        // Actualizar campos
        grupo.setCodigo(grupoActualizado.getCodigo());
        grupo.setDescripcion(grupoActualizado.getDescripcion());
        grupo.setFechaEstimadaLlegada(grupoActualizado.getFechaEstimadaLlegada());
        grupo.setCostoTotal(grupoActualizado.getCostoTotal());
        grupo.setObservaciones(grupoActualizado.getObservaciones());
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    @Transactional(readOnly = true)
    public GrupoImportacion obtenerGrupoImportacion(Long id) {
        // Cargar el grupo con la licencia usando JOIN FETCH para evitar LazyInitializationException
        return grupoImportacionRepository.findById(id)
                .map(grupo -> {
                    // Forzar la carga de la licencia si es LAZY
                    if (grupo.getLicencia() != null) {
                        grupo.getLicencia().getId(); // Trigger lazy load
                    }
                    // Forzar la carga de vendedores y límites
                    if (grupo.getVendedores() != null) {
                        grupo.getVendedores().size(); // Trigger lazy load
                        grupo.getVendedores().forEach(gv -> {
                            if (gv.getVendedor() != null) {
                                gv.getVendedor().getId(); // Trigger lazy load
                            }
                        });
                    }
                    if (grupo.getLimitesCategoria() != null) {
                        grupo.getLimitesCategoria().size(); // Trigger lazy load
                        grupo.getLimitesCategoria().forEach(gl -> {
                            if (gl.getCategoriaArma() != null) {
                                gl.getCategoriaArma().getId(); // Trigger lazy load
                            }
                        });
                    }
                    return grupo;
                })
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
    }
    
    public Page<GrupoImportacion> obtenerGruposImportacion(Pageable pageable) {
        return grupoImportacionRepository.findAll(pageable);
    }
    
    public Page<GrupoImportacion> findAll(Pageable pageable) {
        return grupoImportacionRepository.findAll(pageable);
    }
    
    public GrupoImportacion findById(Long id) {
        return grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
    }
    
    public GrupoImportacion create(GrupoImportacion grupoImportacion) {
        log.info("Creando nuevo grupo de importación: {}", grupoImportacion.getCodigo());
        
        // Validaciones
        if (grupoImportacionRepository.existsByCodigo(grupoImportacion.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoImportacion.getCodigo());
        }
        
        // Generar código automático si no se proporciona
        if (grupoImportacion.getCodigo() == null || grupoImportacion.getCodigo().trim().isEmpty()) {
            grupoImportacion.setCodigo(generarCodigoAutomatico());
        }
        
        grupoImportacion.setEstado(EstadoGrupoImportacion.BORRADOR);
        grupoImportacion.setFechaCreacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupoImportacion);
    }
    
    public GrupoImportacion update(Long id, GrupoImportacion grupoActualizado) {
        log.info("Actualizando grupo de importación con ID: {}", id);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
        
        // Validar código único si cambió
        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }
        
        // Actualizar campos
        grupo.setCodigo(grupoActualizado.getCodigo());
        grupo.setDescripcion(grupoActualizado.getDescripcion());
        grupo.setFechaEstimadaLlegada(grupoActualizado.getFechaEstimadaLlegada());
        grupo.setCostoTotal(grupoActualizado.getCostoTotal());
        grupo.setObservaciones(grupoActualizado.getObservaciones());
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    public void eliminarGrupoImportacion(Long id) {
        if (!grupoImportacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id);
        }
        grupoImportacionRepository.deleteById(id);
    }
    
    // Business Logic
    public List<GrupoImportacion> obtenerGruposActivos() {
        return grupoImportacionRepository.findGruposActivos();
    }
    
    public List<GrupoImportacion> obtenerGruposCompletos() {
        return grupoImportacionRepository.findGruposCompletos();
    }
    
    public List<GrupoImportacion> obtenerGruposIncompletos() {
        return grupoImportacionRepository.findGruposIncompletos();
    }
    
    public void cambiarEstado(Long id, EstadoGrupoImportacion nuevoEstado) {
        // Método legacy - usar cambiarEstado(Long, EstadoGrupoImportacion, Long) cuando sea posible
        cambiarEstado(id, nuevoEstado, null);
    }
    
    // Gestión de Clientes
    public void agregarCliente(Long grupoId, Long clienteId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        // Verificar que el cliente no esté ya asignado a este grupo
        if (clienteGrupoRepository.existsByClienteAndGrupoImportacion(cliente, grupo)) {
            throw new BadRequestException("El cliente ya está asignado a este grupo");
        }
        
        // Verificar que el cliente no esté asignado a otro grupo activo
        List<ClienteGrupoImportacion> asignacionesExistentes = clienteGrupoRepository.findByClienteId(clienteId);
        boolean tieneGrupoActivo = asignacionesExistentes.stream()
                .anyMatch(cgi -> cgi.getEstado() != EstadoClienteGrupo.COMPLETADO 
                              && cgi.getEstado() != EstadoClienteGrupo.CANCELADO);
        
        if (tieneGrupoActivo) {
            throw new BadRequestException("El cliente ya está asignado a otro grupo de importación activo. " +
                    "Un cliente solo puede estar en un grupo a la vez.");
        }
        
        // Verificar que el cliente no tenga armas en estado ASIGNADA
        // Si tiene armas asignadas, está en pasos finales y no puede ser agregado a un grupo
        List<ClienteArma> armasAsignadas = clienteArmaRepository.findByClienteIdAndEstado(
                clienteId, ClienteArma.EstadoClienteArma.ASIGNADA);
        
        if (!armasAsignadas.isEmpty()) {
            throw new BadRequestException("El cliente tiene armas en estado ASIGNADA. " +
                    "Los clientes con armas asignadas están en los pasos finales del proceso " +
                    "y no pueden ser agregados a grupos de importación. " +
                    "Solo clientes con armas en estado RESERVADA pueden ser agregados.");
        }
        
        // Verificar que el cliente tenga todos sus documentos obligatorios completos
        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(clienteId);
        if (!documentosCompletos) {
            throw new BadRequestException("El cliente no tiene todos sus documentos obligatorios completos. " +
                    "Debe cargar y aprobar todos los documentos requeridos antes de ser asignado a un grupo de importación.");
        }
        
        // VALIDACIÓN CRÍTICA: Verificar que el tipo de cliente sea compatible con el tipo de grupo
        String tipoGrupo = grupo.getTipoGrupo();
        if (tipoGrupo == null) {
            tipoGrupo = "CUPO"; // Valor por defecto si no está definido
        }
        
        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            throw new BadRequestException("El cliente no tiene un tipo de cliente definido");
        }
        
        boolean esCompatible = false;
        String mensajeError = "";
        
        if ("CUPO".equals(tipoGrupo)) {
            // CUPO: para civiles, deportistas y uniformados en servicio PASIVO
            if (tipoCliente.esCivil()) {
                esCompatible = true;
            } else if (tipoCliente.esDeportista()) {
                esCompatible = true;
            } else if (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                      cliente.getEstadoMilitar().name().equals("PASIVO")) {
                esCompatible = true;
            } else {
                mensajeError = "Los grupos de tipo CUPO solo pueden incluir: Civiles, Deportistas y Uniformados en servicio PASIVO. " +
                              "Este cliente es: " + tipoCliente.getNombre() + 
                              (cliente.getEstadoMilitar() != null ? " (Estado: " + cliente.getEstadoMilitar().name() + ")" : "");
            }
        } else if ("JUSTIFICATIVO".equals(tipoGrupo)) {
            // JUSTIFICATIVO: para uniformados ACTIVOS, compañías de seguridad y deportistas
            if (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                cliente.getEstadoMilitar().name().equals("ACTIVO")) {
                esCompatible = true;
            } else if (tipoCliente.esEmpresa()) {
                esCompatible = true;
            } else if (tipoCliente.esDeportista()) {
                esCompatible = true;
            } else {
                mensajeError = "Los grupos de tipo JUSTIFICATIVO solo pueden incluir: Uniformados en servicio ACTIVO, " +
                              "Compañías de Seguridad y Deportistas. " +
                              "Este cliente es: " + tipoCliente.getNombre() + 
                              (cliente.getEstadoMilitar() != null ? " (Estado: " + cliente.getEstadoMilitar().name() + ")" : "");
            }
        }
        
        if (!esCompatible) {
            throw new BadRequestException(mensajeError);
        }
        
        ClienteGrupoImportacion clienteGrupo = new ClienteGrupoImportacion();
        clienteGrupo.setCliente(cliente);
        clienteGrupo.setGrupoImportacion(grupo);
        clienteGrupo.setEstado(EstadoClienteGrupo.PENDIENTE);
        clienteGrupo.setFechaCreacion(LocalDateTime.now());
        
        clienteGrupoRepository.save(clienteGrupo);
        log.info("✅ Cliente ID {} agregado al grupo ID {}", clienteId, grupoId);
    }
    
    public void removerCliente(Long grupoId, Long clienteId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        ClienteGrupoImportacion clienteGrupo = clienteGrupoRepository
                .findByClienteAndGrupoImportacion(cliente, grupo)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no está asignado a este grupo"));
        
        clienteGrupoRepository.delete(clienteGrupo);
    }
    
    public List<ClienteGrupoImportacion> obtenerClientesPorGrupo(Long grupoId) {
        return clienteGrupoRepository.findByGrupoImportacionId(grupoId);
    }
    
    /**
     * Obtiene los clientes disponibles para asignar a grupos de importación
     * Un cliente está disponible si:
     * 1. NO está asignado a ningún grupo activo
     * 2. NO tiene armas en estado ASIGNADA (ya está en pasos finales del proceso)
     * 3. Es compatible con el tipo de grupo (si se proporciona grupoId)
     * Solo clientes con armas en estado RESERVADA pueden ser agregados a grupos
     */
    @Transactional(readOnly = true)
    public List<Cliente> obtenerClientesDisponibles() {
        return obtenerClientesDisponibles(null);
    }
    
    /**
     * Obtiene los clientes disponibles para asignar a un grupo específico
     * Filtra por compatibilidad con el tipo de grupo (CUPO o JUSTIFICATIVO)
     */
    @Transactional(readOnly = true)
    public List<Cliente> obtenerClientesDisponibles(Long grupoId) {
        log.info("🔍 Obteniendo clientes disponibles para asignar a grupos{}", 
                grupoId != null ? " (grupo ID: " + grupoId + ")" : "");
        
        // Obtener tipo de grupo si se proporciona grupoId
        final String tipoGrupoFinal;
        if (grupoId != null) {
            GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
            String tipoGrupo = grupo.getTipoGrupo();
            if (tipoGrupo == null) {
                tipoGrupoFinal = "CUPO"; // Valor por defecto
            } else {
                tipoGrupoFinal = tipoGrupo;
            }
            log.info("📋 Filtrando clientes compatibles con tipo de grupo: {}", tipoGrupoFinal);
        } else {
            tipoGrupoFinal = null;
        }
        
        // Obtener todos los clientes
        List<Cliente> todosClientes = clienteRepository.findAll();
        
        // Obtener IDs de clientes que están en grupos activos
        List<ClienteGrupoImportacion> asignacionesActivas = clienteGrupoRepository.findAll().stream()
                .filter(cgi -> cgi.getEstado() != EstadoClienteGrupo.COMPLETADO 
                            && cgi.getEstado() != EstadoClienteGrupo.CANCELADO)
                .toList();
        
        Set<Long> idsClientesOcupados = asignacionesActivas.stream()
                .map(cgi -> cgi.getCliente().getId())
                .collect(Collectors.toSet());
        
        // Obtener IDs de clientes que tienen armas en estado ASIGNADA
        // Estos clientes están en pasos finales y no pueden ser agregados a grupos
        List<ClienteArma> armasAsignadas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
        Set<Long> idsClientesConArmasAsignadas = armasAsignadas.stream()
                .map(ca -> ca.getCliente().getId())
                .collect(Collectors.toSet());
        
        // Filtrar clientes disponibles
        List<Cliente> clientesDisponibles = todosClientes.stream()
                .filter(cliente -> !idsClientesOcupados.contains(cliente.getId()))
                .filter(cliente -> !idsClientesConArmasAsignadas.contains(cliente.getId()))
                .filter(cliente -> {
                    // Si se proporciona tipoGrupoFinal, filtrar por compatibilidad
                    if (tipoGrupoFinal == null) {
                        return true; // Sin filtro de tipo
                    }
                    
                    TipoCliente tipoCliente = cliente.getTipoCliente();
                    if (tipoCliente == null) {
                        return false;
                    }
                    
                    if ("CUPO".equals(tipoGrupoFinal)) {
                        // CUPO: civiles, deportistas, uniformados PASIVOS
                        return tipoCliente.esCivil() || 
                               tipoCliente.esDeportista() || 
                               (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                                cliente.getEstadoMilitar().name().equals("PASIVO"));
                    } else if ("JUSTIFICATIVO".equals(tipoGrupoFinal)) {
                        // JUSTIFICATIVO: uniformados ACTIVOS, empresas, deportistas
                        return (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                                cliente.getEstadoMilitar().name().equals("ACTIVO")) ||
                               tipoCliente.esEmpresa() ||
                               tipoCliente.esDeportista();
                    }
                    
                    return true; // Si el tipo de grupo no es reconocido, no filtrar
                })
                .toList();
        
        log.info("✅ Encontrados {} clientes disponibles de {} totales (excluyendo {} con armas asignadas{})", 
                clientesDisponibles.size(), todosClientes.size(), idsClientesConArmasAsignadas.size(),
                tipoGrupoFinal != null ? ", filtrados por tipo " + tipoGrupoFinal : "");
        
        return clientesDisponibles;
    }
    
    // Gestión de Cupos
    public void configurarCupo(Long grupoId, String tipoCliente, Integer cupoAsignado) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        Optional<GrupoImportacionCupo> cupoExistente = cupoRepository
                .findByGrupoImportacionIdAndTipoCliente(grupoId, tipoCliente);
        
        GrupoImportacionCupo cupo;
        if (cupoExistente.isPresent()) {
            cupo = cupoExistente.get();
            cupo.setCupoConsumido(cupoAsignado);
            cupo.setCupoDisponibleLicencia(cupoAsignado);
        } else {
            cupo = new GrupoImportacionCupo();
            cupo.setGrupoImportacion(grupo);
            cupo.setTipoCliente(tipoCliente);
            cupo.setCupoConsumido(cupoAsignado);
            cupo.setCupoDisponibleLicencia(cupoAsignado);
            cupo.setFechaCreacion(LocalDateTime.now());
        }
        
        cupoRepository.save(cupo);
    }
    
    public boolean tieneCupoDisponible(Long grupoId, String tipoCliente) {
        return cupoRepository.tieneCupoDisponible(grupoId, tipoCliente);
    }
    
    public void decrementarCupo(Long grupoId, String tipoCliente) {
        GrupoImportacionCupo cupo = cupoRepository
                .findByGrupoImportacionIdAndTipoCliente(grupoId, tipoCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cupo no encontrado"));
        
        if (!cupo.tieneCupoDisponible()) {
            throw new BadRequestException("No hay cupo disponible para el tipo: " + tipoCliente);
        }
        
        cupo.incrementarCupoConsumido();
        cupoRepository.save(cupo);
    }
    
    // Búsquedas
    public Page<GrupoImportacion> buscarGrupos(String codigo, EstadoGrupoImportacion estado, 
                                              Long usuarioCreadorId, LocalDateTime fechaInicio, 
                                              LocalDateTime fechaFin, Pageable pageable) {
        return grupoImportacionRepository.findWithFilters(codigo, estado, usuarioCreadorId, fechaInicio, fechaFin, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return grupoImportacionRepository.countByEstado();
    }
    
    public List<GrupoImportacion> obtenerGruposProximosALlegar(int dias) {
        LocalDateTime fechaInicio = LocalDateTime.now();
        LocalDateTime fechaFin = fechaInicio.plusDays(dias);
        return grupoImportacionRepository.findGruposProximosALlegar(fechaInicio, fechaFin);
    }
    
    // Utilidades
    private String generarCodigoAutomatico() {
        String prefijo = "IMP";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = ahora.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        Long contador = grupoImportacionRepository.countByCodigoPrefijo(prefijo + timestamp);
        String numero = String.format("%04d", contador + 1);
        
        return prefijo + timestamp + numero;
    }
    
    public BigDecimal calcularCostoTotal(Long grupoId) {
        // Implementar lógica de cálculo de costos
        return BigDecimal.ZERO;
    }

    /**
     * Obtiene el resumen de un grupo de importación con conteo de clientes por tipo
     */
    @Transactional(readOnly = true)
    public GrupoImportacionResumenDTO obtenerResumenGrupo(Long grupoId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        List<ClienteGrupoImportacion> clientesGrupo = clienteGrupoRepository.findByGrupoImportacionId(grupoId);
        
        // Contar clientes por tipo usando las banderas del TipoCliente
        int civiles = 0;
        int uniformados = 0;
        int empresas = 0;
        int deportistas = 0;
        
        for (ClienteGrupoImportacion cgi : clientesGrupo) {
            Cliente cliente = cgi.getCliente();
            if (cliente.getTipoCliente() != null) {
                if (cliente.getTipoCliente().esCivil() || 
                    (cliente.getTipoCliente().esMilitar() && cliente.getEstadoMilitar() != null && 
                     cliente.getEstadoMilitar().name().equals("PASIVO"))) {
                    civiles++;
                } else if (cliente.getTipoCliente().esUniformado() && 
                          cliente.getEstadoMilitar() != null && 
                          cliente.getEstadoMilitar().name().equals("ACTIVO")) {
                    uniformados++;
                } else if (cliente.getTipoCliente().esEmpresa()) {
                    empresas++;
                } else if (cliente.getTipoCliente().esDeportista()) {
                    deportistas++;
                }
            }
        }
        
        // Calcular cupos civiles desde la licencia asignada al grupo
        // La licencia tiene los cupos definidos en la BD por tipo de importación
        Licencia licencia = grupo.getLicencia();
        int cupoCivilTotal = 0;
        int cupoCivilDisponible = 0;
        int cupoCivilRestante = 0;
        
        if (licencia != null && licencia.getCupoCivil() != null) {
            // Obtener el cupo total civil de la licencia (viene de la BD)
            cupoCivilTotal = licencia.getCupoCivil();
            // Calcular cuántos cupos quedan disponibles
            cupoCivilDisponible = Math.max(0, cupoCivilTotal - civiles);
            cupoCivilRestante = cupoCivilDisponible;
        } else {
            // Fallback: si no hay licencia o no tiene cupo definido, usar valor por defecto
            log.warn("⚠️ Grupo ID {} no tiene licencia o licencia sin cupo civil definido. Usando valor por defecto.", grupoId);
            cupoCivilTotal = Licencia.CUPO_FIJO_CIVIL; // 25 como fallback
            cupoCivilDisponible = Math.max(0, cupoCivilTotal - civiles);
            cupoCivilRestante = cupoCivilDisponible;
        }
        
        return GrupoImportacionResumenDTO.builder()
                .grupoId(grupo.getId())
                .grupoNombre(grupo.getNombre())
                .grupoCodigo(grupo.getCodigo())
                .clientesCiviles(civiles)
                .clientesUniformados(uniformados)
                .clientesEmpresas(empresas)
                .clientesDeportistas(deportistas)
                .totalClientes(civiles + uniformados + empresas + deportistas)
                .fechaUltimaActualizacion(grupo.getFechaActualizacion() != null ? 
                    grupo.getFechaActualizacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
                    grupo.getFechaCreacion().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .cupoCivilTotal(cupoCivilTotal)
                .cupoCivilDisponible(cupoCivilDisponible)
                .cupoCivilRestante(cupoCivilRestante)
                .build();
    }

    // ============================================================
    // MÉTODOS DEL FLUJO DE OPERACIONES
    // ============================================================

    /**
     * Define el pedido para un grupo de importación
     * Genera el PDF "Pedido_Armas_Grupo_Importacion_AAAA_MM_DD" y cambia el estado
     */
    public com.armasimportacion.model.DocumentoGenerado definirPedido(Long grupoId, Long usuarioId) {
        log.info("📋 Definiendo pedido para grupo de importación ID: {}", grupoId);
        
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        // Validar que puede definir pedido
        if (!verificarPuedeDefinirPedido(grupoId)) {
            throw new BadRequestException("El grupo no puede definir pedido en este momento. Estado: " + grupo.getEstado());
        }
        
        // Generar pedido usando el servicio especializado
        return pedidoArmasService.generarPedidoArmas(grupoId, usuarioId);
    }

    /**
     * Verifica si un grupo puede definir pedido
     */
    @Transactional(readOnly = true)
    public boolean verificarPuedeDefinirPedido(Long grupoId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        // Solo puede definir pedido si está en estos estados
        return grupo.getEstado() == EstadoGrupoImportacion.EN_PREPARACION ||
               grupo.getEstado() == EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES;
    }

    /**
     * Notifica el pago a fábrica
     * Solo se puede ejecutar si los documentos 1, 2, 3 están cargados
     */
    public void notificarPagoFabrica(Long grupoId, Long usuarioId) {
        log.info("💰 Notificando pago a fábrica para grupo ID: {}", grupoId);
        
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar que los documentos requeridos están cargados
        if (!documentoGrupoImportacionService.verificarDocumentosRequeridos(grupoId)) {
            throw new BadRequestException("No se puede notificar el pago. Faltan documentos requeridos (1, 2, 3)");
        }
        
        // Validar estado
        if (grupo.getEstado() != EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA &&
            grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_OPERACIONES) {
            throw new BadRequestException("El grupo no está en un estado válido para notificar pago. Estado actual: " + grupo.getEstado());
        }
        
        // Registrar notificación (puede agregarse un campo o tabla para esto)
        grupo.setObservaciones((grupo.getObservaciones() != null ? grupo.getObservaciones() + "\n" : "") +
            "Pago a fábrica notificado el " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + 
            " por " + usuario.getNombreCompleto());
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        grupoImportacionRepository.save(grupo);
        
        log.info("✅ Pago a fábrica notificado para grupo ID: {}", grupoId);
    }

    /**
     * Registra la fecha aproximada de llegada de la importación
     */
    public void registrarFechaLlegada(Long grupoId, java.time.LocalDate fechaLlegada, Long usuarioId) {
        log.info("📅 Registrando fecha de llegada para grupo ID: {} - Fecha: {}", grupoId, fechaLlegada);
        
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar estado
        if (grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_OPERACIONES) {
            throw new BadRequestException("El grupo no está en un estado válido para registrar fecha de llegada. Estado actual: " + grupo.getEstado());
        }
        
        grupo.setFechaEstimadaLlegada(fechaLlegada);
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        grupoImportacionRepository.save(grupo);
        
        log.info("✅ Fecha de llegada registrada para grupo ID: {}", grupoId);
    }

    /**
     * Registra el número de previa importación
     */
    public void registrarNumeroPreviaImportacion(Long grupoId, String numeroPrevia, Long usuarioId) {
        log.info("📝 Registrando número de previa importación para grupo ID: {} - Número: {}", grupoId, numeroPrevia);
        
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar estado
        if (grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_OPERACIONES) {
            throw new BadRequestException("El grupo no está en un estado válido para registrar número de previa. Estado actual: " + grupo.getEstado());
        }
        
        if (numeroPrevia == null || numeroPrevia.trim().isEmpty()) {
            throw new BadRequestException("El número de previa importación no puede estar vacío");
        }
        
        grupo.setNumeroPreviaImportacion(numeroPrevia.trim());
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        grupoImportacionRepository.save(grupo);
        
        log.info("✅ Número de previa importación registrado para grupo ID: {}", grupoId);
    }

    /**
     * Encuentra el primer grupo de importación disponible para un vendedor
     * Un grupo está disponible si:
     * 1. Tiene al vendedor asignado
     * 2. Está en estado EN_PREPARACION o EN_PROCESO_ASIGNACION_CLIENTES
     * 3. Tiene cupo disponible (para tipo CUPO) o no tiene límites (JUSTIFICATIVO)
     * 4. El cliente es compatible con el tipo de grupo
     * 
     * @param vendedorId ID del vendedor
     * @param cliente Cliente a asignar (para verificar compatibilidad)
     * @return Grupo de importación disponible, o null si no hay ninguno
     */
    @Transactional(readOnly = true)
    public GrupoImportacion encontrarGrupoDisponibleParaVendedor(Long vendedorId, Cliente cliente) {
        log.info("🔍 Buscando grupo disponible para vendedor ID: {} y cliente ID: {}", vendedorId, cliente.getId());
        
        Usuario vendedor = usuarioRepository.findById(vendedorId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado"));
        
        // Obtener todos los grupos donde el vendedor está asignado
        List<GrupoImportacionVendedor> asignacionesVendedor = grupoImportacionVendedorRepository.findByVendedor(vendedor);
        
        if (asignacionesVendedor.isEmpty()) {
            log.info("📭 No hay grupos asignados para el vendedor ID: {}", vendedorId);
            return null;
        }
        
        // Filtrar grupos activos y disponibles
        for (GrupoImportacionVendedor asignacion : asignacionesVendedor) {
            GrupoImportacion grupo = asignacion.getGrupoImportacion();
            
            // Verificar que el grupo esté en estado válido
            if (grupo.getEstado() != EstadoGrupoImportacion.EN_PREPARACION &&
                grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES) {
                continue;
            }
            
            // Verificar compatibilidad del cliente con el tipo de grupo
            if (!esClienteCompatibleConGrupo(cliente, grupo)) {
                log.debug("⚠️ Cliente ID {} no es compatible con grupo ID {} (tipo: {})", 
                    cliente.getId(), grupo.getId(), grupo.getTipoGrupo());
                continue;
            }
            
            // Verificar cupo disponible (solo para tipo CUPO)
            // Los límites por categoría solo aplican para CIVILES, DEPORTISTAS y UNIFORMADOS PASIVOS
            if ("CUPO".equals(grupo.getTipoGrupo())) {
                // Verificar si el cliente tiene armas asignadas y si hay cupo disponible por categoría
                List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
                
                if (!armasCliente.isEmpty()) {
                    // Obtener límites por categoría del grupo
                    List<GrupoImportacionLimiteCategoria> limites = grupoImportacionLimiteCategoriaRepository
                        .findByGrupoImportacion(grupo);
                    
                    // Verificar cupo disponible por cada categoría de arma del cliente
                    boolean tieneCupoDisponible = true;
                    for (ClienteArma clienteArma : armasCliente) {
                        Long categoriaId = clienteArma.getArma().getCategoria().getId();
                        
                        // Buscar límite para esta categoría
                        Optional<GrupoImportacionLimiteCategoria> limiteOpt = limites.stream()
                            .filter(l -> l.getCategoriaArma().getId().equals(categoriaId))
                            .findFirst();
                        
                        if (limiteOpt.isPresent()) {
                            GrupoImportacionLimiteCategoria limite = limiteOpt.get();
                            Integer limiteMaximo = limite.getLimiteMaximo();
                            
                            // Contar SOLO clientes CONFIRMADOS (CIVILES, DEPORTISTAS, UNIFORMADOS PASIVOS) 
                            // con armas de esta categoría
                            long clientesConfirmadosConCategoria = clienteGrupoRepository.findByGrupoImportacionId(grupo.getId()).stream()
                                .filter(cgi -> cgi.getEstado() == EstadoClienteGrupo.CONFIRMADO ||
                                              cgi.getEstado() == EstadoClienteGrupo.APROBADO ||
                                              cgi.getEstado() == EstadoClienteGrupo.EN_PROCESO)
                                .filter(cgi -> {
                                    Cliente c = cgi.getCliente();
                                    TipoCliente tc = c.getTipoCliente();
                                    
                                    // Solo contar CIVILES, DEPORTISTAS y UNIFORMADOS PASIVOS
                                    if (tc == null) return false;
                                    if (tc.esCivil()) return true;
                                    if (tc.esDeportista()) return true;
                                    if (tc.esUniformado() && c.getEstadoMilitar() != null && 
                                        c.getEstadoMilitar().name().equals("PASIVO")) {
                                        return true;
                                    }
                                    return false;
                                })
                                .filter(cgi -> {
                                    // Verificar si el cliente tiene armas de esta categoría
                                    return clienteArmaRepository.findByClienteId(cgi.getCliente().getId()).stream()
                                        .anyMatch(ca -> ca.getArma().getCategoria().getId().equals(categoriaId));
                                })
                                .count();
                            
                            // Verificar si hay cupo disponible para esta categoría
                            if (clientesConfirmadosConCategoria >= limiteMaximo) {
                                log.debug("⚠️ Grupo ID {} no tiene cupo disponible para categoría {} (ocupados: {}, límite: {})", 
                                    grupo.getId(), categoriaId, clientesConfirmadosConCategoria, limiteMaximo);
                                tieneCupoDisponible = false;
                                break;
                            }
                        }
                    }
                    
                    if (!tieneCupoDisponible) {
                        continue; // No hay cupo disponible para alguna categoría
                    }
                }
            }
            
            // Este grupo está disponible
            log.info("✅ Grupo disponible encontrado: ID={}, nombre={}", grupo.getId(), grupo.getNombre());
            return grupo;
        }
        
        log.info("📭 No se encontró grupo disponible para vendedor ID: {}", vendedorId);
        return null;
    }
    
    /**
     * Verifica si un cliente es compatible con el tipo de grupo
     */
    private boolean esClienteCompatibleConGrupo(Cliente cliente, GrupoImportacion grupo) {
        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            return false;
        }
        
        String tipoGrupo = grupo.getTipoGrupo();
        if (tipoGrupo == null) {
            tipoGrupo = "CUPO"; // Valor por defecto
        }
        
        if ("CUPO".equals(tipoGrupo)) {
            // CUPO: civiles, deportistas, uniformados PASIVOS
            return tipoCliente.esCivil() || 
                   tipoCliente.esDeportista() || 
                   (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                    cliente.getEstadoMilitar().name().equals("PASIVO"));
        } else if ("JUSTIFICATIVO".equals(tipoGrupo)) {
            // JUSTIFICATIVO: uniformados ACTIVOS, empresas, deportistas
            return (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                    cliente.getEstadoMilitar().name().equals("ACTIVO")) ||
                   tipoCliente.esEmpresa() ||
                   tipoCliente.esDeportista();
        }
        
        return false;
    }
    
    /**
     * Asigna automáticamente un cliente a un grupo disponible del vendedor
     * La asignación es provisional (PENDIENTE) hasta que el cliente confirme sus datos
     * 
     * @param cliente Cliente a asignar
     * @param vendedorId ID del vendedor que creó el cliente
     * @return ClienteGrupoImportacion creado, o null si no hay grupo disponible
     */
    @Transactional
    public ClienteGrupoImportacion asignarClienteAGrupoDisponible(Cliente cliente, Long vendedorId) {
        log.info("🔄 Asignando cliente ID {} a grupo disponible del vendedor ID: {}", cliente.getId(), vendedorId);
        
        // Buscar grupo disponible
        GrupoImportacion grupo = encontrarGrupoDisponibleParaVendedor(vendedorId, cliente);
        
        if (grupo == null) {
            log.info("📭 No hay grupo disponible para asignar cliente ID: {}", cliente.getId());
            return null;
        }
        
        // Verificar que el cliente no esté ya asignado a este grupo
        if (clienteGrupoRepository.existsByClienteAndGrupoImportacion(cliente, grupo)) {
            log.info("ℹ️ Cliente ID {} ya está asignado al grupo ID: {}", cliente.getId(), grupo.getId());
            return clienteGrupoRepository.findByClienteAndGrupoImportacion(cliente, grupo)
                .orElse(null);
        }
        
        // Crear asignación provisional (PENDIENTE)
        ClienteGrupoImportacion clienteGrupo = new ClienteGrupoImportacion();
        clienteGrupo.setCliente(cliente);
        clienteGrupo.setGrupoImportacion(grupo);
        clienteGrupo.setEstado(EstadoClienteGrupo.PENDIENTE);
        clienteGrupo.setFechaAsignacion(LocalDateTime.now());
        clienteGrupo.setFechaCreacion(LocalDateTime.now());
        
        ClienteGrupoImportacion guardado = clienteGrupoRepository.save(clienteGrupo);
        log.info("✅ Cliente ID {} asignado provisionalmente al grupo ID: {} (estado: PENDIENTE)", 
            cliente.getId(), grupo.getId());
        
        return guardado;
    }
    
    /**
     * Confirma la asignación de un cliente a un grupo (cuando el cliente verifica su email)
     * Cambia el estado de PENDIENTE a CONFIRMADO
     * 
     * @param clienteId ID del cliente
     */
    @Transactional
    public void confirmarAsignacionCliente(Long clienteId) {
        log.info("✅ Confirmando asignación del cliente ID: {} al grupo", clienteId);
        
        // Verificar que el cliente existe
        if (!clienteRepository.existsById(clienteId)) {
            throw new ResourceNotFoundException("Cliente no encontrado");
        }
        
        // Buscar asignación pendiente del cliente
        List<ClienteGrupoImportacion> asignaciones = clienteGrupoRepository.findByClienteId(clienteId);
        
        ClienteGrupoImportacion asignacionPendiente = asignaciones.stream()
            .filter(cgi -> cgi.getEstado() == EstadoClienteGrupo.PENDIENTE)
            .findFirst()
            .orElse(null);
        
        if (asignacionPendiente == null) {
            log.warn("⚠️ No se encontró asignación pendiente para cliente ID: {}", clienteId);
            return;
        }
        
        // Cambiar estado a CONFIRMADO
        asignacionPendiente.setEstado(EstadoClienteGrupo.CONFIRMADO);
        asignacionPendiente.setFechaActualizacion(LocalDateTime.now());
        clienteGrupoRepository.save(asignacionPendiente);
        
        log.info("✅ Asignación confirmada: Cliente ID {} en grupo ID: {}", 
            clienteId, asignacionPendiente.getGrupoImportacion().getId());
    }
    
    /**
     * Calcula los cupos disponibles por categoría para un grupo CUPO
     * Solo cuenta clientes CONFIRMADOS (no pendientes) para el cálculo de cupos
     * 
     * @param grupoId ID del grupo
     * @return Map con categoría -> cupos disponibles
     */
    @Transactional(readOnly = true)
    public Map<Long, Integer> calcularCuposDisponiblesPorCategoria(Long grupoId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        if (!"CUPO".equals(grupo.getTipoGrupo())) {
            return new HashMap<>(); // No aplica para JUSTIFICATIVO
        }
        
        // Obtener límites por categoría
        List<GrupoImportacionLimiteCategoria> limites = grupoImportacionLimiteCategoriaRepository
            .findByGrupoImportacion(grupo);
        
        Map<Long, Integer> cuposDisponibles = new HashMap<>();
        
        for (GrupoImportacionLimiteCategoria limite : limites) {
            Long categoriaId = limite.getCategoriaArma().getId();
            Integer limiteMaximo = limite.getLimiteMaximo();
            
            // Contar SOLO clientes CONFIRMADOS (no pendientes) con armas de esta categoría
            // IMPORTANTE: Los límites por categoría solo aplican para:
            // - CIVILES
            // - DEPORTISTAS
            // - UNIFORMADOS en PASIVO
            long clientesConfirmadosConCategoria = clienteGrupoRepository.findByGrupoImportacionId(grupoId).stream()
                .filter(cgi -> cgi.getEstado() == EstadoClienteGrupo.CONFIRMADO ||
                              cgi.getEstado() == EstadoClienteGrupo.APROBADO ||
                              cgi.getEstado() == EstadoClienteGrupo.EN_PROCESO)
                .filter(cgi -> {
                    Cliente cliente = cgi.getCliente();
                    TipoCliente tipoCliente = cliente.getTipoCliente();
                    
                    // Solo contar clientes CIVILES, DEPORTISTAS o UNIFORMADOS PASIVOS
                    boolean esClienteValidoParaLimites = false;
                    if (tipoCliente != null) {
                        if (tipoCliente.esCivil()) {
                            esClienteValidoParaLimites = true;
                        } else if (tipoCliente.esDeportista()) {
                            esClienteValidoParaLimites = true;
                        } else if (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null && 
                                   cliente.getEstadoMilitar().name().equals("PASIVO")) {
                            esClienteValidoParaLimites = true;
                        }
                    }
                    
                    if (!esClienteValidoParaLimites) {
                        return false; // No contar este cliente para los límites
                    }
                    
                    // Verificar si el cliente tiene armas de esta categoría
                    return clienteArmaRepository.findByClienteId(cliente.getId()).stream()
                        .anyMatch(ca -> ca.getArma().getCategoria().getId().equals(categoriaId));
                })
                .count();
            
            int disponibles = Math.max(0, limiteMaximo - (int)clientesConfirmadosConCategoria);
            cuposDisponibles.put(categoriaId, disponibles);
        }
        
        return cuposDisponibles;
    }
    
    /**
     * Calcula el cupo total disponible para un grupo CUPO
     * Suma todos los cupos disponibles por categoría
     * 
     * @param grupoId ID del grupo
     * @return Cupo total disponible, o null si no es tipo CUPO
     */
    @Transactional(readOnly = true)
    public Integer calcularCupoTotalDisponible(Long grupoId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        if (!"CUPO".equals(grupo.getTipoGrupo())) {
            return null; // No aplica para JUSTIFICATIVO
        }
        
        Map<Long, Integer> cuposPorCategoria = calcularCuposDisponiblesPorCategoria(grupoId);
        return cuposPorCategoria.values().stream()
            .mapToInt(Integer::intValue)
            .sum();
    }
    
    /**
     * Cambia el estado del grupo (método genérico mejorado)
     */
    public void cambiarEstado(Long grupoId, EstadoGrupoImportacion nuevoEstado, Long usuarioId) {
        log.info("🔄 Cambiando estado del grupo ID: {} a {}", grupoId, nuevoEstado);
        
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        if (usuarioId != null) {
            Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            grupo.setUsuarioActualizador(usuario);
        }
        
        grupo.setEstado(nuevoEstado);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        grupoImportacionRepository.save(grupo);
        
        log.info("✅ Estado del grupo ID: {} cambiado a {}", grupoId, nuevoEstado);
    }
} 
