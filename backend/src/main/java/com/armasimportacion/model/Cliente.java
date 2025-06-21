package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "cliente",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tipo_identificacion_id", "numero_identificacion"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relaciones a otras tablas
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_identificacion_id", nullable = false)
    private TipoIdentificacion tipoIdentificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cliente_id", nullable = false)
    private TipoCliente tipoCliente;

    @Column(name = "numero_identificacion", length = 20, nullable = false)
    private String numeroIdentificacion;

    @Column(length = 100, nullable = false)
    private String nombres;

    @Column(length = 100)
    private String apellidos;

    @Column(length = 255, nullable = false)
    private String direccion;

    @Column(length = 100, nullable = false)
    private String email;

    @Column(name = "telefono_principal", length = 15, nullable = false)
    private String telefonoPrincipal;

    @Column(name = "telefono_secundario", length = 15)
    private String telefonoSecundario;

    @Column(name = "representante_legal", length = 100)
    private String representanteLegal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id", nullable = false)
    private Usuario usuarioCreador;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(length = 20, nullable = false)
    private String estado = "ACTIVO";
}
