package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipoClienteDTO {
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;
    private Boolean estado;
    
    // Banderas dinámicas para clasificación
    private Boolean esMilitar;
    private Boolean esPolicia;
    private Boolean esEmpresa;
    private Boolean esDeportista;
    private Boolean esCivil;
    private Boolean requiereIssfa;
    
    // Relación con tipo de proceso
    private Long tipoProcesoId;
    
    private LocalDateTime fechaCreacion;
}
