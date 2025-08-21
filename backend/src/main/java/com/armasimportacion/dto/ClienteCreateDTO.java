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
public class ClienteCreateDTO {
    
    // Información básica
    private String nombres;
    private String apellidos;
    private String numeroIdentificacion;
    private String tipoIdentificacionCodigo; // "CED" o "RUC" - CÓDIGO del tipo
    private String tipoClienteCodigo; // "CIV", "MIL", "EMP", "DEP" - CÓDIGO del tipo
    private LocalDate fechaNacimiento;
    private String direccion;
    private String provincia;
    private String canton;
    private String email;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    
    // Información de empresa (opcional)
    private String representanteLegal;
    private String ruc;
    private String nombreEmpresa;
    private String direccionFiscal;
    private String telefonoReferencia;
    private String correoEmpresa;
    private String provinciaEmpresa;
    private String cantonEmpresa;
    
    // Información militar (opcional)
    private String estadoMilitar; // "ACTIVO" o "PASIVO"
}
