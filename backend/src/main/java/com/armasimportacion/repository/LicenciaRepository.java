package com.armasimportacion.repository;

import com.armasimportacion.model.Licencia;
import com.armasimportacion.enums.EstadoOcupacionLicencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la entidad Licencia.
 * NOTA: Los cupos se manejan a nivel de Grupo de Importación, no de Licencia.
 */
@Repository
public interface LicenciaRepository extends JpaRepository<Licencia, Long> {

    // Búsquedas básicas
    Optional<Licencia> findByNumero(String numero);
    List<Licencia> findByEstado(Boolean estado); // true = ACTIVA, false = INACTIVA
    List<Licencia> findByEstadoAndEstadoOcupacion(Boolean estado, EstadoOcupacionLicencia estadoOcupacion);

    // Búsquedas por fecha
    List<Licencia> findByFechaVencimientoBefore(LocalDate fecha);
    List<Licencia> findByFechaEmisionBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // Licencias activas
    @Query("SELECT l FROM Licencia l WHERE l.estado = true AND (l.fechaVencimiento IS NULL OR l.fechaVencimiento > :fecha)")
    List<Licencia> findLicenciasActivas(@Param("fecha") LocalDate fecha);

    // NOTA: Los métodos de búsqueda por cupo fueron eliminados
    // Los cupos ahora se manejan a nivel de GrupoImportacion

    // Búsquedas con filtros
    @Query("SELECT l FROM Licencia l WHERE " +
           "(:numero IS NULL OR l.numero LIKE %:numero%) AND " +
           "(:nombre IS NULL OR l.nombre LIKE %:nombre%) AND " +
           "(:estado IS NULL OR l.estado = :estado) AND " +
           "(:ruc IS NULL OR l.ruc LIKE %:ruc%)")
    Page<Licencia> findWithFilters(
            @Param("numero") String numero,
            @Param("nombre") String nombre,
            @Param("estado") Boolean estado,
            @Param("ruc") String ruc,
            Pageable pageable);

    // Verificar existencia
    boolean existsByNumero(String numero);

    // Contar licencias por estado
    @Query("SELECT l.estado, COUNT(l) FROM Licencia l GROUP BY l.estado")
    List<Object[]> countByEstado();

    // Licencias próximas a vencer
    @Query("SELECT l FROM Licencia l WHERE l.estado = true AND l.fechaVencimiento BETWEEN :fechaInicio AND :fechaFin")
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

    // Licencias disponibles (activas y no vencidas)
    @Query("SELECT l FROM Licencia l WHERE l.estado = true AND (l.fechaVencimiento IS NULL OR l.fechaVencimiento > CURRENT_DATE)")
    List<Licencia> findLicenciasDisponibles();

    // Licencias disponibles por estado de ocupación
    @Query("SELECT l FROM Licencia l WHERE l.estadoOcupacion = :estadoOcupacion AND l.estado = true")
    List<Licencia> findByEstadoOcupacionAndEstado(
            @Param("estadoOcupacion") EstadoOcupacionLicencia estadoOcupacion);
}
