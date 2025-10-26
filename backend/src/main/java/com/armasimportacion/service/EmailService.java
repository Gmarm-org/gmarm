package com.armasimportacion.service;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.RespuestaCliente;
import com.armasimportacion.model.Pago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:Sistema de Importación de Armas}")
    private String appName;

    /**
     * Envía email de contrato al cliente cuando su proceso está completo
     */
    public void enviarContratoCliente(Cliente cliente, List<DocumentoCliente> documentos, 
                                    List<RespuestaCliente> respuestas) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Contrato de Importación de Armas - " + appName);

            // Generar contenido del email usando HTML simple
            String htmlContent = generarContenidoContrato(cliente, documentos, respuestas);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Contrato enviado exitosamente al cliente: {} ({})", 
                    cliente.getNombreCompleto(), cliente.getEmail());

        } catch (MessagingException e) {
            log.error("❌ Error al enviar contrato al cliente {}: {}", 
                    cliente.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Error al enviar email de contrato", e);
        }
    }

    /**
     * Envía email de confirmación de proceso iniciado
     */
    public void enviarConfirmacionProceso(Cliente cliente) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Proceso de Importación Iniciado - " + appName);

            String htmlContent = generarContenidoConfirmacion(cliente);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Confirmación de proceso enviada al cliente: {} ({})", 
                    cliente.getNombreCompleto(), cliente.getEmail());

        } catch (MessagingException e) {
            log.error("❌ Error al enviar confirmación al cliente {}: {}", 
                    cliente.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Error al enviar email de confirmación", e);
        }
    }

    /**
     * Genera el contenido HTML del contrato
     */
    private String generarContenidoContrato(Cliente cliente, List<DocumentoCliente> documentos, 
                                          List<RespuestaCliente> respuestas) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<title>Contrato de Importación</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; }");
        html.append(".section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; }");
        html.append(".footer { background-color: #ecf0f1; padding: 20px; text-align: center; margin-top: 30px; }");
        html.append("</style></head><body>");
        
        html.append("<div class='header'>");
        html.append("<h1>").append(appName).append("</h1>");
        html.append("<h2>Contrato de Importación de Armas</h2>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<p>Estimado/a <strong>").append(cliente.getNombreCompleto()).append("</strong>,</p>");
        html.append("<p>Su proceso de importación de armas ha sido <strong>COMPLETADO</strong> y está listo para continuar.</p>");
        
        html.append("<div class='section'>");
        html.append("<h3>📋 Información del Cliente</h3>");
        html.append("<p><strong>Identificación:</strong> ").append(cliente.getNumeroIdentificacion()).append("</p>");
        html.append("<p><strong>Email:</strong> ").append(cliente.getEmail()).append("</p>");
        html.append("<p><strong>Teléfono:</strong> ").append(cliente.getTelefonoPrincipal()).append("</p>");
        html.append("</div>");
        
        if (!documentos.isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h3>📄 Documentos Cargados</h3>");
            html.append("<ul>");
            for (DocumentoCliente doc : documentos) {
                html.append("<li>").append(doc.getTipoDocumento().getNombre()).append(" - ").append(doc.getNombreArchivo()).append("</li>");
            }
            html.append("</ul>");
            html.append("</div>");
        }
        
        if (!respuestas.isEmpty()) {
            html.append("<div class='section'>");
            html.append("<h3>❓ Preguntas Respondidas</h3>");
            html.append("<ul>");
            for (RespuestaCliente resp : respuestas) {
                html.append("<li><strong>").append(resp.getPregunta().getPregunta()).append(":</strong> ").append(resp.getRespuesta()).append("</li>");
            }
            html.append("</ul>");
            html.append("</div>");
        }
        
        html.append("<div class='section'>");
        html.append("<h3>✅ Próximos Pasos</h3>");
        html.append("<p>Su proceso ha sido validado exitosamente. En los próximos días recibirá:</p>");
        html.append("<ul>");
        html.append("<li>Contrato formal para firma</li>");
        html.append("<li>Información sobre el proceso de importación</li>");
        html.append("<li>Detalles de pagos y cronograma</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<p>Si tiene alguna pregunta, no dude en contactarnos.</p>");
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p><strong>").append(appName).append("</strong></p>");
        html.append("<p>Fecha: ").append(java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString();
    }

    /**
     * Genera el contenido HTML de confirmación
     */
    private String generarContenidoConfirmacion(Cliente cliente) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<title>Confirmación de Proceso</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; }");
        html.append(".section { margin: 20px 0; padding: 15px; border-left: 4px solid #27ae60; }");
        html.append(".footer { background-color: #ecf0f1; padding: 20px; text-align: center; margin-top: 30px; }");
        html.append("</style></head><body>");
        
        html.append("<div class='header'>");
        html.append("<h1>").append(appName).append("</h1>");
        html.append("<h2>Proceso de Importación Iniciado</h2>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<p>Estimado/a <strong>").append(cliente.getNombreCompleto()).append("</strong>,</p>");
        html.append("<p>Su proceso de importación de armas ha sido <strong>INICIADO EXITOSAMENTE</strong>.</p>");
        
        html.append("<div class='section'>");
        html.append("<h3>📋 Información del Cliente</h3>");
        html.append("<p><strong>Identificación:</strong> ").append(cliente.getNumeroIdentificacion()).append("</p>");
        html.append("<p><strong>Email:</strong> ").append(cliente.getEmail()).append("</p>");
        html.append("<p><strong>Teléfono:</strong> ").append(cliente.getTelefonoPrincipal()).append("</p>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<h3>🔄 Estado del Proceso</h3>");
        html.append("<p>Su solicitud está siendo procesada. Para continuar, debe completar:</p>");
        html.append("<ul>");
        html.append("<li>Documentos requeridos</li>");
        html.append("<li>Preguntas obligatorias</li>");
        html.append("<li>Validación de información</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<h3>📧 Próximos Pasos</h3>");
        html.append("<p>Recibirá notificaciones por email sobre:</p>");
        html.append("<ul>");
        html.append("<li>Documentos pendientes</li>");
        html.append("<li>Preguntas por responder</li>");
        html.append("<li>Estado de su solicitud</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<p>Gracias por confiar en nosotros.</p>");
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p><strong>").append(appName).append("</strong></p>");
        html.append("<p>Fecha: ").append(java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString();
    }

    /**
     * Envía email de recordatorio si faltan documentos o respuestas
     */
    public void enviarRecordatorio(Cliente cliente, List<String> elementosFaltantes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Recordatorio - Documentos Pendientes - " + appName);

            String htmlContent = generarContenidoRecordatorio(cliente, elementosFaltantes);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Recordatorio enviado al cliente: {} ({})", 
                    cliente.getNombreCompleto(), cliente.getEmail());

        } catch (MessagingException e) {
            log.error("❌ Error al enviar recordatorio al cliente {}: {}", 
                    cliente.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Error al enviar email de recordatorio", e);
        }
    }

    /**
     * Genera el contenido HTML del recordatorio
     */
    private String generarContenidoRecordatorio(Cliente cliente, List<String> elementosFaltantes) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<title>Recordatorio - Documentos Pendientes</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; }");
        html.append(".section { margin: 20px 0; padding: 15px; border-left: 4px solid #e74c3c; }");
        html.append(".footer { background-color: #ecf0f1; padding: 20px; text-align: center; margin-top: 30px; }");
        html.append("</style></head><body>");
        
        html.append("<div class='header'>");
        html.append("<h1>").append(appName).append("</h1>");
        html.append("<h2>Recordatorio - Documentos Pendientes</h2>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<p>Estimado/a <strong>").append(cliente.getNombreCompleto()).append("</strong>,</p>");
        html.append("<p>Su proceso de importación está <strong>PENDIENTE</strong> de completar.</p>");
        
        html.append("<div class='section'>");
        html.append("<h3>⚠️ Elementos Pendientes</h3>");
        html.append("<p>Para continuar con su proceso, debe completar:</p>");
        html.append("<ul>");
        for (String elemento : elementosFaltantes) {
            html.append("<li>").append(elemento).append("</li>");
        }
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<div class='section'>");
        html.append("<h3>📧 Contacto</h3>");
        html.append("<p>Si tiene dudas sobre los documentos requeridos, contáctenos.</p>");
        html.append("</div>");
        
        html.append("<p>Gracias por su atención.</p>");
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p><strong>").append(appName).append("</strong></p>");
        html.append("<p>Fecha: ").append(java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString();
    }

    /**
     * Envía contrato con adjunto al cliente
     */
    public void enviarContratoConAdjunto(String emailCliente, String nombreCliente, Pago pago, 
                                        byte[] pdfBytes, String nombreArchivo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emailCliente);
            helper.setSubject("Contrato de Compra de Arma - " + appName);

            String htmlContent = generarContenidoContratoCliente(nombreCliente, pago);
            helper.setText(htmlContent, true);

            // Adjuntar PDF
            helper.addAttachment(nombreArchivo, new org.springframework.core.io.ByteArrayResource(pdfBytes), "application/pdf");

            mailSender.send(message);
            log.info("✅ Contrato con adjunto enviado al cliente: {} ({})", nombreCliente, emailCliente);

        } catch (MessagingException e) {
            log.error("❌ Error al enviar contrato con adjunto al cliente {}: {}", emailCliente, e.getMessage(), e);
            throw new RuntimeException("Error al enviar contrato con adjunto", e);
        }
    }

    /**
     * Envía confirmación de contrato al vendedor
     */
    public void enviarConfirmacionContratoVendedor(String emailVendedor, String nombreVendedor, 
                                                  Cliente cliente, Pago pago, byte[] pdfBytes, String nombreArchivo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emailVendedor);
            helper.setSubject("Confirmación - Contrato Enviado al Cliente - " + appName);

            String htmlContent = generarContenidoConfirmacionVendedor(nombreVendedor, cliente, pago);
            helper.setText(htmlContent, true);

            // Adjuntar copia del contrato
            helper.addAttachment("Copia_" + nombreArchivo, new org.springframework.core.io.ByteArrayResource(pdfBytes), "application/pdf");

            mailSender.send(message);
            log.info("✅ Confirmación de contrato enviada al vendedor: {} ({})", nombreVendedor, emailVendedor);

        } catch (MessagingException e) {
            log.error("❌ Error al enviar confirmación al vendedor {}: {}", emailVendedor, e.getMessage(), e);
            throw new RuntimeException("Error al enviar confirmación al vendedor", e);
        }
    }

    /**
     * Genera contenido HTML para el email del contrato al cliente
     */
    private String generarContenidoContratoCliente(String nombreCliente, Pago pago) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        html.append(".header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; background-color: #f9f9f9; }");
        html.append(".footer { background-color: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }");
        html.append(".highlight { background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }");
        html.append("</style></head><body>");
        
        html.append("<div class='container'>");
        html.append("<div class='header'>");
        html.append("<h1>🎯 Contrato de Compra de Arma</h1>");
        html.append("<p>").append(appName).append("</p>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<h2>Estimado/a ").append(nombreCliente).append(",</h2>");
        html.append("<p>Nos complace informarle que su contrato de compra ha sido generado exitosamente.</p>");
        
        html.append("<div class='highlight'>");
        html.append("<h3>📋 Detalles del Contrato:</h3>");
        html.append("<ul>");
        html.append("<li><strong>Monto Total:</strong> $").append(pago.getMontoTotal()).append("</li>");
        html.append("<li><strong>Tipo de Pago:</strong> ").append(pago.getTipoPago()).append("</li>");
        html.append("<li><strong>Número de Cuotas:</strong> ").append(pago.getNumeroCuotas()).append("</li>");
        if (pago.getMontoCuota() != null) {
            html.append("<li><strong>Monto por Cuota:</strong> $").append(pago.getMontoCuota()).append("</li>");
        }
        html.append("<li><strong>Fecha de Generación:</strong> ").append(java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<p><strong>📎 Adjunto encontrará:</strong></p>");
        html.append("<ul>");
        html.append("<li>Contrato de compra en formato PDF</li>");
        html.append("<li>Términos y condiciones</li>");
        html.append("<li>Información de contacto</li>");
        html.append("</ul>");
        
        html.append("<p><strong>⚠️ Importante:</strong></p>");
        html.append("<ul>");
        html.append("<li>Revise cuidadosamente todos los términos del contrato</li>");
        html.append("<li>Conserve este documento para sus registros</li>");
        html.append("<li>Si tiene alguna pregunta, no dude en contactarnos</li>");
        html.append("</ul>");
        
        html.append("<p>Gracias por confiar en nosotros.</p>");
        html.append("<p>Saludos cordiales,<br>El equipo de ").append(appName).append("</p>");
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p>Este es un mensaje automático, por favor no responda a este email.</p>");
        html.append("<p>Si necesita asistencia, contacte a su vendedor asignado.</p>");
        html.append("</div>");
        
        html.append("</div></body></html>");
        
        return html.toString();
    }

    /**
     * Genera contenido HTML para la confirmación al vendedor
     */
    private String generarContenidoConfirmacionVendedor(String nombreVendedor, Cliente cliente, Pago pago) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        html.append(".header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }");
        html.append(".content { padding: 20px; background-color: #f9f9f9; }");
        html.append(".footer { background-color: #2c3e50; color: white; padding: 15px; text-align: center; font-size: 12px; }");
        html.append(".highlight { background-color: #d5f4e6; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }");
        html.append("</style></head><body>");
        
        html.append("<div class='container'>");
        html.append("<div class='header'>");
        html.append("<h1>✅ Confirmación de Envío de Contrato</h1>");
        html.append("<p>").append(appName).append("</p>");
        html.append("</div>");
        
        html.append("<div class='content'>");
        html.append("<h2>Estimado/a ").append(nombreVendedor).append(",</h2>");
        html.append("<p>Le confirmamos que el contrato ha sido enviado exitosamente al cliente.</p>");
        
        html.append("<div class='highlight'>");
        html.append("<h3>👤 Información del Cliente:</h3>");
        html.append("<ul>");
        html.append("<li><strong>Nombre:</strong> ").append(cliente.getNombres()).append(" ").append(cliente.getApellidos()).append("</li>");
        html.append("<li><strong>Email:</strong> ").append(cliente.getEmail()).append("</li>");
        html.append("<li><strong>Teléfono:</strong> ").append(cliente.getTelefonoPrincipal()).append("</li>");
        html.append("<li><strong>Identificación:</strong> ").append(cliente.getNumeroIdentificacion()).append("</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<div class='highlight'>");
        html.append("<h3>💰 Detalles del Pago:</h3>");
        html.append("<ul>");
        html.append("<li><strong>Monto Total:</strong> $").append(pago.getMontoTotal()).append("</li>");
        html.append("<li><strong>Tipo de Pago:</strong> ").append(pago.getTipoPago()).append("</li>");
        html.append("<li><strong>Número de Cuotas:</strong> ").append(pago.getNumeroCuotas()).append("</li>");
        html.append("<li><strong>Estado:</strong> ").append(pago.getEstado()).append("</li>");
        html.append("</ul>");
        html.append("</div>");
        
        html.append("<p><strong>📎 Adjunto encontrará:</strong></p>");
        html.append("<ul>");
        html.append("<li>Copia del contrato enviado al cliente</li>");
        html.append("<li>Para sus registros y seguimiento</li>");
        html.append("</ul>");
        
        html.append("<p><strong>📋 Próximos pasos:</strong></p>");
        html.append("<ul>");
        html.append("<li>Monitoree la respuesta del cliente</li>");
        html.append("<li>Esté atento a posibles consultas</li>");
        html.append("<li>Realice seguimiento según sea necesario</li>");
        html.append("</ul>");
        
        html.append("<p>¡Excelente trabajo!</p>");
        html.append("<p>El equipo de ").append(appName).append("</p>");
        html.append("</div>");
        
        html.append("<div class='footer'>");
        html.append("<p>Este es un mensaje automático del sistema.</p>");
        html.append("<p>Fecha: ").append(java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</p>");
        html.append("</div>");
        
        html.append("</div></body></html>");
        
        return html.toString();
    }
}
