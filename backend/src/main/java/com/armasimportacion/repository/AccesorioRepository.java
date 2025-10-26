package com.armasimportacion.repository;

import com.armasimportacion.model.Accesorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para los accesorios disponibles
 */
@Repository
public interface AccesorioRepository extends JpaRepository<Accesorio, Long> {

    // Buscar por nombre
    List<Accesorio> findByNombreContainingIgnoreCase(String nombre);
    
    // Buscar por código
    Optional<Accesorio> findByCodigo(String codigo);
    
    // Buscar por categoría
    List<Accesorio> findByCategoria(String categoria);
    
    // Buscar por estado
    List<Accesorio> findByEstado(Boolean estado);
    
    // Buscar solo activos
    List<Accesorio> findByEstadoTrue();
    
    // Buscar por rango de precio
    List<Accesorio> findByPrecioReferenciaBetween(BigDecimal precioMin, BigDecimal precioMax);
    
    // Buscar por precio mayor que
    List<Accesorio> findByPrecioReferenciaGreaterThan(BigDecimal precio);
    
    // Buscar por precio menor que
    List<Accesorio> findByPrecioReferenciaLessThan(BigDecimal precio);
    
    // Buscar por nombre y categoría
    List<Accesorio> findByNombreContainingIgnoreCaseAndCategoria(String nombre, String categoria);
    
    // Verificar si existe por código
    boolean existsByCodigo(String codigo);
    
    // Contar por categoría
    long countByCategoria(String categoria);
    
    // Contar por estado
    long countByEstado(Boolean estado);
    
    // Buscar accesorios con precio
    @Query("SELECT a FROM Accesorio a WHERE a.precioReferencia IS NOT NULL AND a.precioReferencia > 0")
    List<Accesorio> findAccesoriosConPrecio();
    
    // Buscar accesorios sin precio
    @Query("SELECT a FROM Accesorio a WHERE a.precioReferencia IS NULL OR a.precioReferencia = 0")
    List<Accesorio> findAccesoriosSinPrecio();
    
    // Buscar por descripción
    @Query("SELECT a FROM Accesorio a WHERE LOWER(a.descripcion) LIKE LOWER(CONCAT('%', :descripcion, '%'))")
    List<Accesorio> findByDescripcionContainingIgnoreCase(@Param("descripcion") String descripcion);
    
    // Buscar accesorios más caros
    @Query("SELECT a FROM Accesorio a WHERE a.precioReferencia IS NOT NULL ORDER BY a.precioReferencia DESC")
    List<Accesorio> findAccesoriosOrdenadosPorPrecioDesc();
    
    // Buscar accesorios más baratos
    @Query("SELECT a FROM Accesorio a WHERE a.precioReferencia IS NOT NULL ORDER BY a.precioReferencia ASC")
    List<Accesorio> findAccesoriosOrdenadosPorPrecioAsc();
} 
