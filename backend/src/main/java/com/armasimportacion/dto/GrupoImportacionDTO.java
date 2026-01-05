package com.armasimportacion.dto;

import com.armasimportacion.enums.EstadoGrupoImportacion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
    
    // Información de estado de documentos (para Operaciones)
    private Integer documentosCargados;
    private Integer documentosFaltantes;
    private Integer documentosRequeridosCargados;
    private Boolean puedeNotificarPago;
    
    // Información de licencia
    private Long licenciaId;
    private String licenciaNumero;
    private String licenciaNombre;
    
    // Información adicional del grupo
    private String codigo;
    private java.time.LocalDate fechaInicio;
    private java.time.LocalDate fechaFin;
    private Integer cupoTotal;
    private Integer cupoDisponible;
    private String observaciones;
    
    // Nuevos campos
    private String tipoGrupo; // CUPO o JUSTIFICATIVO
    private String tra; // TRA-XXXXXXXXXX
    private List<VendedorDTO> vendedores; // Vendedores asignados
    private List<LimiteCategoriaDTO> limitesCategoria; // Límites por categoría
    private Map<Long, Integer> cuposDisponiblesPorCategoria; // Cupos disponibles por categoría (solo para tipo CUPO)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendedorDTO {
        private Long id;
        private String nombres;
        private String apellidos;
        private String email;
        private Integer limiteArmas; // Límite de armas para este vendedor en el grupo
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LimiteCategoriaDTO {
        private Long categoriaArmaId;
        private String categoriaArmaNombre;
        private String categoriaArmaCodigo;
        private Integer limiteMaximo;
    }
    
    // Métodos de utilidad
    public boolean estaActivo() {
        return estado == EstadoGrupoImportacion.EN_PREPARACION || 
               estado == EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES || 
               estado == EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA || 
               estado == EstadoGrupoImportacion.EN_PROCESO_OPERACIONES ||
               estado == EstadoGrupoImportacion.NOTIFICAR_AGENTE_ADUANERO ||
               estado == EstadoGrupoImportacion.EN_ESPERA_DOCUMENTOS_CLIENTE;
    }
    
    public boolean estaCompletado() {
        return estado == EstadoGrupoImportacion.COMPLETADO;
    }
    
    public boolean tieneClientes() {
        return totalClientes != null && totalClientes > 0;
    }
}
