package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrupoImportacionResumenDTO {
    private Long grupoId;
    private String grupoNombre;
    private String grupoCodigo;
    private Integer clientesCiviles;
    private Integer clientesUniformados;
    private Integer clientesEmpresas;
    private Integer clientesDeportistas;
    private Integer totalClientes;
    private String fechaUltimaActualizacion;
    private String estado;
    
    // Información de cupos civiles (el más crítico)
    private Integer cupoCivilTotal; // Total de cupo civil (25)
    private Integer cupoCivilDisponible; // Cupo civil disponible (25 - clientesCiviles)
    private Integer cupoCivilRestante; // Cuántos cupos faltan (igual a cupoCivilDisponible, pero más claro)
    
    // Información de series
    private Integer totalArmasSolicitadas; // Total de armas en el pedido
    private Integer seriesCargadas; // Series ya cargadas al grupo
    private Integer seriesPendientes; // Armas que aún necesitan series (totalArmas - seriesCargadas)
}

