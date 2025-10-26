package com.armasimportacion.repository;

import com.armasimportacion.model.CategoriaArma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaArmaRepository extends JpaRepository<CategoriaArma, Long> {
    
    // Búsquedas básicas
    Optional<CategoriaArma> findByCodigo(String codigo);
    Optional<CategoriaArma> findByNombre(String nombre);
    List<CategoriaArma> findByEstado(Boolean estado);
    
    // Búsquedas con filtros
    @Query("SELECT c FROM CategoriaArma c WHERE " +
           "(:codigo IS NULL OR c.codigo LIKE %:codigo%) AND " +
           "(:nombre IS NULL OR c.nombre LIKE %:nombre%) AND " +
           "(:estado IS NULL OR c.estado = :estado)")
    List<CategoriaArma> findWithFilters(
            @Param("codigo") String codigo,
            @Param("nombre") String nombre,
            @Param("estado") Boolean estado);
    
    // Verificar existencia
    boolean existsByCodigo(String codigo);
    boolean existsByNombre(String nombre);
    
    // Categorías activas
    List<CategoriaArma> findByEstadoTrue();
} 
