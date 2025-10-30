package com.armasimportacion.service.helper;

import com.armasimportacion.model.Pago;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.enums.EstadoCuotaPago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio especializado para la gestión de pagos del cliente
 * Maneja la creación, cálculo y gestión de pagos y cuotas
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GestionPagosServiceHelper {

    private final PagoRepository pagoRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final com.armasimportacion.service.ConfiguracionSistemaService configuracionService;

    /**
     * Crea un pago completo con todos los datos necesarios
     */
    public Pago crearPagoCompleto(Map<String, Object> pagoData, Long clienteId) {
        try {
            log.info("💰 Creando pago completo para cliente ID: {}", clienteId);
            
            if (pagoData == null) {
                return crearPagoPorDefecto(clienteId);
            }
            
            Pago pago = construirPagoDesdeDatos(pagoData, clienteId);
            Pago pagoGuardado = pagoRepository.save(pago);
            
            log.info("✅ Pago creado con ID: {}, monto: {}, tipo: {}", 
                pagoGuardado.getId(), pagoGuardado.getMontoTotal(), pagoGuardado.getTipoPago());
            
            // Crear cuotas: usar las específicas del frontend si están disponibles, sino automáticas
            crearCuotasDesdeDatos(pagoGuardado, pagoData);
            
            return pagoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error creando pago para cliente ID: {}: {}", clienteId, e.getMessage(), e);
            throw new RuntimeException("Error creando pago", e);
        }
    }

    /**
     * Crea un pago por defecto cuando no se proporcionan datos específicos
     */
    public Pago crearPagoPorDefecto(Long clienteId) {
        log.info("🔧 Creando pago por defecto para cliente ID: {}", clienteId);
        
        Pago pago = new Pago();
        pago.setMontoTotal(BigDecimal.ZERO);
        pago.setFechaCreacion(LocalDateTime.now());
        pago.setClienteId(clienteId);
        pago.setTipoPago("CONTADO");
        pago.setNumeroCuotas(1);
        pago.setMontoCuota(BigDecimal.ZERO);
        pago.setMontoPagado(BigDecimal.ZERO);
        pago.setMontoPendiente(BigDecimal.ZERO);
        pago.setCuotaActual(1);
        pago.setEstado(EstadoPago.PENDIENTE);
        
        Pago pagoGuardado = pagoRepository.save(pago);
        log.info("✅ Pago por defecto creado con ID: {}", pagoGuardado.getId());
        return pagoGuardado;
    }

    /**
     * Construye un pago desde los datos del frontend
     */
    private Pago construirPagoDesdeDatos(Map<String, Object> pagoData, Long clienteId) {
        // Obtener IVA dinámicamente desde configuración
        double ivaDecimal = obtenerIVADelSistema();
        
        // Calcular montos con desglose
        BigDecimal subtotal = pagoData.containsKey("subtotal") && pagoData.get("subtotal") != null
            ? new BigDecimal(pagoData.get("subtotal").toString())
            : null;
            
        // El frontend envía "total", no "montoTotal"
        BigDecimal montoTotal = pagoData.containsKey("total") 
            ? new BigDecimal(pagoData.get("total").toString())
            : new BigDecimal(pagoData.get("montoTotal").toString());
        
        // Si no viene subtotal, calcularlo desde el total
        if (subtotal == null) {
            subtotal = montoTotal.divide(BigDecimal.valueOf(1 + ivaDecimal), 2, java.math.RoundingMode.HALF_UP);
        }
        
        BigDecimal montoIva = montoTotal.subtract(subtotal);
        
        Pago pago = new Pago();
        pago.setSubtotal(subtotal);
        pago.setMontoIva(montoIva);
        pago.setMontoTotal(montoTotal);
        pago.setFechaCreacion(LocalDateTime.now());
        pago.setClienteId(clienteId);
        
        log.info("💰 Pago construido: subtotal={}, IVA={}, total={}", subtotal, montoIva, montoTotal);
        
        // Establecer tipo de pago desde los datos o usar valor por defecto
        // Intentar obtener de "tipoPago" o "metodoPagoCodigo"
        String tipoPago = Optional.ofNullable(pagoData.get("tipoPago"))
            .map(Object::toString)
            .or(() -> Optional.ofNullable(pagoData.get("metodoPagoCodigo")).map(Object::toString))
            .orElse("CONTADO");
        
        // Normalizar: el frontend envía "CUOTAS", el backend usa "CREDITO"
        String tipoPagoNormalizado = "CUOTAS".equals(tipoPago) ? "CREDITO" : tipoPago;
        pago.setTipoPago(tipoPagoNormalizado);
        
        log.info("💰 Tipo de pago normalizado: '{}' → '{}'", tipoPago, tipoPagoNormalizado);
        
        // Establecer número de cuotas desde los datos o calcular basado en tipo de pago
        Integer numeroCuotas = Optional.ofNullable(pagoData.get("numeroCuotas"))
            .map(obj -> Integer.valueOf(obj.toString()))
            .orElse("CONTADO".equals(tipoPagoNormalizado) ? 1 : 12);
        pago.setNumeroCuotas(numeroCuotas);
        
        // Calcular monto por cuota
        BigDecimal montoCuota = montoTotal.divide(BigDecimal.valueOf(numeroCuotas), 2, java.math.RoundingMode.HALF_UP);
        pago.setMontoCuota(montoCuota);
        
        // Establecer montos iniciales
        BigDecimal montoPagado = Optional.ofNullable(pagoData.get("montoPagado"))
            .map(obj -> new BigDecimal(obj.toString()))
            .orElse(BigDecimal.ZERO);
        pago.setMontoPagado(montoPagado);
        pago.setMontoPendiente(montoTotal.subtract(montoPagado));
        
        // Establecer cuota actual
        Integer cuotaActual = Optional.ofNullable(pagoData.get("cuotaActual"))
            .map(obj -> Integer.valueOf(obj.toString()))
            .orElse(1);
        pago.setCuotaActual(cuotaActual);
        
        // Establecer estado desde los datos o usar valor por defecto
        String estadoStr = Optional.ofNullable(pagoData.get("estado"))
            .map(Object::toString)
            .orElse("PENDIENTE");
        try {
            pago.setEstado(EstadoPago.valueOf(estadoStr));
        } catch (IllegalArgumentException e) {
            pago.setEstado(EstadoPago.PENDIENTE);
        }
        
        return pago;
    }

    /**
     * Crea las cuotas usando los datos específicos del frontend o automáticamente
     */
    public void crearCuotasDesdeDatos(Pago pago, Map<String, Object> pagoData) {
        // El frontend envía "CUOTAS", el backend usa "CREDITO" internamente
        String tipoPagoNormalizado = "CUOTAS".equals(pago.getTipoPago()) ? "CREDITO" : pago.getTipoPago();
        
        if (!"CREDITO".equals(tipoPagoNormalizado) || pago.getNumeroCuotas() <= 1) {
            log.info("📝 Pago no requiere cuotas: tipo={}, cuotas={}", 
                pago.getTipoPago(), pago.getNumeroCuotas());
            return;
        }
        
        // Verificar si vienen cuotas específicas del frontend
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cuotasData = (List<Map<String, Object>>) pagoData.get("cuotas");
        
        log.info("📅 DEBUG: pagoData completo recibido: {}", pagoData);
        log.info("📅 DEBUG: cuotasData extraído: {}", cuotasData);
        log.info("📅 DEBUG: cuotasData es null? {}", cuotasData == null);
        log.info("📅 DEBUG: cuotasData está vacío? {}", cuotasData != null ? cuotasData.isEmpty() : "N/A");
        
        if (cuotasData != null && !cuotasData.isEmpty()) {
            log.info("📅 ✅ Creando {} cuotas específicas del frontend para pago ID: {}", 
                cuotasData.size(), pago.getId());
            crearCuotasEspecificas(pago, cuotasData);
        } else {
            log.warn("📅 ⚠️ No hay cuotas específicas del frontend, creando {} cuotas automáticas para pago ID: {}", 
                pago.getNumeroCuotas(), pago.getId());
            crearCuotasAutomaticamente(pago);
        }
    }
    
    /**
     * Crea cuotas específicas desde los datos del frontend
     */
    private void crearCuotasEspecificas(Pago pago, List<Map<String, Object>> cuotasData) {
        for (Map<String, Object> cuotaData : cuotasData) {
            try {
                CuotaPago cuota = new CuotaPago();
                cuota.setPago(pago);
                
                // Número de cuota
                Integer numeroCuota = Integer.valueOf(cuotaData.get("numeroCuota").toString());
                cuota.setNumeroCuota(numeroCuota);
                
                // Monto
                BigDecimal monto = new BigDecimal(cuotaData.get("monto").toString());
                cuota.setMonto(monto);
                
                // Fecha de vencimiento - el frontend envía "fechaVencimiento" no "fecha"
                String fechaStr = cuotaData.get("fechaVencimiento").toString();
                LocalDate fechaVencimiento = parsearFechaEcuador(fechaStr);
                cuota.setFechaVencimiento(fechaVencimiento);
                
                cuota.setEstado(EstadoCuotaPago.PENDIENTE);
                
                cuotaPagoRepository.save(cuota);
                log.info("✅ Cuota {} creada desde frontend: monto={}, vencimiento={}", 
                    numeroCuota, monto, fechaVencimiento);
                    
            } catch (Exception e) {
                log.error("❌ Error creando cuota específica: {}", e.getMessage(), e);
                throw new RuntimeException("Error creando cuota específica", e);
            }
        }
    }
    
    /**
     * Crea las cuotas automáticamente para un pago en cuotas
     */
    public void crearCuotasAutomaticamente(Pago pago) {
        log.info("📅 Creando {} cuotas automáticas para pago ID: {}", 
            pago.getNumeroCuotas(), pago.getId());
        
        BigDecimal montoPorCuota = pago.getMontoTotal().divide(
            BigDecimal.valueOf(pago.getNumeroCuotas()), 2, java.math.RoundingMode.HALF_UP);
        LocalDate fechaVencimiento = LocalDate.now().plusMonths(1);
        
        for (int i = 1; i <= pago.getNumeroCuotas(); i++) {
            CuotaPago cuota = new CuotaPago();
            cuota.setPago(pago);
            cuota.setNumeroCuota(i);
            cuota.setMonto(montoPorCuota);
            cuota.setFechaVencimiento(fechaVencimiento.plusMonths(i - 1));
            cuota.setEstado(EstadoCuotaPago.PENDIENTE);
            
            cuotaPagoRepository.save(cuota);
            log.info("✅ Cuota {} creada automáticamente: monto={}, vencimiento={}", 
                i, montoPorCuota, fechaVencimiento.plusMonths(i - 1));
        }
    }

    /**
     * Obtiene el IVA del sistema desde configuración
     */
    private double obtenerIVADelSistema() {
        try {
            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            return ivaPorcentaje / 100.0;  // Convertir a decimal (15 -> 0.15)
        } catch (Exception e) {
            log.warn("⚠️ Error obteniendo IVA del sistema, usando valor por defecto 15%: {}", e.getMessage());
            return 0.15;  // Fallback
        }
    }

    /**
     * Parsea una fecha string considerando la zona horaria de Ecuador (America/Guayaquil)
     * Esto evita desfases de fechas causados por diferencias de zona horaria
     */
    private LocalDate parsearFechaEcuador(String fechaStr) {
        try {
            log.info("📅 Parseando fecha: '{}'", fechaStr);
            
            // Si la fecha viene con hora (ISO DateTime con 'T'), extraer solo YYYY-MM-DD
            if (fechaStr.contains("T")) {
                fechaStr = fechaStr.split("T")[0];
            }
            
            // Parsear directamente como LocalDate (sin conversiones de timezone)
            LocalDate fecha = LocalDate.parse(fechaStr);
            log.info("📅 ✅ Fecha parseada: {}", fecha);
            return fecha;
            
        } catch (Exception e) {
            log.error("❌ Error parseando fecha '{}': {}", fechaStr, e.getMessage());
            throw new RuntimeException("Error parseando fecha: " + fechaStr, e);
        }
    }

    /**
     * Valida que los datos de pago sean correctos
     */
    public boolean validarDatosPago(Map<String, Object> pagoData) {
        if (pagoData == null) {
            log.warn("⚠️ Datos de pago son nulos");
            return false;
        }
        
        try {
            Object montoObj = pagoData.get("montoTotal");
            if (montoObj == null) {
                log.warn("⚠️ Monto total no especificado");
                return false;
            }
            
            BigDecimal monto = new BigDecimal(montoObj.toString());
            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("⚠️ Monto total debe ser mayor a cero: {}", monto);
                return false;
            }
            
            log.info("✅ Datos de pago validados correctamente: monto={}", monto);
            return true;
            
        } catch (NumberFormatException e) {
            log.warn("⚠️ Error parseando monto total: {}", e.getMessage());
            return false;
        }
    }
}
