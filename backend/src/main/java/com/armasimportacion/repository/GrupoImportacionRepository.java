package com.armasimportacion.repository;

import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoImportacionRepository extends JpaRepository<GrupoImportacion, Long> {
    
    // Búsquedas básicas
    Optional<GrupoImportacion> findByCodigo(String codigo);
    List<GrupoImportacion> findByEstado(EstadoGrupoImportacion estado);
    List<GrupoImportacion> findByUsuarioCreador(Usuario usuarioCreador);
    
    // Búsquedas por fecha
    List<GrupoImportacion> findByFechaEstimadaLlegadaBetween(LocalDate fechaInicio, LocalDate fechaFin);
    
    // Grupos activos
    @Query("SELECT gi FROM GrupoImportacion gi WHERE gi.estado IN ('PENDIENTE', 'EN_PROCESO', 'EN_ADUANA')")
    List<GrupoImportacion> findGruposActivos();
    
    // Grupos completos
    @Query("SELECT gi FROM GrupoImportacion gi WHERE gi.estado = 'COMPLETO'")
    List<GrupoImportacion> findGruposCompletos();
    
    // Grupos incompletos
    @Query("SELECT gi FROM GrupoImportacion gi WHERE gi.estado IN ('BORRADOR', 'PENDIENTE', 'EN_PROCESO', 'EN_ADUANA', 'EN_REVISION')")
    List<GrupoImportacion> findGruposIncompletos();
    
    // Verificar existencia
    boolean existsByCodigo(String codigo);
    
    // Búsquedas con filtros
    @Query("SELECT gi FROM GrupoImportacion gi WHERE " +
           "(:codigo IS NULL OR gi.codigo LIKE %:codigo%) AND " +
           "(:estado IS NULL OR gi.estado = :estado) AND " +
           "(:usuarioCreadorId IS NULL OR gi.usuarioCreador.id = :usuarioCreadorId) AND " +
           "(:fechaInicio IS NULL OR gi.fechaCreacion >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR gi.fechaCreacion <= :fechaFin)")
    Page<GrupoImportacion> findWithFilters(
            @Param("codigo") String codigo,
            @Param("estado") EstadoGrupoImportacion estado,
            @Param("usuarioCreadorId") Long usuarioCreadorId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    // Contar grupos por estado
    @Query("SELECT gi.estado, COUNT(gi) FROM GrupoImportacion gi GROUP BY gi.estado")
    List<Object[]> countByEstado();
    
    // Grupos próximos a llegar
    @Query("SELECT gi FROM GrupoImportacion gi WHERE gi.estado IN ('EN_PROCESO', 'EN_ADUANA') AND gi.fechaEstimadaLlegada BETWEEN :fechaInicio AND :fechaFin")
    List<GrupoImportacion> findGruposProximosALlegar(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin);
    
    // Generar código único
    @Query("SELECT COUNT(gi) FROM GrupoImportacion gi WHERE gi.codigo LIKE :prefijo%")
    Long countByCodigoPrefijo(@Param("prefijo") String prefijo);
    
    // Búsquedas por TRA
    Optional<GrupoImportacion> findByTra(String tra);
    boolean existsByTra(String tra);
} 
