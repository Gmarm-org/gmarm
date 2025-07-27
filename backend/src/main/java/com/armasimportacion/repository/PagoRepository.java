package com.armasimportacion.repository;

import com.armasimportacion.model.Pago;
import com.armasimportacion.model.PlanPago;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.enums.TipoPago;
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
    Optional<Pago> findByReferenciaPago(String referenciaPago);
    List<Pago> findByPlanPago(PlanPago planPago);
    List<Pago> findByEstado(EstadoPago estado);
    List<Pago> findByTipoPago(TipoPago tipoPago);
    
    // Pagos por fecha
    List<Pago> findByFechaPagoBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<Pago> findByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Pagos por plan y estado
    List<Pago> findByPlanPagoAndEstado(PlanPago planPago, EstadoPago estado);
    
    // Pagos completados
    List<Pago> findByEstadoAndFechaPagoBetween(EstadoPago estado, LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Verificar existencia
    boolean existsByReferenciaPago(String referenciaPago);
    
    // Búsquedas con filtros
    @Query("SELECT p FROM Pago p WHERE " +
           "(:referenciaPago IS NULL OR p.referenciaPago LIKE %:referenciaPago%) AND " +
           "(:estado IS NULL OR p.estado = :estado) AND " +
           "(:tipoPago IS NULL OR p.tipoPago = :tipoPago) AND " +
           "(:planPagoId IS NULL OR p.planPago.id = :planPagoId) AND " +
           "(:fechaInicio IS NULL OR p.fechaPago >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR p.fechaPago <= :fechaFin)")
    Page<Pago> findWithFilters(
            @Param("referenciaPago") String referenciaPago,
            @Param("estado") EstadoPago estado,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("planPagoId") Long planPagoId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    // Suma de pagos por plan
    @Query("SELECT SUM(p.monto) FROM Pago p WHERE p.planPago.id = :planPagoId AND p.estado = 'COMPLETADO'")
    BigDecimal sumPagosCompletadosByPlanPago(@Param("planPagoId") Long planPagoId);
    
    // Contar pagos por estado
    @Query("SELECT p.estado, COUNT(p) FROM Pago p GROUP BY p.estado")
    List<Object[]> countByEstado();
    
    // Pagos pendientes
    @Query("SELECT p FROM Pago p WHERE p.estado = 'PENDIENTE'")
    List<Pago> findPagosPendientes();
    
    // Último pago del plan
    @Query("SELECT p FROM Pago p WHERE p.planPago.id = :planPagoId ORDER BY p.fechaPago DESC")
    List<Pago> findUltimosPagosByPlanPago(@Param("planPagoId") Long planPagoId, Pageable pageable);
    
    // Pagos por cliente (a través del plan de pago)
    @Query("SELECT p FROM Pago p WHERE p.planPago.cliente.id = :clienteId")
    List<Pago> findByCliente(@Param("clienteId") Long clienteId);
    
    // Suma de pagos completados por cliente
    @Query("SELECT SUM(p.monto) FROM Pago p WHERE p.planPago.cliente.id = :clienteId AND p.estado = 'COMPLETADO'")
    BigDecimal sumPagosCompletadosByCliente(@Param("clienteId") Long clienteId);
} 