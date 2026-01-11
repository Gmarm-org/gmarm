package com.armasimportacion.repository;

import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.ArmaSerie.EstadoSerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de números de serie de armas
 */
@Repository
public interface ArmaSerieRepository extends JpaRepository<ArmaSerie, Long> {

    /**
     * Busca un número de serie específico
     */
    Optional<ArmaSerie> findByNumeroSerie(String numeroSerie);

    /**
     * Verifica si existe un número de serie
     */
    boolean existsByNumeroSerie(String numeroSerie);

    /**
     * Encuentra todas las series de un arma específica
     */
    List<ArmaSerie> findByArmaId(Long armaId);

    /**
     * Encuentra todas las series de un arma en un estado específico
     */
    List<ArmaSerie> findByArmaIdAndEstado(Long armaId, EstadoSerie estado);

    /**
     * Busca una serie por número de serie y arma
     */
    Optional<ArmaSerie> findByNumeroSerieAndArmaId(String numeroSerie, Long armaId);

    /**
     * Encuentra todas las series disponibles de un arma
     */
    @Query("SELECT s FROM ArmaSerie s WHERE s.arma.id = :armaId AND s.estado = 'DISPONIBLE'")
    List<ArmaSerie> findSeriesDisponiblesByArmaId(@Param("armaId") Long armaId);

    /**
     * Encuentra todas las series disponibles de un arma en un grupo de importación específico
     */
    @Query("SELECT s FROM ArmaSerie s WHERE s.arma.id = :armaId AND s.estado = 'DISPONIBLE' AND s.grupoImportacion.id = :grupoImportacionId")
    List<ArmaSerie> findSeriesDisponiblesByArmaIdAndGrupoImportacionId(
            @Param("armaId") Long armaId, 
            @Param("grupoImportacionId") Long grupoImportacionId);

    /**
     * Cuenta cuántas series disponibles hay de un arma
     */
    @Query("SELECT COUNT(s) FROM ArmaSerie s WHERE s.arma.id = :armaId AND s.estado = 'DISPONIBLE'")
    Long countSeriesDisponiblesByArmaId(@Param("armaId") Long armaId);

    /**
     * Encuentra todas las series por estado
     */
    List<ArmaSerie> findByEstado(EstadoSerie estado);

    /**
     * Encuentra todas las series de un lote
     */
    List<ArmaSerie> findByLote(String lote);

    /**
     * Encuentra todas las series asignadas a un cliente_arma
     */
    List<ArmaSerie> findByClienteArmaId(Long clienteArmaId);

    /**
     * Encuentra la serie asignada a un cliente_arma específico
     */
    Optional<ArmaSerie> findByClienteArmaIdAndEstado(Long clienteArmaId, EstadoSerie estado);

    /**
     * Obtiene estadísticas de series por arma
     */
    @Query("SELECT s.arma.id, s.arma.modelo, COUNT(s), " +
           "SUM(CASE WHEN s.estado = 'DISPONIBLE' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN s.estado = 'ASIGNADO' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN s.estado = 'VENDIDO' THEN 1 ELSE 0 END) " +
           "FROM ArmaSerie s GROUP BY s.arma.id, s.arma.modelo")
    List<Object[]> getEstadisticasPorArma();

    /**
     * Busca series por múltiples números de serie (útil para validación en lote)
     */
    @Query("SELECT s.numeroSerie FROM ArmaSerie s WHERE s.numeroSerie IN :numerosSerie")
    List<String> findNumeroSerieExistentes(@Param("numerosSerie") List<String> numerosSerie);
}

