package com.armasimportacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrupoImportacionCreateDTO {
    
    @NotBlank(message = "El nombre del grupo es obligatorio")
    private String nombre;
    
    private String descripcion;
    
    @NotNull(message = "La licencia es obligatoria")
    private Long licenciaId;
    
    // Tipo de proceso es opcional - los grupos pueden tener todos los tipos de clientes
    private Long tipoProcesoId;
    
    // Fecha de inicio se genera automáticamente al crear el grupo
    private LocalDate fechaInicio;
    
    // Fecha fin se establece automáticamente al finalizar el proceso
    private LocalDate fechaFin;
    
    // Cupos se calculan automáticamente desde la licencia
    private Integer cupoTotal;
    private Integer cupoDisponible;
    
    // Código se genera automáticamente, no debe ser visible
    private String codigo;
    
    private String observaciones;
}

