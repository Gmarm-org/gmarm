package com.armasimportacion.controller;

import com.armasimportacion.dto.ArmaSerieDTO;
import com.armasimportacion.service.ArmaSerieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para gestionar números de serie de armas
 */
@RestController
@RequestMapping("/api/arma-serie")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ArmaSerieController {

    private final ArmaSerieService armaSerieService;

    /**
     * Carga números de serie desde un archivo Excel/CSV
     * 
     * POST /api/arma-serie/cargar
     * 
     * @param archivo Archivo Excel/CSV con números de serie
     * @param armaId ID del arma del catálogo (opcional si el archivo incluye columna MODELO_ARMA)
     * @param lote Lote o grupo de importación (opcional)
     * 
     * Formatos soportados:
     * 1. Con armaId: NUMERO_SERIE (una columna)
     * 2. Sin armaId: MODELO_ARMA, NUMERO_SERIE (dos columnas)
     */
    @PostMapping(value = "/cargar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> cargarSeriesDesdeArchivo(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "armaId", required = false) Long armaId,
            @RequestParam(value = "lote", required = false) String lote) {
        
        try {
            log.info("Solicitud de carga de series para arma ID: {}, lote: {}", armaId, lote);
            
            // Validar archivo
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "El archivo está vacío"));
            }

            String filename = archivo.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".csv") && !filename.endsWith(".txt") && !filename.endsWith(".xlsx"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Formato de archivo no válido. Use CSV, TXT o XLSX"));
            }

            Map<String, Object> resultado = armaSerieService.cargarSeriesDesdeArchivo(archivo, armaId, lote);
            
            if (Boolean.TRUE.equals(resultado.get("success"))) {
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultado);
            }
            
        } catch (Exception e) {
            log.error("Error cargando series: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Carga masiva de series desde JSON (procesado desde Excel en frontend)
     * 
     * POST /api/arma-serie/bulk-upload
     * 
     * @param requestBody { series: Lista de series, grupoImportacionId: ID del grupo de importación }
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<Map<String, Object>> bulkUploadSeries(@RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> series = (List<Map<String, String>>) requestBody.get("series");
            Long grupoImportacionId = requestBody.get("grupoImportacionId") != null 
                ? Long.valueOf(requestBody.get("grupoImportacionId").toString()) 
                : null;
            
            if (series == null || series.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", 0, "errors", List.of("No se proporcionaron series para cargar")));
            }
            
            if (grupoImportacionId == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", 0, "errors", List.of("Debe seleccionar un grupo de importación")));
            }
            
            log.info("Solicitud de carga masiva de {} series para grupo de importacion ID: {}", series.size(), grupoImportacionId);
            
            Map<String, Object> resultado = armaSerieService.bulkUploadSeriesFromJson(series, grupoImportacionId);
            
            if (Boolean.TRUE.equals(resultado.get("success")) || ((Integer) resultado.get("success")) > 0) {
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(resultado);
            }
            
        } catch (Exception e) {
            log.error("Error en carga masiva de series: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", 0, "errors", List.of("Error del servidor: " + e.getMessage())));
        }
    }

    /**
     * Asigna un número de serie a una reserva de cliente
     * 
     * POST /api/arma-serie/asignar
     * 
     * @param requestBody { clienteArmaId, numeroSerie, usuarioAsignadorId }
     */
    @PostMapping("/asignar")
    public ResponseEntity<Map<String, Object>> asignarSerieACliente(@RequestBody Map<String, Object> requestBody) {
        try {
            Long clienteArmaId = Long.valueOf(requestBody.get("clienteArmaId").toString());
            String numeroSerie = requestBody.get("numeroSerie").toString();
            Long usuarioAsignadorId = Long.valueOf(requestBody.get("usuarioAsignadorId").toString());

            log.info("Solicitud de asignacion de serie {} a cliente_arma {}", numeroSerie, clienteArmaId);

            ArmaSerieDTO resultado = armaSerieService.asignarSerieACliente(clienteArmaId, numeroSerie, usuarioAsignadorId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Serie asignada exitosamente");
            response.put("data", resultado);

            return ResponseEntity.ok(response);

        } catch (IllegalStateException | IllegalArgumentException e) {
            log.error("Error de validacion: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Error asignando serie: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Obtiene todas las series disponibles de un arma
     * Si se proporciona grupoImportacionId, filtra solo las series de ese grupo
     * 
     * GET /api/arma-serie/disponibles/{armaId}?grupoImportacionId={grupoId}
     */
    @GetMapping("/disponibles/{armaId}")
    public ResponseEntity<List<ArmaSerieDTO>> getSeriesDisponibles(
            @PathVariable Long armaId,
            @RequestParam(required = false) Long grupoImportacionId) {
        try {
            List<ArmaSerieDTO> series = armaSerieService.getSeriesDisponiblesByArma(armaId, grupoImportacionId);
            return ResponseEntity.ok(series);
        } catch (Exception e) {
            log.error("Error obteniendo series disponibles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene todas las series de un arma (cualquier estado)
     * 
     * GET /api/arma-serie/arma/{armaId}
     */
    @GetMapping("/arma/{armaId}")
    public ResponseEntity<List<ArmaSerieDTO>> getSeriesByArma(@PathVariable Long armaId) {
        try {
            List<ArmaSerieDTO> series = armaSerieService.getSeriesByArma(armaId);
            return ResponseEntity.ok(series);
        } catch (Exception e) {
            log.error("Error obteniendo series: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene estadísticas de series por arma
     * 
     * GET /api/arma-serie/estadisticas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<List<Map<String, Object>>> getEstadisticas() {
        try {
            List<Map<String, Object>> estadisticas = armaSerieService.getEstadisticasSeries();
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            log.error("Error obteniendo estadisticas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene una serie por su número
     * 
     * GET /api/arma-serie/numero/{numeroSerie}
     */
    @GetMapping("/numero/{numeroSerie}")
    public ResponseEntity<ArmaSerieDTO> getSerieByNumero(@PathVariable String numeroSerie) {
        try {
            ArmaSerieDTO serie = armaSerieService.getSerieByNumero(numeroSerie);
            return ResponseEntity.ok(serie);
        } catch (Exception e) {
            log.error("Error obteniendo serie: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Obtiene todas las series por estado
     * 
     * GET /api/arma-serie/estado/{estado}
     */
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<ArmaSerieDTO>> getSeriesByEstado(@PathVariable String estado) {
        try {
            List<ArmaSerieDTO> series = armaSerieService.getSeriesByEstado(estado);
            return ResponseEntity.ok(series);
        } catch (Exception e) {
            log.error("Error obteniendo series por estado: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Libera una serie asignada (en caso de cancelación)
     * 
     * PUT /api/arma-serie/liberar/{serieId}
     */
    @PutMapping("/liberar/{serieId}")
    public ResponseEntity<Map<String, Object>> liberarSerie(@PathVariable Long serieId) {
        try {
            armaSerieService.liberarSerie(serieId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Serie liberada exitosamente"));
        } catch (Exception e) {
            log.error("Error liberando serie: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Marca una serie como vendida
     * 
     * PUT /api/arma-serie/vendida/{serieId}
     */
    @PutMapping("/vendida/{serieId}")
    public ResponseEntity<Map<String, Object>> marcarComoVendida(@PathVariable Long serieId) {
        try {
            armaSerieService.marcarComoVendida(serieId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Serie marcada como vendida exitosamente"));
        } catch (Exception e) {
            log.error("Error marcando serie como vendida: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}

