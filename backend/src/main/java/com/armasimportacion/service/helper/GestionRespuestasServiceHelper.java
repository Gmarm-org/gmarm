package com.armasimportacion.service.helper;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.RespuestaCliente;
import com.armasimportacion.model.PreguntaCliente;
import com.armasimportacion.repository.RespuestaClienteRepository;
import com.armasimportacion.repository.PreguntaClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Servicio especializado para la gestión de respuestas del cliente
 * Maneja el guardado y validación de respuestas a preguntas del formulario
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GestionRespuestasServiceHelper {

    private final RespuestaClienteRepository respuestaClienteRepository;
    private final PreguntaClienteRepository preguntaClienteRepository;

    /**
     * Guarda todas las respuestas del cliente a las preguntas del formulario
     */
    public int guardarRespuestasCliente(List<Map<String, Object>> respuestasData, Cliente cliente) {
        try {
            log.info("📝 Guardando respuestas para cliente ID: {}", cliente.getId());
            
            if (respuestasData == null || respuestasData.isEmpty()) {
                log.warn("⚠️ No hay respuestas para guardar para cliente ID: {}", cliente.getId());
                return 0;
            }
            
            log.info("🔍 Procesando {} respuestas para cliente ID: {}", respuestasData.size(), cliente.getId());
            
            int respuestasGuardadas = respuestasData.stream()
                .filter(Objects::nonNull)
                .mapToInt(respuestaData -> procesarRespuestaIndividual(respuestaData, cliente))
                .sum();
            
            log.info("✅ Total de respuestas guardadas: {} para cliente ID: {}", respuestasGuardadas, cliente.getId());
            return respuestasGuardadas;
            
        } catch (Exception e) {
            log.error("❌ Error guardando respuestas para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Procesa una respuesta individual del cliente
     */
    private int procesarRespuestaIndividual(Map<String, Object> respuestaData, Cliente cliente) {
        log.info("🔍 Procesando respuesta individual: {}", respuestaData);
        
        return Optional.ofNullable(respuestaData.get("preguntaId"))
            .map(Object::toString)
            .map(Long::valueOf)
            .flatMap(preguntaClienteRepository::findById)
            .map(pregunta -> {
                log.info("✅ Pregunta encontrada: ID={}, Texto={}", pregunta.getId(), pregunta.getPregunta());
                
                RespuestaCliente respuesta = crearRespuestaCliente(cliente, pregunta, respuestaData);
                RespuestaCliente respuestaGuardada = respuestaClienteRepository.save(respuesta);
                
                log.info("✅ Respuesta guardada con ID: {} para pregunta ID: {}", 
                    respuestaGuardada.getId(), pregunta.getId());
                
                return 1; // Contador de respuestas guardadas
            })
            .orElseGet(() -> {
                log.warn("⚠️ No se pudo procesar respuesta: {}", respuestaData);
                return 0;
            });
    }

    /**
     * Crea un objeto RespuestaCliente con todos los datos necesarios
     */
    private RespuestaCliente crearRespuestaCliente(Cliente cliente, PreguntaCliente pregunta, Map<String, Object> respuestaData) {
        RespuestaCliente respuesta = new RespuestaCliente();
        respuesta.setCliente(cliente);
        respuesta.setPregunta(pregunta);
        
        // Establecer respuesta usando datos del frontend o valor por defecto
        String textoRespuesta = Optional.ofNullable(respuestaData.get("respuesta"))
            .map(Object::toString)
            .orElse("Sin respuesta");
        respuesta.setRespuesta(textoRespuesta);
        
        // Establecer fecha de respuesta
        respuesta.setFechaRespuesta(LocalDateTime.now());
        
        log.info("🔧 RespuestaCliente creado: pregunta={}, respuesta={}", 
            pregunta.getPregunta(), textoRespuesta);
        
        return respuesta;
    }

    /**
     * Valida que los datos de respuestas sean correctos
     */
    public boolean validarDatosRespuestas(List<Map<String, Object>> respuestasData) {
        if (respuestasData == null || respuestasData.isEmpty()) {
            log.warn("⚠️ Lista de respuestas es nula o vacía");
            return false;
        }
        
        for (Map<String, Object> respuestaData : respuestasData) {
            if (respuestaData == null) {
                log.warn("⚠️ Respuesta individual es nula");
                return false;
            }
            
            Object preguntaIdObj = respuestaData.get("preguntaId");
            if (preguntaIdObj == null) {
                log.warn("⚠️ preguntaId no especificado en respuesta: {}", respuestaData);
                return false;
            }
            
            try {
                Long preguntaId = Long.valueOf(preguntaIdObj.toString());
                Optional<PreguntaCliente> preguntaOpt = preguntaClienteRepository.findById(preguntaId);
                if (preguntaOpt.isEmpty()) {
                    log.warn("⚠️ Pregunta no encontrada con ID: {}", preguntaId);
                    return false;
                }
            } catch (NumberFormatException e) {
                log.warn("⚠️ Error parseando preguntaId: {}", e.getMessage());
                return false;
            }
        }
        
        log.info("✅ Datos de respuestas validados correctamente: {} respuestas", respuestasData.size());
        return true;
    }

    /**
     * Obtiene todas las respuestas de un cliente
     */
    public List<RespuestaCliente> obtenerRespuestasCliente(Long clienteId) {
        try {
            return respuestaClienteRepository.findByClienteId(clienteId);
        } catch (Exception e) {
            log.error("❌ Error obteniendo respuestas para cliente ID: {}: {}", clienteId, e.getMessage());
            return List.of();
        }
    }

    /**
     * Verifica si un cliente tiene respuestas completas
     */
    public boolean verificarRespuestasCompletas(Long clienteId) {
        try {
            List<RespuestaCliente> respuestas = obtenerRespuestasCliente(clienteId);
            long respuestasConContenido = respuestas.stream()
                .filter(r -> r.getRespuesta() != null && !r.getRespuesta().trim().isEmpty())
                .count();
            
            boolean completas = respuestasConContenido == respuestas.size() && !respuestas.isEmpty();
            log.info("🔍 Cliente ID: {} tiene {} respuestas completas de {} total", 
                clienteId, respuestasConContenido, respuestas.size());
            
            return completas;
        } catch (Exception e) {
            log.error("❌ Error verificando respuestas completas para cliente ID: {}: {}", clienteId, e.getMessage());
            return false;
        }
    }
}
