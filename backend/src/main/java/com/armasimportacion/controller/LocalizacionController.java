package com.armasimportacion.controller;

import com.armasimportacion.service.LocalizacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/localizacion")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Localización", description = "API para datos de localización de Ecuador")
@CrossOrigin(origins = "*")
public class LocalizacionController {

    private final LocalizacionService localizacionService;

    @GetMapping("/provincias")
    @Operation(summary = "Obtener provincias de Ecuador", description = "Retorna la lista de todas las provincias de Ecuador")
    public ResponseEntity<List<String>> getProvincias() {
        log.info("Solicitud para obtener provincias de Ecuador");
        List<String> provincias = localizacionService.getProvincias();
        return ResponseEntity.ok(provincias);
    }

    @GetMapping("/provincias-completas")
    @Operation(summary = "Obtener provincias completas con códigos", description = "Retorna la lista de provincias con código y nombre")
    public ResponseEntity<List<Map<String, String>>> getProvinciasCompletas() {
        log.info("Solicitud para obtener provincias completas con códigos");
        List<Map<String, String>> provincias = localizacionService.getProvinciasCompletas();
        return ResponseEntity.ok(provincias);
    }
    
    @GetMapping("/cantones/{provincia}")
    @Operation(summary = "Obtener cantones por provincia", description = "Retorna la lista de cantones de una provincia específica")
    public ResponseEntity<List<String>> getCantones(@PathVariable String provincia) {
        log.info("Solicitud para obtener cantones de la provincia: {}", provincia);
        List<String> cantones = localizacionService.getCantones(provincia);
        return ResponseEntity.ok(cantones);
    }
}
