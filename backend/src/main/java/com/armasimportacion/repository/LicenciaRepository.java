package com.armasimportacion.repository;

import com.armasimportacion.model.Licencia;
import com.armasimportacion.enums.EstadoLicencia;
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
public interface LicenciaRepository extends JpaRepository<Licencia, Long> {
    
    // Búsquedas básicas
    Optional<Licencia> findByNumeroLicencia(String numeroLicencia);
    List<Licencia> findByEstado(EstadoLicencia estado);
    List<Licencia> findByTipoLicencia(String tipoLicencia);
    
    // Búsquedas por fecha
    List<Licencia> findByFechaVencimientoBefore(LocalDateTime fecha);
    List<Licencia> findByFechaEmisionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Licencias activas
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND (l.fechaVencimiento IS NULL OR l.fechaVencimiento > :fecha)")
    List<Licencia> findLicenciasActivas(@Param("fecha") LocalDateTime fecha);
    
    // Licencias con cupo disponible
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoCivil > 0")
    List<Licencia> findLicenciasConCupoCivilDisponible();
    
    // Búsquedas con filtros
    @Query("SELECT l FROM Licencia l WHERE " +
           "(:numeroLicencia IS NULL OR l.numeroLicencia LIKE %:numeroLicencia%) AND " +
           "(:tipoLicencia IS NULL OR l.tipoLicencia = :tipoLicencia) AND " +
           "(:estado IS NULL OR l.estado = :estado)")
    Page<Licencia> findWithFilters(
            @Param("numeroLicencia") String numeroLicencia,
            @Param("tipoLicencia") String tipoLicencia,
            @Param("estado") EstadoLicencia estado,
            Pageable pageable);
    
    // Verificar existencia
    boolean existsByNumeroLicencia(String numeroLicencia);
    
    // Contar licencias por estado
    @Query("SELECT l.estado, COUNT(l) FROM Licencia l GROUP BY l.estado")
    List<Object[]> countByEstado();
    
    // Licencias próximas a vencer
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.fechaVencimiento BETWEEN :fechaInicio AND :fechaFin")
    List<Licencia> findLicenciasProximasAVencer(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin);
} 