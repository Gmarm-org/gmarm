package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_documento_externo")
public class ConfiguracionDocumentoExterno {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;
    
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
    
    @Column(name = "link_externo", nullable = false, length = 500)
    private String linkExterno;
    
    @Column(name = "instrucciones_descarga", columnDefinition = "TEXT")
    private String instruccionesDescarga;
    
    @Column(name = "aplica_para_tipos_cliente", columnDefinition = "TEXT[]")
    private String[] aplicaParaTiposCliente;
    
    @Column(name = "excluye_tipos_cliente", columnDefinition = "TEXT[]")
    private String[] excluyeTiposCliente;
    
    @Column(name = "orden_visual")
    private Integer ordenVisual;
    
    @Column(name = "activo")
    private Boolean activo = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    // Constructores
    public ConfiguracionDocumentoExterno() {}
    
    public ConfiguracionDocumentoExterno(String nombre, String descripcion, String linkExterno) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.linkExterno = linkExterno;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    public String getLinkExterno() {
        return linkExterno;
    }
    
    public void setLinkExterno(String linkExterno) {
        this.linkExterno = linkExterno;
    }
    
    public String getInstruccionesDescarga() {
        return instruccionesDescarga;
    }
    
    public void setInstruccionesDescarga(String instruccionesDescarga) {
        this.instruccionesDescarga = instruccionesDescarga;
    }
    
    public String[] getAplicaParaTiposCliente() {
        return aplicaParaTiposCliente;
    }
    
    public void setAplicaParaTiposCliente(String[] aplicaParaTiposCliente) {
        this.aplicaParaTiposCliente = aplicaParaTiposCliente;
    }
    
    public String[] getExcluyeTiposCliente() {
        return excluyeTiposCliente;
    }
    
    public void setExcluyeTiposCliente(String[] excluyeTiposCliente) {
        this.excluyeTiposCliente = excluyeTiposCliente;
    }
    
    public Integer getOrdenVisual() {
        return ordenVisual;
    }
    
    public void setOrdenVisual(Integer ordenVisual) {
        this.ordenVisual = ordenVisual;
    }
    
    public Boolean getActivo() {
        return activo;
    }
    
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    // Métodos de utilidad
    public boolean aplicaParaTipoCliente(String tipoCliente) {
        if (aplicaParaTiposCliente != null) {
            for (String tipo : aplicaParaTiposCliente) {
                if (tipo.equals(tipoCliente)) {
                    return true;
                }
            }
        }
        
        if (excluyeTiposCliente != null) {
            for (String tipo : excluyeTiposCliente) {
                if (tipo.equals(tipoCliente)) {
                    return false;
                }
            }
        }
        
        return true; // Si no hay restricciones específicas, aplica para todos
    }
    
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }
} 
