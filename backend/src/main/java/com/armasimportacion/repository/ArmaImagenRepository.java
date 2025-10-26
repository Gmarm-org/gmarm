package com.armasimportacion.repository;

import com.armasimportacion.model.ArmaImagen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestionar imágenes de armas.
 */
@Repository
public interface ArmaImagenRepository extends JpaRepository<ArmaImagen, Long> {
    
    /**
     * Buscar todas las imágenes de un arma ordenadas por orden.
     */
    List<ArmaImagen> findByArmaIdOrderByOrdenAsc(Long armaId);
    
    /**
     * Buscar la imagen principal de un arma.
     */
    @Query("SELECT ai FROM ArmaImagen ai WHERE ai.arma.id = :armaId AND ai.esPrincipal = true")
    Optional<ArmaImagen> findImagenPrincipalByArmaId(@Param("armaId") Long armaId);
    
    /**
     * Contar imágenes de un arma.
     */
    long countByArmaId(Long armaId);
    
    /**
     * Eliminar todas las imágenes de un arma.
     */
    void deleteByArmaId(Long armaId);
}

