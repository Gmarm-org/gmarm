package com.armasimportacion.repository;

import com.armasimportacion.enums.EtapaProcesoImportacion;
import com.armasimportacion.model.GrupoImportacionProceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoImportacionProcesoRepository extends JpaRepository<GrupoImportacionProceso, Long> {

    List<GrupoImportacionProceso> findByGrupoImportacionId(Long grupoImportacionId);

    Optional<GrupoImportacionProceso> findByGrupoImportacionIdAndEtapa(Long grupoImportacionId, EtapaProcesoImportacion etapa);

    @Query("SELECT p FROM GrupoImportacionProceso p " +
           "WHERE p.fechaPlanificada IS NOT NULL " +
           "AND p.fechaPlanificada <= :fechaLimite " +
           "AND p.completado = false")
    List<GrupoImportacionProceso> findProcesosPendientesHasta(@Param("fechaLimite") LocalDate fechaLimite);
}
