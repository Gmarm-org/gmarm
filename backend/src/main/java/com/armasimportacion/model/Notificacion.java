package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificacion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class Notificacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "titulo", nullable = false)
    private String titulo;
    
    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;
    
    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoNotificacion tipo;
    
    @Column(name = "estado", nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoNotificacion estado;
    
    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;
    
    @Column(name = "fecha_lectura")
    private LocalDateTime fechaLectura;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private Usuario usuarioDestino;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origen_id")
    private Usuario usuarioOrigen;
    
    @Column(name = "entidad_tipo")
    private String entidadTipo; // CLIENTE, IMPORTACION, PAGO, etc.
    
    @Column(name = "entidad_id")
    private Long entidadId;
    
    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;
    
    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Métodos de utilidad
    public boolean esNoLeida() {
        return estado == EstadoNotificacion.NO_LEIDA;
    }
    
    public boolean esEmail() {
        return tipo == TipoNotificacion.EMAIL;
    }
    
    public boolean esSistema() {
        return tipo == TipoNotificacion.SISTEMA;
    }
} 