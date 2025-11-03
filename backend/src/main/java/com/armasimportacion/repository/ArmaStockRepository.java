package com.armasimportacion.repository;

import com.armasimportacion.model.ArmaStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de stock de armas
 */
@Repository
public interface ArmaStockRepository extends JpaRepository<ArmaStock, Long> {

    /**
     * Buscar stock por ID de arma
     */
    Optional<ArmaStock> findByArmaId(Long armaId);

    /**
     * Buscar stock activo por ID de arma
     */
    Optional<ArmaStock> findByArmaIdAndActivoTrue(Long armaId);

    /**
     * Obtener todas las armas con stock disponible
     */
    @Query("SELECT ast FROM ArmaStock ast WHERE ast.cantidadDisponible > 0 AND ast.activo = true")
    List<ArmaStock> findArmasConStockDisponible();

    /**
     * Obtener armas de expoferia con stock disponible
     */
    @Query("SELECT ast FROM ArmaStock ast " +
           "JOIN ast.arma a " +
           "WHERE ast.cantidadDisponible > 0 " +
           "AND ast.activo = true " +
           "AND a.expoferia = :esExpoferia " +
           "AND a.estado = true")
    List<ArmaStock> findArmasExpoferiaConStock(@Param("esExpoferia") Boolean esExpoferia);

    /**
     * Verificar si una arma tiene stock suficiente
     */
    @Query("SELECT CASE WHEN ast.cantidadDisponible >= :cantidad THEN true ELSE false END " +
           "FROM ArmaStock ast " +
           "WHERE ast.arma.id = :armaId " +
           "AND ast.activo = true")
    Boolean tieneStockSuficiente(@Param("armaId") Long armaId, @Param("cantidad") Integer cantidad);

    /**
     * Obtener stock disponible de una arma
     */
    @Query("SELECT ast.cantidadDisponible FROM ArmaStock ast " +
           "WHERE ast.arma.id = :armaId " +
           "AND ast.activo = true")
    Optional<Integer> getStockDisponible(@Param("armaId") Long armaId);

    /**
     * Obtener todo el stock activo (para panel de Jefe de Ventas)
     */
    @Query("SELECT ast FROM ArmaStock ast JOIN FETCH ast.arma a WHERE ast.activo = true ORDER BY a.nombre")
    List<ArmaStock> findByActivoTrue();
}
