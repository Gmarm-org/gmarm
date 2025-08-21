package com.armasimportacion.controller;

import com.armasimportacion.dto.TipoIdentificacionDTO;
import com.armasimportacion.mapper.TipoIdentificacionMapper;
import com.armasimportacion.service.TipoIdentificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-identificacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tipos de Identificación", description = "API para gestión de tipos de identificación")
@CrossOrigin(origins = "*")
public class TipoIdentificacionController {

    private final TipoIdentificacionService service;
    private final TipoIdentificacionMapper mapper;

    @GetMapping
    @Operation(summary = "Obtener todos los tipos de identificación", description = "Retorna la lista de todos los tipos de identificación activos")
    public ResponseEntity<List<TipoIdentificacionDTO>> getAllTiposIdentificacion() {
        log.info("Solicitud para obtener todos los tipos de identificación");
        List<TipoIdentificacionDTO> tipos = mapper.toDTOList(service.findAllActive());
        return ResponseEntity.ok(tipos);
    }
}
