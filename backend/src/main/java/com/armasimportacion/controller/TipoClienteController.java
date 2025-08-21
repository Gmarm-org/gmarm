package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoClienteDTO;
import com.armasimportacion.mapper.TipoClienteMapper;
import com.armasimportacion.service.TipoClienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-cliente")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Cliente", description = "API para gestión de tipos de cliente")
@CrossOrigin(origins = "*")
public class TipoClienteController {

    private final TipoClienteService service;
    private final TipoClienteMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de cliente", description = "Retorna la lista de todos los tipos de cliente activos")
    public ResponseEntity<List<TipoClienteDTO>> getAllTiposCliente() {
        log.info("Solicitud para obtener todos los tipos de cliente");
        List<TipoClienteDTO> tipos = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(tipos);
    }
}
