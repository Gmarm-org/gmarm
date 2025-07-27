package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.PlanPago;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.PlanPagoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.enums.TipoPago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PagoService {
    
    private final PagoRepository pagoRepository;
    private final ClienteRepository clienteRepository;
    private final PlanPagoRepository planPagoRepository;
    private final UsuarioRepository usuarioRepository;
    
    // CRUD Operations
    public Pago crearPago(Pago pago, Long usuarioId) {
        log.info("Creando nuevo pago: {}", pago.getReferenciaPago());
        
        // Validaciones
        if (pagoRepository.existsByReferenciaPago(pago.getReferenciaPago())) {
            throw new BadRequestException("Ya existe un pago con la referencia: " + pago.getReferenciaPago());
        }
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        pago.setUsuarioRegistrador(usuario);
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(EstadoPago.COMPLETADO);
        
        return pagoRepository.save(pago);
    }
    
    public Pago actualizarPago(Long id, Pago pagoActualizado, Long usuarioId) {
        log.info("Actualizando pago con ID: {}", id);
        
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con ID: " + id));
        
        // Validar referencia de pago única si cambió
        if (!pago.getReferenciaPago().equals(pagoActualizado.getReferenciaPago()) &&
            pagoRepository.existsByReferenciaPago(pagoActualizado.getReferenciaPago())) {
            throw new BadRequestException("Ya existe un pago con la referencia: " + pagoActualizado.getReferenciaPago());
        }
        
        // Actualizar campos
        pago.setReferenciaPago(pagoActualizado.getReferenciaPago());
        pago.setMonto(pagoActualizado.getMonto());
        pago.setTipoPago(pagoActualizado.getTipoPago());
        pago.setObservaciones(pagoActualizado.getObservaciones());
        
        return pagoRepository.save(pago);
    }
    
    public Pago obtenerPago(Long id) {
        return pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con ID: " + id));
    }
    
    public Page<Pago> obtenerPagos(Pageable pageable) {
        return pagoRepository.findAll(pageable);
    }
    
    public void eliminarPago(Long id) {
        if (!pagoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pago no encontrado con ID: " + id);
        }
        pagoRepository.deleteById(id);
    }
    
    // Business Logic
    public List<Pago> obtenerPagosPorPlanPago(Long planPagoId) {
        PlanPago planPago = planPagoRepository.findById(planPagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de pago no encontrado"));
        return pagoRepository.findByPlanPago(planPago);
    }
    
    public BigDecimal obtenerSaldoPlanPago(Long planPagoId) {
        BigDecimal totalPagos = pagoRepository.sumPagosCompletadosByPlanPago(planPagoId);
        return totalPagos != null ? totalPagos : BigDecimal.ZERO;
    }
    
    public List<Pago> obtenerPagosPorFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return pagoRepository.findByFechaPagoBetween(fechaInicio, fechaFin);
    }
    
    public List<Pago> obtenerPagosPendientes() {
        return pagoRepository.findPagosPendientes();
    }
    
    public Page<Pago> buscarPagos(String referenciaPago, EstadoPago estado, TipoPago tipoPago, 
                                 Long planPagoId, LocalDateTime fechaInicio, LocalDateTime fechaFin, Pageable pageable) {
        return pagoRepository.findWithFilters(referenciaPago, estado, tipoPago, planPagoId, fechaInicio, fechaFin, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return pagoRepository.countByEstado();
    }
    
    public void cambiarEstado(Long id, EstadoPago nuevoEstado) {
        Pago pago = obtenerPago(id);
        pago.setEstado(nuevoEstado);
        pagoRepository.save(pago);
    }
    
    public String generarReferenciaPago() {
        String prefijo = "AUTOMATICO";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = String.format("%02d%02d%02d%02d%02d%02d", 
                ahora.getYear(), ahora.getMonthValue(), ahora.getDayOfMonth(),
                ahora.getHour(), ahora.getMinute(), ahora.getSecond());
        return prefijo + timestamp;
    }
    
    public boolean planPagoTieneSaldoPendiente(Long planPagoId) {
        BigDecimal saldo = obtenerSaldoPlanPago(planPagoId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }
    
    // Additional methods for controller
    public List<Pago> obtenerPagosPorCliente(Long clienteId) {
        clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        return pagoRepository.findByCliente(clienteId);
    }
    
    public BigDecimal obtenerSaldoCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        BigDecimal totalPagos = pagoRepository.sumPagosCompletadosByCliente(clienteId);
        return totalPagos != null ? totalPagos : BigDecimal.ZERO;
    }
    
    public boolean clienteTieneSaldoPendiente(Long clienteId) {
        BigDecimal saldo = obtenerSaldoCliente(clienteId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }
    
    public String generarNumeroComprobante() {
        String prefijo = "COMP";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = String.format("%02d%02d%02d%02d%02d%02d", 
                ahora.getYear(), ahora.getMonthValue(), ahora.getDayOfMonth(),
                ahora.getHour(), ahora.getMinute(), ahora.getSecond());
        return prefijo + timestamp;
    }
} 