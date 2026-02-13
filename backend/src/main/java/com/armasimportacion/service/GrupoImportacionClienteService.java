package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.enums.TipoGrupo;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


/**
 * Servicio responsable de la gestión de clientes dentro de grupos de importación.
 * Incluye: agregar/remover clientes, obtener clientes disponibles, asignación automática, confirmación.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionClienteService {

    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ClienteRepository clienteRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final DocumentoClienteService documentoClienteService;
    private final GrupoImportacionMatchingService matchingService;

    public void agregarCliente(Long grupoId, Long clienteId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
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
        TipoGrupo tipoGrupo = grupo.getTipoGrupo() != null ? grupo.getTipoGrupo() : TipoGrupo.CUPO;

        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            throw new BadRequestException("El cliente no tiene un tipo de cliente definido");
        }

        boolean esCompatible = false;
        String mensajeError = "";

        if (tipoGrupo == TipoGrupo.CUPO) {
            if (tipoCliente.esCivil()) {
                esCompatible = true;
            } else if (tipoCliente.esDeportista()) {
                esCompatible = true;
            } else if (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                      cliente.getEstadoMilitar() == EstadoMilitar.PASIVO) {
                esCompatible = true;
            } else {
                mensajeError = "Los grupos de tipo CUPO solo pueden incluir: Civiles, Deportistas y Uniformados en servicio PASIVO. " +
                              "Este cliente es: " + tipoCliente.getNombre() +
                              (cliente.getEstadoMilitar() != null ? " (Estado: " + cliente.getEstadoMilitar().getDescripcion() + ")" : "");
            }
        } else if (tipoGrupo == TipoGrupo.JUSTIFICATIVO) {
            if (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                cliente.getEstadoMilitar() == EstadoMilitar.ACTIVO) {
                esCompatible = true;
            } else if (tipoCliente.esEmpresa()) {
                esCompatible = true;
            } else if (tipoCliente.esDeportista()) {
                esCompatible = true;
            } else {
                mensajeError = "Los grupos de tipo JUSTIFICATIVO solo pueden incluir: Uniformados en servicio ACTIVO, " +
                              "Compañías de Seguridad y Deportistas. " +
                              "Este cliente es: " + tipoCliente.getNombre() +
                              (cliente.getEstadoMilitar() != null ? " (Estado: " + cliente.getEstadoMilitar().getDescripcion() + ")" : "");
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
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
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

    @Transactional(readOnly = true)
    public List<Cliente> obtenerClientesDisponibles() {
        return obtenerClientesDisponibles(null);
    }

    @Transactional(readOnly = true)
    public List<Cliente> obtenerClientesDisponibles(Long grupoId) {
        log.info("🔍 Obteniendo clientes disponibles para asignar a grupos{}",
                grupoId != null ? " (grupo ID: " + grupoId + ")" : "");

        final TipoGrupo tipoGrupoFinal;
        if (grupoId != null) {
            GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
            tipoGrupoFinal = grupo.getTipoGrupo() != null ? grupo.getTipoGrupo() : TipoGrupo.CUPO;
            log.info("📋 Filtrando clientes compatibles con tipo de grupo: {}", tipoGrupoFinal);
        } else {
            tipoGrupoFinal = null;
        }

        List<Cliente> clientesPreFiltrados = clienteRepository.findClientesDisponiblesParaGrupo();

        List<Cliente> clientesDisponibles = clientesPreFiltrados.stream()
                .filter(cliente -> {
                    if (tipoGrupoFinal == null) {
                        return true;
                    }

                    TipoCliente tipoCliente = cliente.getTipoCliente();
                    if (tipoCliente == null) {
                        return false;
                    }

                    if (tipoGrupoFinal == TipoGrupo.CUPO) {
                        return tipoCliente.esCivil() ||
                               tipoCliente.esDeportista() ||
                               (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                                cliente.getEstadoMilitar() == EstadoMilitar.PASIVO);
                    } else if (tipoGrupoFinal == TipoGrupo.JUSTIFICATIVO) {
                        return (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                                cliente.getEstadoMilitar() == EstadoMilitar.ACTIVO) ||
                               tipoCliente.esEmpresa() ||
                               tipoCliente.esDeportista();
                    }

                    return true;
                })
                .toList();

        log.info("✅ Encontrados {} clientes disponibles de {} pre-filtrados{}",
                clientesDisponibles.size(), clientesPreFiltrados.size(),
                tipoGrupoFinal != null ? " (filtrados por tipo " + tipoGrupoFinal + ")" : "");

        return clientesDisponibles;
    }

    /**
     * Asigna automáticamente un cliente a un grupo disponible del vendedor.
     * La asignación es provisional (PENDIENTE) hasta que el cliente confirme sus datos.
     */
    @Transactional
    public ClienteGrupoImportacion asignarClienteAGrupoDisponible(Cliente cliente, Long vendedorId) {
        log.info("🔄 Asignando cliente ID {} a grupo disponible del vendedor ID: {}", cliente.getId(), vendedorId);

        GrupoImportacion grupo = matchingService.encontrarGrupoDisponibleParaVendedor(vendedorId, cliente);

        if (grupo == null) {
            log.info("📭 No hay grupo disponible para asignar cliente ID: {}", cliente.getId());
            return null;
        }

        if (clienteGrupoRepository.existsByClienteAndGrupoImportacion(cliente, grupo)) {
            log.info("ℹ️ Cliente ID {} ya está asignado al grupo ID: {}", cliente.getId(), grupo.getId());
            return clienteGrupoRepository.findByClienteAndGrupoImportacion(cliente, grupo)
                .orElse(null);
        }

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
     * Confirma la asignación de un cliente a un grupo (cuando el cliente verifica su email).
     * Cambia el estado de PENDIENTE a CONFIRMADO.
     */
    @Transactional
    public void confirmarAsignacionCliente(Long clienteId) {
        log.info("✅ Confirmando asignación del cliente ID: {} al grupo", clienteId);

        if (!clienteRepository.existsById(clienteId)) {
            throw new ResourceNotFoundException("Cliente no encontrado");
        }

        List<ClienteGrupoImportacion> asignaciones = clienteGrupoRepository.findByClienteId(clienteId);

        ClienteGrupoImportacion asignacionPendiente = asignaciones.stream()
            .filter(cgi -> cgi.getEstado() == EstadoClienteGrupo.PENDIENTE)
            .findFirst()
            .orElse(null);

        if (asignacionPendiente == null) {
            log.warn("⚠️ No se encontró asignación pendiente para cliente ID: {}", clienteId);
            return;
        }

        asignacionPendiente.setEstado(EstadoClienteGrupo.CONFIRMADO);
        asignacionPendiente.setFechaActualizacion(LocalDateTime.now());
        clienteGrupoRepository.save(asignacionPendiente);

        log.info("✅ Asignación confirmada: Cliente ID {} en grupo ID: {}",
            clienteId, asignacionPendiente.getGrupoImportacion().getId());
    }
}
