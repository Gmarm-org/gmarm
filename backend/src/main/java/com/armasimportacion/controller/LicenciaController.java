package com.armasimportacion.controller;

import com.armasimportacion.dto.LicenciaDTO;
import com.armasimportacion.enums.EstadoOcupacionLicencia;
import com.armasimportacion.mapper.LicenciaMapper;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.repository.CantonRepository;
import com.armasimportacion.repository.LicenciaRepository;
import com.armasimportacion.repository.ProvinciaRepository;
import com.armasimportacion.service.LicenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    private final LicenciaService licenciaService;
    private final ProvinciaRepository provinciaRepository;
    private final CantonRepository cantonRepository;

    @GetMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener todas las licencias", description = "Devuelve la lista completa de licencias")
    public ResponseEntity<List<LicenciaDTO>> getAllLicencias() {
        log.info("📋 GET /api/licencia - Obteniendo todas las licencias");
        List<Licencia> licencias = licenciaRepository.findAll();
        List<LicenciaDTO> licenciaDTOs = licencias.stream()
                .map(licenciaMapper::toDTO)
                .collect(Collectors.toList());
        log.info("✅ Licencias encontradas: {}", licenciaDTOs.size());
        return ResponseEntity.ok(licenciaDTOs);
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Obtener licencias disponibles", description = "Retorna las licencias que están activas y disponibles (no bloqueadas)")
    public ResponseEntity<List<LicenciaDTO>> getLicenciasDisponibles() {
        log.info("📋 GET /api/licencia/disponibles - Obteniendo licencias disponibles");
        List<Licencia> licencias = licenciaRepository.findByEstadoAndEstadoOcupacion(true, EstadoOcupacionLicencia.DISPONIBLE);
        List<LicenciaDTO> licenciaDTOs = licencias.stream()
                .map(licenciaMapper::toDTO)
                .collect(Collectors.toList());
        log.info("✅ Licencias disponibles encontradas: {}", licenciaDTOs.size());
        return ResponseEntity.ok(licenciaDTOs);
    }

    @GetMapping("/{id}")
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Obtener licencia por ID", description = "Devuelve una licencia específica por su ID")
    public ResponseEntity<LicenciaDTO> getLicenciaById(@PathVariable Long id) {
        log.info("📋 GET /api/licencia/{} - Obteniendo licencia", id);
        return licenciaRepository.findById(id)
                .map(licencia -> {
                    log.info("✅ Licencia encontrada: {} - Banco: {}, Cuenta: {}", 
                             licencia.getNumero(), licencia.getNombreBanco(), licencia.getCuentaBancaria());
                    return ResponseEntity.ok(licenciaMapper.toDTO(licencia));
                })
                .orElseGet(() -> {
                    log.warn("⚠️ Licencia no encontrada con ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/{id}/iniciales")
    @Operation(summary = "Obtener iniciales del importador", description = "Devuelve las iniciales calculadas desde el nombre de la licencia")
    public ResponseEntity<java.util.Map<String, String>> getInicialesImportador(@PathVariable Long id) {
        String iniciales = licenciaService.obtenerInicialesImportador(id);
        return ResponseEntity.ok(java.util.Map.of("iniciales", iniciales));
    }

    @PostMapping
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Crear nueva licencia", description = "Crea una nueva licencia en el sistema")
    public ResponseEntity<LicenciaDTO> createLicencia(@RequestBody LicenciaDTO licenciaDTO) {
        log.info("📝 POST /api/licencia - Creando nueva licencia: {}", licenciaDTO.getNumero());
        log.info("📦 Datos bancarios recibidos - Cuenta: {}, Banco: {}, Tipo: {}, Cedula: {}", 
                  licenciaDTO.getCuentaBancaria(), licenciaDTO.getNombreBanco(), 
                  licenciaDTO.getTipoCuenta(), licenciaDTO.getCedulaCuenta());
        
        Licencia licencia = licenciaMapper.toEntity(licenciaDTO);
        
        // 🏦 Verificar que los campos bancarios se mapearon correctamente
        log.info("🔍 Después del mapper - Cuenta: {}, Banco: {}, Tipo: {}, Cedula: {}", 
                  licencia.getCuentaBancaria(), licencia.getNombreBanco(), 
                  licencia.getTipoCuenta(), licencia.getCedulaCuenta());
        
        if (licencia.getFechaCreacion() == null) {
            licencia.setFechaCreacion(LocalDateTime.now());
        }

        // NOTA: Los cupos se manejan a nivel de Grupo de Importación, no de Licencia

        Licencia savedLicencia = licenciaRepository.save(licencia);
        log.info("✅ Licencia creada con ID: {} - Banco: {}, Cuenta: {}", 
                 savedLicencia.getId(), savedLicencia.getNombreBanco(), savedLicencia.getCuentaBancaria());
        return ResponseEntity.ok(licenciaMapper.toDTO(savedLicencia));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    // TODO: Descomentar en producción: @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar licencia", description = "Actualiza una licencia existente (soporta PUT y PATCH)")
    public ResponseEntity<LicenciaDTO> updateLicencia(@PathVariable Long id, @RequestBody LicenciaDTO licenciaDTO) {
        log.info("📝 PUT/PATCH /api/licencia/{} - Actualizando licencia", id);
        log.debug("📦 Datos recibidos - Cuenta: {}, Banco: {}, Tipo: {}, Cedula: {}",
                  licenciaDTO.getCuentaBancaria(), licenciaDTO.getNombreBanco(),
                  licenciaDTO.getTipoCuenta(), licenciaDTO.getCedulaCuenta());
        
        return licenciaRepository.findById(id)
                .map(existingLicencia -> {
                    // Actualizar campos básicos
                    if (licenciaDTO.getNumero() != null) {
                        existingLicencia.setNumero(licenciaDTO.getNumero());
                    }
                    if (licenciaDTO.getNombre() != null) {
                        existingLicencia.setNombre(licenciaDTO.getNombre());
                    }
                    if (licenciaDTO.getTitulo() != null) {
                        existingLicencia.setTitulo(licenciaDTO.getTitulo());
                    }
                    if (licenciaDTO.getRuc() != null) {
                        existingLicencia.setRuc(licenciaDTO.getRuc());
                    }
                    
                    // 🏦 Actualizar SIEMPRE campos bancarios (permitir vacíos)
                    existingLicencia.setCuentaBancaria(licenciaDTO.getCuentaBancaria());
                    existingLicencia.setNombreBanco(licenciaDTO.getNombreBanco());
                    existingLicencia.setTipoCuenta(licenciaDTO.getTipoCuenta());
                    existingLicencia.setCedulaCuenta(licenciaDTO.getCedulaCuenta());
                    
                    // Actualizar otros campos
                    if (licenciaDTO.getEmail() != null) {
                        existingLicencia.setEmail(licenciaDTO.getEmail());
                    }
                    if (licenciaDTO.getTelefono() != null) {
                        existingLicencia.setTelefono(licenciaDTO.getTelefono());
                    }
                    
                    // Actualizar provincia y canton (buscar por nombre, igual que Cliente)
                    if (licenciaDTO.getProvincia() != null && !licenciaDTO.getProvincia().isEmpty()) {
                        provinciaRepository.findByNombre(licenciaDTO.getProvincia())
                                .ifPresent(existingLicencia::setProvincia);
                    }
                    if (licenciaDTO.getCanton() != null && !licenciaDTO.getCanton().isEmpty()) {
                        cantonRepository.findAll().stream()
                                .filter(c -> c.getNombre().equalsIgnoreCase(licenciaDTO.getCanton()))
                                .findFirst()
                                .ifPresent(existingLicencia::setCanton);
                    }
                    
                    if (licenciaDTO.getFechaVencimiento() != null) {
                        existingLicencia.setFechaVencimiento(licenciaDTO.getFechaVencimiento());
                    }
                    if (licenciaDTO.getDescripcion() != null) {
                        existingLicencia.setDescripcion(licenciaDTO.getDescripcion());
                    }
                    if (licenciaDTO.getObservaciones() != null) {
                        existingLicencia.setObservaciones(licenciaDTO.getObservaciones());
                    }
                    if (licenciaDTO.getFechaEmision() != null) {
                        existingLicencia.setFechaEmision(licenciaDTO.getFechaEmision());
                    }

                    // NOTA: Los cupos se manejan a nivel de Grupo de Importación

                    // Estado y estado de ocupación
                    if (licenciaDTO.getEstado() != null) {
                        existingLicencia.setEstado(licenciaDTO.getEstado());
                    }
                    if (licenciaDTO.getEstadoOcupacion() != null) {
                        existingLicencia.setEstadoOcupacion(licenciaDTO.getEstadoOcupacion());
                    }
                    
                    existingLicencia.setFechaActualizacion(LocalDateTime.now());
                    
                    Licencia updated = licenciaRepository.save(existingLicencia);
                    log.info("✅ Licencia actualizada: {} - Banco: {}, Cuenta: {}", 
                             updated.getNumero(), updated.getNombreBanco(), updated.getCuentaBancaria());
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

