package com.armasimportacion.repository;

import com.armasimportacion.model.Licencia;
import com.armasimportacion.enums.EstadoLicencia;
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
public interface LicenciaRepository extends JpaRepository<Licencia, Long> {
    
    // Búsquedas básicas
    Optional<Licencia> findByNumero(String numero);
    List<Licencia> findByEstado(EstadoLicencia estado);
    List<Licencia> findByTipoLicencia(String tipoLicencia);
    
    // Búsquedas por fecha
    List<Licencia> findByFechaVencimientoBefore(LocalDate fecha);
    List<Licencia> findByFechaEmisionBetween(LocalDate fechaInicio, LocalDate fechaFin);
    
    // Licencias activas
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND (l.fechaVencimiento IS NULL OR l.fechaVencimiento > :fecha)")
    List<Licencia> findLicenciasActivas(@Param("fecha") LocalDate fecha);
    
    // Licencias con cupo disponible por tipo
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoCivil > 0")
    List<Licencia> findLicenciasConCupoCivilDisponible();
    
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoMilitar > 0")
    List<Licencia> findLicenciasConCupoMilitarDisponible();
    
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoEmpresa > 0")
    List<Licencia> findLicenciasConCupoEmpresaDisponible();
    
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoDeportista > 0")
    List<Licencia> findLicenciasConCupoDeportistaDisponible();
    
    // Búsquedas con filtros
    @Query("SELECT l FROM Licencia l WHERE " +
           "(:numero IS NULL OR l.numero LIKE %:numero%) AND " +
           "(:nombre IS NULL OR l.nombre LIKE %:nombre%) AND " +
           "(:tipoLicencia IS NULL OR l.tipoLicencia = :tipoLicencia) AND " +
           "(:estado IS NULL OR l.estado = :estado) AND " +
           "(:ruc IS NULL OR l.ruc LIKE %:ruc%)")
    Page<Licencia> findWithFilters(
            @Param("numero") String numero,
            @Param("nombre") String nombre,
            @Param("tipoLicencia") String tipoLicencia,
            @Param("estado") EstadoLicencia estado,
            @Param("ruc") String ruc,
            Pageable pageable);
    
    // Verificar existencia
    boolean existsByNumero(String numero);
    
    // Contar licencias por estado
    @Query("SELECT l.estado, COUNT(l) FROM Licencia l GROUP BY l.estado")
    List<Object[]> countByEstado();
    
    // Licencias próximas a vencer
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.fechaVencimiento BETWEEN :fechaInicio AND :fechaFin")
    List<Licencia> findLicenciasProximasAVencer(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin);
    
    // Búsquedas por RUC
    List<Licencia> findByRuc(String ruc);
    
    // Búsquedas por email
    List<Licencia> findByEmail(String email);
    
    // Licencias vencidas
    @Query("SELECT l FROM Licencia l WHERE l.fechaVencimiento < :fecha")
    List<Licencia> findLicenciasVencidas(@Param("fecha") LocalDate fecha);
    
    // Licencias con cupo disponible total
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.cupoDisponible > 0")
    List<Licencia> findLicenciasConCupoDisponible();
    
    // Estadísticas de cupos
    @Query("SELECT l.tipoLicencia, " +
           "SUM(l.cupoTotal) as total, " +
           "SUM(l.cupoDisponible) as disponible, " +
           "SUM(l.cupoCivil) as civil, " +
           "SUM(l.cupoMilitar) as militar, " +
           "SUM(l.cupoEmpresa) as empresa, " +
           "SUM(l.cupoDeportista) as deportista " +
           "FROM Licencia l WHERE l.estado = 'ACTIVA' GROUP BY l.tipoLicencia")
    List<Object[]> getEstadisticasCupos();
    
    // Licencias por tipo con cupo disponible
    @Query("SELECT l FROM Licencia l WHERE l.estado = 'ACTIVA' AND l.tipoLicencia = :tipo AND " +
           "(l.cupoDisponible > 0 OR l.cupoCivil > 0 OR l.cupoMilitar > 0 OR l.cupoEmpresa > 0 OR l.cupoDeportista > 0)")
    List<Licencia> findLicenciasDisponiblesPorTipo(@Param("tipo") String tipo);
} 