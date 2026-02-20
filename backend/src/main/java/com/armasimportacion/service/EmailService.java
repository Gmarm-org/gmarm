package com.armasimportacion.service;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.dto.AlertaProcesoImportacionDTO;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.RespuestaCliente;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.File;
import com.armasimportacion.exception.EmailSendException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

/**
 * Servicio para envío de correos electrónicos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final LocalizacionService localizacionService;

    @Value("${app.email.from-name:GMARM}")
    private String fromName;

    public static class DocumentoAdjunto {
        private final String nombreArchivo;
        private final byte[] contenido;

        public DocumentoAdjunto(String nombreArchivo, byte[] contenido) {
            this.nombreArchivo = nombreArchivo;
            this.contenido = contenido;
        }

        public String getNombreArchivo() {
            return nombreArchivo;
        }

        public byte[] getContenido() {
            return contenido;
        }
    }

    /**
     * Obtiene el email del remitente desde el JavaMailSender configurado
     */
    private String getFromEmail() {
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl) {
            org.springframework.mail.javamail.JavaMailSenderImpl impl = 
                (org.springframework.mail.javamail.JavaMailSenderImpl) mailSender;
            String username = impl.getUsername();
            if (username != null && !username.isEmpty()) {
                return username;
            }
        }
        // Fallback: intentar desde properties
        return "noreply@gmarm.com";
    }

    /**
     * Envía correo de verificación de email al cliente con todos sus datos personales
     * 
     * @param cliente Cliente completo con todos sus datos
     * @param verificationUrl URL de verificación con token
     * @param noTieneCuentaSicoar true si el cliente respondió NO a tener cuenta en Sicoar
     */
    public void sendVerificationEmail(Cliente cliente, String verificationUrl, boolean noTieneCuentaSicoar) {
        log.info("Enviando correo de verificación a: {}", cliente.getEmail());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Verifica tus datos personales - GMARM");

            // Crear contexto para la plantilla con todos los datos del cliente
            Context context = new Context();
            context.setVariable("nombre", cliente.getNombres());
            context.setVariable("apellidos", cliente.getApellidos());
            context.setVariable("numeroIdentificacion", cliente.getNumeroIdentificacion());
            context.setVariable("tipoIdentificacion", cliente.getTipoIdentificacion() != null ? cliente.getTipoIdentificacion().getNombre() : "N/A");
            context.setVariable("direccion", cliente.getDireccion() != null ? cliente.getDireccion() : "No especificada");
            // Obtener el nombre de la provincia desde el código
            String nombreProvincia = "No especificada";
            if (cliente.getProvincia() != null && !cliente.getProvincia().isBlank()) {
                nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
            }
            context.setVariable("provincia", nombreProvincia);
            context.setVariable("canton", cliente.getCanton() != null ? cliente.getCanton() : "No especificado");
            context.setVariable("fechaNacimiento", cliente.getFechaNacimiento() != null ? cliente.getFechaNacimiento().toString() : "No especificada");
            context.setVariable("telefonoPrincipal", cliente.getTelefonoPrincipal() != null ? cliente.getTelefonoPrincipal() : "No especificado");
            context.setVariable("telefonoSecundario", cliente.getTelefonoSecundario() != null ? cliente.getTelefonoSecundario() : "No especificado");
            context.setVariable("email", cliente.getEmail() != null ? cliente.getEmail() : "No especificado");
            context.setVariable("verificationUrl", verificationUrl);
            context.setVariable("expirationHours", 48);
            context.setVariable("noTieneCuentaSicoar", noTieneCuentaSicoar);

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/verification-email", context);
            helper.setText(htmlContent, true);

            // Enviar correo
            mailSender.send(message);
            log.info("Correo de verificación enviado exitosamente a: {}", cliente.getEmail());

        } catch (MessagingException e) {
            log.error("Error enviando correo de verificación a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error al enviar correo de verificación: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando correo a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar correo: " + e.getMessage(), e);
        }
    }

    /**
     * Envía contrato adjunto desde ruta de archivo
     * 
     * @param email Email del destinatario
     * @param nombreCompleto Nombre completo del destinatario
     * @param rutaArchivo Ruta completa del archivo PDF a adjuntar
     */
    public void enviarContratoAdjunto(String email, String nombreCompleto, String rutaArchivo) {
        log.info("Enviando contrato adjunto a: {}", email);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(email);
            helper.setSubject("Contrato de Compra de Arma - GMARM");

            // Crear contexto para la plantilla
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCompleto);

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/contrato-cliente", context);
            helper.setText(htmlContent, true);

            // Adjuntar archivo PDF
            File file = new File(rutaArchivo);
            if (file.exists()) {
                FileSystemResource resource = new FileSystemResource(file);
                helper.addAttachment(file.getName(), resource);
                log.info("Archivo adjuntado: {}", rutaArchivo);
            } else {
                log.warn("Archivo no encontrado: {}", rutaArchivo);
            }

            // Enviar correo
            mailSender.send(message);
            log.info("Contrato enviado exitosamente a: {}", email);

        } catch (MessagingException e) {
            log.error("Error enviando contrato a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error al enviar contrato: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando contrato a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar contrato: " + e.getMessage(), e);
        }
    }

    /**
     * Envía contrato con adjunto desde bytes en memoria
     * 
     * @param email Email del destinatario
     * @param nombreCompleto Nombre completo del destinatario
     * @param pago Información del pago
     * @param pdfBytes Bytes del PDF a adjuntar
     * @param nombreArchivo Nombre del archivo PDF
     */
    public void enviarContratoConAdjunto(String email, String nombreCompleto, Pago pago, 
                                        byte[] pdfBytes, String nombreArchivo) {
        log.info("Enviando contrato con adjunto a: {}", email);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(email);
            helper.setSubject("Contrato de Compra de Arma - GMARM");

            // Crear contexto para la plantilla
            Context context = new Context();
            context.setVariable("nombreCliente", nombreCompleto);
            
            if (pago != null) {
                context.setVariable("tipoPago", pago.getTipoPago() != null ? pago.getTipoPago().toString() : "N/A");
                context.setVariable("montoTotal", formatCurrency(pago.getMontoTotal()));
            } else {
                context.setVariable("tipoPago", "N/A");
                context.setVariable("montoTotal", "N/A");
            }

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/contrato-con-pago", context);
            helper.setText(htmlContent, true);

            // Adjuntar PDF desde bytes
            helper.addAttachment(nombreArchivo, () -> new java.io.ByteArrayInputStream(pdfBytes));

            // Enviar correo
            mailSender.send(message);
            log.info("Contrato con adjunto enviado exitosamente a: {}", email);

        } catch (MessagingException e) {
            log.error("Error enviando contrato con adjunto a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error al enviar contrato con adjunto: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando contrato con adjunto a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar contrato con adjunto: " + e.getMessage(), e);
        }
    }

    /**
     * Envía confirmación de contrato al vendedor
     * 
     * @param email Email del vendedor
     * @param nombreVendedor Nombre completo del vendedor
     * @param cliente Información del cliente
     * @param pago Información del pago
     * @param pdfBytes Bytes del PDF a adjuntar
     * @param nombreArchivo Nombre del archivo PDF
     */
    public void enviarConfirmacionContratoVendedor(String email, String nombreVendedor, Cliente cliente, 
                                                   Pago pago, byte[] pdfBytes, String nombreArchivo) {
        log.info("Enviando confirmación de contrato a vendedor: {}", email);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(email);
            helper.setSubject("Contrato Generado - Cliente: " + cliente.getNombres() + " " + cliente.getApellidos());

            // Crear contexto para la plantilla
            Context context = new Context();
            context.setVariable("nombreVendedor", nombreVendedor);
            context.setVariable("nombreCliente", cliente.getNombres() + " " + cliente.getApellidos());
            context.setVariable("ciCliente", cliente.getNumeroIdentificacion());
            context.setVariable("montoTotal", pago != null ? formatCurrency(pago.getMontoTotal()) : "N/A");

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/notificacion-vendedor", context);
            helper.setText(htmlContent, true);

            // Adjuntar PDF desde bytes
            helper.addAttachment(nombreArchivo, () -> new java.io.ByteArrayInputStream(pdfBytes));

            // Enviar correo
            mailSender.send(message);
            log.info("Confirmación de contrato enviada exitosamente a vendedor: {}", email);

        } catch (MessagingException e) {
            log.error("Error enviando confirmación a vendedor {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error al enviar confirmación a vendedor: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando confirmación a vendedor {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar confirmación a vendedor: " + e.getMessage(), e);
        }
    }

    public void enviarDocumentosGenerados(String email, String nombreCliente, String nombreVendedor, Licencia licencia,
                                          List<DocumentoAdjunto> adjuntos) {
        if (email == null || email.isBlank()) {
            log.warn("Email vacío, omitiendo envío de documentos generados");
            return;
        }
        log.info("Enviando documentos generados a: {}", email);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(email.trim());
            helper.setSubject("Documentos generados para adquisición de arma - GMARM");

            Context context = new Context();
            context.setVariable("nombreCliente", nombreCliente);
            context.setVariable("nombreVendedor", nombreVendedor);
            String licenciaTitulo = licencia != null && licencia.getTitulo() != null && !licencia.getTitulo().isBlank()
                ? licencia.getTitulo() : "";
            context.setVariable("licenciaTitulo", licenciaTitulo);
            context.setVariable("licenciaNombre", licencia != null ? licencia.getNombre() : "N/A");
            context.setVariable("licenciaBanco", licencia != null ? licencia.getNombreBanco() : "N/A");
            context.setVariable("licenciaTipoCuenta", licencia != null && licencia.getTipoCuenta() != null ? licencia.getTipoCuenta().name() : "N/A");
            context.setVariable("licenciaCuenta", licencia != null ? licencia.getCuentaBancaria() : "N/A");
            context.setVariable("licenciaCedulaCuenta", licencia != null ? licencia.getCedulaCuenta() : "N/A");
            context.setVariable("licenciaRuc", licencia != null ? licencia.getRuc() : "N/A");
            context.setVariable("licenciaEmail", licencia != null ? licencia.getEmail() : "N/A");
            context.setVariable("licenciaTelefono", licencia != null ? licencia.getTelefono() : "N/A");

            String htmlContent = templateEngine.process("email/documentos-generados", context);
            helper.setText(htmlContent, true);

            if (adjuntos != null) {
                for (DocumentoAdjunto adjunto : adjuntos) {
                    if (adjunto == null || adjunto.getContenido() == null || adjunto.getNombreArchivo() == null) {
                        continue;
                    }
                    helper.addAttachment(adjunto.getNombreArchivo(), () -> new java.io.ByteArrayInputStream(adjunto.getContenido()));
                }
            }

            mailSender.send(message);
            log.info("Documentos generados enviados exitosamente a: {}", email);
        } catch (MessagingException e) {
            log.error("Error enviando documentos generados a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error al enviar documentos generados: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando documentos generados a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar documentos generados: " + e.getMessage(), e);
        }
    }

    public void enviarAlertasProcesoImportacion(String email, String nombreDestinatario, List<AlertaProcesoImportacionDTO> alertas) {
        if (email == null || email.isBlank() || alertas == null || alertas.isEmpty()) {
            return;
        }

        log.info("Enviando alertas de proceso de importación a: {}", email);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(email.trim());
            helper.setSubject("Alertas de procesos de importación - GMARM");

            Context context = new Context();
            context.setVariable("nombreDestinatario", nombreDestinatario);
            context.setVariable("alertas", alertas);

            String htmlContent = templateEngine.process("email/alerta-proceso-importacion", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Alertas enviadas exitosamente a: {}", email);
        } catch (MessagingException e) {
            log.error("Error enviando alertas a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error al enviar alertas de proceso: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando alertas a {}: {}", email, e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar alertas: " + e.getMessage(), e);
        }
    }

    /**
     * Envía contrato al cliente con información de documentos
     * 
     * @param cliente Cliente
     * @param documentos Lista de documentos del cliente
     * @param respuestas Lista de respuestas del cliente
     */
    public void enviarContratoCliente(Cliente cliente, List<DocumentoCliente> documentos, 
                                     List<RespuestaCliente> respuestas) {
        log.info("Enviando contrato con documentos a cliente: {}", cliente.getEmail());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Proceso de Compra Registrado - GMARM");

            // Crear contexto para la plantilla
            Context context = new Context();
            context.setVariable("nombreCliente", cliente.getNombres() + " " + cliente.getApellidos());
            context.setVariable("documentos", documentos);
            context.setVariable("respuestas", respuestas);

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/contrato-con-documentos", context);
            helper.setText(htmlContent, true);

            // Enviar correo
            mailSender.send(message);
            log.info("Contrato con documentos enviado exitosamente a: {}", cliente.getEmail());

        } catch (MessagingException e) {
            log.error("Error enviando contrato con documentos a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error al enviar contrato con documentos: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando contrato con documentos a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar contrato con documentos: " + e.getMessage(), e);
        }
    }

    /**
     * Envía confirmación de proceso completado
     * 
     * @param cliente Cliente
     */
    public void enviarConfirmacionProceso(Cliente cliente) {
        log.info("Enviando confirmación de proceso a cliente: {}", cliente.getEmail());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getFromEmail(), fromName);
            helper.setTo(cliente.getEmail());
            helper.setSubject("Proceso Completado - GMARM");

            // Crear contexto para la plantilla
            Context context = new Context();
            context.setVariable("nombreCliente", cliente.getNombres() + " " + cliente.getApellidos());

            // Procesar plantilla HTML
            String htmlContent = templateEngine.process("email/confirmacion-proceso", context);
            helper.setText(htmlContent, true);

            // Enviar correo
            mailSender.send(message);
            log.info("Confirmación de proceso enviada exitosamente a: {}", cliente.getEmail());

        } catch (MessagingException e) {
            log.error("Error enviando confirmación de proceso a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error al enviar confirmación de proceso: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error inesperado enviando confirmación de proceso a {}: {}", cliente.getEmail(), e.getMessage(), e);
            throw new EmailSendException("Error inesperado al enviar confirmación de proceso: " + e.getMessage(), e);
        }
    }

    /**
     * Envía recibo de pago por correo a múltiples destinatarios
     * Los destinatarios incluyen el cliente y los correos configurados en CORREOS_RECIBO
     * 
     * @param emails Lista de emails destinatarios (cliente + correos configurados en sistema)
     * @param clienteNombre Nombre completo del cliente
     * @param pdfBytes Bytes del PDF del recibo
     * @param nombreArchivo Nombre del archivo PDF
     * @param numeroRecibo Número de recibo
     * @param monto Monto pagado
     */
    public void enviarReciboPorCorreo(List<String> emails, String clienteNombre, 
                                     byte[] pdfBytes, String nombreArchivo, 
                                     String numeroRecibo, BigDecimal monto) {
        log.info("Enviando recibo a {} destinatarios", emails.size());

        for (String email : emails) {
            if (email == null || email.isBlank()) {
                log.warn("Email vacío, omitiendo envío");
                continue;
            }

            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(getFromEmail(), fromName);
                helper.setTo(email);
                helper.setSubject("Recibo de Pago - GMARM - " + numeroRecibo);

                // Crear contexto para la plantilla
                Context context = new Context();
                context.setVariable("nombreCliente", clienteNombre);
                context.setVariable("numeroRecibo", numeroRecibo);
                context.setVariable("monto", formatCurrency(monto));

                // Procesar plantilla HTML
                String htmlContent = templateEngine.process("email/recibo-pago", context);
                helper.setText(htmlContent, true);

                // Adjuntar PDF desde bytes
                helper.addAttachment(nombreArchivo, () -> new java.io.ByteArrayInputStream(pdfBytes));

                // Enviar correo
                mailSender.send(message);
                log.info("Recibo enviado exitosamente a: {}", email);

            } catch (MessagingException e) {
                log.error("Error enviando recibo a {}: {}", email, e.getMessage(), e);
            } catch (Exception e) {
                log.error("Error inesperado enviando recibo a {}: {}", email, e.getMessage(), e);
            }
        }
    }

    /**
     * Formatea un monto como moneda
     */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "$0.00";
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("es", "EC"));
        return formatter.format(amount);
    }
}
