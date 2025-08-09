package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.PlanPago;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.PlanPagoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoPago;
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
        log.info("Creando nuevo pago: {}", pago.getNumeroComprobante());
        
        // Validaciones
        if (pagoRepository.existsByNumeroComprobante(pago.getNumeroComprobante())) {
            throw new BadRequestException("Ya existe un pago con el número de comprobante: " + pago.getNumeroComprobante());
        }
        
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(EstadoPago.COMPLETADO);
        
        return pagoRepository.save(pago);
    }
    
    public Pago actualizarPago(Long id, Pago pagoActualizado, Long usuarioId) {
        log.info("Actualizando pago con ID: {}", id);
        
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con ID: " + id));
        
        // Validar número de comprobante único si cambió
        if (!pago.getNumeroComprobante().equals(pagoActualizado.getNumeroComprobante()) &&
            pagoRepository.existsByNumeroComprobante(pagoActualizado.getNumeroComprobante())) {
            throw new BadRequestException("Ya existe un pago con el número de comprobante: " + pagoActualizado.getNumeroComprobante());
        }
        
        // Actualizar campos
        pago.setNumeroComprobante(pagoActualizado.getNumeroComprobante());
        pago.setMontoTotal(pagoActualizado.getMontoTotal());
        pago.setSaldoPendiente(pagoActualizado.getSaldoPendiente());
        pago.setMetodoPago(pagoActualizado.getMetodoPago());
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
        return pagoRepository.findByPlanPagoId(planPagoId)
                .stream()
                .map(Pago::getSaldoPendiente)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public List<Pago> obtenerPagosPorFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return pagoRepository.findByFechaPagoBetween(fechaInicio, fechaFin);
    }
    
    public List<Pago> obtenerPagosPendientes() {
        return pagoRepository.findByEstado(EstadoPago.PENDIENTE);
    }
    
    public Page<Pago> buscarPagos(String numeroComprobante, EstadoPago estado, 
                                 Long planPagoId, LocalDateTime fechaInicio, LocalDateTime fechaFin, Pageable pageable) {
        return pagoRepository.findWithFilters(numeroComprobante, estado, planPagoId, fechaInicio, fechaFin, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return pagoRepository.findEstadisticasPorEstado();
    }
    
    public void cambiarEstado(Long id, EstadoPago nuevoEstado) {
        Pago pago = obtenerPago(id);
        pago.setEstado(nuevoEstado);
        pagoRepository.save(pago);
    }
    
    public String generarNumeroComprobante() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = String.valueOf((int) (Math.random() * 1000));
        return "COMP-" + timestamp + "-" + random;
    }
    
    public boolean planPagoTieneSaldoPendiente(Long planPagoId) {
        BigDecimal saldo = obtenerSaldoPlanPago(planPagoId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }
    
    public List<Pago> obtenerPagosPorCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        return pagoRepository.findByCliente(cliente);
    }
    
    public BigDecimal obtenerSaldoCliente(Long clienteId) {
        return pagoRepository.findByClienteId(clienteId)
                .stream()
                .map(Pago::getSaldoPendiente)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public boolean clienteTieneSaldoPendiente(Long clienteId) {
        BigDecimal saldo = obtenerSaldoCliente(clienteId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }
} 