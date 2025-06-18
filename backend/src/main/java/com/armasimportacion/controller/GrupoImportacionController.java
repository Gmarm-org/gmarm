package com.armasimportacion.controller;

import com.armasimportacion.service.GrupoImportacionService;
import com.armasimportacion.service.LicenciaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grupos-importacion")
public class GrupoImportacionController {
    private final GrupoImportacionService grupoService;
    private final LicenciaService licenciaService;


    public GrupoImportacionController(GrupoImportacionService grupoService, LicenciaService licenciaService) {
        this.grupoService = grupoService;
        this.licenciaService = licenciaService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECCION_VENTAS')")
    public ResponseEntity<GrupoImportacionResponse> crearGrupo(
            @RequestBody GrupoImportacionRequest request) {
        return ResponseEntity.ok(grupoService.crearGrupo(request));
    }

    @PostMapping("/{grupoId}/asignar-licencia")
    @PreAuthorize("hasRole('DIRECCION_VENTAS')")
    public ResponseEntity<GrupoImportacionResponse> asignarLicencia(
            @PathVariable Long grupoId,
            @RequestParam String codigoLicencia) {
        return ResponseEntity.ok(licenciaService.asignarLicencia(grupoId, codigoLicencia));
    }
}
