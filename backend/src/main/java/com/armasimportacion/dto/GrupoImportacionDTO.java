package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoGrupoImportacion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrupoImportacionDTO {
    
    private Long id;
    private String nombre;
    private String descripcion;
    private EstadoGrupoImportacion estado;
    private LocalDateTime fechaImportacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Información de usuario creador
    private Long usuarioCreadorId;
    private String usuarioCreadorNombre;
    
    // Información de tipo de importación
    private Long tipoImportacionId;
    private String tipoImportacionNombre;
    
    // Resúmenes de entidades relacionadas (solo IDs y contadores)
    private List<Long> clientesIds;
    private List<Long> cuposIds;
    private List<Long> armasFisicasIds;
    private List<Long> accesoriosFisicosIds;
    private List<Long> asignacionesArmaIds;
    private List<Long> asignacionesAccesorioIds;
    private List<Long> documentosIds;
    private List<Long> documentosGeneradosIds;
    
    // Contadores para estadísticas
    private Integer totalClientes;
    private Integer totalCupos;
    private Integer totalArmasFisicas;
    private Integer totalAccesoriosFisicos;
    private Integer totalAsignacionesArma;
    private Integer totalAsignacionesAccesorio;
    private Integer totalDocumentos;
    private Integer totalDocumentosGenerados;
    
    // Métodos de utilidad
    public boolean estaActivo() {
        return estado == EstadoGrupoImportacion.EN_PREPARACION || 
               estado == EstadoGrupoImportacion.PENDIENTE_APROBACION || 
               estado == EstadoGrupoImportacion.APROBADO || 
               estado == EstadoGrupoImportacion.EN_PROCESO;
    }
    
    public boolean estaCompletado() {
        return estado == EstadoGrupoImportacion.COMPLETADO;
    }
    
    public boolean tieneClientes() {
        return totalClientes != null && totalClientes > 0;
    }
}
