package com.armasimportacion.repository;

import com.armasimportacion.model.ModeloArma;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModeloArmaRepository extends JpaRepository<ModeloArma, Long> {

    // Búsquedas básicas
    Optional<ModeloArma> findByCodigo(String codigo);
    List<ModeloArma> findByEstado(String estado);
    List<ModeloArma> findByCategoriaId(Long categoriaId);

    // Búsquedas por calibre
    List<ModeloArma> findByCalibre(String calibre);
    List<ModeloArma> findByCalibreAndEstado(String calibre, String estado);

    // Búsquedas por precio
    List<ModeloArma> findByPrecioReferenciaBetween(BigDecimal precioMin, BigDecimal precioMax);
    List<ModeloArma> findByPrecioReferenciaLessThanEqual(BigDecimal precioMax);

    // Búsquedas con filtros
    @Query("SELECT ma FROM ModeloArma ma WHERE " +
           "(:codigo IS NULL OR ma.codigo LIKE %:codigo%) AND " +
           "(:nombre IS NULL OR ma.nombre LIKE %:nombre%) AND " +
           "(:calibre IS NULL OR ma.calibre = :calibre) AND " +
           "(:categoriaId IS NULL OR ma.categoriaId = :categoriaId) AND " +
           "(:estado IS NULL OR ma.estado = :estado)")
    Page<ModeloArma> findByFiltros(@Param("codigo") String codigo,
                                   @Param("nombre") String nombre,
                                   @Param("calibre") String calibre,
                                   @Param("categoriaId") Long categoriaId,
                                   @Param("estado") String estado,
                                   Pageable pageable);

    // Búsquedas por disponibilidad
    @Query("SELECT ma FROM ModeloArma ma WHERE ma.estado = 'DISPONIBLE'")
    List<ModeloArma> findDisponibles();

    // Verificaciones
    boolean existsByCodigo(String codigo);
    boolean existsByCodigoAndIdNot(String codigo, Long id);

    // Estadísticas
    @Query("SELECT COUNT(ma) FROM ModeloArma ma WHERE ma.estado = :estado")
    Long countByEstado(@Param("estado") String estado);

    @Query("SELECT ma.calibre, COUNT(ma) FROM ModeloArma ma GROUP BY ma.calibre")
    List<Object[]> countByCalibre();

    @Query("SELECT AVG(ma.precioReferencia) FROM ModeloArma ma WHERE ma.estado = 'DISPONIBLE'")
    BigDecimal getPrecioPromedio();
} 