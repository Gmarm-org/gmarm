package com.armasimportacion.repository;

import com.armasimportacion.model.GrupoImportacionCupo;
import com.armasimportacion.model.GrupoImportacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoImportacionCupoRepository extends JpaRepository<GrupoImportacionCupo, Long> {
    
    // Búsquedas básicas
    List<GrupoImportacionCupo> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    List<GrupoImportacionCupo> findByTipoCliente(String tipoCliente);
    
    // Cupos por grupo
    @Query("SELECT gic FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId")
    List<GrupoImportacionCupo> findByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Cupo específico por grupo y tipo
    @Query("SELECT gic FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId AND gic.tipoCliente = :tipoCliente")
    Optional<GrupoImportacionCupo> findByGrupoImportacionIdAndTipoCliente(
            @Param("grupoId") Long grupoId, 
            @Param("tipoCliente") String tipoCliente);
    
    // Cupos con disponibilidad
    @Query("SELECT gic FROM GrupoImportacionCupo gic WHERE gic.cupoDisponible > 0")
    List<GrupoImportacionCupo> findCuposDisponibles();
    
    // Cupos por grupo con disponibilidad
    @Query("SELECT gic FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId AND gic.cupoDisponible > 0")
    List<GrupoImportacionCupo> findCuposDisponiblesByGrupo(@Param("grupoId") Long grupoId);
    
    // Verificar disponibilidad
    @Query("SELECT COUNT(gic) > 0 FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId AND gic.tipoCliente = :tipoCliente AND gic.cupoDisponible > 0")
    boolean tieneCupoDisponible(@Param("grupoId") Long grupoId, @Param("tipoCliente") String tipoCliente);
    
    // Total de cupos por grupo
    @Query("SELECT SUM(gic.cupoAsignado) FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId")
    Integer getTotalCuposAsignados(@Param("grupoId") Long grupoId);
    
    // Total de cupos utilizados por grupo
    @Query("SELECT SUM(gic.cupoUtilizado) FROM GrupoImportacionCupo gic WHERE gic.grupoImportacion.id = :grupoId")
    Integer getTotalCuposUtilizados(@Param("grupoId") Long grupoId);
} 