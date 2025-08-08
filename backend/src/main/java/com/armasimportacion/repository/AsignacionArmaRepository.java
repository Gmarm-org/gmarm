package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoAsignacion;
import com.armasimportacion.model.AsignacionArma;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AsignacionArmaRepository extends JpaRepository<AsignacionArma, Long> {

    // Búsquedas básicas por cliente
    List<AsignacionArma> findByClienteId(Long clienteId);
    
    // Búsquedas por usuario asignador
    List<AsignacionArma> findByUsuarioAsignadorId(Long usuarioId);
    
    // Búsquedas por estado
    List<AsignacionArma> findByEstado(EstadoAsignacion estado);
    
    // Búsquedas por grupo de importación
    List<AsignacionArma> findByGrupoImportacionId(Long grupoImportacionId);
    
    // Búsquedas por modelo de arma
    List<AsignacionArma> findByModeloArmaId(Long modeloArmaId);
    
    // Búsquedas combinadas
    List<AsignacionArma> findByClienteIdAndEstado(Long clienteId, EstadoAsignacion estado);
    List<AsignacionArma> findByGrupoImportacionIdAndEstado(Long grupoImportacionId, EstadoAsignacion estado);
    
    // Búsquedas por fechas
    List<AsignacionArma> findByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<AsignacionArma> findByFechaAsignacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Búsquedas con filtros avanzados
    @Query("SELECT aa FROM AsignacionArma aa WHERE " +
           "(:clienteId IS NULL OR aa.cliente.id = :clienteId) AND " +
           "(:grupoImportacionId IS NULL OR aa.grupoImportacion.id = :grupoImportacionId) AND " +
           "(:modeloArmaId IS NULL OR aa.modeloArma.id = :modeloArmaId) AND " +
           "(:estado IS NULL OR aa.estado = :estado) AND " +
           "(:usuarioAsignadorId IS NULL OR aa.usuarioAsignador.id = :usuarioAsignadorId)")
    Page<AsignacionArma> findByFiltros(@Param("clienteId") Long clienteId,
                                       @Param("grupoImportacionId") Long grupoImportacionId,
                                       @Param("modeloArmaId") Long modeloArmaId,
                                       @Param("estado") EstadoAsignacion estado,
                                       @Param("usuarioAsignadorId") Long usuarioAsignadorId,
                                       Pageable pageable);
    
    // Verificaciones
    boolean existsByClienteIdAndModeloArmaIdAndEstado(Long clienteId, Long modeloArmaId, EstadoAsignacion estado);
    
    // Estadísticas
    @Query("SELECT COUNT(aa) FROM AsignacionArma aa WHERE aa.estado = :estado")
    Long countByEstado(@Param("estado") EstadoAsignacion estado);
    
    @Query("SELECT aa.estado, COUNT(aa) FROM AsignacionArma aa GROUP BY aa.estado")
    List<Object[]> countByEstadoGrouped();
    
    @Query("SELECT COUNT(aa) FROM AsignacionArma aa WHERE aa.cliente.id = :clienteId")
    Long countByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT COUNT(aa) FROM AsignacionArma aa WHERE aa.grupoImportacion.id = :grupoImportacionId")
    Long countByGrupoImportacionId(@Param("grupoImportacionId") Long grupoImportacionId);
    
    // Búsquedas para reportes
    @Query("SELECT aa FROM AsignacionArma aa WHERE aa.fechaCreacion >= :fechaDesde ORDER BY aa.fechaCreacion DESC")
    List<AsignacionArma> findRecentAssignments(@Param("fechaDesde") LocalDateTime fechaDesde);
    
    @Query("SELECT aa FROM AsignacionArma aa WHERE aa.estado = :estado AND aa.fechaCreacion < :fechaLimite")
    List<AsignacionArma> findExpiredReservations(@Param("estado") EstadoAsignacion estado, @Param("fechaLimite") LocalDateTime fechaLimite);
}
