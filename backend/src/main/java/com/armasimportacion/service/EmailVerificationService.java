package com.armasimportacion.service;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.EmailVerificationToken;
import com.armasimportacion.model.RespuestaCliente;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.EmailVerificationTokenRepository;
import com.armasimportacion.repository.RespuestaClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para manejar la verificación de correos electrónicos de clientes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final ClienteRepository clienteRepository;
    private final EmailService emailService;
    private final RespuestaClienteRepository respuestaClienteRepository;
    private final LocalizacionService localizacionService;
    private final GrupoImportacionClienteService grupoImportacionClienteService;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;
    
    // Duración de validez del token: 48 horas
    private static final int TOKEN_EXPIRATION_HOURS = 48;

    /**
     * Genera un token de verificación para un cliente y envía el correo
     * 
     * @param cliente Cliente al que se le enviará el correo de verificación
     * @return Token generado
     */
    @Transactional
    public EmailVerificationToken generateAndSendVerificationToken(Cliente cliente) {
        return generateAndSendVerificationToken(cliente, frontendBaseUrl);
    }

    /**
     * Genera un token de verificación para un cliente y envía el correo
     * 
     * @param cliente Cliente al que se le enviará el correo de verificación
     * @param baseUrl URL base de la aplicación (ej: https://mi-dominio.com)
     * @return Token generado
     */
    @Transactional
    public EmailVerificationToken generateAndSendVerificationToken(Cliente cliente, String baseUrl) {
        log.info("Generando token de verificacion para cliente ID: {}", cliente.getId());

        // Validar que el cliente tenga email
        if (cliente.getEmail() == null || cliente.getEmail().trim().isEmpty()) {
            log.warn("Cliente ID {} no tiene email, no se puede generar token", cliente.getId());
            throw new IllegalArgumentException("El cliente debe tener un correo electrónico para verificación");
        }

        // Invalidar tokens anteriores del cliente (si existen)
        tokenRepository.findByClienteId(cliente.getId())
            .ifPresent(token -> {
                if (!token.getUsed()) {
                    token.setUsed(true);
                    token.setUsedAt(LocalDateTime.now());
                    tokenRepository.save(token);
                    log.debug("Token anterior invalidado para cliente ID: {}", cliente.getId());
                }
            });

        // Crear nuevo token
        String tokenValue = EmailVerificationToken.generateToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS);

        EmailVerificationToken token = EmailVerificationToken.builder()
            .token(tokenValue)
            .cliente(cliente)
            .expiresAt(expiresAt)
            .used(false)
            .build();

        EmailVerificationToken savedToken = tokenRepository.save(token);
        log.info("Token de verificacion generado para cliente ID: {} (expira en: {})", cliente.getId(), expiresAt);

        // Enviar correo de verificación con todos los datos del cliente
        try {
            String verificationUrl = baseUrl + "/verify?token=" + tokenValue;
            
            // Verificar si el cliente respondió NO a la pregunta sobre cuenta en Sicoar
            boolean noTieneCuentaSicoar = verificarNoTieneCuentaSicoar(cliente.getId());
            
            emailService.sendVerificationEmail(cliente, verificationUrl, noTieneCuentaSicoar);
            log.info("Correo de verificacion enviado para cliente ID: {}", cliente.getId());
        } catch (Exception e) {
            log.error("Error enviando correo de verificacion para cliente ID {}: {}", cliente.getId(), e.getMessage());
            // No lanzamos excepción para no romper el flujo de creación del cliente
            // El token se guarda pero el correo puede fallar
        }

        return savedToken;
    }

    /**
     * Verifica un token de verificación
     * 
     * @param tokenValue Valor del token a verificar
     * @return Resultado de la verificación con información del cliente
     * @throws IllegalArgumentException si el token es inválido, expirado o ya usado
     */
    @Transactional
    public Map<String, Object> verifyToken(String tokenValue) {
        log.info("Verificando token de email");

        // Buscar token
        EmailVerificationToken token = tokenRepository.findByToken(tokenValue)
            .orElseThrow(() -> {
                log.warn("Token de verificacion no encontrado");
                return new IllegalArgumentException("Token de verificación inválido");
            });

        // Verificar si ya fue usado
        if (token.getUsed()) {
            log.warn("Token de verificacion ya fue usado");
            throw new IllegalArgumentException("Este token de verificación ya fue utilizado");
        }

        // Verificar si expiró
        if (token.isExpired()) {
            log.warn("Token de verificacion expirado (expiraba en: {})", token.getExpiresAt());
            throw new IllegalArgumentException("El token de verificación ha expirado. Por favor, solicite un nuevo correo de verificación");
        }

        // Marcar token como usado
        token.markAsUsed();
        tokenRepository.save(token);

        // Marcar cliente como verificado
        Cliente cliente = token.getCliente();
        cliente.setEmailVerificado(true);
        clienteRepository.save(cliente);
        
        // Confirmar asignación al grupo de importación (si tiene una asignación pendiente)
        try {
            grupoImportacionClienteService.confirmarAsignacionCliente(cliente.getId());
            log.info("Asignacion al grupo confirmada para cliente ID: {}", cliente.getId());
        } catch (Exception e) {
            log.warn("No se pudo confirmar asignacion al grupo para cliente ID {}: {}",
                cliente.getId(), e.getMessage());
            // No fallar la verificación si no hay asignación pendiente
        }

        log.info("Token verificado exitosamente para cliente ID: {}", cliente.getId());

        // Retornar información del resultado con todos los datos del cliente
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Correo electrónico verificado exitosamente");
        result.put("clienteId", cliente.getId());
        result.put("email", cliente.getEmail());
        result.put("nombres", cliente.getNombres());
        result.put("apellidos", cliente.getApellidos());
        result.put("numeroIdentificacion", cliente.getNumeroIdentificacion());
        result.put("tipoIdentificacion", cliente.getTipoIdentificacion() != null ? cliente.getTipoIdentificacion().getNombre() : null);
        result.put("direccion", cliente.getDireccion());
        // Obtener el nombre de la provincia desde el código
        String nombreProvincia = "No especificada";
        if (cliente.getProvincia() != null && !cliente.getProvincia().trim().isEmpty()) {
            nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
        }
        result.put("provincia", nombreProvincia);
        result.put("canton", cliente.getCanton());
        result.put("fechaNacimiento", cliente.getFechaNacimiento() != null ? cliente.getFechaNacimiento().toString() : null);
        result.put("telefonoPrincipal", cliente.getTelefonoPrincipal());
        result.put("telefonoSecundario", cliente.getTelefonoSecundario());

        return result;
    }

    /**
     * Obtiene información del cliente asociado a un token (sin verificar)
     * Útil para mostrar información antes de verificar
     */
    public Map<String, Object> getTokenInfo(String tokenValue) {
        EmailVerificationToken token = tokenRepository.findByToken(tokenValue)
            .orElseThrow(() -> new IllegalArgumentException("Token de verificación inválido"));

        // Verificar si el token es válido (no usado y no expirado)
        if (token.getUsed()) {
            throw new IllegalArgumentException("Este token de verificación ya fue utilizado");
        }
        
        if (token.isExpired()) {
            throw new IllegalArgumentException("El token de verificación ha expirado. Por favor, solicite un nuevo correo de verificación");
        }

        Map<String, Object> info = new HashMap<>();
        info.put("success", true);
        info.put("token", token.getToken());
        info.put("expiresAt", token.getExpiresAt());
        info.put("used", token.getUsed());
        info.put("expired", token.isExpired());
        info.put("valid", token.isValid());
        
        if (token.getCliente() != null) {
            Cliente cliente = token.getCliente();
            info.put("clienteId", cliente.getId());
            info.put("email", cliente.getEmail());
            info.put("nombres", cliente.getNombres());
            info.put("apellidos", cliente.getApellidos());
            info.put("numeroIdentificacion", cliente.getNumeroIdentificacion());
            info.put("tipoIdentificacion", cliente.getTipoIdentificacion() != null ? cliente.getTipoIdentificacion().getNombre() : null);
            info.put("direccion", cliente.getDireccion());
            // Obtener el nombre de la provincia desde el código
            String nombreProvincia = "No especificada";
            if (cliente.getProvincia() != null && !cliente.getProvincia().trim().isEmpty()) {
                nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
            }
            info.put("provincia", nombreProvincia);
            info.put("canton", cliente.getCanton());
            info.put("fechaNacimiento", cliente.getFechaNacimiento() != null ? cliente.getFechaNacimiento().toString() : null);
            info.put("telefonoPrincipal", cliente.getTelefonoPrincipal());
            info.put("telefonoSecundario", cliente.getTelefonoSecundario());
        }

        return info;
    }

    /**
     * Verifica si el cliente respondió NO a la pregunta sobre cuenta en Sicoar
     * 
     * @param clienteId ID del cliente
     * @return true si el cliente respondió NO, false en caso contrario
     */
    private boolean verificarNoTieneCuentaSicoar(Long clienteId) {
        try {
            List<RespuestaCliente> respuestas = respuestaClienteRepository.findByClienteIdWithPregunta(clienteId);
            
            for (RespuestaCliente respuesta : respuestas) {
                if (respuesta.getPregunta() != null) {
                    String preguntaTexto = respuesta.getPregunta().getPregunta();
                    String respuestaTexto = respuesta.getRespuesta();
                    
                    // Verificar si es la pregunta sobre cuenta en Sicoar y la respuesta es NO
                    if (preguntaTexto != null && preguntaTexto.toLowerCase().contains("cuenta en el sicoar")) {
                        if (respuestaTexto != null && respuestaTexto.trim().equalsIgnoreCase("NO")) {
                            log.debug("Cliente ID {} respondio NO a cuenta en Sicoar", clienteId);
                            return true;
                        }
                    }
                }
            }
            
            return false;
        } catch (Exception e) {
            log.warn("Error verificando respuesta Sicoar para cliente ID {}: {}", clienteId, e.getMessage());
            return false; // Por defecto, asumir que sí tiene cuenta si hay error
        }
    }
}

