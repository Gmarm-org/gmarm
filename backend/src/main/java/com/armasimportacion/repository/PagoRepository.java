package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.enums.TipoPago;
import com.armasimportacion.model.Pago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByClienteId(Long clienteId);
    
    List<Pago> findByEstado(EstadoPago estado);
    
    List<Pago> findByClienteIdAndEstado(Long clienteId, EstadoPago estado);
    
    @Query("SELECT p FROM Pago p WHERE p.clienteId = :clienteId ORDER BY p.fechaCreacion DESC")
    List<Pago> findUltimosPagosByCliente(@Param("clienteId") Long clienteId, Pageable pageable);
    
    @Query("SELECT SUM(p.montoPagado) FROM Pago p WHERE p.clienteId = :clienteId")
    BigDecimal findTotalPagadoByCliente(@Param("clienteId") Long clienteId);
    
    @Query("SELECT SUM(p.montoPendiente) FROM Pago p WHERE p.clienteId = :clienteId")
    BigDecimal findTotalPendienteByCliente(@Param("clienteId") Long clienteId);
    
    @Query("SELECT p FROM Pago p WHERE " +
           "(:numeroComprobante IS NULL OR p.tipoPago LIKE %:numeroComprobante%) AND " +
           "(:estado IS NULL OR p.estado = :estado) AND " +
           "(:clienteId IS NULL OR p.clienteId = :clienteId) AND " +
           "(:fechaInicio IS NULL OR p.fechaCreacion >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR p.fechaCreacion <= :fechaFin)")
    Page<Pago> findWithFilters(
            @Param("numeroComprobante") String numeroComprobante,
            @Param("estado") EstadoPago estado,
            @Param("clienteId") Long clienteId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    @Query("SELECT p FROM Pago p WHERE p.clienteId = :clienteId AND p.estado = :estado ORDER BY p.fechaCreacion DESC")
    List<Pago> findByClienteAndEstado(@Param("clienteId") Long clienteId, @Param("estado") EstadoPago estado);
    
    @Query("SELECT p FROM Pago p WHERE p.tipoPago = :tipoPago AND p.estado = :estado")
    List<Pago> findByTipoPagoAndEstado(@Param("tipoPago") TipoPago tipoPago, @Param("estado") EstadoPago estado);
    
    @Query("SELECT p FROM Pago p WHERE p.cuotaActual = :cuotaActual AND p.estado = :estado")
    List<Pago> findByCuotaActualAndEstado(@Param("cuotaActual") Integer cuotaActual, @Param("estado") EstadoPago estado);
} 
