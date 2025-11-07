package com.armasimportacion.config;

import com.armasimportacion.service.ConfiguracionSistemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class EmailConfig {

    private final ConfiguracionSistemaService configuracionService;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        try {
            // Cargar configuración SMTP desde base de datos
            String host = configuracionService.getValorConfiguracion("SMTP_HOST");
            String port = configuracionService.getValorConfiguracion("SMTP_PORT");
            String username = configuracionService.getValorConfiguracion("SMTP_USERNAME");
            String password = configuracionService.getValorConfiguracion("SMTP_PASSWORD");
            String auth = configuracionService.getValorConfiguracion("SMTP_AUTH");
            String starttls = configuracionService.getValorConfiguracion("SMTP_STARTTLS");
            
            mailSender.setHost(host);
            mailSender.setPort(Integer.parseInt(port));
            mailSender.setUsername(username);
            mailSender.setPassword(password);
            
            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", auth);
            props.put("mail.smtp.starttls.enable", starttls);
            props.put("mail.smtp.starttls.required", starttls);
            props.put("mail.debug", "false"); // Cambiar a "true" para debugging
            
            log.info("✅ Configuración SMTP cargada desde BD:");
            log.info("   📧 Host: {}", host);
            log.info("   🔌 Puerto: {}", port);
            log.info("   👤 Usuario: {}", username);
            log.info("   🔐 Auth: {}", auth);
            log.info("   🔒 STARTTLS: {}", starttls);
            
        } catch (Exception e) {
            log.error("❌ Error cargando configuración SMTP desde BD: {}", e.getMessage());
            log.warn("⚠️ Usando valores por defecto de application.properties");
            
            // Valores por defecto si falla la carga desde BD
            mailSender.setHost("smtp.gmail.com");
            mailSender.setPort(587);
            
            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }
        
        return mailSender;
    }
}

