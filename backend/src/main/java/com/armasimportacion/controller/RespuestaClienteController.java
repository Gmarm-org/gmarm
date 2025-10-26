package com.armasimportacion.controller;

import com.armasimportacion.dto.RespuestaClienteCreateDTO;
import com.armasimportacion.dto.RespuestaClienteDTO;
import com.armasimportacion.service.RespuestaClienteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/respuesta-cliente")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RespuestaClienteController {
    
    private final RespuestaClienteService respuestaClienteService;
    
    @PostMapping
    public ResponseEntity<RespuestaClienteDTO> crearRespuesta(@RequestBody RespuestaClienteCreateDTO dto) {
        try {
            RespuestaClienteDTO respuesta = respuestaClienteService.createRespuesta(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            log.error("Error al crear respuesta: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<RespuestaClienteDTO>> obtenerRespuestasCliente(@PathVariable Long clienteId) {
        try {
            List<RespuestaClienteDTO> respuestas = respuestaClienteService.getRespuestasByCliente(clienteId);
            return ResponseEntity.ok(respuestas);
        } catch (Exception e) {
            log.error("Error al obtener respuestas del cliente: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
