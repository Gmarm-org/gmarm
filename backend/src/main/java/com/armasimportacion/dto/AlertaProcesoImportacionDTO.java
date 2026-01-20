package com.armasimportacion.dto;

import com.armasimportacion.enums.EtapaProcesoImportacion;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AlertaProcesoImportacionDTO {
    private Long grupoImportacionId;
    private String grupoNombre;
    private EtapaProcesoImportacion etapa;
    private String etapaLabel;
    private LocalDate fechaPlanificada;
    private Integer diasRestantes;
}
