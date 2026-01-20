package com.armasimportacion.dto;

import com.armasimportacion.enums.EtapaProcesoImportacion;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GrupoImportacionProcesoUpdateDTO {
    private EtapaProcesoImportacion etapa;
    private LocalDate fechaPlanificada;
    private Boolean completado;
}
