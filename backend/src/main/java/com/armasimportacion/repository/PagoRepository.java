package com.armasimportacion.repository;

import com.armasimportacion.model.Pago;
import com.armasimportacion.model.PlanPago;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.enums.EstadoPago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    
    // Búsquedas básicas
    Optional<Pago> findByNumeroComprobante(String numeroComprobante);
    List<Pago> findByPlanPago(PlanPago planPago);
    List<Pago> findByEstado(EstadoPago estado);
    List<Pago> findByCliente(Cliente cliente);
    List<Pago> findByClienteId(Long clienteId);
    List<Pago> findByPlanPagoId(Long planPagoId);
    
    // Pagos por fecha
    List<Pago> findByFechaPagoBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<Pago> findByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Pagos por plan y estado
    List<Pago> findByPlanPagoAndEstado(PlanPago planPago, EstadoPago estado);
    
    // Pagos completados
    List<Pago> findByEstadoAndFechaPagoBetween(EstadoPago estado, LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Verificar existencia
    boolean existsByNumeroComprobante(String numeroComprobante);
    
    // Búsquedas con filtros
    @Query("SELECT p FROM Pago p WHERE " +
           "(:numeroComprobante IS NULL OR p.numeroComprobante LIKE %:numeroComprobante%) AND " +
           "(:estado IS NULL OR p.estado = :estado) AND " +
           "(:planPagoId IS NULL OR p.planPago.id = :planPagoId) AND " +
           "(:fechaInicio IS NULL OR p.fechaPago >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR p.fechaPago <= :fechaFin)")
    Page<Pago> findWithFilters(
            @Param("numeroComprobante") String numeroComprobante,
            @Param("estado") EstadoPago estado,
            @Param("planPagoId") Long planPagoId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    // Estadísticas por estado
    @Query("SELECT p.estado, COUNT(p) FROM Pago p GROUP BY p.estado")
    List<Object[]> findEstadisticasPorEstado();
    
    // Último pago del plan
    @Query("SELECT p FROM Pago p WHERE p.planPago.id = :planPagoId ORDER BY p.fechaPago DESC")
    List<Pago> findUltimosPagosByPlanPago(@Param("planPagoId") Long planPagoId, Pageable pageable);
} 