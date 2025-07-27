package com.armasimportacion.repository;

import com.armasimportacion.model.Pago;
import com.armasimportacion.model.Cliente;
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
    Optional<Pago> findByNumeroComprobante(String numeroComprobante);
    List<Pago> findByCliente(Cliente cliente);
    List<Pago> findByEstado(EstadoPago estado);
    List<Pago> findByTipoPago(TipoPago tipoPago);
    
    // Pagos por fecha
    List<Pago> findByFechaPagoBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    List<Pago> findByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Pagos por cliente y estado
    List<Pago> findByClienteAndEstado(Cliente cliente, EstadoPago estado);
    
    // Pagos confirmados
    List<Pago> findByEstadoAndFechaPagoBetween(EstadoPago estado, LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Verificar existencia
    boolean existsByNumeroComprobante(String numeroComprobante);
    
    // Búsquedas con filtros
    @Query("SELECT p FROM Pago p WHERE " +
           "(:numeroComprobante IS NULL OR p.numeroComprobante LIKE %:numeroComprobante%) AND " +
           "(:estado IS NULL OR p.estado = :estado) AND " +
           "(:tipoPago IS NULL OR p.tipoPago = :tipoPago) AND " +
           "(:clienteId IS NULL OR p.cliente.id = :clienteId) AND " +
           "(:fechaInicio IS NULL OR p.fechaPago >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR p.fechaPago <= :fechaFin)")
    Page<Pago> findWithFilters(
            @Param("numeroComprobante") String numeroComprobante,
            @Param("estado") EstadoPago estado,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("clienteId") Long clienteId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    // Suma de pagos por cliente
    @Query("SELECT SUM(p.valorPago) FROM Pago p WHERE p.cliente.id = :clienteId AND p.estado = 'CONFIRMADO'")
    BigDecimal sumPagosConfirmadosByCliente(@Param("clienteId") Long clienteId);
    
    // Contar pagos por estado
    @Query("SELECT p.estado, COUNT(p) FROM Pago p GROUP BY p.estado")
    List<Object[]> countByEstado();
    
    // Pagos pendientes
    @Query("SELECT p FROM Pago p WHERE p.estado = 'PENDIENTE'")
    List<Pago> findPagosPendientes();
    
    // Último pago del cliente
    @Query("SELECT p FROM Pago p WHERE p.cliente.id = :clienteId ORDER BY p.fechaPago DESC")
    List<Pago> findUltimosPagosByCliente(@Param("clienteId") Long clienteId, Pageable pageable);
} 