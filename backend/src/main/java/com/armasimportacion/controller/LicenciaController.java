package com.armasimportacion.controller;

import com.armasimportacion.dto.LicenciaDTO;
import com.armasimportacion.mapper.LicenciaMapper;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/licencia")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Licencias", description = "Gestión de licencias del sistema")
public class LicenciaController {

    private final LicenciaRepository licenciaRepository;
    private final LicenciaMapper licenciaMapper;

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
    public ResponseEntity<LicenciaDTO> createLicencia(@RequestBody LicenciaDTO licenciaDTO) {
        log.info("📝 POST /api/licencia - Creando nueva licencia: {}", licenciaDTO.getNumero());
        
        Licencia licencia = licenciaMapper.toEntity(licenciaDTO);
        
        if (licencia.getFechaCreacion() == null) {
            licencia.setFechaCreacion(LocalDateTime.now());
        }
        
        Licencia savedLicencia = licenciaRepository.save(licencia);
        log.info("✅ Licencia creada con ID: {}", savedLicencia.getId());
        return ResponseEntity.ok(licenciaMapper.toDTO(savedLicencia));
    }

    @PutMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar licencia", description = "Actualiza una licencia existente")
    public ResponseEntity<LicenciaDTO> updateLicencia(@PathVariable Long id, @RequestBody LicenciaDTO licenciaDTO) {
        log.info("📝 PUT /api/licencia/{} - Actualizando licencia", id);
        return licenciaRepository.findById(id)
                .map(existingLicencia -> {
                    // Actualizar campos desde DTO
                    if (licenciaDTO.getNumero() != null) existingLicencia.setNumero(licenciaDTO.getNumero());
                    if (licenciaDTO.getNombre() != null) existingLicencia.setNombre(licenciaDTO.getNombre());
                    if (licenciaDTO.getRuc() != null) existingLicencia.setRuc(licenciaDTO.getRuc());
                    if (licenciaDTO.getCuentaBancaria() != null) existingLicencia.setCuentaBancaria(licenciaDTO.getCuentaBancaria());
                    if (licenciaDTO.getNombreBanco() != null) existingLicencia.setNombreBanco(licenciaDTO.getNombreBanco());
                    if (licenciaDTO.getTipoCuenta() != null) existingLicencia.setTipoCuenta(licenciaDTO.getTipoCuenta());
                    if (licenciaDTO.getCedulaCuenta() != null) existingLicencia.setCedulaCuenta(licenciaDTO.getCedulaCuenta());
                    if (licenciaDTO.getEmail() != null) existingLicencia.setEmail(licenciaDTO.getEmail());
                    if (licenciaDTO.getTelefono() != null) existingLicencia.setTelefono(licenciaDTO.getTelefono());
                    if (licenciaDTO.getFechaVencimiento() != null) existingLicencia.setFechaVencimiento(licenciaDTO.getFechaVencimiento());
                    if (licenciaDTO.getDescripcion() != null) existingLicencia.setDescripcion(licenciaDTO.getDescripcion());
                    if (licenciaDTO.getFechaEmision() != null) existingLicencia.setFechaEmision(licenciaDTO.getFechaEmision());
                    if (licenciaDTO.getCupoTotal() != null) existingLicencia.setCupoTotal(licenciaDTO.getCupoTotal());
                    if (licenciaDTO.getCupoDisponible() != null) existingLicencia.setCupoDisponible(licenciaDTO.getCupoDisponible());
                    if (licenciaDTO.getCupoCivil() != null) existingLicencia.setCupoCivil(licenciaDTO.getCupoCivil());
                    if (licenciaDTO.getCupoMilitar() != null) existingLicencia.setCupoMilitar(licenciaDTO.getCupoMilitar());
                    if (licenciaDTO.getCupoEmpresa() != null) existingLicencia.setCupoEmpresa(licenciaDTO.getCupoEmpresa());
                    if (licenciaDTO.getCupoDeportista() != null) existingLicencia.setCupoDeportista(licenciaDTO.getCupoDeportista());
                    existingLicencia.setFechaActualizacion(LocalDateTime.now());
                    
                    Licencia updated = licenciaRepository.save(existingLicencia);
                    log.info("✅ Licencia actualizada: {}", updated.getNumero());
                    return ResponseEntity.ok(licenciaMapper.toDTO(updated));
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

