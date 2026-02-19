package com.armasimportacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

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
    
    // Cupo total se calcula automáticamente o se provee manualmente
    private Integer cupoTotal;
    
    // Código se genera automáticamente, no debe ser visible
    private String codigo;
    
    private String observaciones;
    
    // Nuevos campos
    private String tipoGrupo; // CUPO o JUSTIFICATIVO
    private String tra; // TRA-XXXXXXXXXX
    private List<VendedorLimiteDTO> vendedores; // Vendedores con límite de armas
    private List<LimiteCategoriaDTO> limitesCategoria; // Límites por categoría (solo para tipo CUPO)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendedorLimiteDTO {
        private Long vendedorId;
        private Integer limiteArmas; // Límite de armas para este vendedor
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LimiteCategoriaDTO {
        private Long categoriaArmaId;
        private Integer limiteMaximo;
    }
}

