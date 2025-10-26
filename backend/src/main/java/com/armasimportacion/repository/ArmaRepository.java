package com.armasimportacion.repository;

import com.armasimportacion.model.Arma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArmaRepository extends JpaRepository<Arma, Long> {
    
    // Buscar por estado con JOIN FETCH para evitar problemas de lazy loading
    @Query("SELECT DISTINCT a FROM Arma a LEFT JOIN FETCH a.categoria WHERE a.estado = :estado ORDER BY a.categoria.nombre, a.nombre")
    List<Arma> findByEstado(@Param("estado") Boolean estado);
    
    // Buscar por categoría
    List<Arma> findByCategoriaId(Long categoriaId);
    
    // Buscar por código
    Optional<Arma> findByCodigo(String codigo);
    
    // Buscar por nombre
    Optional<Arma> findByNombre(String nombre);
    
    // Buscar armas disponibles por categoría
    @Query("SELECT a FROM Arma a WHERE a.categoria.id = :categoriaId AND a.estado = true")
    List<Arma> findDisponiblesByCategoria(@Param("categoriaId") Long categoriaId);
    
    // Buscar todas las armas activas con categoría
    @Query("SELECT a FROM Arma a WHERE a.estado = true ORDER BY a.categoria.nombre, a.nombre")
    List<Arma> findAllActiveWithCategoria();
}
