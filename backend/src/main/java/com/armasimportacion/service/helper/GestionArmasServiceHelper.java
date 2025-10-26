package com.armasimportacion.service.helper;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio especializado para la gestión de armas del cliente
 * Maneja la asignación, cálculo de precios y gestión de armas
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GestionArmasServiceHelper {

    private final ArmaRepository armaRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final com.armasimportacion.service.ConfiguracionSistemaService configuracionService;
    private final com.armasimportacion.service.InventarioService inventarioService;

    /**
     * Asigna una arma a un cliente con todos los detalles necesarios
     */
    public ClienteArma asignarArmaACliente(Map<String, Object> armaData, Cliente cliente) {
        try {
            log.info("🔫 Asignando arma a cliente ID: {}", cliente.getId());
            
            if (armaData == null) {
                log.warn("⚠️ Datos de arma son nulos para cliente ID: {}", cliente.getId());
                return null;
            }
            
            Long armaId = obtenerArmaIdDesdeDatos(armaData);
            if (armaId == null) {
                log.warn("⚠️ No se pudo obtener ID de arma para cliente ID: {}", cliente.getId());
                return null;
            }
            
            Optional<Arma> armaOpt = armaRepository.findById(armaId);
            if (armaOpt.isEmpty()) {
                log.warn("⚠️ Arma no encontrada con ID: {} para cliente ID: {}", armaId, cliente.getId());
                return null;
            }
            
            Arma arma = armaOpt.get();
            ClienteArma clienteArma = crearClienteArma(cliente, arma, armaData);
            
            // Validar y reducir stock ANTES de guardar la asignación
            Integer cantidad = clienteArma.getCantidad();
            log.info("🔍 Validando stock disponible para arma ID={}, cantidad solicitada={}", armaId, cantidad);
            
            if (!inventarioService.tieneStockSuficiente(armaId, cantidad)) {
                Integer stockDisponible = inventarioService.getStockDisponible(armaId);
                log.error("❌ Stock insuficiente para arma '{}'. Disponible: {}, Solicitado: {}", 
                    arma.getNombre(), stockDisponible, cantidad);
                throw new RuntimeException("Stock insuficiente para arma: " + arma.getNombre() + 
                    ". Disponible: " + stockDisponible + ", Solicitado: " + cantidad);
            }
            
            // Reducir stock del inventario
            log.info("📦 Reduciendo stock de arma ID={}, cantidad={}", armaId, cantidad);
            inventarioService.reducirStock(armaId, cantidad);
            log.info("✅ Stock reducido exitosamente para arma '{}'", arma.getNombre());
            
            ClienteArma clienteArmaGuardado = clienteArmaRepository.save(clienteArma);
            
            log.info("✅ Arma asignada exitosamente: cliente={}, arma={}, precio={}, cantidad={}", 
                cliente.getId(), arma.getNombre(), clienteArmaGuardado.getPrecioUnitario(), 
                clienteArmaGuardado.getCantidad());
            
            // NOTA: El contrato se genera en ClienteCompletoService, no aquí
            log.info("✅ Arma asignada. El contrato será generado por ClienteCompletoService");
            
            return clienteArmaGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error asignando arma a cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error asignando arma: " + e.getMessage(), e);
        }
    }

    /**
     * Obtiene el ID de arma desde los datos del frontend
     */
    private Long obtenerArmaIdDesdeDatos(Map<String, Object> armaData) {
        try {
            // Intentar primero con 'id' (formato del frontend)
            Object armaIdObj = armaData.get("id");
            if (armaIdObj == null) {
                // Fallback a 'armaId' por compatibilidad
                armaIdObj = armaData.get("armaId");
            }
            
            if (armaIdObj == null) {
                log.warn("⚠️ Campo 'id' o 'armaId' no encontrado en datos de arma: {}", armaData);
                return null;
            }
            
            Long armaId = Long.valueOf(armaIdObj.toString());
            log.info("🔍 Arma ID extraído: {} desde datos: {}", armaId, armaData);
            return armaId;
        } catch (NumberFormatException e) {
            log.warn("⚠️ Error parseando armaId: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Crea la relación ClienteArma con todos los datos necesarios
     */
    private ClienteArma crearClienteArma(Cliente cliente, Arma arma, Map<String, Object> armaData) {
        ClienteArma clienteArma = new ClienteArma();
        clienteArma.setCliente(cliente);
        clienteArma.setArma(arma);
        
        // Establecer precio usando datos del frontend o precio de referencia de la arma
        BigDecimal precio = calcularPrecioArma(armaData, arma);
        clienteArma.setPrecioUnitario(precio);
        
        // Establecer cantidad usando datos del frontend o valor por defecto
        Integer cantidad = calcularCantidadArma(armaData);
        clienteArma.setCantidad(cantidad);
        
        // Establecer estado y fecha
        clienteArma.setEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        clienteArma.setFechaAsignacion(LocalDateTime.now());
        
        log.info("🔧 ClienteArma creado: precio={}, cantidad={}, estado={}", 
            precio, cantidad, clienteArma.getEstado());
        
        return clienteArma;
    }

    /**
     * Calcula el precio de la arma usando datos del frontend o precio de referencia
     */
    private BigDecimal calcularPrecioArma(Map<String, Object> armaData, Arma arma) {
        // Intentar obtener precio del frontend
        Optional<BigDecimal> precioFrontend = Optional.ofNullable(armaData.get("precio"))
            .map(Object::toString)
            .map(precioStr -> {
                try {
                    return new BigDecimal(precioStr);
                } catch (NumberFormatException e) {
                    log.warn("⚠️ Error parseando precio del frontend '{}': {}", precioStr, e.getMessage());
                    return null;
                }
            });
        
        // Si no hay precio del frontend, usar precio de referencia de la arma
        BigDecimal precioFinal = precioFrontend.orElseGet(() -> {
            BigDecimal precioReferencia = arma.getPrecioReferencia();
            if (precioReferencia != null) {
                log.info("🔍 Usando precio de referencia de arma: {}", precioReferencia);
                return precioReferencia;
            } else {
                log.warn("⚠️ Arma sin precio de referencia, usando cero");
                return BigDecimal.ZERO;
            }
        });
        
        log.info("💰 Precio calculado para arma '{}': {}", arma.getNombre(), precioFinal);
        return precioFinal;
    }

    /**
     * Calcula la cantidad de armas usando datos del frontend o valor por defecto
     */
    private Integer calcularCantidadArma(Map<String, Object> armaData) {
        return Optional.ofNullable(armaData.get("cantidad"))
            .map(Object::toString)
            .map(cantidadStr -> {
                try {
                    return Integer.valueOf(cantidadStr);
                } catch (NumberFormatException e) {
                    log.warn("⚠️ Error parseando cantidad '{}': {}", cantidadStr, e.getMessage());
                    return 1; // Valor por defecto
                }
            })
            .orElse(1); // Valor por defecto si no se especifica
    }

    /**
     * Valida que los datos de arma sean correctos
     */
    public boolean validarDatosArma(Map<String, Object> armaData) {
        if (armaData == null) {
            log.warn("⚠️ Datos de arma son nulos");
            return false;
        }
        
        Long armaId = obtenerArmaIdDesdeDatos(armaData);
        if (armaId == null) {
            log.warn("⚠️ ID de arma inválido");
            return false;
        }
        
        Optional<Arma> armaOpt = armaRepository.findById(armaId);
        if (armaOpt.isEmpty()) {
            log.warn("⚠️ Arma no encontrada con ID: {}", armaId);
            return false;
        }
        
        log.info("✅ Datos de arma validados correctamente: arma={}", armaOpt.get().getNombre());
        return true;
    }

    /**
     * Obtiene el precio total de todas las armas asignadas a un cliente
     */
    public BigDecimal calcularPrecioTotalArmasCliente(Long clienteId) {
        try {
            return clienteArmaRepository.findByClienteId(clienteId)
                .stream()
                .map(clienteArma -> clienteArma.getPrecioUnitario().multiply(BigDecimal.valueOf(clienteArma.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        } catch (Exception e) {
            log.error("❌ Error calculando precio total de armas para cliente ID: {}: {}", clienteId, e.getMessage());
            return BigDecimal.ZERO;
        }
    }
}
