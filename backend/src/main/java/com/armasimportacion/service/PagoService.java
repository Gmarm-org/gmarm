package com.armasimportacion.service;

import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PagoService {

    private final PagoRepository pagoRepository;
    private final CuotaPagoRepository cuotaPagoRepository;

    public Pago crearPago(Pago pago) {
        log.info("Creando pago para cliente: {}", pago.getClienteId());
        
        // Calcular monto pendiente inicial
        pago.setMontoPendiente(pago.getMontoTotal().subtract(pago.getMontoPagado()));
        
        // Validar que el monto pendiente sea correcto
        if (pago.getMontoPendiente().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El monto pagado no puede ser mayor al monto total");
        }
        
        Pago pagoGuardado = pagoRepository.save(pago);
        
        // Si es pago en cuotas, crear las cuotas automáticamente
        if ("CUOTAS".equals(pago.getTipoPago()) && pago.getNumeroCuotas() > 1) {
            crearCuotasAutomaticamente(pagoGuardado);
        }
        
        return pagoGuardado;
    }

    public Optional<Pago> obtenerPagoPorId(Long id) {
        return pagoRepository.findById(id);
    }

    public List<Pago> obtenerPagosPorCliente(Long clienteId) {
        return pagoRepository.findByClienteId(clienteId);
    }

    public List<Pago> obtenerPagosPorEstado(EstadoPago estado) {
        return pagoRepository.findByEstado(estado);
    }

    public Pago actualizarPago(Pago pago) {
        log.info("Actualizando pago: {}", pago.getId());
        
        // Recalcular monto pendiente
        pago.setMontoPendiente(pago.getMontoTotal().subtract(pago.getMontoPagado()));
        
        // Actualizar cuota actual basada en cuotas pagadas
        actualizarCuotaActual(pago);
        
        return pagoRepository.save(pago);
    }

    public void eliminarPago(Long id) {
        log.info("Eliminando pago: {}", id);
        pagoRepository.deleteById(id);
    }

    public Page<Pago> buscarPagos(String numeroComprobante, EstadoPago estado, 
                                 Long clienteId, LocalDateTime fechaInicio, 
                                 LocalDateTime fechaFin, Pageable pageable) {
        return pagoRepository.findWithFilters(numeroComprobante, estado, clienteId, fechaInicio, fechaFin, pageable);
    }

    public BigDecimal obtenerSaldoCliente(Long clienteId) {
        BigDecimal totalPagado = pagoRepository.findTotalPagadoByCliente(clienteId);
        BigDecimal totalPendiente = pagoRepository.findTotalPendienteByCliente(clienteId);
        
        if (totalPagado == null) totalPagado = BigDecimal.ZERO;
        if (totalPendiente == null) totalPendiente = BigDecimal.ZERO;
        
        return totalPendiente;
    }

    public boolean clienteTieneSaldoPendiente(Long clienteId) {
        BigDecimal saldo = obtenerSaldoCliente(clienteId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }

    public List<CuotaPago> obtenerCuotasPorPago(Long pagoId) {
        return cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pagoId);
    }

    public CuotaPago pagarCuota(Long cuotaId, String referenciaPago, Long usuarioConfirmadorId) {
        Optional<CuotaPago> cuotaOpt = cuotaPagoRepository.findById(cuotaId);
        if (cuotaOpt.isEmpty()) {
            throw new IllegalArgumentException("Cuota no encontrada");
        }

        CuotaPago cuota = cuotaOpt.get();
        cuota.setEstado(com.armasimportacion.enums.EstadoCuotaPago.PAGADA);
        cuota.setFechaPago(LocalDateTime.now());
        cuota.setReferenciaPago(referenciaPago);
        
        // Actualizar el pago principal
        Pago pago = cuota.getPago();
        pago.setMontoPagado(pago.getMontoPagado().add(cuota.getMonto()));
        pago.setMontoPendiente(pago.getMontoPendiente().subtract(cuota.getMonto()));
        
        // Verificar si el pago está completo
        if (pago.getMontoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
            pago.setEstado(EstadoPago.COMPLETADO);
        } else {
            pago.setEstado(EstadoPago.EN_CURSO);
        }
        
        pagoRepository.save(pago);
        return cuotaPagoRepository.save(cuota);
    }

    private void crearCuotasAutomaticamente(Pago pago) {
        BigDecimal montoPorCuota = pago.getMontoTotal().divide(BigDecimal.valueOf(pago.getNumeroCuotas()), 2, BigDecimal.ROUND_HALF_UP);
        LocalDate fechaVencimiento = LocalDate.now().plusMonths(1);
        
        for (int i = 1; i <= pago.getNumeroCuotas(); i++) {
            CuotaPago cuota = new CuotaPago();
            cuota.setPago(pago);
            cuota.setNumeroCuota(i);
            cuota.setMonto(montoPorCuota);
            cuota.setFechaVencimiento(fechaVencimiento.plusMonths(i - 1));
            cuota.setEstado(com.armasimportacion.enums.EstadoCuotaPago.PENDIENTE);
            
            cuotaPagoRepository.save(cuota);
        }
    }

    private void actualizarCuotaActual(Pago pago) {
        Long cuotasPagadas = cuotaPagoRepository.countCuotasPagadasByPagoId(pago.getId());
        pago.setCuotaActual(cuotasPagadas.intValue() + 1);
    }

    public List<CuotaPago> obtenerCuotasVencidas() {
        return cuotaPagoRepository.findCuotasVencidas(LocalDate.now());
    }

    public List<CuotaPago> obtenerCuotasPorCliente(Long clienteId) {
        return cuotaPagoRepository.findByClienteIdOrderByVencimiento(clienteId);
    }
} 