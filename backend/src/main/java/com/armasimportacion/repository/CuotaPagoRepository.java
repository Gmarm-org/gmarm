package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoCuotaPago;
import com.armasimportacion.model.CuotaPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CuotaPagoRepository extends JpaRepository<CuotaPago, Long> {

    List<CuotaPago> findByPagoId(Long pagoId);
    
    List<CuotaPago> findByPagoIdOrderByNumeroCuota(Long pagoId);
    
    List<CuotaPago> findByEstado(EstadoCuotaPago estado);
    
    List<CuotaPago> findByPagoIdAndEstado(Long pagoId, EstadoCuotaPago estado);
    
    @Query("SELECT c FROM CuotaPago c WHERE c.fechaVencimiento < :fecha AND c.estado = 'PENDIENTE'")
    List<CuotaPago> findCuotasVencidas(@Param("fecha") LocalDate fecha);
    
    @Query("SELECT c FROM CuotaPago c WHERE c.pago.clienteId = :clienteId AND c.estado = :estado")
    List<CuotaPago> findByClienteIdAndEstado(@Param("clienteId") Long clienteId, @Param("estado") EstadoCuotaPago estado);
    
    @Query("SELECT c FROM CuotaPago c WHERE c.pago.clienteId = :clienteId ORDER BY c.fechaVencimiento ASC")
    List<CuotaPago> findByClienteIdOrderByVencimiento(@Param("clienteId") Long clienteId);
    
    @Query("SELECT COUNT(c) FROM CuotaPago c WHERE c.pago.id = :pagoId AND c.estado = 'PAGADA'")
    Long countCuotasPagadasByPagoId(@Param("pagoId") Long pagoId);
    
    @Query("SELECT COUNT(c) FROM CuotaPago c WHERE c.pago.id = :pagoId AND c.estado = 'PENDIENTE'")
    Long countCuotasPendientesByPagoId(@Param("pagoId") Long pagoId);
    
    @Query("SELECT c FROM CuotaPago c WHERE c.pago.id = :pagoId AND c.numeroCuota = :numeroCuota")
    CuotaPago findByPagoIdAndNumeroCuota(@Param("pagoId") Long pagoId, @Param("numeroCuota") Integer numeroCuota);
}
