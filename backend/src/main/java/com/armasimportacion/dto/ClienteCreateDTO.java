package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String fechaNacimiento; // YYYY-MM-DD, se parsea manualmente
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
    private String codigoIssfa; // Código ISSFA para tipos militares
    private String codigoIsspol; // Código ISSPOL para policías
    private String rango; // Rango militar/policial (opcional)
    
    // Estado del cliente (opcional, si no se proporciona se usa ACTIVO por defecto)
    private String estado; // "EN_PROCESO", "ACTIVO", "PENDIENTE_ASIGNACION_CLIENTE", etc.
}
