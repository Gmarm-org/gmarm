package com.armasimportacion.repository;

import com.armasimportacion.model.TipoIdentificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoIdentificacionRepository extends JpaRepository<TipoIdentificacion, Long> {
    
    Optional<TipoIdentificacion> findByNombre(String nombre);
    
    Optional<TipoIdentificacion> findByCodigo(String codigo);
    
    List<TipoIdentificacion> findByEstado(Boolean estado);
    
    @Query("SELECT t FROM TipoIdentificacion t WHERE t.nombre LIKE %:filtro% OR t.codigo LIKE %:filtro%")
    List<TipoIdentificacion> findByFiltro(@Param("filtro") String filtro);
    
    boolean existsByNombre(String nombre);
    
    boolean existsByCodigo(String codigo);
} 
