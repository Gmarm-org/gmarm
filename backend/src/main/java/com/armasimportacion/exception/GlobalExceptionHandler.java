package com.armasimportacion.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manejador global de excepciones para toda la aplicación.
 * Convierte excepciones técnicas en mensajes legibles para el usuario final.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Estructura estándar de respuesta de error
     */
    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatus status,
            String mensaje,
            String detalles) {

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", mensaje);
        response.put("timestamp", LocalDateTime.now().toString());

        if (detalles != null && !detalles.isEmpty()) {
            response.put("detalles", detalles);
        }

        return ResponseEntity.status(status).body(response);
    }

    // ==================== EXCEPCIONES DE NEGOCIO ====================

    /**
     * Maneja BadRequestException (errores de validación de negocio)
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequestException(BadRequestException ex) {
        log.warn("BadRequest: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    /**
     * Maneja ResourceNotFoundException (recurso no encontrado)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("Recurso no encontrado: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    /**
     * Maneja EntityNotFoundException de JPA
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.warn("Entidad no encontrada: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.NOT_FOUND,
            "El recurso solicitado no fue encontrado en el sistema.",
            null
        );
    }

    /**
     * Maneja DocumentGenerationException (errores de generación PDF/templates)
     */
    @ExceptionHandler(DocumentGenerationException.class)
    public ResponseEntity<Map<String, Object>> handleDocumentGenerationException(DocumentGenerationException ex) {
        log.error("Error generando documento: {}", ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), null);
    }

    /**
     * Maneja EmailSendException (errores de envío de correo)
     */
    @ExceptionHandler(EmailSendException.class)
    public ResponseEntity<Map<String, Object>> handleEmailSendException(EmailSendException ex) {
        log.error("Error enviando email: {}", ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.BAD_GATEWAY, ex.getMessage(), null);
    }

    // ==================== ERRORES DE BASE DE DATOS ====================

    /**
     * Maneja errores de integridad de datos (duplicados, FK, etc.)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Error de integridad de datos: {}", ex.getMessage());

        String mensaje = ex.getMessage();
        String mensajeUsuario;

        if (mensaje != null) {
            if (mensaje.contains("duplicate key") || mensaje.contains("Duplicate entry")) {
                if (mensaje.contains("numero_identificacion")) {
                    mensajeUsuario = "El número de cédula/RUC ingresado ya está registrado en el sistema.";
                } else if (mensaje.contains("email")) {
                    mensajeUsuario = "El email ingresado ya está registrado en el sistema.";
                } else if (mensaje.contains("codigo")) {
                    mensajeUsuario = "El código ingresado ya existe en el sistema.";
                } else {
                    mensajeUsuario = "Ya existe un registro con estos datos en el sistema.";
                }
            } else if (mensaje.contains("foreign key") || mensaje.contains("FK_")) {
                mensajeUsuario = "No se puede realizar esta operación porque el registro está relacionado con otros datos del sistema.";
            } else if (mensaje.contains("cannot be null") || mensaje.contains("NOT NULL")) {
                mensajeUsuario = "Faltan datos obligatorios para completar la operación.";
            } else {
                mensajeUsuario = "Error al guardar los datos. Por favor, verifique la información e intente nuevamente.";
            }
        } else {
            mensajeUsuario = "Error al guardar los datos. Por favor, intente nuevamente.";
        }

        return buildErrorResponse(HttpStatus.BAD_REQUEST, mensajeUsuario, null);
    }

    /**
     * Maneja errores de validación de constraints
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("Violación de constraint: {}", ex.getMessage());

        String errores = ex.getConstraintViolations().stream()
            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
            .collect(Collectors.joining(", "));

        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Los datos ingresados no son válidos.",
            errores
        );
    }

    // ==================== ERRORES DE VALIDACIÓN ====================

    /**
     * Maneja errores de validación de argumentos (@Valid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        log.warn("Error de validación de argumentos");

        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String campo = ((FieldError) error).getField();
            String mensaje = error.getDefaultMessage();
            errores.put(campo, mensaje);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", "Los datos ingresados contienen errores de validación.");
        response.put("errores", errores);
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Maneja parámetros de request faltantes
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex) {
        log.warn("Parámetro faltante: {}", ex.getParameterName());
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Falta el parámetro requerido: " + ex.getParameterName(),
            null
        );
    }

    /**
     * Maneja errores de tipo de argumento
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        log.warn("Error de tipo de argumento: {}", ex.getName());
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "El valor proporcionado para '" + ex.getName() + "' no es válido.",
            null
        );
    }

    // ==================== ERRORES DE SEGURIDAD ====================

    /**
     * Maneja errores de acceso denegado
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Acceso denegado: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.FORBIDDEN,
            "No tiene permisos para realizar esta operación.",
            null
        );
    }

    /**
     * Maneja errores de credenciales incorrectas
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Credenciales inválidas");
        return buildErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Las credenciales proporcionadas son incorrectas.",
            null
        );
    }

    // ==================== ERRORES HTTP ====================

    /**
     * Maneja método HTTP no soportado
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        log.warn("Método HTTP no soportado: {}", ex.getMethod());
        return buildErrorResponse(
            HttpStatus.METHOD_NOT_ALLOWED,
            "El método HTTP utilizado no está permitido para esta operación.",
            null
        );
    }

    /**
     * Maneja tipo de contenido no soportado
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex) {
        log.warn("Tipo de media no soportado");
        return buildErrorResponse(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            "El formato de los datos enviados no es soportado.",
            null
        );
    }

    /**
     * Maneja body de request inválido/malformado
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        log.warn("Request body inválido: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Los datos enviados tienen un formato incorrecto. Verifique e intente nuevamente.",
            null
        );
    }

    /**
     * Maneja ruta no encontrada
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFound(NoHandlerFoundException ex) {
        log.warn("Ruta no encontrada: {}", ex.getRequestURL());
        return buildErrorResponse(
            HttpStatus.NOT_FOUND,
            "La ruta solicitada no existe.",
            null
        );
    }

    // ==================== ERRORES DE ARCHIVOS ====================

    /**
     * Maneja archivos demasiado grandes
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex) {
        log.warn("Archivo demasiado grande");
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "El archivo es demasiado grande. El tamaño máximo permitido es 10MB.",
            null
        );
    }

    // ==================== ERRORES DE TEMPLATES/PDF ====================

    /**
     * Maneja errores de generación de PDF/templates
     */
    @ExceptionHandler(org.thymeleaf.exceptions.TemplateProcessingException.class)
    public ResponseEntity<Map<String, Object>> handleTemplateProcessingException(
            org.thymeleaf.exceptions.TemplateProcessingException ex) {
        log.error("Error procesando template: {}", ex.getMessage());

        String mensaje;
        if (ex.getMessage() != null && ex.getMessage().contains("cannot be found")) {
            mensaje = "Error al generar el documento: faltan datos requeridos. Verifique que toda la información esté completa.";
        } else {
            mensaje = "Error al generar el documento PDF. Por favor, contacte al administrador.";
        }

        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, mensaje, null);
    }

    // ==================== ERRORES GENÉRICOS ====================

    /**
     * Maneja RuntimeException genéricas
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("RuntimeException: {}", ex.getMessage(), ex);

        String mensaje = ex.getMessage();
        String mensajeUsuario;

        // Intentar extraer un mensaje útil
        if (mensaje != null) {
            if (mensaje.contains("Cliente no encontrado")) {
                mensajeUsuario = "El cliente especificado no fue encontrado.";
            } else if (mensaje.contains("Arma no encontrada") || mensaje.contains("no tiene armas")) {
                mensajeUsuario = "No se encontró información del arma. Verifique que el cliente tenga un arma asignada.";
            } else if (mensaje.contains("Documento no encontrado")) {
                mensajeUsuario = "El documento solicitado no fue encontrado.";
            } else if (mensaje.contains("HibernateProxy") || mensaje.contains("LazyInitializationException")) {
                mensajeUsuario = "Error al cargar los datos. Por favor, intente nuevamente.";
            } else if (mensaje.length() < 100) {
                // Si el mensaje es corto, mostrarlo
                mensajeUsuario = mensaje;
            } else {
                mensajeUsuario = "Ocurrió un error al procesar la solicitud. Por favor, intente nuevamente.";
            }
        } else {
            mensajeUsuario = "Ocurrió un error inesperado. Por favor, intente nuevamente.";
        }

        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, mensajeUsuario, null);
    }

    /**
     * Maneja IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Argumento inválido: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            ex.getMessage() != null ? ex.getMessage() : "Los datos proporcionados no son válidos.",
            null
        );
    }

    /**
     * Maneja IllegalStateException
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateException(IllegalStateException ex) {
        log.warn("Estado inválido: {}", ex.getMessage());
        return buildErrorResponse(
            HttpStatus.CONFLICT,
            ex.getMessage() != null ? ex.getMessage() : "La operación no puede realizarse en el estado actual.",
            null
        );
    }

    /**
     * Maneja cualquier otra excepción no capturada
     * Este es el último recurso para evitar errores 500 sin mensaje
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Error no manejado: {}", ex.getMessage(), ex);
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Ocurrió un error inesperado en el servidor. Si el problema persiste, contacte al administrador.",
            null
        );
    }
}
