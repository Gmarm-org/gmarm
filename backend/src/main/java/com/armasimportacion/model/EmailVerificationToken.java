package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad para tokens de verificación de correo electrónico
 * Cada token es único, tiene expiración de 48 horas y es de un solo uso
 */
@Entity
@Table(name = "email_verification_token")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true, length = 36)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private Boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Genera un nuevo token UUID único
     */
    public static String generateToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * Verifica si el token ha expirado
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Verifica si el token es válido (no usado y no expirado)
     */
    public boolean isValid() {
        return !used && !isExpired();
    }

    /**
     * Marca el token como usado
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }
}

