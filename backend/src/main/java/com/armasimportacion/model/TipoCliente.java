package com.armasimportacion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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

    // Banderas dinámicas para clasificación de tipos de cliente
    @Column(name = "es_militar")
    @Builder.Default
    private Boolean esMilitar = false;

    @Column(name = "es_policia")
    @Builder.Default
    private Boolean esPolicia = false;

    @Column(name = "es_empresa")
    @Builder.Default
    private Boolean esEmpresa = false;

    @Column(name = "es_deportista")
    @Builder.Default
    private Boolean esDeportista = false;

    @Column(name = "es_civil")
    @Builder.Default
    private Boolean esCivil = false;

    @Column(name = "requiere_issfa")
    @Builder.Default
    private Boolean requiereIssfa = false;

    @Column(name = "tipo_proceso_id")
    private Long tipoProcesoId;

    @CreatedDate
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    // Relaciones
    @OneToMany(mappedBy = "tipoCliente", fetch = FetchType.LAZY)
    @JsonManagedReference
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

    // Métodos de utilidad usando banderas dinámicas
    public boolean esActivo() {
        return estado != null && estado;
    }

    public boolean esEmpresa() {
        return esEmpresa != null && esEmpresa;
    }

    public boolean esMilitar() {
        return esMilitar != null && esMilitar;
    }

    public boolean esPolicia() {
        return esPolicia != null && esPolicia;
    }

    public boolean esUniformado() {
        return esMilitar() || esPolicia();
    }

    public boolean esCivil() {
        return esCivil != null && esCivil;
    }

    public boolean esDeportista() {
        return esDeportista != null && esDeportista;
    }

    public boolean requiereIssfa() {
        return requiereIssfa != null && requiereIssfa;
    }
}
