package com.armasimportacion.service;

import com.armasimportacion.dto.GrupoImportacionResumenDTO;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionCupo;
import com.armasimportacion.model.GrupoImportacionVendedor;
import com.armasimportacion.model.GrupoImportacionLimiteCategoria;
import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.Rol;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.dto.GrupoImportacionCreateDTO;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.GrupoImportacionCupoRepository;
import com.armasimportacion.repository.ArmaSerieRepository;
import com.armasimportacion.repository.CategoriaArmaRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.LicenciaRepository;
import com.armasimportacion.repository.TipoProcesoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.GrupoImportacionVendedorRepository;
import com.armasimportacion.repository.GrupoImportacionLimiteCategoriaRepository;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.TipoGrupo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
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
    private final ClienteArmaRepository clienteArmaRepository;
    private final LicenciaRepository licenciaRepository;
    private final TipoProcesoRepository tipoProcesoRepository;
    private final GrupoImportacionVendedorRepository grupoImportacionVendedorRepository;
    private final GrupoImportacionLimiteCategoriaRepository grupoImportacionLimiteCategoriaRepository;
    private final CategoriaArmaRepository categoriaArmaRepository;
    private final ArmaSerieRepository armaSerieRepository;
    private final GrupoImportacionWorkflowService workflowService;

    // ============================================================
    // CRUD Operations
    // ============================================================

    public GrupoImportacion crearGrupoDesdeDTO(GrupoImportacionCreateDTO dto, Long usuarioId) {
        log.info("Creando nuevo grupo de importación desde DTO: {}", dto.getNombre());

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Licencia licencia = validarLicenciaActiva(dto.getLicenciaId());
        TipoProceso tipoProceso = obtenerTipoProcesoOpcional(dto.getTipoProcesoId());
        int cupoTotal = calcularCupoTotal(dto);

        GrupoImportacion grupo = construirGrupoBase(dto, usuario, licencia, tipoProceso, cupoTotal);
        configurarTipoGrupoYTra(grupo, dto);

        GrupoImportacion grupoGuardado = grupoImportacionRepository.save(grupo);

        asignarVendedoresAlGrupo(grupoGuardado, dto.getVendedores());
        asignarLimitesPorCategoria(grupoGuardado, dto.getLimitesCategoria());

        return grupoGuardado;
    }

    private Licencia validarLicenciaActiva(Long licenciaId) {
        Licencia licencia = licenciaRepository.findById(licenciaId)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada"));
        if (Boolean.FALSE.equals(licencia.getEstado()) || licencia.isVencida()) {
            throw new BadRequestException("La licencia seleccionada no está activa o está vencida");
        }
        return licencia;
    }

    private TipoProceso obtenerTipoProcesoOpcional(Long tipoProcesoId) {
        if (tipoProcesoId == null) return null;
        return tipoProcesoRepository.findById(tipoProcesoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de proceso no encontrado"));
    }

    private int calcularCupoTotal(GrupoImportacionCreateDTO dto) {
        if (dto.getCupoTotal() != null && dto.getCupoTotal() > 0) {
            return dto.getCupoTotal();
        }
        if (TipoGrupo.JUSTIFICATIVO.name().equalsIgnoreCase(dto.getTipoGrupo())) {
            return 999999;
        }
        return 1000;
    }

    private GrupoImportacion construirGrupoBase(GrupoImportacionCreateDTO dto, Usuario usuario,
            Licencia licencia, TipoProceso tipoProceso, int cupoTotal) {
        LocalDate fechaInicio = dto.getFechaInicio() != null ? dto.getFechaInicio() : LocalDate.now();

        GrupoImportacion grupo = new GrupoImportacion();
        grupo.setNombre(dto.getNombre());
        grupo.setDescripcion(dto.getDescripcion());
        grupo.setLicencia(licencia);
        grupo.setTipoProceso(tipoProceso);
        grupo.setFechaInicio(fechaInicio);
        grupo.setFechaFin(dto.getFechaFin());
        grupo.setCupoTotal(cupoTotal);
        grupo.setCupoDisponible(cupoTotal);
        grupo.setObservaciones(dto.getObservaciones());

        if (dto.getCodigo() == null || dto.getCodigo().trim().isEmpty()) {
            grupo.setCodigo(generarCodigoAutomatico());
        } else {
            if (grupoImportacionRepository.existsByCodigo(dto.getCodigo())) {
                throw new BadRequestException("Ya existe un grupo con el código: " + dto.getCodigo());
            }
            grupo.setCodigo(dto.getCodigo());
        }

        grupo.setUsuarioCreador(usuario);
        grupo.setEstado(EstadoGrupoImportacion.EN_PREPARACION);
        grupo.setFechaCreacion(LocalDateTime.now());

        return grupo;
    }

    private void configurarTipoGrupoYTra(GrupoImportacion grupo, GrupoImportacionCreateDTO dto) {
        if (dto.getTipoGrupo() != null && !dto.getTipoGrupo().trim().isEmpty()) {
            try {
                grupo.setTipoGrupo(TipoGrupo.valueOf(dto.getTipoGrupo()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("El tipo de grupo debe ser 'CUPO' o 'JUSTIFICATIVO'");
            }
        } else {
            grupo.setTipoGrupo(TipoGrupo.CUPO);
        }

        if (dto.getTra() != null && !dto.getTra().trim().isEmpty()) {
            if (!dto.getTra().matches("TRA-\\d+")) {
                throw new BadRequestException("El formato de TRA debe ser TRA- seguido de números (ej: TRA-1212121212)");
            }
            if (grupoImportacionRepository.existsByTra(dto.getTra())) {
                throw new BadRequestException("Ya existe un grupo con el TRA: " + dto.getTra());
            }
            grupo.setTra(dto.getTra());
        }
    }

    private void asignarVendedoresAlGrupo(GrupoImportacion grupo, List<GrupoImportacionCreateDTO.VendedorLimiteDTO> vendedoresDTO) {
        if (vendedoresDTO == null || vendedoresDTO.isEmpty()) return;

        int sumaLimites = 0;
        Map<Long, Integer> limitesPorVendedor = new LinkedHashMap<>();
        for (GrupoImportacionCreateDTO.VendedorLimiteDTO vendedorLimite : vendedoresDTO) {
            if (vendedorLimite.getVendedorId() == null) continue;
            Integer limiteArmas = vendedorLimite.getLimiteArmas() != null ? vendedorLimite.getLimiteArmas() : 0;
            limitesPorVendedor.put(vendedorLimite.getVendedorId(), limiteArmas);
        }

        for (Map.Entry<Long, Integer> vendedorEntry : limitesPorVendedor.entrySet()) {
            Usuario vendedor = usuarioRepository.findById(vendedorEntry.getKey())
                .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado con ID: " + vendedorEntry.getKey()));

            if (vendedor.getRoles().stream().noneMatch(Rol::esVendedor)) {
                throw new BadRequestException("El usuario con ID " + vendedorEntry.getKey() + " no es un vendedor");
            }

            Integer limiteArmas = vendedorEntry.getValue();
            if (limiteArmas < 0) {
                throw new BadRequestException("El límite de armas no puede ser negativo");
            }

            if (grupo.getTipoGrupo() == TipoGrupo.CUPO) {
                sumaLimites += limiteArmas;
                if (sumaLimites > grupo.getCupoTotal()) {
                    throw new BadRequestException(
                        String.format("La suma de límites de armas por vendedor (%d) excede el cupo total del grupo (%d)",
                            sumaLimites, grupo.getCupoTotal()));
                }
            }

            GrupoImportacionVendedor grupoVendedor = new GrupoImportacionVendedor();
            grupoVendedor.setGrupoImportacion(grupo);
            grupoVendedor.setVendedor(vendedor);
            grupoVendedor.setLimiteArmas(limiteArmas);
            grupoVendedor.setActivo(true);
            grupoImportacionVendedorRepository.save(grupoVendedor);
        }
        log.info("{} vendedor(es) asignado(s) al grupo con límites de armas", vendedoresDTO.size());
    }

    private void asignarLimitesPorCategoria(GrupoImportacion grupo, List<GrupoImportacionCreateDTO.LimiteCategoriaDTO> limitesDTO) {
        if (grupo.getTipoGrupo() != TipoGrupo.CUPO || limitesDTO == null || limitesDTO.isEmpty()) return;

        for (GrupoImportacionCreateDTO.LimiteCategoriaDTO limiteDTO : limitesDTO) {
            CategoriaArma categoria = categoriaArmaRepository.findById(limiteDTO.getCategoriaArmaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría de arma no encontrada con ID: " + limiteDTO.getCategoriaArmaId()));

            GrupoImportacionLimiteCategoria limite = new GrupoImportacionLimiteCategoria();
            limite.setGrupoImportacion(grupo);
            limite.setCategoriaArma(categoria);
            limite.setLimiteMaximo(limiteDTO.getLimiteMaximo());
            grupoImportacionLimiteCategoriaRepository.save(limite);
        }
        log.info("{} límite(s) de categoría asignado(s) al grupo", limitesDTO.size());
    }

    public GrupoImportacion crearGrupoImportacion(GrupoImportacion grupo, Long usuarioId) {
        log.info("Creando nuevo grupo de importación: {}", grupo.getCodigo());

        if (grupoImportacionRepository.existsByCodigo(grupo.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupo.getCodigo());
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

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

        // Actualizar licencia si se proporciona
        if (dto.getLicenciaId() != null) {
            Licencia nuevaLicencia = licenciaRepository.findById(dto.getLicenciaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada con ID: " + dto.getLicenciaId()));

            if (Boolean.FALSE.equals(nuevaLicencia.getEstado()) || nuevaLicencia.isVencida()) {
                throw new BadRequestException("La licencia seleccionada no está activa o está vencida");
            }

            if (!nuevaLicencia.getId().equals(grupo.getLicencia() != null ? grupo.getLicencia().getId() : null)) {
                log.info("📋 Cambiando licencia del grupo de {} a {}",
                    grupo.getLicencia() != null ? grupo.getLicencia().getNumero() : "ninguna",
                    nuevaLicencia.getNumero());

                if (grupo.getLicencia() != null) {
                    grupo.getLicencia().liberar();
                    licenciaRepository.save(grupo.getLicencia());
                }

                nuevaLicencia.bloquear();
                licenciaRepository.save(nuevaLicencia);

                grupo.setLicencia(nuevaLicencia);

                log.info("✅ Licencia actualizada. El cupo del grupo se mantiene: {}", grupo.getCupoTotal());
            }
        }

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

        if (dto.getTipoGrupo() != null && !dto.getTipoGrupo().trim().isEmpty()) {
            try {
                grupo.setTipoGrupo(TipoGrupo.valueOf(dto.getTipoGrupo()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("El tipo de grupo debe ser 'CUPO' o 'JUSTIFICATIVO'");
            }
        }

        if (dto.getTra() != null && !dto.getTra().trim().isEmpty()) {
            if (!dto.getTra().matches("TRA-\\d+")) {
                throw new BadRequestException("El formato de TRA debe ser TRA- seguido de números (ej: TRA-1212121212)");
            }
            Optional<GrupoImportacion> grupoConTra = grupoImportacionRepository.findByTra(dto.getTra());
            if (grupoConTra.isPresent() && !grupoConTra.get().getId().equals(id)) {
                throw new BadRequestException("Ya existe otro grupo con el TRA: " + dto.getTra());
            }
            grupo.setTra(dto.getTra());
        }

        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());

        GrupoImportacion grupoGuardado = grupoImportacionRepository.save(grupo);

        // Actualizar vendedores
        if (dto.getVendedores() != null) {
            if (!dto.getVendedores().isEmpty()) {
                int sumaLimites = 0;

                Map<Long, Integer> limitesPorVendedor = new LinkedHashMap<>();
                for (GrupoImportacionCreateDTO.VendedorLimiteDTO vendedorLimite : dto.getVendedores()) {
                    if (vendedorLimite.getVendedorId() == null) {
                        continue;
                    }
                    Integer limiteArmas = vendedorLimite.getLimiteArmas() != null ? vendedorLimite.getLimiteArmas() : 0;
                    limitesPorVendedor.put(vendedorLimite.getVendedorId(), limiteArmas);
                }

                List<GrupoImportacionVendedor> asignacionesExistentes = grupoImportacionVendedorRepository
                    .findByGrupoImportacion(grupoGuardado);
                Map<Long, GrupoImportacionVendedor> asignacionesPorVendedor = asignacionesExistentes.stream()
                    .collect(Collectors.toMap(giv -> giv.getVendedor().getId(), giv -> giv));

                for (Map.Entry<Long, Integer> vendedorEntry : limitesPorVendedor.entrySet()) {
                    Usuario vendedor = usuarioRepository.findById(vendedorEntry.getKey())
                        .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado con ID: " + vendedorEntry.getKey()));

                    boolean esVendedor = vendedor.getRoles().stream()
                        .anyMatch(Rol::esVendedor);

                    if (!esVendedor) {
                        throw new BadRequestException("El usuario con ID " + vendedorEntry.getKey() + " no es un vendedor");
                    }

                    Integer limiteArmas = vendedorEntry.getValue();
                    if (limiteArmas < 0) {
                        throw new BadRequestException("El límite de armas no puede ser negativo");
                    }

                    if (grupoGuardado.getTipoGrupo() == TipoGrupo.CUPO) {
                        sumaLimites += limiteArmas;
                        if (sumaLimites > grupoGuardado.getCupoTotal()) {
                            throw new BadRequestException(
                                String.format("La suma de límites de armas por vendedor (%d) excede el cupo total del grupo (%d)",
                                    sumaLimites, grupoGuardado.getCupoTotal()));
                        }
                    }

                    GrupoImportacionVendedor grupoVendedor = asignacionesPorVendedor.get(vendedorEntry.getKey());
                    if (grupoVendedor == null) {
                        grupoVendedor = grupoImportacionVendedorRepository
                            .findByGrupoImportacionAndVendedor(grupoGuardado, vendedor)
                            .orElse(null);
                    }
                    if (grupoVendedor == null) {
                        grupoVendedor = grupoImportacionVendedorRepository
                            .findByGrupoImportacionIdAndVendedorId(grupoGuardado.getId(), vendedor.getId())
                            .orElse(null);
                    }
                    if (grupoVendedor == null) {
                        boolean existeAsignacion = grupoImportacionVendedorRepository
                            .existsByGrupoImportacionAndVendedor(grupoGuardado, vendedor);
                        if (existeAsignacion) {
                            log.warn("⚠️ Asignación ya existe para grupo {} y vendedor {}, se omite inserción", grupoGuardado.getId(), vendedor.getId());
                            continue;
                        }
                        grupoVendedor = new GrupoImportacionVendedor();
                        grupoVendedor.setGrupoImportacion(grupoGuardado);
                        grupoVendedor.setVendedor(vendedor);
                    }
                    grupoVendedor.setLimiteArmas(limiteArmas);
                    grupoVendedor.setActivo(true);
                    grupoImportacionVendedorRepository.save(grupoVendedor);
                }

                for (GrupoImportacionVendedor asignacion : asignacionesExistentes) {
                    if (!limitesPorVendedor.containsKey(asignacion.getVendedor().getId())) {
                        asignacion.setActivo(false);
                        grupoImportacionVendedorRepository.save(asignacion);
                    }
                }
                log.info("✅ {} vendedor(es) actualizado(s) en el grupo con límites de armas", limitesPorVendedor.size());
            }
        }

        // Actualizar límites por categoría
        if (grupoGuardado.getTipoGrupo() == TipoGrupo.CUPO && dto.getLimitesCategoria() != null) {
            Map<Long, Integer> limitesPorCategoria = new LinkedHashMap<>();
            for (GrupoImportacionCreateDTO.LimiteCategoriaDTO limiteDTO : dto.getLimitesCategoria()) {
                if (limiteDTO.getCategoriaArmaId() == null) {
                    continue;
                }
                Integer limiteMaximo = limiteDTO.getLimiteMaximo() != null ? limiteDTO.getLimiteMaximo() : 0;
                limitesPorCategoria.put(limiteDTO.getCategoriaArmaId(), limiteMaximo);
            }

            grupoImportacionLimiteCategoriaRepository.deleteByGrupoImportacion(grupoGuardado);
            grupoImportacionLimiteCategoriaRepository.flush();

            if (!limitesPorCategoria.isEmpty()) {
                for (Map.Entry<Long, Integer> entry : limitesPorCategoria.entrySet()) {
                    CategoriaArma categoria = categoriaArmaRepository.findById(entry.getKey())
                        .orElseThrow(() -> new ResourceNotFoundException("Categoría de arma no encontrada con ID: " + entry.getKey()));

                    GrupoImportacionLimiteCategoria limite = new GrupoImportacionLimiteCategoria();
                    limite.setGrupoImportacion(grupoGuardado);
                    limite.setCategoriaArma(categoria);
                    limite.setLimiteMaximo(entry.getValue());
                    grupoImportacionLimiteCategoriaRepository.save(limite);
                }
                log.info("✅ {} límite(s) de categoría actualizado(s) en el grupo", limitesPorCategoria.size());
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

        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }

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
        return grupoImportacionRepository.findById(id)
                .map(grupo -> {
                    if (grupo.getLicencia() != null) {
                        grupo.getLicencia().getId();
                    }
                    if (grupo.getVendedores() != null) {
                        grupo.getVendedores().size();
                        grupo.getVendedores().forEach(gv -> {
                            if (gv.getVendedor() != null) {
                                gv.getVendedor().getId();
                            }
                        });
                    }
                    if (grupo.getLimitesCategoria() != null) {
                        grupo.getLimitesCategoria().size();
                        grupo.getLimitesCategoria().forEach(gl -> {
                            if (gl.getCategoriaArma() != null) {
                                gl.getCategoriaArma().getId();
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

    public List<GrupoImportacion> findAll() {
        return grupoImportacionRepository.findAll();
    }

    public GrupoImportacion findById(Long id) {
        return grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
    }

    public GrupoImportacion create(GrupoImportacion grupoImportacion) {
        log.info("Creando nuevo grupo de importación: {}", grupoImportacion.getCodigo());

        if (grupoImportacionRepository.existsByCodigo(grupoImportacion.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoImportacion.getCodigo());
        }

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

        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }

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

    // ============================================================
    // Business Queries
    // ============================================================

    public List<GrupoImportacion> obtenerGruposActivos() {
        return grupoImportacionRepository.findAll().stream()
            .filter(grupo -> grupo.getEstado() != EstadoGrupoImportacion.COMPLETADO)
            .filter(grupo -> grupo.getEstado() != EstadoGrupoImportacion.CANCELADO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrupoImportacion> obtenerGruposActivosParaVendedor(Long vendedorId) {
        log.info("🔍 Obteniendo grupos activos disponibles para vendedor ID: {}", vendedorId);

        List<GrupoImportacionVendedor> asignacionesVendedor =
            grupoImportacionVendedorRepository.findGruposActivosByVendedorId(
                vendedorId,
                EstadoGrupoImportacion.EN_PREPARACION,
                EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES);

        log.info("📊 RESULTADO CONSULTA: {} asignación(es) encontrada(s) para vendedor ID {}", asignacionesVendedor.size(), vendedorId);

        if (!asignacionesVendedor.isEmpty()) {
            asignacionesVendedor.forEach(asig -> {
                GrupoImportacion grupo = asig.getGrupoImportacion();
                log.info("📋 Grupo encontrado: ID={}, Nombre={}, Estado={}, Tipo={}, CupoDisponible={}",
                    grupo.getId(), grupo.getNombre(), grupo.getEstado(), grupo.getTipoGrupo(), grupo.getCupoDisponible());
            });
        }

        if (asignacionesVendedor.isEmpty()) {
            log.warn("📭 No hay grupos activos (EN_PREPARACION/EN_PROCESO_ASIGNACION_CLIENTES) asignados al vendedor ID {}", vendedorId);
            return List.of();
        }

        List<GrupoImportacion> gruposDisponibles = asignacionesVendedor.stream()
            .map(GrupoImportacionVendedor::getGrupoImportacion)
            .filter(grupo -> {
                if (grupo.getTipoGrupo() == TipoGrupo.CUPO) {
                    boolean tieneCupo = grupo.getCupoDisponible() != null && grupo.getCupoDisponible() > 0;
                    if (!tieneCupo) {
                        log.warn("⚠️ Grupo ID={} (CUPO) filtrado: sin cupo disponible (disponible={}, total={})",
                            grupo.getId(), grupo.getCupoDisponible(), grupo.getCupoTotal());
                    }
                    return tieneCupo;
                } else if (grupo.getTipoGrupo() == TipoGrupo.JUSTIFICATIVO) {
                    log.debug("✅ Grupo ID={} (JUSTIFICATIVO) disponible", grupo.getId());
                    return true;
                }
                log.warn("⚠️ Grupo ID={} sin tipo definido, considerando disponible", grupo.getId());
                return true;
            })
            .peek(grupo -> log.info("✅ Grupo DISPONIBLE: ID={}, Nombre={}, Estado={}, Tipo={}, CupoDisponible={}, CupoTotal={}",
                grupo.getId(), grupo.getNombre(), grupo.getEstado(), grupo.getTipoGrupo(),
                grupo.getCupoDisponible(), grupo.getCupoTotal()))
            .collect(Collectors.toList());

        log.info("✅ RESULTADO FINAL: {} grupo(s) disponible(s) para vendedor ID: {}",
            gruposDisponibles.size(), vendedorId);

        return gruposDisponibles;
    }

    public List<GrupoImportacion> obtenerGruposCompletos() {
        return grupoImportacionRepository.findGruposCompletos();
    }

    public List<GrupoImportacion> obtenerGruposIncompletos() {
        return grupoImportacionRepository.findGruposIncompletos();
    }

    public void cambiarEstado(Long id, EstadoGrupoImportacion nuevoEstado) {
        workflowService.cambiarEstado(id, nuevoEstado, null);
    }

    // ============================================================
    // Gestión de Cupos
    // ============================================================

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

    // ============================================================
    // Búsquedas
    // ============================================================

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

    // ============================================================
    // Resumen
    // ============================================================

    @Transactional(readOnly = true)
    public GrupoImportacionResumenDTO obtenerResumenGrupo(Long grupoId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        List<ClienteGrupoImportacion> clientesGrupo = clienteGrupoRepository.findByGrupoImportacionId(grupoId);

        int civiles = 0;
        int uniformados = 0;
        int empresas = 0;
        int deportistas = 0;

        for (ClienteGrupoImportacion cgi : clientesGrupo) {
            Cliente cliente = cgi.getCliente();
            if (cliente.getTipoCliente() != null) {
                if (esClienteCivilParaCupo(cliente)) {
                    civiles++;
                } else if (cliente.getTipoCliente().esUniformado() &&
                          cliente.getEstadoMilitar() != null &&
                          cliente.getEstadoMilitar() == EstadoMilitar.ACTIVO) {
                    uniformados++;
                } else if (cliente.getTipoCliente().esEmpresa()) {
                    empresas++;
                } else if (cliente.getTipoCliente().esDeportista()) {
                    deportistas++;
                }
            }
        }

        int cupoCivilTotal = 25;
        int cupoCivilDisponible = 0;
        int cupoCivilRestante = 0;

        if (grupo.getCupoTotal() != null && grupo.getCupoTotal() > 0) {
            cupoCivilTotal = Math.min(grupo.getCupoTotal(), 25);
        }
        cupoCivilDisponible = Math.max(0, cupoCivilTotal - civiles);
        cupoCivilRestante = cupoCivilDisponible;

        int totalArmasSolicitadas = 0;
        int seriesCargadas = 0;
        int seriesPendientes = 0;
        int seriesAsignadas = 0;
        int armasSinAsignar = 0;

        List<Long> clienteIds = clientesGrupo.stream()
            .map(cgi -> cgi.getCliente().getId())
            .toList();
        if (!clienteIds.isEmpty()) {
            List<ClienteArma> todasReservadas = clienteArmaRepository.findByClienteIdInAndEstado(
                clienteIds, ClienteArma.EstadoClienteArma.RESERVADA);
            List<ClienteArma> todasAsignadas = clienteArmaRepository.findByClienteIdInAndEstado(
                clienteIds, ClienteArma.EstadoClienteArma.ASIGNADA);
            armasSinAsignar = todasReservadas.size();
            seriesAsignadas = todasAsignadas.size();
            totalArmasSolicitadas = armasSinAsignar + seriesAsignadas;
        }

        Long seriesCargadasLong = armaSerieRepository.countByGrupoImportacionId(grupoId);
        seriesCargadas = seriesCargadasLong != null ? seriesCargadasLong.intValue() : 0;
        seriesPendientes = Math.max(0, totalArmasSolicitadas - seriesCargadas);

        log.debug("📊 Grupo {}: {} armas solicitadas, {} series cargadas, {} asignadas, {} sin asignar",
            grupo.getCodigo(), totalArmasSolicitadas, seriesCargadas, seriesAsignadas, armasSinAsignar);

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
                .estado(grupo.getEstado() != null ? grupo.getEstado().name() : null)
                .cupoCivilTotal(cupoCivilTotal)
                .cupoCivilDisponible(cupoCivilDisponible)
                .cupoCivilRestante(cupoCivilRestante)
                .totalArmasSolicitadas(totalArmasSolicitadas)
                .seriesCargadas(seriesCargadas)
                .seriesPendientes(seriesPendientes)
                .seriesAsignadas(seriesAsignadas)
                .armasSinAsignar(armasSinAsignar)
                .build();
    }

    private boolean esClienteCivilParaCupo(Cliente cliente) {
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            return true;
        }
        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            return false;
        }
        return tipoCliente.esCivil() ||
               tipoCliente.esDeportista() ||
               (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                cliente.getEstadoMilitar() == EstadoMilitar.PASIVO);
    }

    // ============================================================
    // Utilidades
    // ============================================================

    private String generarCodigoAutomatico() {
        String prefijo = "IMP";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = ahora.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        Long contador = grupoImportacionRepository.countByCodigoPrefijo(prefijo + timestamp);
        String numero = String.format("%04d", contador + 1);

        return prefijo + timestamp + numero;
    }

    public BigDecimal calcularCostoTotal(Long grupoId) {
        return BigDecimal.ZERO;
    }
}
