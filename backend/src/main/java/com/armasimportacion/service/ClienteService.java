package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.mapper.ClienteMapper;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.TipoIdentificacion;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.dto.ClienteCreateDTO;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.enums.EstadoClienteGrupo;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClienteService {

    @PersistenceContext
    private EntityManager entityManager;
    
    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    private final TipoIdentificacionRepository tipoIdentificacionRepository;
    private final TipoClienteRepository tipoClienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    private final DocumentoClienteService documentoClienteService;
    private final ClienteArmaService clienteArmaService;
    

    // ===== OPERACIONES CRUD =====

    public List<Cliente> findAll() {
        return clienteRepository.findAll();
    }

    public Page<Cliente> findAll(Pageable pageable) {
        return clienteRepository.findAll(pageable);
    }

    public Cliente findById(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
    }

    public Cliente create(Cliente cliente) {
        // Validaciones
        validateClienteForCreate(cliente);

        // Configurar valores por defecto
        cliente.setEstado(EstadoCliente.ACTIVO);
        cliente.setFechaCreacion(java.time.LocalDateTime.now());

        return clienteRepository.save(cliente);
    }

    public Cliente update(Long id, Cliente clienteUpdate) {
        Cliente cliente = findById(id);
        
        // Validaciones
        validateClienteForUpdate(clienteUpdate, id);

        // Actualizar campos
        updateClienteFields(cliente, clienteUpdate);

        return clienteRepository.save(cliente);
    }

    public void delete(Long id) {
        Cliente cliente = findById(id);
        clienteRepository.delete(cliente);
    }

    // ===== BÚSQUEDAS ESPECÍFICAS =====

    public List<Cliente> findByUsuarioCreador(Long usuarioId) {
        return clienteRepository.findByUsuarioCreadorId(usuarioId);
    }

    public Page<Cliente> findByUsuarioCreador(Long usuarioId, Pageable pageable) {
        return clienteRepository.findByUsuarioCreadorId(usuarioId, pageable);
    }

    public List<Cliente> findByEstado(EstadoCliente estado) {
        return clienteRepository.findByEstado(estado);
    }

    public List<Cliente> findByTipoCliente(Long tipoClienteId) {
        return clienteRepository.findByTipoClienteId(tipoClienteId);
    }

    public List<Cliente> findByProvincia(String provincia) {
        return clienteRepository.findByProvincia(provincia);
    }

    public List<Cliente> findByProvinciaAndCanton(String provincia, String canton) {
        return clienteRepository.findByProvinciaAndCanton(provincia, canton);
    }

    public List<Cliente> findByEstadoMilitar(EstadoMilitar estadoMilitar) {
        return clienteRepository.findByEstadoMilitar(estadoMilitar);
    }

    // ===== BÚSQUEDAS CON FILTROS =====

    public Page<Cliente> findByFiltros(Long tipoClienteId, EstadoCliente estado, 
                                      Long usuarioCreadorId, String provincia, 
                                      String email, String nombres, Pageable pageable) {
        return clienteRepository.findByFiltros(tipoClienteId, estado, usuarioCreadorId, 
                                              provincia, email, nombres, pageable);
    }

    // ===== VALIDACIONES ESPECÍFICAS =====

    public boolean existsByIdentificacion(Long tipoIdentificacionId, String numeroIdentificacion) {
        return clienteRepository.existsByTipoIdentificacionIdAndNumeroIdentificacion(
            tipoIdentificacionId, numeroIdentificacion);
    }

    public boolean existsByEmail(String email) {
        return clienteRepository.existsByEmail(email);
    }

    public boolean existsByRuc(String ruc) {
        return clienteRepository.findByRuc(ruc).size() > 0;
    }

    // ===== VALIDACIONES DE NEGOCIO =====

    public boolean validateEdadMinima(LocalDate fechaNacimiento) {
        if (fechaNacimiento == null) return false;
        LocalDate fechaMinima = LocalDate.now().minusYears(25);
        return fechaNacimiento.isBefore(fechaMinima) || fechaNacimiento.isEqual(fechaMinima);
    }

    public boolean validateCedula(String cedula) {
        if (cedula == null || cedula.trim().isEmpty()) return false;
        return cedula.matches("^[0-9]{10}$");
    }

    public boolean validateRuc(String ruc) {
        if (ruc == null || ruc.trim().isEmpty()) return false;
        return ruc.matches("^[0-9]{13}$");
    }

    public boolean validateTelefono(String telefono) {
        if (telefono == null || telefono.trim().isEmpty()) return false;
        return telefono.matches("^[0-9]{10}$");
    }

    // ===== GESTIÓN DE ESTADO =====

    public Cliente changeStatus(Long id, EstadoCliente estado) {
        Cliente cliente = findById(id);
        cliente.setEstado(estado);
        return clienteRepository.save(cliente);
    }

    // ===== ESTADÍSTICAS =====

    public Long countByEstado(EstadoCliente estado) {
        return clienteRepository.countByEstado(estado);
    }

    public Long countByTipoCliente(Long tipoClienteId) {
        return clienteRepository.countByTipoCliente(tipoClienteId);
    }

    public Long countByUsuarioCreador(Long usuarioId) {
        return clienteRepository.countByUsuarioCreador(usuarioId);
    }

    public List<Object[]> getEstadisticasPorProvincia() {
        return clienteRepository.countByProvincia();
    }
    
    // ===== MÉTODOS PARA JEFE DE VENTAS =====
    
    public Page<Cliente> findAllForJefeVentas(EstadoCliente estado, String vendedor, Pageable pageable) {
        if (estado != null && vendedor != null && !vendedor.trim().isEmpty()) {
            return clienteRepository.findByEstadoAndUsuarioCreadorNombreContainingIgnoreCase(estado, vendedor, pageable);
        } else if (estado != null) {
            return clienteRepository.findByEstado(estado, pageable);
        } else if (vendedor != null && !vendedor.trim().isEmpty()) {
            return clienteRepository.findByUsuarioCreadorNombreContainingIgnoreCase(vendedor, pageable);
        } else {
            return clienteRepository.findAll(pageable);
        }
    }
    
    public List<Cliente> findClientesAprobados() {
        return clienteRepository.findByEstadoAndProcesoCompletadoTrue(EstadoCliente.ACTIVO);
    }
    
    public List<Cliente> findClientesPendientesAprobacion() {
        return clienteRepository.findByEstadoAndProcesoCompletadoFalse(EstadoCliente.ACTIVO);
    }
    
    public Map<String, Object> getDetalleCompleto(Long clienteId) {
        Cliente cliente = findById(clienteId);
        Map<String, Object> detalle = new java.util.HashMap<>();
        
        detalle.put("cliente", cliente);
        detalle.put("documentos", cliente.getDocumentos());
        detalle.put("respuestas", cliente.getRespuestas());
        detalle.put("asignacionesArma", cliente.getAsignacionesArma());
        detalle.put("asignacionesAccesorio", cliente.getAsignacionesAccesorio());
        
        return detalle;
    }
    
    public Cliente aprobarCliente(Long clienteId) {
        Cliente cliente = findById(clienteId);
        
        if (cliente.getEstado() != EstadoCliente.ACTIVO) {
            throw new BadRequestException("Solo se pueden aprobar clientes activos");
        }
        
        if (!cliente.getProcesoCompletado()) {
            throw new BadRequestException("El cliente debe tener el proceso de datos completado");
        }
        
        cliente.setAprobadoPorJefeVentas(true);
        cliente.setFechaAprobacion(java.time.LocalDateTime.now());
        
        return clienteRepository.save(cliente);
    }
    
    public Cliente rechazarCliente(Long clienteId, String motivo) {
        Cliente cliente = findById(clienteId);
        
        cliente.setAprobadoPorJefeVentas(false);
        cliente.setMotivoRechazo(motivo);
        cliente.setFechaRechazo(java.time.LocalDateTime.now());
        
        return clienteRepository.save(cliente);
    }
    
    public Map<String, Object> getEstadisticasJefeVentas() {
        Map<String, Object> estadisticas = new java.util.HashMap<>();
        
        estadisticas.put("totalClientes", clienteRepository.count());
        estadisticas.put("clientesAprobados", clienteRepository.countByAprobadoPorJefeVentasTrue());
        estadisticas.put("clientesPendientes", clienteRepository.countByAprobadoPorJefeVentasFalseAndEstado(EstadoCliente.ACTIVO));
        estadisticas.put("clientesRechazados", clienteRepository.countByAprobadoPorJefeVentasFalseAndMotivoRechazoIsNotNull());
        estadisticas.put("clientesPorEstado", clienteRepository.getEstadisticasPorEstado());
        estadisticas.put("clientesPorVendedor", clienteRepository.getEstadisticasPorVendedor());
        
        return estadisticas;
    }
    
    public Map<String, Object> getEstadisticasVendedor(Long usuarioId) {
        Map<String, Object> estadisticas = new java.util.HashMap<>();
        
        estadisticas.put("totalClientes", clienteRepository.countByUsuarioCreador(usuarioId));
        estadisticas.put("clientesActivos", clienteRepository.countByUsuarioCreadorAndEstado(usuarioId, EstadoCliente.ACTIVO));
        estadisticas.put("clientesBloqueados", clienteRepository.countByUsuarioCreadorAndEstado(usuarioId, EstadoCliente.BLOQUEADO));
        estadisticas.put("clientesCompletados", clienteRepository.countByUsuarioCreadorAndProcesoCompletadoTrue(usuarioId));
        estadisticas.put("clientesPendientes", clienteRepository.countByUsuarioCreadorAndProcesoCompletadoFalse(usuarioId));
        
        return estadisticas;
    }

    // ===== MÉTODOS CON DTOs PARA EVITAR PROBLEMAS DE SERIALIZACIÓN =====
    
    public List<ClienteDTO> findAllAsDTO() {
        List<Cliente> clientes = findAll();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        // Calcular estado de pago, grupo de importación y estado calculado para cada cliente
        dtos.forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
            Cliente cliente = clienteRepository.findById(dto.getId()).orElse(null);
            if (cliente != null) {
                dto.setEstado(calcularEstadoCliente(cliente));
            }
        });
        return dtos;
    }
    
    public Page<ClienteDTO> findAllAsDTO(Pageable pageable) {
        Page<Cliente> clientes = clienteRepository.findAllWithUsuarioCreador(pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        // Calcular estado de pago, grupo de importación y estado calculado para cada cliente
        dtos.getContent().forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
            Cliente cliente = clienteRepository.findById(dto.getId()).orElse(null);
            if (cliente != null) {
                dto.setEstado(calcularEstadoCliente(cliente));
            }
        });
        return dtos;
    }
    
    public ClienteDTO findByIdAsDTO(Long id) {
        Cliente cliente = findById(id);
        ClienteDTO dto = clienteMapper.toDTO(cliente);
        dto.setEstadoPago(calcularEstadoPago(id));
        dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(id));
        java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(id);
        if (licenciaInfo != null) {
            dto.setLicenciaNombre(licenciaInfo.get("nombre"));
            dto.setLicenciaNumero(licenciaInfo.get("numero"));
        }
        dto.setEstado(calcularEstadoCliente(cliente));
        return dto;
    }
    
    public List<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId) {
        List<Cliente> clientes = findByUsuarioCreador(usuarioId);
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        // Calcular estado de pago, grupo de importación, licencia y estado calculado para cada cliente
        dtos.forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
            Cliente cliente = clienteRepository.findById(dto.getId()).orElse(null);
            if (cliente != null) {
                EstadoCliente estadoCalculado = calcularEstadoCliente(cliente);
                log.debug("🔍 Cliente ID {}: estado original={}, estado calculado={}", 
                    dto.getId(), cliente.getEstado(), estadoCalculado);
                dto.setEstado(estadoCalculado);
            }
        });
        return dtos;
    }
    
    public Page<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId, Pageable pageable) {
        Page<Cliente> clientes = clienteRepository.findByUsuarioCreadorId(usuarioId, pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        // Calcular estado de pago, grupo de importación y estado calculado para cada cliente
        dtos.getContent().forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
            Cliente cliente = clienteRepository.findById(dto.getId()).orElse(null);
            if (cliente != null) {
                EstadoCliente estadoCalculado = calcularEstadoCliente(cliente);
                log.debug("🔍 Cliente ID {}: estado original={}, estado calculado={}", 
                    dto.getId(), cliente.getEstado(), estadoCalculado);
                dto.setEstado(estadoCalculado);
            }
        });
        return dtos;
    }
    
    public List<ClienteDTO> findByEstadoAsDTO(EstadoCliente estado) {
        List<Cliente> clientes = findByEstado(estado);
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        // Calcular estado de pago y grupo de importación para cada cliente
        dtos.forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
        });
        return dtos;
    }
    
    public List<ClienteDTO> findClientesAprobadosAsDTO() {
        List<Cliente> clientes = findClientesAprobados();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        // Calcular estado de pago y grupo de importación para cada cliente
        dtos.forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
        });
        return dtos;
    }
    
    public List<ClienteDTO> findClientesPendientesAprobacionAsDTO() {
        List<Cliente> clientes = findClientesPendientesAprobacion();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        // Calcular estado de pago y grupo de importación para cada cliente
        dtos.forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
        });
        return dtos;
    }

    // ===== MÉTODOS PRIVADOS =====

    private void validateClienteForCreate(Cliente cliente) {
        // Validar identificación única
        if (clienteRepository.existsByTipoIdentificacionIdAndNumeroIdentificacion(
                cliente.getTipoIdentificacion().getId(), cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Ya existe un cliente con esta identificación: " + 
                cliente.getNumeroIdentificacion());
        }

        // Validar email único
        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            throw new BadRequestException("Ya existe un cliente con este email: " + cliente.getEmail());
        }

        // Validar RUC único para empresas
        if (cliente.getRuc() != null && !cliente.getRuc().trim().isEmpty()) {
            if (clienteRepository.findByRuc(cliente.getRuc()).size() > 0) {
                throw new BadRequestException("Ya existe una empresa con este RUC: " + cliente.getRuc());
            }
        }

        // Validar edad mínima
        if (cliente.getFechaNacimiento() != null && !validateEdadMinima(cliente.getFechaNacimiento())) {
            String mensajeError = cliente.getMensajeErrorEdad();
            throw new BadRequestException(mensajeError != null ? mensajeError : "El cliente debe tener al menos 25 años");
        }

        // Validar formato de identificación
        if (cliente.getTipoIdentificacion().esCedula() && !validateCedula(cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Formato de cédula inválido");
        }

        if (cliente.getTipoIdentificacion().esRUC() && !validateRuc(cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Formato de RUC inválido");
        }

        // Validar teléfono
        if (!validateTelefono(cliente.getTelefonoPrincipal())) {
            throw new BadRequestException("Formato de teléfono inválido");
        }

        // Validar campos específicos por tipo de cliente
        validateCamposEspecificos(cliente);
    }

    private void validateClienteForUpdate(Cliente clienteUpdate, Long id) {
        // Validar identificación única (excluyendo el cliente actual)
        if (clienteRepository.existsByTipoIdentificacionIdAndNumeroIdentificacionAndIdNot(
                clienteUpdate.getTipoIdentificacion().getId(), clienteUpdate.getNumeroIdentificacion(), id)) {
            throw new BadRequestException("Ya existe un cliente con esta identificación: " + 
                clienteUpdate.getNumeroIdentificacion());
        }

        // Validar email único (excluyendo el cliente actual)
        if (clienteRepository.existsByEmail(clienteUpdate.getEmail())) {
            Cliente clienteExistente = clienteRepository.findByEmail(clienteUpdate.getEmail()).get();
            if (!clienteExistente.getId().equals(id)) {
                throw new BadRequestException("Ya existe un cliente con este email: " + clienteUpdate.getEmail());
            }
        }

        // Validar RUC único para empresas (excluyendo el cliente actual)
        if (clienteUpdate.getRuc() != null && !clienteUpdate.getRuc().trim().isEmpty()) {
            List<Cliente> clientesConRuc = clienteRepository.findByRuc(clienteUpdate.getRuc());
            if (clientesConRuc.size() > 0 && !clientesConRuc.get(0).getId().equals(id)) {
                throw new BadRequestException("Ya existe una empresa con este RUC: " + clienteUpdate.getRuc());
            }
        }

        // Validar edad mínima
        if (clienteUpdate.getFechaNacimiento() != null && !validateEdadMinima(clienteUpdate.getFechaNacimiento())) {
            String mensajeError = clienteUpdate.getMensajeErrorEdad();
            throw new BadRequestException(mensajeError != null ? mensajeError : "El cliente debe tener al menos 25 años");
        }

        // Validar campos específicos por tipo de cliente
        validateCamposEspecificos(clienteUpdate);
    }

    private void validateCamposEspecificos(Cliente cliente) {
        // Validar códigos ISSFA/ISSPOL según tipo de cliente
        if (cliente.getTipoCliente() != null) {
            // Para militares: validar código ISSFA
            if (cliente.getTipoCliente().esMilitar()) {
                if (cliente.getCodigoIssfa() == null || cliente.getCodigoIssfa().trim().isEmpty()) {
                    throw new BadRequestException("El código ISSFA es obligatorio para militares");
                }
                
                // Validar longitud y formato
                String codigoIssfa = cliente.getCodigoIssfa().trim();
                if (codigoIssfa.length() != 10) {
                    throw new BadRequestException("El código ISSFA debe tener exactamente 10 dígitos");
                }
                if (!codigoIssfa.matches("\\d{10}")) {
                    throw new BadRequestException("El código ISSFA debe contener solo números (10 dígitos)");
                }
            }
            
            // Para policías: validar código ISSPOL
            if (cliente.getTipoCliente().esPolicia()) {
                if (cliente.getCodigoIsspol() == null || cliente.getCodigoIsspol().trim().isEmpty()) {
                    throw new BadRequestException("El código ISSPOL es obligatorio para policías");
                }
                
                // Validar longitud y formato
                String codigoIsspol = cliente.getCodigoIsspol().trim();
                if (codigoIsspol.length() != 10) {
                    throw new BadRequestException("El código ISSPOL debe tener exactamente 10 dígitos");
                }
                if (!codigoIsspol.matches("\\d{10}")) {
                    throw new BadRequestException("El código ISSPOL debe contener solo números (10 dígitos)");
                }
            }
        }
    }

    private void updateClienteFields(Cliente cliente, Cliente clienteUpdate) {
        cliente.setNombres(clienteUpdate.getNombres());
        cliente.setApellidos(clienteUpdate.getApellidos());
        cliente.setFechaNacimiento(clienteUpdate.getFechaNacimiento());
        cliente.setDireccion(clienteUpdate.getDireccion());
        cliente.setProvincia(clienteUpdate.getProvincia());
        cliente.setCanton(clienteUpdate.getCanton());
        cliente.setEmail(clienteUpdate.getEmail());
        cliente.setTelefonoPrincipal(clienteUpdate.getTelefonoPrincipal());
        cliente.setTelefonoSecundario(clienteUpdate.getTelefonoSecundario());
        cliente.setRepresentanteLegal(clienteUpdate.getRepresentanteLegal());
        cliente.setEstadoMilitar(clienteUpdate.getEstadoMilitar());
        cliente.setCodigoIssfa(clienteUpdate.getCodigoIssfa()); // Actualizar código ISSFA (para militares)
        cliente.setCodigoIsspol(clienteUpdate.getCodigoIsspol()); // Actualizar código ISSPOL (para policías)
        cliente.setRango(clienteUpdate.getRango()); // Actualizar rango

        // Campos de empresa
        cliente.setRuc(clienteUpdate.getRuc());
        cliente.setNombreEmpresa(clienteUpdate.getNombreEmpresa());
        cliente.setDireccionFiscal(clienteUpdate.getDireccionFiscal());
        cliente.setTelefonoReferencia(clienteUpdate.getTelefonoReferencia());
        cliente.setCorreoEmpresa(clienteUpdate.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(clienteUpdate.getProvinciaEmpresa());
        cliente.setCantonEmpresa(clienteUpdate.getCantonEmpresa());
    }

    // ===== MÉTODOS DTO =====

    public ClienteDTO createFromDTO(ClienteCreateDTO dto, Long usuarioId) {
        log.info("🔍 ClienteService.createFromDTO: Recibiendo DTO: {}", dto);
        log.info("🔍 ClienteService.createFromDTO: numeroIdentificacion = '{}'", dto.getNumeroIdentificacion());
        log.info("🔍 ClienteService.createFromDTO: nombres = '{}'", dto.getNombres());
        log.info("🔍 ClienteService.createFromDTO: apellidos = '{}'", dto.getApellidos());
        log.info("🔍 ClienteService.createFromDTO: tipoIdentificacionCodigo = '{}'", dto.getTipoIdentificacionCodigo());
        log.info("🔍 ClienteService.createFromDTO: tipoClienteCodigo = '{}'", dto.getTipoClienteCodigo());
        
        // Crear entidad Cliente desde DTO
        Cliente cliente = new Cliente();
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        // Parsear fechaNacimiento de String a LocalDate (sin conversiones de timezone)
        if (dto.getFechaNacimiento() != null && !dto.getFechaNacimiento().isEmpty()) {
            String fechaStr = dto.getFechaNacimiento();
            // Si viene con 'T' (ISO DateTime), extraer solo la fecha
            if (fechaStr.contains("T")) {
                fechaStr = fechaStr.split("T")[0];
            }
            java.time.LocalDate fechaParsed = java.time.LocalDate.parse(fechaStr);
            cliente.setFechaNacimiento(fechaParsed);
        }
        cliente.setDireccion(dto.getDireccion());
        cliente.setProvincia(dto.getProvincia());
        cliente.setCanton(dto.getCanton());
        cliente.setEmail(dto.getEmail());
        cliente.setTelefonoPrincipal(dto.getTelefonoPrincipal());
        cliente.setTelefonoSecundario(dto.getTelefonoSecundario());
        cliente.setRepresentanteLegal(dto.getRepresentanteLegal());
        if (dto.getEstadoMilitar() != null) {
            try {
                cliente.setEstadoMilitar(EstadoMilitar.valueOf(dto.getEstadoMilitar().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Estado militar inválido: " + dto.getEstadoMilitar());
            }
        }
        cliente.setCodigoIssfa(dto.getCodigoIssfa()); // Para militares
        cliente.setCodigoIsspol(dto.getCodigoIsspol()); // Para policías
        cliente.setRango(dto.getRango());

        // Campos de empresa
        cliente.setRuc(dto.getRuc());
        cliente.setNombreEmpresa(dto.getNombreEmpresa());
        cliente.setDireccionFiscal(dto.getDireccionFiscal());
        cliente.setTelefonoReferencia(dto.getTelefonoReferencia());
        cliente.setCorreoEmpresa(dto.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(dto.getProvinciaEmpresa());
        cliente.setCantonEmpresa(dto.getCantonEmpresa());
        
        // Establecer relaciones - CONSULTAR POR CÓDIGO EN BD
        // El frontend SIEMPRE debe enviar estos datos desde los dropdowns
        if (dto.getTipoIdentificacionCodigo() == null || dto.getTipoIdentificacionCodigo().trim().isEmpty()) {
            throw new BadRequestException("tipoIdentificacionCodigo es obligatorio y debe enviarse desde el frontend");
        }
        if (dto.getTipoClienteCodigo() == null || dto.getTipoClienteCodigo().trim().isEmpty()) {
            throw new BadRequestException("tipoClienteCodigo es obligatorio y debe enviarse desde el frontend");
        }

        // Consultar directamente por código en la base de datos
        log.info("🔍 Buscando TipoIdentificacion con código: '{}'", dto.getTipoIdentificacionCodigo());
        TipoIdentificacion tipoIdentificacion = tipoIdentificacionRepository.findByCodigo(dto.getTipoIdentificacionCodigo())
                .orElseThrow(() -> {
                    log.error("❌ TipoIdentificacion NO encontrado con código: '{}'", dto.getTipoIdentificacionCodigo());
                    return new ResourceNotFoundException("Tipo de identificación no encontrado con código: " + dto.getTipoIdentificacionCodigo());
                });
        log.info("✅ TipoIdentificacion encontrado: ID={}, Código={}, Nombre={}", 
                tipoIdentificacion.getId(), tipoIdentificacion.getCodigo(), tipoIdentificacion.getNombre());
        cliente.setTipoIdentificacion(tipoIdentificacion);

        log.info("🔍 Buscando TipoCliente con código: '{}'", dto.getTipoClienteCodigo());
        TipoCliente tipoCliente = tipoClienteRepository.findByCodigo(dto.getTipoClienteCodigo())
                .orElseThrow(() -> {
                    log.error("❌ TipoCliente NO encontrado con código: '{}'", dto.getTipoClienteCodigo());
                    return new ResourceNotFoundException("Tipo de cliente no encontrado con código: " + dto.getTipoClienteCodigo());
                });
        log.info("✅ TipoCliente encontrado: ID={}, Código={}, Nombre={}", 
                tipoCliente.getId(), tipoCliente.getCodigo(), tipoCliente.getNombre());
        cliente.setTipoCliente(tipoCliente);

        // Establecer usuario creador
        if (usuarioId != null) {
            cliente.setUsuarioCreador(usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
        }

        // Configurar valores por defecto
        // Si el DTO tiene un estado, usarlo; si no, usar ACTIVO por defecto
        if (dto.getEstado() != null && !dto.getEstado().trim().isEmpty()) {
            try {
                cliente.setEstado(EstadoCliente.valueOf(dto.getEstado().toUpperCase()));
                log.info("✅ Estado del cliente establecido desde DTO: {}", dto.getEstado());
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ Estado inválido en DTO: {}, usando ACTIVO por defecto", dto.getEstado());
                cliente.setEstado(EstadoCliente.ACTIVO);
            }
        } else {
            cliente.setEstado(EstadoCliente.ACTIVO);
            log.info("✅ Estado del cliente establecido por defecto: ACTIVO");
        }
        cliente.setFechaCreacion(java.time.LocalDateTime.now());

        // Guardar y retornar DTO
        Cliente clienteGuardado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteGuardado);
        resultado.setEstadoPago(calcularEstadoPago(clienteGuardado.getId()));
        resultado.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(clienteGuardado.getId()));
        java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(clienteGuardado.getId());
        if (licenciaInfo != null) {
            resultado.setLicenciaNombre(licenciaInfo.get("nombre"));
            resultado.setLicenciaNumero(licenciaInfo.get("numero"));
        }
        resultado.setEstado(calcularEstadoCliente(clienteGuardado));
        return resultado;
    }

    public ClienteDTO updateFromDTO(Long id, ClienteCreateDTO dto) {
        Cliente cliente = findById(id);
        
        // Actualizar campos
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        // Parsear fechaNacimiento de String a LocalDate (sin conversiones de timezone)
        if (dto.getFechaNacimiento() != null && !dto.getFechaNacimiento().isEmpty()) {
            String fechaStr = dto.getFechaNacimiento();
            // Si viene con 'T' (ISO DateTime), extraer solo la fecha
            if (fechaStr.contains("T")) {
                fechaStr = fechaStr.split("T")[0];
            }
            java.time.LocalDate fechaParsed = java.time.LocalDate.parse(fechaStr);
            cliente.setFechaNacimiento(fechaParsed);
        }
        cliente.setDireccion(dto.getDireccion());
        cliente.setProvincia(dto.getProvincia());
        cliente.setCanton(dto.getCanton());
        cliente.setEmail(dto.getEmail());
        cliente.setTelefonoPrincipal(dto.getTelefonoPrincipal());
        cliente.setTelefonoSecundario(dto.getTelefonoSecundario());
        cliente.setRepresentanteLegal(dto.getRepresentanteLegal());
        if (dto.getEstadoMilitar() != null) {
            try {
                cliente.setEstadoMilitar(EstadoMilitar.valueOf(dto.getEstadoMilitar().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Estado militar inválido: " + dto.getEstadoMilitar());
            }
        }
        cliente.setCodigoIssfa(dto.getCodigoIssfa()); // Para militares
        cliente.setCodigoIsspol(dto.getCodigoIsspol()); // Para policías (nuevo campo)
        cliente.setRango(dto.getRango());

        // Campos de empresa
        cliente.setRuc(dto.getRuc());
        cliente.setNombreEmpresa(dto.getNombreEmpresa());
        cliente.setDireccionFiscal(dto.getDireccionFiscal());
        cliente.setTelefonoReferencia(dto.getTelefonoReferencia());
        cliente.setCorreoEmpresa(dto.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(dto.getProvinciaEmpresa());
        cliente.setCantonEmpresa(dto.getCantonEmpresa());

        // Establecer relaciones - BUSCAR POR CÓDIGO EN BD (dinámico)
        if (dto.getTipoIdentificacionCodigo() != null) {
            TipoIdentificacion tipoIdentificacion = tipoIdentificacionRepository.findByCodigo(dto.getTipoIdentificacionCodigo())
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de identificación no encontrado con código: " + dto.getTipoIdentificacionCodigo()));
            cliente.setTipoIdentificacion(tipoIdentificacion);
        }

        if (dto.getTipoClienteCodigo() != null) {
            TipoCliente tipoCliente = tipoClienteRepository.findByCodigo(dto.getTipoClienteCodigo())
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de cliente no encontrado con código: " + dto.getTipoClienteCodigo()));
            cliente.setTipoCliente(tipoCliente);
        }

        // Guardar y retornar DTO
        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteActualizado);
        resultado.setEstadoPago(calcularEstadoPago(clienteActualizado.getId()));
        resultado.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(clienteActualizado.getId()));
        resultado.setEstado(calcularEstadoCliente(clienteActualizado));
        return resultado;
    }

    public ClienteDTO findByNumeroIdentificacionAsDTO(String numeroIdentificacion) {
        // Buscar por cualquier tipo de identificación
        List<Cliente> clientes = clienteRepository.findByRuc(numeroIdentificacion);
        if (clientes.isEmpty()) {
            // Si no es RUC, buscar por otros tipos de identificación
            throw new ResourceNotFoundException("Cliente no encontrado con identificación: " + numeroIdentificacion);
        }
        ClienteDTO resultado = clienteMapper.toDTO(clientes.get(0));
        resultado.setEstadoPago(calcularEstadoPago(clientes.get(0).getId()));
        resultado.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(clientes.get(0).getId()));
        return resultado;
    }

    public boolean existsByNumeroIdentificacion(String numeroIdentificacion) {
        // Verificar si existe por RUC
        List<Cliente> clientesRuc = clienteRepository.findByRuc(numeroIdentificacion);
        if (!clientesRuc.isEmpty()) {
            return true;
        }
        
        // Verificar si existe por número de identificación
        List<Cliente> clientes = clienteRepository.findAll();
        return clientes.stream().anyMatch(c -> numeroIdentificacion.equals(c.getNumeroIdentificacion()));
    }

    public Page<ClienteDTO> findByFiltrosAsDTO(String nombres, EstadoCliente estado, Long vendedorId, 
                                               String numeroIdentificacion, String email, String apellidos, Pageable pageable) {
        // Usar el método existente del repository
        Page<Cliente> clientes = clienteRepository.findByFiltros(null, estado, vendedorId, null, email, nombres, pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        // Calcular estado de pago, grupo de importación y estado calculado para cada cliente
        dtos.getContent().forEach(dto -> {
            dto.setEstadoPago(calcularEstadoPago(dto.getId()));
            dto.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(dto.getId()));
            java.util.Map<String, String> licenciaInfo = obtenerLicenciaGrupoImportacionActivo(dto.getId());
            if (licenciaInfo != null) {
                dto.setLicenciaNombre(licenciaInfo.get("nombre"));
                dto.setLicenciaNumero(licenciaInfo.get("numero"));
            }
            Cliente cliente = clienteRepository.findById(dto.getId()).orElse(null);
            if (cliente != null) {
                dto.setEstado(calcularEstadoCliente(cliente));
            }
        });
        return dtos;
    }

    // ===== MÉTODOS DE APROBACIÓN/RECHAZO =====

    public ClienteDTO aprobarClienteAsDTO(Long id) {
        Cliente cliente = findById(id);
        cliente.setAprobadoPorJefeVentas(true);
        cliente.setFechaAprobacion(java.time.LocalDateTime.now());
        cliente.setEstado(EstadoCliente.APROBADO);
        
        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteActualizado);
        resultado.setEstadoPago(calcularEstadoPago(clienteActualizado.getId()));
        resultado.setGrupoImportacionNombre(obtenerGrupoImportacionActivo(clienteActualizado.getId()));
        resultado.setEstado(calcularEstadoCliente(clienteActualizado));
        return resultado;
    }

    public ClienteDTO rechazarClienteAsDTO(Long id, String motivo) {
        Cliente cliente = findById(id);
        cliente.setAprobadoPorJefeVentas(false);
        cliente.setMotivoRechazo(motivo);
        cliente.setFechaRechazo(java.time.LocalDateTime.now());
        cliente.setEstado(EstadoCliente.RECHAZADO);
        
        Cliente clienteActualizado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(clienteActualizado);
    }
    
    /**
     * Busca o crea el cliente "fantasma" del vendedor para armas sin cliente asignado
     * Este cliente se usa para almacenar armas que el vendedor solicita sin tener un cliente específico
     * 
     * @param usuarioId ID del vendedor
     * @return Cliente fantasma del vendedor (reutiliza el existente o crea uno nuevo)
     */
    @Transactional
    public Cliente buscarOCrearClienteFantasmaVendedor(Long usuarioId) {
        try {
            log.info("🔍 Buscando cliente fantasma del vendedor ID: {}", usuarioId);
            
            // Buscar si ya existe un cliente fantasma para este vendedor
            List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
                usuarioId, 
                EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
            );
            
            if (!clientesFantasma.isEmpty()) {
                // Reutilizar el cliente fantasma más antiguo
                Cliente clienteFantasma = clientesFantasma.get(0);
                log.info("✅ Cliente fantasma encontrado: ID={}, nombres={}", 
                    clienteFantasma.getId(), clienteFantasma.getNombres());
                return clienteFantasma;
            }
            
            // Si no existe, crear uno nuevo
            log.info("📝 No se encontró cliente fantasma, creando uno nuevo para vendedor ID: {}", usuarioId);
            
            var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));
            
            // Buscar tipo "Civil" y "Cédula"
            TipoCliente tipoClienteCivil = tipoClienteRepository.findByCodigo("CIV")
                .orElseThrow(() -> {
                    log.error("❌ Tipo de cliente 'Civil' (CIV) no encontrado en la base de datos");
                    return new BadRequestException("Tipo de cliente 'Civil' no encontrado. Contacte al administrador.");
                });
            
            TipoIdentificacion tipoIdentificacionCedula = tipoIdentificacionRepository.findByCodigo("CED")
                .orElseThrow(() -> {
                    log.error("❌ Tipo de identificación 'Cédula' (CED) no encontrado en la base de datos");
                    return new BadRequestException("Tipo de identificación 'Cédula' no encontrado. Contacte al administrador.");
                });
            
            // Crear cliente fantasma con datos mínimos requeridos
            Cliente clienteFantasma = new Cliente();
            clienteFantasma.setNombres(usuario.getNombres() != null ? usuario.getNombres() : "Vendedor");
            clienteFantasma.setApellidos(usuario.getApellidos() != null ? usuario.getApellidos() : "Sin Apellido");
            
            // Generar número de identificación único (máximo 50 caracteres en BD, pero generamos <= 20 para compatibilidad)
            // Formato: V{usuarioId}-{hash corto}
            // Usar simplemente "V{usuarioId}" como numero_identificacion
            // Esto garantiza unicidad porque cada usuario tiene un ID único
            // Ejemplo: V2, V10, V123 (máximo ~10 caracteres, muy por debajo del límite de 50)
            String numeroIdentificacion = "V" + usuarioId;
            
            log.info("📝 Generando numero_identificacion para cliente fantasma: {} ({} caracteres)", 
                numeroIdentificacion, numeroIdentificacion.length());
            
            clienteFantasma.setNumeroIdentificacion(numeroIdentificacion);
            clienteFantasma.setTipoIdentificacion(tipoIdentificacionCedula);
            clienteFantasma.setTipoCliente(tipoClienteCivil);
            // Cliente fantasma es tipo Civil, por lo que su tipoProceso se obtiene automáticamente
            // desde tipoCliente.getTipoProcesoId() (debería ser 1L = CUPO_CIVIL)
            clienteFantasma.setEstado(EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE);
            // Validar y truncar email si es muy largo (máximo 255 caracteres en BD, pero por seguridad truncar a 200)
            String email = usuario.getEmail();
            if (email != null && email.length() > 200) {
                log.warn("⚠️ Email del usuario muy largo ({} caracteres), truncando a 200", email.length());
                email = email.substring(0, 200);
            }
            clienteFantasma.setEmail(email);
            clienteFantasma.setUsuarioCreador(usuario);
            clienteFantasma.setFechaCreacion(java.time.LocalDateTime.now());
            
            // Validación: "V{usuarioId}" siempre será <= 50 caracteres (máximo ~10 caracteres)
            // No necesita validación adicional
            
            // Guardar cliente fantasma
            Cliente clienteGuardado = clienteRepository.save(clienteFantasma);
            log.info("✅ Cliente fantasma creado exitosamente: ID={}, nombres={}, numeroIdentificacion={}", 
                clienteGuardado.getId(), clienteGuardado.getNombres(), clienteGuardado.getNumeroIdentificacion());
            
            return clienteGuardado;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("❌ Error de integridad al crear cliente fantasma para vendedor ID {}: {}", usuarioId, e.getMessage(), e);
            
            // Verificar si el error es por duplicado (unique constraint violation)
            // Si es duplicado, significa que otro proceso ya creó el cliente, entonces buscarlo
            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            boolean esDuplicado = errorMessage.contains("duplicate key") || 
                                 errorMessage.contains("unique constraint") ||
                                 errorMessage.contains("already exists");
            
            if (esDuplicado) {
                log.info("🔄 Error por duplicado detectado, buscando cliente fantasma existente...");
                // Limpiar la sesión de Hibernate antes de buscar
                entityManager.clear();
                try {
                    return buscarClienteFantasmaExistente(usuarioId, e.getMessage());
                } catch (Exception buscarError) {
                    log.error("❌ Error al buscar cliente fantasma existente: {}", buscarError.getMessage(), buscarError);
                    // Si no se encuentra, reintentar la creación con un nuevo numero_identificacion
                    log.info("🔄 Reintentando creación con nuevo numero_identificacion...");
                    return reintentarCreacionClienteFantasma(usuarioId);
                }
            } else {
                // Si no es duplicado, reintentar la creación con un nuevo numero_identificacion
                log.info("🔄 Error no es por duplicado, reintentando creación con nuevo numero_identificacion...");
                entityManager.clear(); // Limpiar sesión antes de reintentar
                return reintentarCreacionClienteFantasma(usuarioId);
            }
        } catch (Exception e) {
            log.error("❌ Error inesperado al buscar/crear cliente fantasma para vendedor ID {}: {}", usuarioId, e.getMessage(), e);
            throw new RuntimeException("Error al buscar/crear cliente fantasma: " + e.getMessage(), e);
        }
    }
    
    /**
     * Genera un número de identificación único para cliente fantasma
     * Formato simple: V{usuarioId}
     * Esto garantiza unicidad porque cada usuario tiene un ID único
     */
    private String generarNumeroIdentificacionUnico(Long usuarioId) {
        return "V" + usuarioId;
    }
    
    /**
     * Método auxiliar para buscar cliente fantasma existente en una nueva transacción
     * Se usa después de un error de integridad por duplicado para buscar el cliente que ya existe
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Cliente buscarClienteFantasmaExistente(Long usuarioId, String mensajeError) {
        log.info("🔍 Buscando cliente fantasma existente en nueva transacción para vendedor ID: {}", usuarioId);
        
        // Limpiar la sesión de Hibernate para evitar problemas con objetos inconsistentes
        entityManager.clear();
        
        List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
            usuarioId, 
            EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
        );
        if (!clientesFantasma.isEmpty()) {
            log.info("✅ Cliente fantasma encontrado después de error de integridad: ID={}", clientesFantasma.get(0).getId());
            return clientesFantasma.get(0);
        }
        throw new BadRequestException("Error al crear cliente fantasma: " + mensajeError);
    }
    
    /**
     * Reintenta la creación del cliente fantasma con un nuevo numero_identificacion
     * Se usa cuando falla la creación por un error que no es duplicado
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private Cliente reintentarCreacionClienteFantasma(Long usuarioId) {
        log.info("🔄 Reintentando creación de cliente fantasma para vendedor ID: {}", usuarioId);
        
        // Limpiar la sesión de Hibernate
        entityManager.clear();
        
        // Primero, verificar si ya existe un cliente fantasma (por si acaso otro proceso lo creó)
        List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
            usuarioId, 
            EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
        );
        if (!clientesFantasma.isEmpty()) {
            log.info("✅ Cliente fantasma encontrado durante reintento: ID={}", clientesFantasma.get(0).getId());
            return clientesFantasma.get(0);
        }
        
        // Obtener datos necesarios
        var usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));
        
        TipoCliente tipoClienteCivil = tipoClienteRepository.findByCodigo("CIV")
            .orElseThrow(() -> new BadRequestException("Tipo de cliente 'Civil' no encontrado. Contacte al administrador."));
        
        TipoIdentificacion tipoIdentificacionCedula = tipoIdentificacionRepository.findByCodigo("CED")
            .orElseThrow(() -> new BadRequestException("Tipo de identificación 'Cédula' no encontrado. Contacte al administrador."));
        
        // Si no existe, crear uno nuevo con un nuevo numero_identificacion
        Cliente clienteFantasma = new Cliente();
        clienteFantasma.setNombres(usuario.getNombres() != null ? usuario.getNombres() : "Vendedor");
        clienteFantasma.setApellidos(usuario.getApellidos() != null ? usuario.getApellidos() : "Sin Apellido");
        
        // Usar simplemente "V{usuarioId}" como numero_identificacion
        String numeroIdentificacion = generarNumeroIdentificacionUnico(usuarioId);
        
        log.info("📝 Reintentando con numero_identificacion: {} ({} caracteres)", 
            numeroIdentificacion, numeroIdentificacion.length());
        
        clienteFantasma.setNumeroIdentificacion(numeroIdentificacion);
        clienteFantasma.setTipoIdentificacion(tipoIdentificacionCedula);
        clienteFantasma.setTipoCliente(tipoClienteCivil);
        clienteFantasma.setEstado(EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE);
        
        String email = usuario.getEmail();
        if (email != null && email.length() > 200) {
            email = email.substring(0, 200);
        }
        clienteFantasma.setEmail(email);
        clienteFantasma.setUsuarioCreador(usuario);
        clienteFantasma.setFechaCreacion(java.time.LocalDateTime.now());
        
        try {
            Cliente clienteGuardado = clienteRepository.save(clienteFantasma);
            log.info("✅ Cliente fantasma creado exitosamente en reintento: ID={}, numeroIdentificacion={}", 
                clienteGuardado.getId(), clienteGuardado.getNumeroIdentificacion());
            
            return clienteGuardado;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("❌ Error de integridad en reintento de creación de cliente fantasma: {}", e.getMessage(), e);
            // Si falla nuevamente, buscar si ya existe
            entityManager.clear();
            List<Cliente> clientesExistentes = clienteRepository.findByUsuarioCreadorIdAndEstado(
                usuarioId, 
                EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
            );
            if (!clientesExistentes.isEmpty()) {
                log.info("✅ Cliente fantasma encontrado después de error en reintento: ID={}", clientesExistentes.get(0).getId());
                return clientesExistentes.get(0);
            }
            throw new BadRequestException("No se pudo crear el cliente fantasma después de múltiples intentos: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Error inesperado en reintento de creación de cliente fantasma: {}", e.getMessage(), e);
            throw new RuntimeException("Error al reintentar creación de cliente fantasma: " + e.getMessage(), e);
        }
    }
    
    /**
     * Obtiene el nombre del grupo de importación activo del cliente
     * @param clienteId ID del cliente
     * @return Nombre del grupo de importación activo, o null si no está asignado a ningún grupo activo
     */
    public String obtenerGrupoImportacionActivo(Long clienteId) {
        List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(clienteId);
        
        if (gruposCliente == null || gruposCliente.isEmpty()) {
            return null;
        }
        
        // Buscar el grupo activo (no completado ni cancelado)
        for (ClienteGrupoImportacion cgi : gruposCliente) {
            EstadoClienteGrupo estado = cgi.getEstado();
            if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                return cgi.getGrupoImportacion().getNombre();
            }
        }
        
        // Si no hay grupo activo, retornar null
        return null;
    }
    
    /**
     * Obtiene la información de la licencia del grupo de importación activo del cliente
     * @param clienteId ID del cliente
     * @return Map con "nombre" y "numero" de la licencia, o null si no hay grupo activo
     */
    public java.util.Map<String, String> obtenerLicenciaGrupoImportacionActivo(Long clienteId) {
        List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(clienteId);
        
        if (gruposCliente == null || gruposCliente.isEmpty()) {
            return null;
        }
        
        // Buscar el grupo activo (no completado ni cancelado)
        for (ClienteGrupoImportacion cgi : gruposCliente) {
            EstadoClienteGrupo estado = cgi.getEstado();
            if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                GrupoImportacion grupo = cgi.getGrupoImportacion();
                if (grupo != null && grupo.getLicencia() != null) {
                    java.util.Map<String, String> licenciaInfo = new java.util.HashMap<>();
                    licenciaInfo.put("nombre", grupo.getLicencia().getNombre());
                    licenciaInfo.put("numero", grupo.getLicencia().getNumero());
                    return licenciaInfo;
                }
            }
        }
        
        // Si no hay grupo activo o no tiene licencia, retornar null
        return null;
    }
    
    /**
     * Calcula el estado del cliente de manera consistente basado en documentos, armas y estado actual
     * @param cliente Cliente para calcular el estado
     * @return EstadoCliente calculado de manera consistente
     */
    public EstadoCliente calcularEstadoCliente(Cliente cliente) {
        // Si está bloqueado, siempre mostrar BLOQUEADO
        if (cliente.getEstado() == EstadoCliente.BLOQUEADO) {
            return EstadoCliente.BLOQUEADO;
        }
        
        // Si está inhabilitado, mantener ese estado
        if (cliente.getEstado() == EstadoCliente.INHABILITADO_COMPRA) {
            return EstadoCliente.INHABILITADO_COMPRA;
        }
        
        // Si está rechazado, mantener ese estado
        if (cliente.getEstado() == EstadoCliente.RECHAZADO) {
            return EstadoCliente.RECHAZADO;
        }
        
        // Si está cancelado, mantener ese estado
        if (cliente.getEstado() == EstadoCliente.CANCELADO) {
            return EstadoCliente.CANCELADO;
        }
        
        // Si está pendiente de asignación de cliente (fantasma), mantener ese estado
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            return EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE;
        }
        
        // Verificar si tiene documentos completos
        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(cliente.getId());
        
        // Si faltan documentos, retornar PENDIENTE_DOCUMENTOS
        if (!documentosCompletos) {
            return EstadoCliente.PENDIENTE_DOCUMENTOS;
        }
        
        // Verificar si tiene armas asignadas
        boolean tieneArmasAsignadas = clienteArmaService.tieneArmasAsignadas(cliente.getId());
        
        // Si tiene documentos completos y armas asignadas, está listo para importación
        if (documentosCompletos && tieneArmasAsignadas) {
            return EstadoCliente.LISTO_IMPORTACION;
        }
        
        // Si tiene documentos completos pero no tiene armas, está en proceso
        if (documentosCompletos && !tieneArmasAsignadas) {
            return EstadoCliente.EN_PROCESO;
        }
        
        // Por defecto, retornar el estado actual del cliente
        return cliente.getEstado() != null ? cliente.getEstado() : EstadoCliente.EN_PROCESO;
    }
    
    /**
     * Calcula el estado de pago de un cliente
     * @param clienteId ID del cliente
     * @return "IMPAGO" si no ha pagado nada, "ABONADO" si tiene pagos parciales, "PAGO_COMPLETO" si no tiene saldo pendiente
     */
    public String calcularEstadoPago(Long clienteId) {
        List<Pago> pagos = pagoRepository.findByClienteId(clienteId);
        
        if (pagos == null || pagos.isEmpty()) {
            return "IMPAGO";
        }
        
        BigDecimal totalPagado = BigDecimal.ZERO;
        BigDecimal totalPendiente = BigDecimal.ZERO;
        
        for (Pago pago : pagos) {
            if (pago.getMontoPagado() != null) {
                totalPagado = totalPagado.add(pago.getMontoPagado());
            }
            if (pago.getMontoPendiente() != null) {
                totalPendiente = totalPendiente.add(pago.getMontoPendiente());
            }
        }
        
        // Si no ha pagado nada
        if (totalPagado.compareTo(BigDecimal.ZERO) == 0) {
            return "IMPAGO";
        }
        
        // Si tiene saldo pendiente (ha pagado algo pero no todo)
        if (totalPendiente.compareTo(BigDecimal.ZERO) > 0) {
            return "ABONADO";
        }
        
        // Si no tiene saldo pendiente (todo pagado)
        return "PAGO_COMPLETO";
    }

} 
