package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.PreguntaCliente;
import com.armasimportacion.model.RespuestaCliente;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.DocumentoClienteRepository;
import com.armasimportacion.repository.PreguntaClienteRepository;
import com.armasimportacion.repository.RespuestaClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClienteProcesoService {

    private final ClienteRepository clienteRepository;
    private final DocumentoClienteRepository documentoClienteRepository;
    private final PreguntaClienteRepository preguntaClienteRepository;
    private final RespuestaClienteRepository respuestaClienteRepository;
    private final EmailService emailService;
    private final NotificacionService notificacionService;

    /**
     * Verifica si el proceso del cliente está completo
     */
    public boolean verificarProcesoCompleto(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));

        boolean documentosCompletos = verificarDocumentosObligatorios(clienteId);
        boolean preguntasCompletas = verificarPreguntasObligatorias(clienteId);

        return documentosCompletos && preguntasCompletas;
    }

    /**
     * Verifica documentos obligatorios
     */
    public boolean verificarDocumentosObligatorios(Long clienteId) {
        List<DocumentoCliente> documentos = documentoClienteRepository.findByClienteId(clienteId);
        return documentos.size() >= 2; // Mínimo 2 documentos para desarrollo
    }

    /**
     * Verifica preguntas obligatorias
     */
    public boolean verificarPreguntasObligatorias(Long clienteId) {
        List<PreguntaCliente> preguntasObligatorias = preguntaClienteRepository.findByEstado(true);
        List<RespuestaCliente> respuestasCliente = respuestaClienteRepository.findByClienteId(clienteId);
        
        for (PreguntaCliente pregunta : preguntasObligatorias) {
            boolean tieneRespuesta = respuestasCliente.stream()
                    .anyMatch(resp -> resp.getPregunta().getId().equals(pregunta.getId()));
            if (!tieneRespuesta) return false;
        }
        return true;
    }

    /**
     * Marca proceso como completo y envía contrato
     */
    public void completarProceso(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));

        if (!verificarProcesoCompleto(clienteId)) {
            throw new BadRequestException("El proceso del cliente no está completo");
        }

        List<DocumentoCliente> documentos = documentoClienteRepository.findByClienteId(clienteId);
        List<RespuestaCliente> respuestas = respuestaClienteRepository.findByClienteId(clienteId);

        cliente.setProcesoCompletado(true);
        cliente.setEstado(EstadoCliente.EN_PROCESO);
        clienteRepository.save(cliente);

        try {
            emailService.enviarContratoCliente(cliente, documentos, respuestas);
            log.info("✅ Proceso completado y contrato enviado para cliente: {}", cliente.getNombreCompleto());
        } catch (Exception e) {
            log.error("❌ Error al enviar contrato: {}", e.getMessage());
        }

        // TODO: Implementar notificación de proceso completado
        log.info("✅ Proceso completado para cliente ID: {}", clienteId);
    }

    /**
     * Envía confirmación de proceso iniciado
     */
    public void enviarConfirmacionProceso(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));

        try {
            emailService.enviarConfirmacionProceso(cliente);
            log.info("✅ Confirmación enviada para cliente: {}", cliente.getNombreCompleto());
        } catch (Exception e) {
            log.error("❌ Error al enviar confirmación: {}", e.getMessage());
            throw new RuntimeException("Error al enviar confirmación", e);
        }
    }

    /**
     * Obtiene elementos faltantes
     */
    public List<String> obtenerElementosFaltantes(Long clienteId) {
        List<String> elementosFaltantes = new ArrayList<>();
        
        if (!verificarDocumentosObligatorios(clienteId)) {
            elementosFaltantes.add("Documentos obligatorios");
        }
        if (!verificarPreguntasObligatorias(clienteId)) {
            elementosFaltantes.add("Preguntas obligatorias");
        }
        
        return elementosFaltantes;
    }
}
