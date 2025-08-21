package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.mapper.ClienteMapper;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.dto.ClienteCreateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    private final TipoIdentificacionRepository tipoIdentificacionRepository;
    private final TipoClienteRepository tipoClienteRepository;
    private final UsuarioRepository usuarioRepository;
    

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
        return clienteMapper.toDTOList(clientes);
    }
    
    public Page<ClienteDTO> findAllAsDTO(Pageable pageable) {
        Page<Cliente> clientes = findAll(pageable);
        return clientes.map(clienteMapper::toDTO);
    }
    
    public ClienteDTO findByIdAsDTO(Long id) {
        Cliente cliente = findById(id);
        return clienteMapper.toDTO(cliente);
    }
    
    public List<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId) {
        List<Cliente> clientes = findByUsuarioCreador(usuarioId);
        return clienteMapper.toDTOList(clientes);
    }
    
    public Page<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId, Pageable pageable) {
        Page<Cliente> clientes = findByUsuarioCreador(usuarioId, pageable);
        return clientes.map(clienteMapper::toDTO);
    }
    
    public List<ClienteDTO> findByEstadoAsDTO(EstadoCliente estado) {
        List<Cliente> clientes = findByEstado(estado);
        return clienteMapper.toDTOList(clientes);
    }
    
    public List<ClienteDTO> findClientesAprobadosAsDTO() {
        List<Cliente> clientes = findClientesAprobados();
        return clienteMapper.toDTOList(clientes);
    }
    
    public List<ClienteDTO> findClientesPendientesAprobacionAsDTO() {
        List<Cliente> clientes = findClientesPendientesAprobacion();
        return clienteMapper.toDTOList(clientes);
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
        // This method is no longer needed as validation is done in DTOs
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
        // Crear entidad Cliente desde DTO
        Cliente cliente = new Cliente();
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        cliente.setFechaNacimiento(dto.getFechaNacimiento());
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

        // Campos de empresa
        cliente.setRuc(dto.getRuc());
        cliente.setNombreEmpresa(dto.getNombreEmpresa());
        cliente.setDireccionFiscal(dto.getDireccionFiscal());
        cliente.setTelefonoReferencia(dto.getTelefonoReferencia());
        cliente.setCorreoEmpresa(dto.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(dto.getProvinciaEmpresa());
        cliente.setCantonEmpresa(dto.getCantonEmpresa());

        // Establecer relaciones - MAPEAR CÓDIGOS A IDs
        if (dto.getTipoIdentificacionCodigo() != null) {
            // Mapear código a ID
            Long tipoIdentificacionId = mapTipoIdentificacionCodigoToId(dto.getTipoIdentificacionCodigo());
            cliente.setTipoIdentificacion(tipoIdentificacionRepository.findById(tipoIdentificacionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de identificación no encontrado: " + dto.getTipoIdentificacionCodigo())));
        }

        if (dto.getTipoClienteCodigo() != null) {
            // Mapear código a ID
            Long tipoClienteId = mapTipoClienteCodigoToId(dto.getTipoClienteCodigo());
            cliente.setTipoCliente(tipoClienteRepository.findById(tipoClienteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de cliente no encontrado: " + dto.getTipoClienteCodigo())));
        }

        // Establecer usuario creador
        if (usuarioId != null) {
            cliente.setUsuarioCreador(usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
        }

        // Configurar valores por defecto
        cliente.setEstado(EstadoCliente.ACTIVO);
        cliente.setFechaCreacion(java.time.LocalDateTime.now());

        // Guardar y retornar DTO
        Cliente clienteGuardado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(clienteGuardado);
    }

    public ClienteDTO updateFromDTO(Long id, ClienteCreateDTO dto) {
        Cliente cliente = findById(id);
        
        // Actualizar campos
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        cliente.setFechaNacimiento(dto.getFechaNacimiento());
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

        // Campos de empresa
        cliente.setRuc(dto.getRuc());
        cliente.setNombreEmpresa(dto.getNombreEmpresa());
        cliente.setDireccionFiscal(dto.getDireccionFiscal());
        cliente.setTelefonoReferencia(dto.getTelefonoReferencia());
        cliente.setCorreoEmpresa(dto.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(dto.getProvinciaEmpresa());
        cliente.setCantonEmpresa(dto.getCantonEmpresa());

        // Establecer relaciones - MAPEAR CÓDIGOS A IDs
        if (dto.getTipoIdentificacionCodigo() != null) {
            // Mapear código a ID
            Long tipoIdentificacionId = mapTipoIdentificacionCodigoToId(dto.getTipoIdentificacionCodigo());
            cliente.setTipoIdentificacion(tipoIdentificacionRepository.findById(tipoIdentificacionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de identificación no encontrado: " + dto.getTipoIdentificacionCodigo())));
        }

        if (dto.getTipoClienteCodigo() != null) {
            // Mapear código a ID
            Long tipoClienteId = mapTipoClienteCodigoToId(dto.getTipoClienteCodigo());
            cliente.setTipoCliente(tipoClienteRepository.findById(tipoClienteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Tipo de cliente no encontrado: " + dto.getTipoClienteCodigo())));
        }

        // Guardar y retornar DTO
        Cliente clienteActualizado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(clienteActualizado);
    }

    public ClienteDTO findByNumeroIdentificacionAsDTO(String numeroIdentificacion) {
        // Buscar por cualquier tipo de identificación
        List<Cliente> clientes = clienteRepository.findByRuc(numeroIdentificacion);
        if (clientes.isEmpty()) {
            // Si no es RUC, buscar por otros tipos de identificación
            throw new ResourceNotFoundException("Cliente no encontrado con identificación: " + numeroIdentificacion);
        }
        return clienteMapper.toDTO(clientes.get(0));
    }

    public Page<ClienteDTO> findByFiltrosAsDTO(String nombres, EstadoCliente estado, Long vendedorId, 
                                               String numeroIdentificacion, String email, String apellidos, Pageable pageable) {
        // Usar el método existente del repository
        Page<Cliente> clientes = clienteRepository.findByFiltros(null, estado, vendedorId, null, email, nombres, pageable);
        return clientes.map(clienteMapper::toDTO);
    }

    // ===== MÉTODOS DE APROBACIÓN/RECHAZO =====

    public ClienteDTO aprobarClienteAsDTO(Long id) {
        Cliente cliente = findById(id);
        cliente.setAprobadoPorJefeVentas(true);
        cliente.setFechaAprobacion(java.time.LocalDateTime.now());
        cliente.setEstado(EstadoCliente.APROBADO);
        
        Cliente clienteActualizado = clienteRepository.save(cliente);
        return clienteMapper.toDTO(clienteActualizado);
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

    // ===== MÉTODOS DTO ADICIONALES =====

    // ===== MÉTODOS DE MAPEO CÓDIGO A ID =====
    
    private Long mapTipoIdentificacionCodigoToId(String tipoIdentificacionCodigo) {
        switch (tipoIdentificacionCodigo.toUpperCase()) {
            case "CED":
                return 1L;
            case "RUC":
                return 2L;
            default:
                throw new BadRequestException("Código de tipo de identificación no válido: " + tipoIdentificacionCodigo);
        }
    }
    
    private Long mapTipoClienteCodigoToId(String tipoClienteCodigo) {
        switch (tipoClienteCodigo.toUpperCase()) {
            case "CIV":
                return 1L;
            case "MIL":
            case "NAV":
            case "AER":
            case "POL":
                return 2L; // Usar el primer tipo militar disponible
            case "EMP":
                return 6L;
            case "DEP":
                return 7L;
            default:
                throw new BadRequestException("Código de tipo de cliente no válido: " + tipoClienteCodigo);
        }
    }
    
} 
