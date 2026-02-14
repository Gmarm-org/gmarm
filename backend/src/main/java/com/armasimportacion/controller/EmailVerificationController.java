package com.armasimportacion.controller;

import com.armasimportacion.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador REST para verificación de correos electrónicos
 */
@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailVerificationController {

    private final EmailVerificationService verificationService;

    /**
     * Verifica un token de verificación de correo
     * GET /api/verification/verify?token=TOKEN
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(@RequestParam String token) {
        log.info("Solicitud de verificacion de token recibida");

        try {
            Map<String, Object> result = verificationService.verifyToken(token);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.warn("Error de validacion en verificacion: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error inesperado en verificacion: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error interno del servidor al verificar el token");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Obtiene información sobre un token (sin verificar)
     * Útil para verificar estado antes de procesar
     */
    @GetMapping("/token-info")
    public ResponseEntity<Map<String, Object>> getTokenInfo(@RequestParam String token) {
        try {
            Map<String, Object> info = verificationService.getTokenInfo(token);
            return ResponseEntity.ok(info);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

