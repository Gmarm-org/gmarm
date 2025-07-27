package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tipo_cliente")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TipoCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    @Column(name = "codigo", unique = true, nullable = false, length = 20)
    private String codigo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "estado", nullable = false)
    @Builder.Default
    private Boolean estado = true;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @OneToMany(mappedBy = "tipoCliente", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Cliente> clientes = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "tipo_cliente_tipo_importacion",
        joinColumns = @JoinColumn(name = "tipo_cliente_id"),
        inverseJoinColumns = @JoinColumn(name = "tipo_importacion_id")
    )
    @Builder.Default
    private List<TipoImportacion> tiposImportacion = new ArrayList<>();

    // Métodos de utilidad
    public boolean esActivo() {
        return estado != null && estado;
    }

    public boolean esEmpresa() {
        return "Empresa Seguridad".equals(nombre);
    }

    public boolean esUniformado() {
        return nombre != null && (
            nombre.contains("Militar") || 
            nombre.contains("Uniformado")
        );
    }

    public boolean esCivil() {
        return "Civil".equals(nombre);
    }

    public boolean esDeportista() {
        return "Deportista".equals(nombre);
    }
}