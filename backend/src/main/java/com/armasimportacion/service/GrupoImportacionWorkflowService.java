package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Servicio responsable del flujo de trabajo y operaciones de grupos de importación.
 * Incluye: definir pedido, notificar pago fábrica, registrar llegada, cambiar estado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionWorkflowService {

    private final GrupoImportacionRepository grupoImportacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final ClienteRepository clienteRepository;
    private final PedidoArmasGrupoImportacionService pedidoArmasService;
    private final DocumentoGrupoImportacionService documentoGrupoImportacionService;
    private final DocumentoClienteService documentoClienteService;

    /**
     * Define el pedido para un grupo de importación
     * Genera el PDF "Pedido_Armas_Grupo_Importacion_AAAA_MM_DD" y cambia el estado
     */
    public com.armasimportacion.model.DocumentoGenerado definirPedido(Long grupoId, Long usuarioId) {
        log.info("📋 Definiendo pedido para grupo de importación ID: {}", grupoId);

        Map<String, Object> validacion = verificarPuedeDefinirPedidoDetalle(grupoId);
        boolean puedeDefinir = Boolean.TRUE.equals(validacion.get("puedeDefinir"));
        if (!puedeDefinir) {
            throw new BadRequestException(validacion.get("mensaje").toString());
        }

        return pedidoArmasService.generarPedidoArmas(grupoId, usuarioId);
    }

    /**
     * Verifica si un grupo puede definir pedido
     */
    @Transactional(readOnly = true)
    public boolean verificarPuedeDefinirPedido(Long grupoId) {
        return Boolean.TRUE.equals(verificarPuedeDefinirPedidoDetalle(grupoId).get("puedeDefinir"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verificarPuedeDefinirPedidoDetalle(Long grupoId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        if (grupo.getEstado() != EstadoGrupoImportacion.EN_PREPARACION &&
            grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES) {
            return Map.of(
                "puedeDefinir", false,
                "mensaje", "El grupo no está en un estado válido para definir pedido"
            );
        }

        List<ClienteGrupoImportacion> clientesGrupo = clienteGrupoRepository.findByGrupoImportacionId(grupoId);
        if (clientesGrupo.isEmpty()) {
            return Map.of(
                "puedeDefinir", false,
                "mensaje", "No hay clientes asignados al grupo de importación"
            );
        }

        boolean hayClientesSinDocumentos = clientesGrupo.stream()
            .anyMatch(cg -> !documentoClienteService.verificarDocumentosCompletos(cg.getCliente().getId()));

        if (hayClientesSinDocumentos) {
            return Map.of(
                "puedeDefinir", false,
                "mensaje", "Existen clientes sin todos los documentos cargados, verifica y vuelve a intentar cuando todos los clientes estén cargados"
            );
        }

        return Map.of(
            "puedeDefinir", true,
            "mensaje", "El grupo puede definir pedido"
        );
    }

    /**
     * Notifica el pago a fábrica
     * Solo se puede ejecutar si los documentos 1, 2, 3 están cargados
     */
    public void notificarPagoFabrica(Long grupoId, Long usuarioId) {
        log.info("💰 Notificando pago a fábrica para grupo ID: {}", grupoId);

        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!documentoGrupoImportacionService.verificarDocumentosRequeridos(grupoId)) {
            throw new BadRequestException("No se puede notificar el pago. Faltan documentos requeridos (1, 2, 3)");
        }

        if (grupo.getEstado() != EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA &&
            grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_OPERACIONES) {
            throw new BadRequestException("El grupo no está en un estado válido para notificar pago. Estado actual: " + grupo.getEstado());
        }

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
    public void registrarFechaLlegada(Long grupoId, LocalDate fechaLlegada, Long usuarioId) {
        log.info("📅 Registrando fecha de llegada para grupo ID: {} - Fecha: {}", grupoId, fechaLlegada);

        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

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

        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

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
     * Cambia el estado del grupo (método genérico mejorado)
     */
    public void cambiarEstado(Long grupoId, EstadoGrupoImportacion nuevoEstado, Long usuarioId) {
        log.info("🔄 Cambiando estado del grupo ID: {} a {}", grupoId, nuevoEstado);

        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        if (usuarioId != null) {
            Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            grupo.setUsuarioActualizador(usuario);
        }

        grupo.setEstado(nuevoEstado);
        grupo.setFechaActualizacion(LocalDateTime.now());

        grupoImportacionRepository.save(grupo);

        Set<EstadoGrupoImportacion> estadosImportacionActiva = Set.of(
            EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA,
            EstadoGrupoImportacion.EN_PROCESO_OPERACIONES,
            EstadoGrupoImportacion.NOTIFICAR_AGENTE_ADUANERO,
            EstadoGrupoImportacion.EN_ESPERA_DOCUMENTOS_CLIENTE
        );

        if (estadosImportacionActiva.contains(nuevoEstado)) {
            actualizarEstadoClientesDelGrupo(grupoId, EstadoCliente.EN_CURSO_IMPORTACION);
        }

        log.info("✅ Estado del grupo ID: {} cambiado a {}", grupoId, nuevoEstado);
    }

    private void actualizarEstadoClientesDelGrupo(Long grupoId, EstadoCliente nuevoEstado) {
        log.info("📋 Actualizando estado de clientes del grupo {} a {}", grupoId, nuevoEstado);

        List<ClienteGrupoImportacion> clientesGrupo = clienteGrupoRepository.findByGrupoImportacionId(grupoId);

        int clientesActualizados = 0;
        for (ClienteGrupoImportacion cgi : clientesGrupo) {
            Cliente cliente = cgi.getCliente();
            if (cliente.getEstado() == EstadoCliente.LISTO_IMPORTACION) {
                cliente.setEstado(nuevoEstado);
                clienteRepository.save(cliente);
                clientesActualizados++;
                log.info("✅ Cliente {} {} actualizado a {}",
                    cliente.getNombres(), cliente.getApellidos(), nuevoEstado);
            }
        }

        log.info("✅ {} clientes actualizados a estado {} en grupo {}",
            clientesActualizados, nuevoEstado, grupoId);
    }
}
