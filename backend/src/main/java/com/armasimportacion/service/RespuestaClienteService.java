package com.armasimportacion.service;

import com.armasimportacion.dto.RespuestaClienteCreateDTO;
import com.armasimportacion.dto.RespuestaClienteDTO;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.mapper.RespuestaClienteMapper;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.PreguntaCliente;
import com.armasimportacion.model.RespuestaCliente;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.PreguntaClienteRepository;
import com.armasimportacion.repository.RespuestaClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RespuestaClienteService {

    private final RespuestaClienteRepository repository;
    private final RespuestaClienteMapper mapper;
    private final ClienteRepository clienteRepository;
    private final PreguntaClienteRepository preguntaClienteRepository;

    public RespuestaClienteDTO createRespuesta(RespuestaClienteCreateDTO respuestaDTO) {
        log.info("Creando respuesta para cliente: {}, pregunta: {}", respuestaDTO.getClienteId(), respuestaDTO.getPreguntaId());
        
        // Validar que los IDs no sean null
        if (respuestaDTO.getClienteId() == null) {
            throw new IllegalArgumentException("clienteId no puede ser null");
        }
        if (respuestaDTO.getPreguntaId() == null) {
            throw new IllegalArgumentException("preguntaId no puede ser null");
        }
        
        // Obtener las entidades Cliente y PreguntaCliente
        Cliente cliente = clienteRepository.findById(respuestaDTO.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + respuestaDTO.getClienteId()));
        
        PreguntaCliente pregunta = preguntaClienteRepository.findById(respuestaDTO.getPreguntaId())
                .orElseThrow(() -> new ResourceNotFoundException("Pregunta no encontrada con ID: " + respuestaDTO.getPreguntaId()));
        
        // Crear la respuesta con las entidades correctas
        RespuestaCliente respuesta = new RespuestaCliente();
        respuesta.setCliente(cliente);
        respuesta.setPregunta(pregunta);
        respuesta.setRespuesta(respuestaDTO.getRespuesta());
        respuesta.setFechaRespuesta(LocalDateTime.now());
        
        RespuestaCliente savedRespuesta = repository.save(respuesta);
        log.info("Respuesta creada exitosamente con ID: {}", savedRespuesta.getId());
        
        return mapper.toDTO(savedRespuesta);
    }

    public List<RespuestaClienteDTO> getRespuestasByCliente(Long clienteId) {
        log.info("Obteniendo respuestas para cliente: {}", clienteId);
        
        List<RespuestaCliente> respuestas = repository.findByClienteIdWithPregunta(clienteId);
        log.info("Respuestas encontradas: {}", respuestas.size());
        
        return mapper.toDTOList(respuestas);
    }

    public RespuestaClienteDTO updateRespuesta(Long id, RespuestaClienteCreateDTO respuestaDTO) {
        log.info("Actualizando respuesta con ID: {}", id);
        
        RespuestaCliente respuesta = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Respuesta no encontrada con ID: " + id));
        
        respuesta.setRespuesta(respuestaDTO.getRespuesta());
        // El modelo no tiene fechaActualizacion, solo fechaRespuesta
        
        RespuestaCliente updatedRespuesta = repository.save(respuesta);
        log.info("Respuesta actualizada exitosamente con ID: {}", updatedRespuesta.getId());
        
        return mapper.toDTO(updatedRespuesta);
    }

    public void deleteRespuesta(Long id) {
        log.info("Eliminando respuesta con ID: {}", id);
        
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Respuesta no encontrada con ID: " + id);
        }
        
        repository.deleteById(id);
        log.info("Respuesta eliminada exitosamente con ID: {}", id);
    }
}
