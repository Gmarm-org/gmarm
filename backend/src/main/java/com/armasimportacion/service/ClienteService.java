package com.armasimportacion.service;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.model.TipoIdentificacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final TipoClienteRepository tipoClienteRepository;
    private final TipoIdentificacionRepository tipoIdentificacionRepository;
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
        TipoCliente tipoCliente = cliente.getTipoCliente();

        if (tipoCliente.esEmpresa()) {
            // Validar campos obligatorios para empresas
            if (cliente.getRuc() == null || cliente.getRuc().trim().isEmpty()) {
                throw new BadRequestException("El RUC es obligatorio para empresas");
            }
            if (cliente.getNombreEmpresa() == null || cliente.getNombreEmpresa().trim().isEmpty()) {
                throw new BadRequestException("El nombre de la empresa es obligatorio");
            }
            if (cliente.getRepresentanteLegal() == null || cliente.getRepresentanteLegal().trim().isEmpty()) {
                throw new BadRequestException("El representante legal es obligatorio");
            }
            if (cliente.getDireccionFiscal() == null || cliente.getDireccionFiscal().trim().isEmpty()) {
                throw new BadRequestException("La dirección fiscal es obligatoria para empresas");
            }
            if (cliente.getTelefonoReferencia() == null || cliente.getTelefonoReferencia().trim().isEmpty()) {
                throw new BadRequestException("El teléfono de referencia es obligatorio para empresas");
            }
            if (cliente.getCorreoEmpresa() == null || cliente.getCorreoEmpresa().trim().isEmpty()) {
                throw new BadRequestException("El correo electrónico de la empresa es obligatorio");
            }
            if (cliente.getProvinciaEmpresa() == null || cliente.getProvinciaEmpresa().trim().isEmpty()) {
                throw new BadRequestException("La provincia de la empresa es obligatoria");
            }
            if (cliente.getCantonEmpresa() == null || cliente.getCantonEmpresa().trim().isEmpty()) {
                throw new BadRequestException("El cantón de la empresa es obligatorio");
            }
            
            // Validar formato de RUC
            if (!validateRuc(cliente.getRuc())) {
                throw new BadRequestException("Formato de RUC inválido");
            }
        }

        if (tipoCliente.esUniformado()) {
            // Validar campos obligatorios para uniformados
            if (cliente.getEstadoMilitar() == null) {
                throw new BadRequestException("El estado militar es obligatorio para uniformados");
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

        // Campos de empresa
        cliente.setRuc(clienteUpdate.getRuc());
        cliente.setNombreEmpresa(clienteUpdate.getNombreEmpresa());
        cliente.setDireccionFiscal(clienteUpdate.getDireccionFiscal());
        cliente.setTelefonoReferencia(clienteUpdate.getTelefonoReferencia());
        cliente.setCorreoEmpresa(clienteUpdate.getCorreoEmpresa());
        cliente.setProvinciaEmpresa(clienteUpdate.getProvinciaEmpresa());
        cliente.setCantonEmpresa(clienteUpdate.getCantonEmpresa());
    }
} 