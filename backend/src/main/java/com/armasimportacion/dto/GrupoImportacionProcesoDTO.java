package com.armasimportacion.dto;

import com.armasimportacion.enums.EtapaProcesoImportacion;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class GrupoImportacionProcesoDTO {
    private Long id;
    private Long grupoImportacionId;
    private EtapaProcesoImportacion etapa;
    private String etapaLabel;
    private LocalDate fechaPlanificada;
    private Boolean completado;
    private LocalDateTime fechaCompletado;
    private Boolean enAlerta;
    private Integer diasRestantes;
}
