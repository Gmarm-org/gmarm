package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoAccesorioFisico;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccesorioFisicoDTO {
    
    private Long id;
    private String numeroSerie;
    private Long accesorioId;
    private EstadoAccesorioFisico estado;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información de grupo de importación
    private Long grupoImportacionId;
    private String grupoImportacionNombre;
    
    // Información de cliente (solo si está asignado)
    private Long clienteId;
    private String clienteNombreCompleto;
    private String clienteNumeroIdentificacion;
    
    // Información de usuario asignador
    private Long usuarioAsignadorId;
    private String usuarioAsignadorNombre;
    
    // Métodos de utilidad
    public boolean estaAsignado() {
        return clienteId != null && estado == EstadoAccesorioFisico.ASIGNADO;
    }
    
    public boolean estaDisponible() {
        return clienteId == null && estado == EstadoAccesorioFisico.DISPONIBLE;
    }
}
