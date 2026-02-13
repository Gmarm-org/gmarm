package com.armasimportacion.controller;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.service.helper.GestionDocumentosServiceHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/autorizaciones")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autorizaciones", description = "API para generar autorizaciones de venta")
@CrossOrigin(origins = "*")
public class AutorizacionController {
    
    private final ClienteRepository clienteRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final GestionDocumentosServiceHelper documentosHelper;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    
    /**
     * Genera una autorización de venta para un cliente
     */
    @PostMapping("/generar")
    @Operation(summary = "Generar autorización de venta",
               description = "Genera un documento PDF de autorización de venta para un cliente con arma asignada")
    public ResponseEntity<?> generarAutorizacion(@RequestBody Map<String, Object> requestData) {
        try {
            log.info("📄 POST /api/autorizaciones/generar - Generando autorización de venta");
            log.info("🔍 Datos recibidos: {}", requestData);

            // Validar datos requeridos
            if (requestData.get("clienteId") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El ID del cliente es requerido"
                ));
            }
            if (requestData.get("numeroFactura") == null || requestData.get("numeroFactura").toString().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El número de factura es requerido"
                ));
            }
            if (requestData.get("tramite") == null || requestData.get("tramite").toString().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El número de trámite es requerido"
                ));
            }

            Long clienteId = Long.valueOf(requestData.get("clienteId").toString());
            String numeroFactura = requestData.get("numeroFactura").toString();
            String tramite = requestData.get("tramite").toString();

            // Buscar cliente
            Optional<Cliente> clienteOpt = clienteRepository.findById(clienteId);
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "No se encontró el cliente con ID: " + clienteId
                ));
            }
            Cliente cliente = clienteOpt.get();

            // Buscar ClienteArma asignada al cliente (con JOIN FETCH para cargar Arma y Categoría)
            List<ClienteArma> armas = clienteArmaRepository.findByClienteIdWithArmaAndCategoria(clienteId);
            if (armas.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El cliente " + cliente.getNombres() + " " + cliente.getApellidos() + " no tiene armas asignadas. Primero debe asignar un arma al cliente."
                ));
            }

            // Usar la primera arma asignada
            ClienteArma clienteArma = armas.get(0);

            // Verificar que el arma tenga número de serie
            if (clienteArma.getNumeroSerie() == null || clienteArma.getNumeroSerie().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "El arma asignada al cliente no tiene número de serie. Primero debe asignar un número de serie al arma."
                ));
            }

            log.info("✅ Cliente encontrado: ID={}, Nombre={}", cliente.getId(), cliente.getNombres());
            log.info("✅ Arma encontrada: ID={}, Modelo={}, Serie={}",
                clienteArma.getArma().getId(),
                clienteArma.getArma().getModelo(),
                clienteArma.getNumeroSerie());

            // Generar autorización
            DocumentoGenerado documento = documentosHelper.generarYGuardarAutorizacion(
                cliente,
                clienteArma,
                numeroFactura,
                tramite
            );

            log.info("✅ Autorización generada exitosamente: ID={}", documento.getId());

            // Preparar respuesta
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Autorización generada exitosamente");
            response.put("documentoId", documento.getId());
            response.put("nombreArchivo", documento.getNombreArchivo());
            response.put("rutaArchivo", documento.getRutaArchivo());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("❌ Error generando autorización: {}", e.getMessage(), e);

            // Extraer mensaje de error más específico
            String mensajeError = extraerMensajeErrorLegible(e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", mensajeError);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Extrae un mensaje de error legible para el usuario
     */
    private String extraerMensajeErrorLegible(Exception e) {
        String mensaje = e.getMessage();

        // Si es error de template Thymeleaf
        if (mensaje != null && mensaje.contains("TemplateProcessingException")) {
            if (mensaje.contains("cannot be found")) {
                return "Error al generar el documento: falta información del arma. Verifique que el arma tenga todos los datos completos (modelo, calibre, categoría).";
            }
            return "Error al generar el documento PDF. Por favor, contacte al administrador.";
        }

        // Si es error de Hibernate/JPA
        if (mensaje != null && mensaje.contains("HibernateProxy")) {
            return "Error de datos: no se pudo cargar la información completa del arma. Intente nuevamente.";
        }

        // Mensaje genérico
        if (mensaje == null || mensaje.isEmpty()) {
            return "Error inesperado al generar la autorización. Por favor, intente nuevamente.";
        }

        return "Error generando autorización: " + mensaje;
    }

    /**
     * Obtiene las autorizaciones generadas para un cliente
     */
    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Obtener autorizaciones de un cliente", 
               description = "Obtiene todas las autorizaciones de venta generadas para un cliente específico")
    public ResponseEntity<?> obtenerAutorizacionesPorCliente(@PathVariable Long clienteId) {
        try {
            log.info("📄 GET /api/autorizaciones/cliente/{} - Obteniendo autorizaciones del cliente", clienteId);
            
            // Buscar autorizaciones del cliente
            List<DocumentoGenerado> autorizaciones = documentoGeneradoRepository
                .findByClienteIdAndTipo(clienteId, TipoDocumentoGenerado.AUTORIZACION);
            
            log.info("✅ Autorizaciones encontradas: {}", autorizaciones.size());
            return ResponseEntity.ok(autorizaciones);
            
        } catch (Exception e) {
            log.error("❌ Error obteniendo autorizaciones del cliente: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error obteniendo autorizaciones: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

