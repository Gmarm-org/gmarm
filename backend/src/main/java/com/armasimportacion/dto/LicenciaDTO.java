package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenciaDTO {
    
    private Long id;
    private String numero;
    private String nombre;
    private String ruc;
    private String cuentaBancaria;
    private String nombreBanco;
    private String tipoCuenta;
    private String cedulaCuenta;
    private String email;
    private String telefono;
    private String descripcion;
    private String tipoLicencia;
    private Integer cupoTotal;
    private Integer cupoDisponible;
    private Integer cupoCivil;
    private Integer cupoMilitar;
    private Integer cupoEmpresa;
    private Integer cupoDeportista;
    private LocalDate fechaVencimiento;
    private LocalDate fechaEmision;
}
