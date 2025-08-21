package com.armasimportacion.repository;

import com.armasimportacion.model.Accesorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccesorioRepository extends JpaRepository<Accesorio, Long> {
    
    // Búsquedas básicas
    Optional<Accesorio> findByCodigo(String codigo);
    List<Accesorio> findByNombreContainingIgnoreCase(String nombre);
    List<Accesorio> findByEstado(Boolean estado);
    
    // Búsquedas con filtros
    @Query("SELECT a FROM Accesorio a WHERE " +
           "(:codigo IS NULL OR a.codigo LIKE %:codigo%) AND " +
           "(:nombre IS NULL OR a.nombre LIKE %:nombre%) AND " +
           "(:estado IS NULL OR a.estado = :estado)")
    List<Accesorio> findWithFilters(
            @Param("codigo") String codigo,
            @Param("nombre") String nombre,
            @Param("estado") Boolean estado);
    
    // Verificar existencia
    boolean existsByCodigo(String codigo);
    
    // Accesorios activos
    List<Accesorio> findByEstadoTrue();
} 
