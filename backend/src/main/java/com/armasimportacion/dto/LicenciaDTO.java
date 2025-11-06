package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoOcupacionLicencia;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // Ignora campos extra que el frontend pueda enviar
public class LicenciaDTO {
    
    private Long id;
    private String numero;
    private String nombre;
    private String ruc;
    
    @JsonProperty("cuenta_bancaria")
    private String cuentaBancaria;
    
    @JsonProperty("nombre_banco")
    private String nombreBanco;
    
    @JsonProperty("tipo_cuenta")
    private String tipoCuenta;
    
    @JsonProperty("cedula_cuenta")
    private String cedulaCuenta;
    
    private String email;
    private String telefono;
    private String descripcion;
    
    @JsonProperty("tipo_licencia")
    private String tipoLicencia;
    
    private Boolean estado; // true = ACTIVA, false = INACTIVA
    
    @JsonProperty("estado_ocupacion")
    private EstadoOcupacionLicencia estadoOcupacion; // DISPONIBLE, BLOQUEADA
    
    private String observaciones;
    
    @JsonProperty("cupo_total")
    private Integer cupoTotal;
    
    @JsonProperty("cupo_disponible")
    private Integer cupoDisponible;
    
    @JsonProperty("cupo_civil")
    private Integer cupoCivil;
    
    @JsonProperty("cupo_militar")
    private Integer cupoMilitar;
    
    @JsonProperty("cupo_empresa")
    private Integer cupoEmpresa;
    
    @JsonProperty("cupo_deportista")
    private Integer cupoDeportista;
    
    @JsonProperty("fecha_vencimiento")
    private LocalDate fechaVencimiento;
    
    @JsonProperty("fecha_emision")
    private LocalDate fechaEmision;
    
    @JsonProperty("fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @JsonProperty("fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
}
