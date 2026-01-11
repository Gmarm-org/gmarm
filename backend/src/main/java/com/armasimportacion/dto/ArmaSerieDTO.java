package com.armasimportacion.dto;

import com.armasimportacion.model.ArmaSerie;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para transferencia de datos de números de serie de armas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArmaSerieDTO {

    private Long id;
    private String numeroSerie;
    
    // Información del arma
    private Long armaId;
    private String armaNombre;
    private String armaCodigo;
    private String armaCalibre;
    
    private String estado;
    private String estadoDescripcion;
    
    private LocalDateTime fechaCarga;
    private LocalDateTime fechaAsignacion;
    
    // Información del cliente si está asignado
    private Long clienteArmaId;
    private String clienteNombre;
    private String clienteApellidos;
    private String clienteIdentificacion;
    
    // Información del usuario que asignó
    private Long usuarioAsignadorId;
    private String usuarioAsignadorNombre;
    
    private String lote;
    private String observaciones;
    
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    /**
     * Constructor desde la entidad
     */
    public static ArmaSerieDTO fromEntity(ArmaSerie entity) {
        if (entity == null) {
            return null;
        }

        ArmaSerieDTO dto = ArmaSerieDTO.builder()
                .id(entity.getId())
                .numeroSerie(entity.getNumeroSerie())
                .estado(entity.getEstado() != null ? entity.getEstado().name() : null)
                .estadoDescripcion(entity.getEstado() != null ? entity.getEstado().getDescripcion() : null)
                .fechaCarga(entity.getFechaCarga())
                .fechaAsignacion(entity.getFechaAsignacion())
                .lote(entity.getLote())
                .observaciones(entity.getObservaciones())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();

        // Información del arma
        if (entity.getArma() != null) {
            dto.setArmaId(entity.getArma().getId());
            dto.setArmaNombre(entity.getArma().getModelo()); // Cambiado de nombre a modelo
            dto.setArmaCodigo(entity.getArma().getCodigo());
            dto.setArmaCalibre(entity.getArma().getCalibre());
        }

        // Información del cliente si está asignado
        if (entity.getClienteArma() != null) {
            dto.setClienteArmaId(entity.getClienteArma().getId());
            if (entity.getClienteArma().getCliente() != null) {
                dto.setClienteNombre(entity.getClienteArma().getCliente().getNombres());
                dto.setClienteApellidos(entity.getClienteArma().getCliente().getApellidos());
                dto.setClienteIdentificacion(entity.getClienteArma().getCliente().getNumeroIdentificacion());
            }
        }

        // Información del usuario que asignó
        if (entity.getUsuarioAsignador() != null) {
            dto.setUsuarioAsignadorId(entity.getUsuarioAsignador().getId());
            dto.setUsuarioAsignadorNombre(
                    entity.getUsuarioAsignador().getNombres() + " " + entity.getUsuarioAsignador().getApellidos()
            );
        }

        return dto;
    }
}

