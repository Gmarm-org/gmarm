package com.armasimportacion.repository;

import com.armasimportacion.model.PlanPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanPagoRepository extends JpaRepository<PlanPago, Long> {
    
    // Búsquedas básicas
    Optional<PlanPago> findByNombre(String nombre);
    List<PlanPago> findByNumeroCuotas(Integer numeroCuotas);
    List<PlanPago> findByEstado(Boolean estado);
    
    // Búsquedas con filtros
    @Query("SELECT pp FROM PlanPago pp WHERE " +
           "(:nombre IS NULL OR pp.nombre LIKE %:nombre%) AND " +
           "(:numeroCuotas IS NULL OR pp.numeroCuotas = :numeroCuotas) AND " +
           "(:estado IS NULL OR pp.estado = :estado)")
    List<PlanPago> findWithFilters(
            @Param("nombre") String nombre,
            @Param("numeroCuotas") Integer numeroCuotas,
            @Param("estado") Boolean estado);
    
    // Verificar existencia
    boolean existsByNombre(String nombre);
    
    // Planes activos
    List<PlanPago> findByEstadoTrue();
} 
