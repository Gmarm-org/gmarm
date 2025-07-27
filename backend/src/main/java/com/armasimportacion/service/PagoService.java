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
import java.util.Optional;

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
            throw new BadRequestException("Ya existe un pago con el comprobante: " + pago.getNumeroComprobante());
        }
        
        Cliente cliente = clienteRepository.findById(pago.getCliente().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        pago.setCliente(cliente);
        pago.setUsuarioRegistro(usuario);
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(EstadoPago.CONFIRMADO);
        pago.setFechaCreacion(LocalDateTime.now());
        
        // Calcular saldo a la fecha
        BigDecimal saldoAnterior = pagoRepository.sumPagosConfirmadosByCliente(cliente.getId());
        if (saldoAnterior == null) saldoAnterior = BigDecimal.ZERO;
        pago.setSaldoFecha(saldoAnterior.add(pago.getValorPago()));
        
        return pagoRepository.save(pago);
    }
    
    public Pago actualizarPago(Long id, Pago pagoActualizado, Long usuarioId) {
        log.info("Actualizando pago con ID: {}", id);
        
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con ID: " + id));
        
        // Validar número de comprobante único si cambió
        if (!pago.getNumeroComprobante().equals(pagoActualizado.getNumeroComprobante()) &&
            pagoRepository.existsByNumeroComprobante(pagoActualizado.getNumeroComprobante())) {
            throw new BadRequestException("Ya existe un pago con el comprobante: " + pagoActualizado.getNumeroComprobante());
        }
        
        // Actualizar campos
        pago.setNumeroComprobante(pagoActualizado.getNumeroComprobante());
        pago.setValorPago(pagoActualizado.getValorPago());
        pago.setTipoPago(pagoActualizado.getTipoPago());
        pago.setObservaciones(pagoActualizado.getObservaciones());
        pago.setFechaActualizacion(LocalDateTime.now());
        
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
    public List<Pago> obtenerPagosPorCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        return pagoRepository.findByCliente(cliente);
    }
    
    public BigDecimal obtenerSaldoCliente(Long clienteId) {
        BigDecimal totalPagos = pagoRepository.sumPagosConfirmadosByCliente(clienteId);
        return totalPagos != null ? totalPagos : BigDecimal.ZERO;
    }
    
    public List<Pago> obtenerPagosPorFecha(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return pagoRepository.findByFechaPagoBetween(fechaInicio, fechaFin);
    }
    
    public List<Pago> obtenerPagosPendientes() {
        return pagoRepository.findPagosPendientes();
    }
    
    public Page<Pago> buscarPagos(String numeroComprobante, EstadoPago estado, TipoPago tipoPago, 
                                 Long clienteId, LocalDateTime fechaInicio, LocalDateTime fechaFin, Pageable pageable) {
        return pagoRepository.findWithFilters(numeroComprobante, estado, tipoPago, clienteId, fechaInicio, fechaFin, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return pagoRepository.countByEstado();
    }
    
    public void cambiarEstado(Long id, EstadoPago nuevoEstado) {
        Pago pago = obtenerPago(id);
        pago.setEstado(nuevoEstado);
        pago.setFechaActualizacion(LocalDateTime.now());
        pagoRepository.save(pago);
    }
    
    public String generarNumeroComprobante() {
        String prefijo = "AUTOMATICO";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = String.format("%02d%02d%02d%02d%02d%02d", 
                ahora.getYear(), ahora.getMonthValue(), ahora.getDayOfMonth(),
                ahora.getHour(), ahora.getMinute(), ahora.getSecond());
        return prefijo + timestamp;
    }
    
    public boolean clienteTieneSaldoPendiente(Long clienteId) {
        BigDecimal saldo = obtenerSaldoCliente(clienteId);
        return saldo.compareTo(BigDecimal.ZERO) > 0;
    }
} 