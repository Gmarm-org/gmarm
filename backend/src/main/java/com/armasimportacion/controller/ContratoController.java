package com.armasimportacion.controller;

import com.armasimportacion.dto.DocumentoGeneradoDTO;
import com.armasimportacion.mapper.DocumentoGeneradoMapper;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.service.ContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contratos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contratos", description = "Gestión de contratos de compra")
public class ContratoController {

    private final ContratoService contratoService;
    private final DocumentoGeneradoMapper documentoGeneradoMapper;

    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Obtener documentos generados de un cliente")
    public ResponseEntity<List<DocumentoGeneradoDTO>> getContratosCliente(@PathVariable Long clienteId) {
        log.info("Obteniendo documentos generados para cliente ID: {}", clienteId);
        List<DocumentoGenerado> documentos = contratoService.obtenerDocumentosGeneradosPorCliente(clienteId);
        log.info("Encontrados {} documentos generados para cliente {}", documentos.size(), clienteId);
        return ResponseEntity.ok(documentoGeneradoMapper.toDTOList(documentos));
    }
}
