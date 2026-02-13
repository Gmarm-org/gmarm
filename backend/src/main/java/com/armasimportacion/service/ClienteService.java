package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.dto.ClienteCreateDTO;
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
    private final ClienteQueryService clienteQueryService;

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
        validateClienteForCreate(cliente);

        cliente.setEstado(EstadoCliente.ACTIVO);
        cliente.setFechaCreacion(java.time.LocalDateTime.now());

        return clienteRepository.save(cliente);
    }

    public Cliente update(Long id, Cliente clienteUpdate) {
        Cliente cliente = findById(id);

        validateClienteForUpdate(clienteUpdate, id);

        updateClienteFields(cliente, clienteUpdate);

        return clienteRepository.save(cliente);
    }

    public void delete(Long id) {
        Cliente cliente = findById(id);
        clienteRepository.delete(cliente);
    }

    // ===== VALIDACIONES PÚBLICAS =====

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

    // ===== APROBACIÓN / RECHAZO =====

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

    public ClienteDTO aprobarClienteAsDTO(Long id) {
        Cliente cliente = findById(id);
        cliente.setAprobadoPorJefeVentas(true);
        cliente.setFechaAprobacion(java.time.LocalDateTime.now());
        cliente.setEstado(EstadoCliente.APROBADO);

        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteActualizado);
        clienteQueryService.enrichDTO(resultado, clienteActualizado);
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

    // ===== MÉTODOS DTO (CREATE / UPDATE) =====

    public ClienteDTO createFromDTO(ClienteCreateDTO dto, Long usuarioId) {
        log.info("🔍 ClienteService.createFromDTO: Recibiendo DTO: {}", dto);
        log.info("🔍 ClienteService.createFromDTO: numeroIdentificacion = '{}'", dto.getNumeroIdentificacion());
        log.info("🔍 ClienteService.createFromDTO: nombres = '{}'", dto.getNombres());
        log.info("🔍 ClienteService.createFromDTO: apellidos = '{}'", dto.getApellidos());
        log.info("🔍 ClienteService.createFromDTO: tipoIdentificacionCodigo = '{}'", dto.getTipoIdentificacionCodigo());
        log.info("🔍 ClienteService.createFromDTO: tipoClienteCodigo = '{}'", dto.getTipoClienteCodigo());

        Cliente cliente = new Cliente();
        mapDtoToCliente(dto, cliente);

        // Establecer relaciones
        if (dto.getTipoIdentificacionCodigo() == null || dto.getTipoIdentificacionCodigo().trim().isEmpty()) {
            throw new BadRequestException("tipoIdentificacionCodigo es obligatorio y debe enviarse desde el frontend");
        }
        if (dto.getTipoClienteCodigo() == null || dto.getTipoClienteCodigo().trim().isEmpty()) {
            throw new BadRequestException("tipoClienteCodigo es obligatorio y debe enviarse desde el frontend");
        }

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

        if (usuarioId != null) {
            cliente.setUsuarioCreador(usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
        }

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

        Cliente clienteGuardado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteGuardado);
        clienteQueryService.enrichDTO(resultado, clienteGuardado);
        return resultado;
    }

    public ClienteDTO updateFromDTO(Long id, ClienteCreateDTO dto) {
        Cliente cliente = findById(id);

        mapDtoToCliente(dto, cliente);

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

        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO resultado = clienteMapper.toDTO(clienteActualizado);
        clienteQueryService.enrichDTO(resultado, clienteActualizado);
        return resultado;
    }

    // ===== CLIENTE FANTASMA =====

    @Transactional
    public Cliente buscarOCrearClienteFantasmaVendedor(Long usuarioId) {
        try {
            log.info("🔍 Buscando cliente fantasma del vendedor ID: {}", usuarioId);

            List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
                usuarioId,
                EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
            );

            if (!clientesFantasma.isEmpty()) {
                Cliente clienteFantasma = clientesFantasma.get(0);
                log.info("✅ Cliente fantasma encontrado: ID={}, nombres={}",
                    clienteFantasma.getId(), clienteFantasma.getNombres());
                return clienteFantasma;
            }

            log.info("📝 No se encontró cliente fantasma, creando uno nuevo para vendedor ID: {}", usuarioId);

            var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

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

            Cliente clienteFantasma = new Cliente();
            clienteFantasma.setNombres(usuario.getNombres() != null ? usuario.getNombres() : "Vendedor");
            clienteFantasma.setApellidos(usuario.getApellidos() != null ? usuario.getApellidos() : "Sin Apellido");

            String numeroIdentificacion = "V" + usuarioId;

            log.info("📝 Generando numero_identificacion para cliente fantasma: {} ({} caracteres)",
                numeroIdentificacion, numeroIdentificacion.length());

            clienteFantasma.setNumeroIdentificacion(numeroIdentificacion);
            clienteFantasma.setTipoIdentificacion(tipoIdentificacionCedula);
            clienteFantasma.setTipoCliente(tipoClienteCivil);
            clienteFantasma.setEstado(EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE);
            String email = usuario.getEmail();
            if (email != null && email.length() > 200) {
                log.warn("⚠️ Email del usuario muy largo ({} caracteres), truncando a 200", email.length());
                email = email.substring(0, 200);
            }
            clienteFantasma.setEmail(email);
            clienteFantasma.setUsuarioCreador(usuario);
            clienteFantasma.setFechaCreacion(java.time.LocalDateTime.now());

            Cliente clienteGuardado = clienteRepository.save(clienteFantasma);
            log.info("✅ Cliente fantasma creado exitosamente: ID={}, nombres={}, numeroIdentificacion={}",
                clienteGuardado.getId(), clienteGuardado.getNombres(), clienteGuardado.getNumeroIdentificacion());

            return clienteGuardado;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("❌ Error de integridad al crear cliente fantasma para vendedor ID {}: {}", usuarioId, e.getMessage(), e);

            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            boolean esDuplicado = errorMessage.contains("duplicate key") ||
                                 errorMessage.contains("unique constraint") ||
                                 errorMessage.contains("already exists");

            if (esDuplicado) {
                log.info("🔄 Error por duplicado detectado, buscando cliente fantasma existente...");
                entityManager.clear();
                try {
                    return buscarClienteFantasmaExistente(usuarioId, e.getMessage());
                } catch (Exception buscarError) {
                    log.error("❌ Error al buscar cliente fantasma existente: {}", buscarError.getMessage(), buscarError);
                    log.info("🔄 Reintentando creación con nuevo numero_identificacion...");
                    return reintentarCreacionClienteFantasma(usuarioId);
                }
            } else {
                log.info("🔄 Error no es por duplicado, reintentando creación con nuevo numero_identificacion...");
                entityManager.clear();
                return reintentarCreacionClienteFantasma(usuarioId);
            }
        } catch (Exception e) {
            log.error("❌ Error inesperado al buscar/crear cliente fantasma para vendedor ID {}: {}", usuarioId, e.getMessage(), e);
            throw new RuntimeException("Error al buscar/crear cliente fantasma: " + e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Cliente buscarClienteFantasmaExistente(Long usuarioId, String mensajeError) {
        log.info("🔍 Buscando cliente fantasma existente en nueva transacción para vendedor ID: {}", usuarioId);

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private Cliente reintentarCreacionClienteFantasma(Long usuarioId) {
        log.info("🔄 Reintentando creación de cliente fantasma para vendedor ID: {}", usuarioId);

        entityManager.clear();

        List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
            usuarioId,
            EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
        );
        if (!clientesFantasma.isEmpty()) {
            log.info("✅ Cliente fantasma encontrado durante reintento: ID={}", clientesFantasma.get(0).getId());
            return clientesFantasma.get(0);
        }

        var usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        TipoCliente tipoClienteCivil = tipoClienteRepository.findByCodigo("CIV")
            .orElseThrow(() -> new BadRequestException("Tipo de cliente 'Civil' no encontrado. Contacte al administrador."));

        TipoIdentificacion tipoIdentificacionCedula = tipoIdentificacionRepository.findByCodigo("CED")
            .orElseThrow(() -> new BadRequestException("Tipo de identificación 'Cédula' no encontrado. Contacte al administrador."));

        Cliente clienteFantasma = new Cliente();
        clienteFantasma.setNombres(usuario.getNombres() != null ? usuario.getNombres() : "Vendedor");
        clienteFantasma.setApellidos(usuario.getApellidos() != null ? usuario.getApellidos() : "Sin Apellido");

        String numeroIdentificacion = "V" + usuarioId;

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

    // ===== MÉTODOS PRIVADOS =====

    private void mapDtoToCliente(ClienteCreateDTO dto, Cliente cliente) {
        cliente.setNombres(dto.getNombres());
        cliente.setApellidos(dto.getApellidos());
        cliente.setNumeroIdentificacion(dto.getNumeroIdentificacion());
        if (dto.getFechaNacimiento() != null && !dto.getFechaNacimiento().isEmpty()) {
            String fechaStr = dto.getFechaNacimiento();
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
        cliente.setCodigoIssfa(dto.getCodigoIssfa());
        cliente.setCodigoIsspol(dto.getCodigoIsspol());
        cliente.setRango(dto.getRango());

        cliente.setRuc(dto.getRuc());
        cliente.setNombreEmpresa(dto.getNombreEmpresa());
        cliente.setDireccionFiscal(dto.getDireccionFiscal());
        cliente.setTelefonoReferencia(dto.getTelefonoReferencia());
        cliente.setCorreoEmpresa(dto.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(dto.getProvinciaEmpresa());
        cliente.setCantonEmpresa(dto.getCantonEmpresa());
    }

    private void validateClienteForCreate(Cliente cliente) {
        if (clienteRepository.existsByTipoIdentificacionIdAndNumeroIdentificacion(
                cliente.getTipoIdentificacion().getId(), cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Ya existe un cliente con esta identificación: " +
                cliente.getNumeroIdentificacion());
        }

        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            throw new BadRequestException("Ya existe un cliente con este email: " + cliente.getEmail());
        }

        if (cliente.getRuc() != null && !cliente.getRuc().trim().isEmpty()) {
            if (clienteRepository.findByRuc(cliente.getRuc()).size() > 0) {
                throw new BadRequestException("Ya existe una empresa con este RUC: " + cliente.getRuc());
            }
        }

        if (cliente.getFechaNacimiento() != null && !validateEdadMinima(cliente.getFechaNacimiento())) {
            String mensajeError = cliente.getMensajeErrorEdad();
            throw new BadRequestException(mensajeError != null ? mensajeError : "El cliente debe tener al menos 25 años");
        }

        if (cliente.getTipoIdentificacion().esCedula() && !validateCedula(cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Formato de cédula inválido");
        }

        if (cliente.getTipoIdentificacion().esRUC() && !validateRuc(cliente.getNumeroIdentificacion())) {
            throw new BadRequestException("Formato de RUC inválido");
        }

        if (!validateTelefono(cliente.getTelefonoPrincipal())) {
            throw new BadRequestException("Formato de teléfono inválido");
        }

        validateCamposEspecificos(cliente);
    }

    private void validateClienteForUpdate(Cliente clienteUpdate, Long id) {
        if (clienteRepository.existsByTipoIdentificacionIdAndNumeroIdentificacionAndIdNot(
                clienteUpdate.getTipoIdentificacion().getId(), clienteUpdate.getNumeroIdentificacion(), id)) {
            throw new BadRequestException("Ya existe un cliente con esta identificación: " +
                clienteUpdate.getNumeroIdentificacion());
        }

        if (clienteRepository.existsByEmail(clienteUpdate.getEmail())) {
            Cliente clienteExistente = clienteRepository.findByEmail(clienteUpdate.getEmail()).get();
            if (!clienteExistente.getId().equals(id)) {
                throw new BadRequestException("Ya existe un cliente con este email: " + clienteUpdate.getEmail());
            }
        }

        if (clienteUpdate.getRuc() != null && !clienteUpdate.getRuc().trim().isEmpty()) {
            List<Cliente> clientesConRuc = clienteRepository.findByRuc(clienteUpdate.getRuc());
            if (clientesConRuc.size() > 0 && !clientesConRuc.get(0).getId().equals(id)) {
                throw new BadRequestException("Ya existe una empresa con este RUC: " + clienteUpdate.getRuc());
            }
        }

        if (clienteUpdate.getFechaNacimiento() != null && !validateEdadMinima(clienteUpdate.getFechaNacimiento())) {
            String mensajeError = clienteUpdate.getMensajeErrorEdad();
            throw new BadRequestException(mensajeError != null ? mensajeError : "El cliente debe tener al menos 25 años");
        }

        validateCamposEspecificos(clienteUpdate);
    }

    private void validateCamposEspecificos(Cliente cliente) {
        if (cliente.getTipoCliente() != null) {
            if (cliente.getTipoCliente().esMilitar()) {
                if (cliente.getCodigoIssfa() == null || cliente.getCodigoIssfa().trim().isEmpty()) {
                    throw new BadRequestException("El código ISSFA es obligatorio para militares");
                }

                String codigoIssfa = cliente.getCodigoIssfa().trim();
                if (codigoIssfa.length() != 10) {
                    throw new BadRequestException("El código ISSFA debe tener exactamente 10 dígitos");
                }
                if (!codigoIssfa.matches("\\d{10}")) {
                    throw new BadRequestException("El código ISSFA debe contener solo números (10 dígitos)");
                }
            }

            if (cliente.getTipoCliente().esPolicia()) {
                if (cliente.getCodigoIsspol() == null || cliente.getCodigoIsspol().trim().isEmpty()) {
                    throw new BadRequestException("El código ISSPOL es obligatorio para policías");
                }

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
        cliente.setCodigoIssfa(clienteUpdate.getCodigoIssfa());
        cliente.setCodigoIsspol(clienteUpdate.getCodigoIsspol());
        cliente.setRango(clienteUpdate.getRango());

        cliente.setRuc(clienteUpdate.getRuc());
        cliente.setNombreEmpresa(clienteUpdate.getNombreEmpresa());
        cliente.setDireccionFiscal(clienteUpdate.getDireccionFiscal());
        cliente.setTelefonoReferencia(clienteUpdate.getTelefonoReferencia());
        cliente.setCorreoEmpresa(clienteUpdate.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(clienteUpdate.getProvinciaEmpresa());
        cliente.setCantonEmpresa(clienteUpdate.getCantonEmpresa());
    }
}
