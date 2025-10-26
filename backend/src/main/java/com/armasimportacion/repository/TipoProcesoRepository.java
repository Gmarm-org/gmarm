package com.armasimportacion.repository;

import com.armasimportacion.model.TipoProceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoProcesoRepository extends JpaRepository<TipoProceso, Long> {
    
    Optional<TipoProceso> findByNombre(String nombre);
    
    Optional<TipoProceso> findByCodigo(String codigo);
    
    List<TipoProceso> findByEstado(Boolean estado);
    
    @Query("SELECT t FROM TipoProceso t WHERE t.nombre LIKE %:filtro% OR t.codigo LIKE %:filtro%")
    List<TipoProceso> findByFiltro(@Param("filtro") String filtro);
    
    boolean existsByNombre(String nombre);
    
    boolean existsByCodigo(String codigo);
} 
