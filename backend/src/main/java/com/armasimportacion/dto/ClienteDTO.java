package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    
    private Long id;
    private String numeroIdentificacion;
    private String nombres;
    private String apellidos;
    private LocalDate fechaNacimiento;
    private String direccion;
    private String provincia;
    private String canton;
    private String email;
    private String telefonoPrincipal;
    private String telefonoSecundario;
    
    // Información de representante legal (para empresas)
    private String representanteLegal;
    
    // Información de empresa (solo para tipo empresa)
    private String ruc;
    private String nombreEmpresa;
    private String direccionFiscal;
    private String telefonoReferencia;
    private String correoEmpresa;
    private String provinciaEmpresa;
    private String cantonEmpresa;
    
    // Información militar (solo para uniformados)
    private EstadoMilitar estadoMilitar;
    
    // Auditoría
    private Long usuarioCreadorId;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private EstadoCliente estado;
    
    // Campos para proceso de aprobación del jefe de ventas
    private Boolean procesoCompletado;
    private Boolean aprobadoPorJefeVentas;
    private LocalDateTime fechaAprobacion;
    private String motivoRechazo;
    private LocalDateTime fechaRechazo;
    
    // Información de catálogos (solo IDs y nombres)
    private Long tipoIdentificacionId;
    private String tipoIdentificacionNombre;
    private Long tipoClienteId;
    private String tipoClienteNombre;
    
    // Respuestas del cliente
    private List<RespuestaClienteDTO> respuestas;
    
    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }
    
    public boolean esEmpresa() {
        return tipoClienteNombre != null && "EMPRESA".equals(tipoClienteNombre);
    }
    
    public boolean esUniformado() {
        return tipoClienteNombre != null && "MILITAR".equals(tipoClienteNombre);
    }
    
    public boolean esCivil() {
        return tipoClienteNombre != null && "CIVIL".equals(tipoClienteNombre);
    }
    
    public boolean esDeportista() {
        return tipoClienteNombre != null && "DEPORTISTA".equals(tipoClienteNombre);
    }
    
    public boolean tieneEdadMinima() {
        if (fechaNacimiento == null) return false;
        LocalDate fechaMinima = LocalDate.now().minusYears(25);
        return fechaNacimiento.isBefore(fechaMinima);
    }
    
    public int getEdad() {
        if (fechaNacimiento == null) return 0;
        LocalDate fechaActual = LocalDate.now();
        int edad = fechaActual.getYear() - fechaNacimiento.getYear();
        if (fechaActual.getMonthValue() < fechaNacimiento.getMonthValue() || 
            (fechaActual.getMonthValue() == fechaNacimiento.getMonthValue() && 
             fechaActual.getDayOfMonth() < fechaNacimiento.getDayOfMonth())) {
            edad--;
        }
        return edad;
    }
    
    public String getMensajeErrorEdad() {
        if (fechaNacimiento == null) return "Fecha de nacimiento no especificada";
        
        int edad = getEdad();
        if (edad >= 25) return null;
        
        int añosFaltantes = 25 - edad;
        if (añosFaltantes == 1) {
            return "El cliente debe tener al menos 25 años para comprar armas. Le falta 1 año.";
        } else {
            return "El cliente debe tener al menos 25 años para comprar armas. Le faltan " + añosFaltantes + " años.";
        }
    }
    
    public String getIdentificacionCompleta() {
        return tipoIdentificacionNombre + ": " + numeroIdentificacion;
    }
    
    public boolean esActivo() {
        return estado == EstadoCliente.ACTIVO;
    }
}
