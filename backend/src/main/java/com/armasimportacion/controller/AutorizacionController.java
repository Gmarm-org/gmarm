package com.armasimportacion.controller;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
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
    private final com.armasimportacion.repository.DocumentoGeneradoRepository documentoGeneradoRepository;
    
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
            Long clienteId = Long.valueOf(requestData.get("clienteId").toString());
            String numeroFactura = requestData.get("numeroFactura").toString();
            String tramite = requestData.get("tramite").toString();
            
            // Buscar cliente
            Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + clienteId));
            
            // Buscar ClienteArma asignada al cliente
            List<ClienteArma> armas = clienteArmaRepository.findByClienteId(clienteId);
            if (armas.isEmpty()) {
                throw new RuntimeException("El cliente no tiene armas asignadas");
            }
            
            // Usar la primera arma asignada
            ClienteArma clienteArma = armas.get(0);
            
            log.info("✅ Cliente encontrado: ID={}, Nombre={}", cliente.getId(), cliente.getNombres());
            log.info("✅ Arma encontrada: ID={}, Modelo={}", clienteArma.getArma().getId(), clienteArma.getArma().getModelo());
            
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
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error generando autorización: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
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

