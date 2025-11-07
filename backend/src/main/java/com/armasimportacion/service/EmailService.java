package com.armasimportacion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;
import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final ConfiguracionSistemaService configuracionService;
    private final TemplateEngine templateEngine;

    /**
     * Envía un email con el contrato adjunto
     * @param destinatario Email del cliente
     * @param nombreCliente Nombre completo del cliente
     * @param contratoPath Ruta del archivo del contrato generado
     */
    public void enviarContratoAdjunto(String destinatario, String nombreCliente, String contratoPath) {
        try {
            log.info("📧 Preparando envío de contrato a: {}", destinatario);
            
            // Obtener el email desde configuración
            String emailNotificaciones = configuracionService.getValorConfiguracion("EMAIL_NOTIFICACIONES");
            log.info("📧 Email remitente: {}", emailNotificaciones);
            
            // Crear mensaje
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(emailNotificaciones);
            helper.setTo(destinatario);
            helper.setSubject("✅ Contrato de Compra de Arma - GMARM");
            
            // Procesar template con Thymeleaf
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCliente);
            String htmlContent = templateEngine.process("email/contrato-cliente", context);
            helper.setText(htmlContent, true);
            
            // Adjuntar el PDF del contrato
            FileSystemResource file = new FileSystemResource(new File(contratoPath));
            helper.addAttachment("Contrato_GMARM.pdf", file);
            
            // Enviar
            mailSender.send(message);
            log.info("✅ Email enviado exitosamente a: {}", destinatario);
            
        } catch (Exception e) {
            log.error("❌ Error enviando email a {}: {}", destinatario, e.getMessage(), e);
            // No lanzar excepción para no afectar el flujo principal
        }
    }

    
    /**
     * Envía el contrato al cliente con documentos y respuestas
     */
    public void enviarContratoCliente(com.armasimportacion.model.Cliente cliente, 
                                     java.util.List<com.armasimportacion.model.DocumentoCliente> documentos,
                                     java.util.List<com.armasimportacion.model.RespuestaCliente> respuestas) {
        try {
            log.info("📧 Enviando contrato completo a cliente: {}", cliente.getEmail());
            
            if (cliente.getEmail() == null || cliente.getEmail().isEmpty()) {
                log.warn("⚠️ Cliente sin email, no se puede enviar contrato");
                return;
            }
            
            String emailNotificaciones = configuracionService.getValorConfiguracion("EMAIL_NOTIFICACIONES");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(emailNotificaciones);
            helper.setTo(cliente.getEmail());
            helper.setSubject("✅ Documentación de Compra - GMARM");
            
            String nombreCompleto = cliente.getNombres() + " " + cliente.getApellidos();
            
            // Procesar template con Thymeleaf
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCompleto);
            context.setVariable("documentos", documentos);
            context.setVariable("respuestas", respuestas);
            String htmlContent = templateEngine.process("email/contrato-con-documentos", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("✅ Email de contrato enviado exitosamente a: {}", cliente.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Error enviando contrato al cliente {}: {}", cliente.getEmail(), e.getMessage(), e);
        }
    }
    
    /**
     * Envía confirmación de proceso completado
     */
    public void enviarConfirmacionProceso(com.armasimportacion.model.Cliente cliente) {
        try {
            log.info("📧 Enviando confirmación de proceso a: {}", cliente.getEmail());
            
            if (cliente.getEmail() == null || cliente.getEmail().isEmpty()) {
                log.warn("⚠️ Cliente sin email, no se puede enviar confirmación");
                return;
            }
            
            String emailNotificaciones = configuracionService.getValorConfiguracion("EMAIL_NOTIFICACIONES");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            
            helper.setFrom(emailNotificaciones);
            helper.setTo(cliente.getEmail());
            helper.setSubject("✅ Proceso Completado - GMARM");
            
            String nombreCompleto = cliente.getNombres() + " " + cliente.getApellidos();
            
            // Procesar template con Thymeleaf
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCompleto);
            String htmlContent = templateEngine.process("email/confirmacion-proceso", context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("✅ Email de confirmación enviado exitosamente a: {}", cliente.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Error enviando confirmación al cliente {}: {}", cliente.getEmail(), e.getMessage(), e);
        }
    }
    
    /**
     * Envía contrato con archivo adjunto (recibe bytes del PDF)
     */
    public void enviarContratoConAdjunto(String emailCliente, String nombreCliente,
                                        com.armasimportacion.model.Pago pago,
                                        byte[] contratoBytes, String nombreArchivo) {
        try {
            log.info("📧 Enviando contrato con adjunto a: {}", emailCliente);
            
            if (emailCliente == null || emailCliente.isEmpty()) {
                log.warn("⚠️ Email vacío, no se puede enviar contrato");
                return;
            }
            
            String emailNotificaciones = configuracionService.getValorConfiguracion("EMAIL_NOTIFICACIONES");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(emailNotificaciones);
            helper.setTo(emailCliente);
            helper.setSubject("✅ Contrato de Compra de Arma - GMARM");
            
            // Procesar template con Thymeleaf
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCliente);
            context.setVariable("tipoPago", pago.getTipoPago() != null ? pago.getTipoPago().toString() : "N/A");
            context.setVariable("montoTotal", pago.getMontoTotal() != null ? String.format("$%.2f", pago.getMontoTotal()) : "N/A");
            String htmlContent = templateEngine.process("email/contrato-con-pago", context);
            helper.setText(htmlContent, true);
            
            // Adjuntar PDF desde bytes
            helper.addAttachment(nombreArchivo, () -> new java.io.ByteArrayInputStream(contratoBytes));
            
            mailSender.send(message);
            log.info("✅ Email con contrato adjunto enviado a: {}", emailCliente);
            
        } catch (Exception e) {
            log.error("❌ Error enviando contrato a {}: {}", emailCliente, e.getMessage(), e);
        }
    }
    
    /**
     * Envía confirmación al vendedor sobre el contrato generado
     */
    public void enviarConfirmacionContratoVendedor(String emailVendedor, String nombreVendedor,
                                                   com.armasimportacion.model.Cliente cliente,
                                                   com.armasimportacion.model.Pago pago,
                                                   byte[] contratoBytes, String nombreArchivo) {
        try {
            log.info("📧 Enviando confirmación a vendedor: {}", emailVendedor);
            
            if (emailVendedor == null || emailVendedor.isEmpty()) {
                log.warn("⚠️ Email de vendedor vacío, no se puede enviar confirmación");
                return;
            }
            
            String emailNotificaciones = configuracionService.getValorConfiguracion("EMAIL_NOTIFICACIONES");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(emailNotificaciones);
            helper.setTo(emailVendedor);
            helper.setSubject("✅ Contrato Generado - Cliente: " + cliente.getNombres() + " " + cliente.getApellidos());
            
            // Procesar template con Thymeleaf
            Context context = new Context();
            context.setVariable("nombreVendedor", nombreVendedor);
            context.setVariable("nombreCliente", cliente.getNombres() + " " + cliente.getApellidos());
            context.setVariable("ciCliente", cliente.getNumeroIdentificacion());
            context.setVariable("montoTotal", pago.getMontoTotal() != null ? String.format("$%.2f", pago.getMontoTotal()) : "N/A");
            String htmlContent = templateEngine.process("email/notificacion-vendedor", context);
            helper.setText(htmlContent, true);
            
            // Adjuntar PDF
            helper.addAttachment(nombreArchivo, () -> new java.io.ByteArrayInputStream(contratoBytes));
            
            mailSender.send(message);
            log.info("✅ Email de confirmación enviado a vendedor: {}", emailVendedor);
            
        } catch (Exception e) {
            log.error("❌ Error enviando confirmación a vendedor {}: {}", emailVendedor, e.getMessage(), e);
        }
    }
}
