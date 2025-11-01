package com.armasimportacion.controller;

import com.armasimportacion.model.Licencia;
import com.armasimportacion.repository.LicenciaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/licencia")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Licencias", description = "Gestión de licencias del sistema")
public class LicenciaController {

    private final LicenciaRepository licenciaRepository;

    @GetMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener todas las licencias", description = "Devuelve la lista completa de licencias")
    public ResponseEntity<List<Licencia>> getAllLicencias() {
        log.info("📋 GET /api/licencia - Obteniendo todas las licencias");
        List<Licencia> licencias = licenciaRepository.findAll();
        log.info("✅ Licencias encontradas: {}", licencias.size());
        return ResponseEntity.ok(licencias);
    }

    @GetMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener licencia por ID", description = "Devuelve una licencia específica por su ID")
    public ResponseEntity<Licencia> getLicenciaById(@PathVariable Long id) {
        log.info("📋 GET /api/licencia/{} - Obteniendo licencia", id);
        return licenciaRepository.findById(id)
                .map(licencia -> {
                    log.info("✅ Licencia encontrada: {}", licencia.getNumero());
                    return ResponseEntity.ok(licencia);
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Licencia no encontrada con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @PostMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Crear nueva licencia", description = "Crea una nueva licencia en el sistema")
    public ResponseEntity<Licencia> createLicencia(@RequestBody Licencia licencia) {
        log.info("📝 POST /api/licencia - Creando nueva licencia: {}", licencia.getNumero());
        
        if (licencia.getFechaCreacion() == null) {
            licencia.setFechaCreacion(LocalDateTime.now());
        }
        
        Licencia savedLicencia = licenciaRepository.save(licencia);
        log.info("✅ Licencia creada con ID: {}", savedLicencia.getId());
        return ResponseEntity.ok(savedLicencia);
    }

    @PutMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar licencia", description = "Actualiza una licencia existente")
    public ResponseEntity<Licencia> updateLicencia(@PathVariable Long id, @RequestBody Licencia licencia) {
        log.info("📝 PUT /api/licencia/{} - Actualizando licencia", id);
        return licenciaRepository.findById(id)
                .map(existingLicencia -> {
                    existingLicencia.setNumero(licencia.getNumero());
                    existingLicencia.setNombre(licencia.getNombre());
                    existingLicencia.setRuc(licencia.getRuc());
                    existingLicencia.setCuentaBancaria(licencia.getCuentaBancaria());
                    existingLicencia.setNombreBanco(licencia.getNombreBanco());
                    existingLicencia.setTipoCuenta(licencia.getTipoCuenta());
                    existingLicencia.setCedulaCuenta(licencia.getCedulaCuenta());
                    existingLicencia.setEmail(licencia.getEmail());
                    existingLicencia.setTelefono(licencia.getTelefono());
                    existingLicencia.setFechaVencimiento(licencia.getFechaVencimiento());
                    existingLicencia.setDescripcion(licencia.getDescripcion());
                    existingLicencia.setFechaEmision(licencia.getFechaEmision());
                    existingLicencia.setCupoTotal(licencia.getCupoTotal());
                    existingLicencia.setCupoDisponible(licencia.getCupoDisponible());
                    existingLicencia.setCupoCivil(licencia.getCupoCivil());
                    existingLicencia.setCupoMilitar(licencia.getCupoMilitar());
                    existingLicencia.setCupoEmpresa(licencia.getCupoEmpresa());
                    existingLicencia.setCupoDeportista(licencia.getCupoDeportista());
                    existingLicencia.setObservaciones(licencia.getObservaciones());
                    existingLicencia.setEstado(licencia.getEstado());
                    existingLicencia.setFechaActualizacion(LocalDateTime.now());
                    
                    Licencia updated = licenciaRepository.save(existingLicencia);
                    log.info("✅ Licencia actualizada: {}", updated.getNumero());
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Licencia no encontrada con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Eliminar licencia", description = "Elimina una licencia del sistema")
    public ResponseEntity<Void> deleteLicencia(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/licencia/{} - Eliminando licencia", id);
        return licenciaRepository.findById(id)
                .map(licencia -> {
                    licenciaRepository.delete(licencia);
                    log.info("✅ Licencia eliminada: {}", licencia.getNumero());
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Licencia no encontrada con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }
}

