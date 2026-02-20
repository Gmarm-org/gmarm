package com.armasimportacion.service.helper;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.repository.ArmaSerieRepository;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.service.ConfiguracionSistemaService;
import com.armasimportacion.service.InventarioService;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
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
    private final ArmaSerieRepository armaSerieRepository;
    private final ConfiguracionSistemaService configuracionService;
    private final InventarioService inventarioService;

    /**
     * Asigna una arma a un cliente con todos los detalles necesarios
     */
    public ClienteArma asignarArmaACliente(Map<String, Object> armaData, Cliente cliente) {
        try {
            log.info("Asignando arma a cliente ID: {}", cliente.getId());
            
            if (armaData == null) {
                log.warn("Datos de arma son nulos para cliente ID: {}", cliente.getId());
                return null;
            }
            
            Long armaId = obtenerArmaIdDesdeDatos(armaData);
            if (armaId == null) {
                log.warn("No se pudo obtener ID de arma para cliente ID: {}", cliente.getId());
                return null;
            }
            
            Optional<Arma> armaOpt = armaRepository.findById(armaId);
            if (armaOpt.isEmpty()) {
                log.warn("Arma no encontrada con ID: {} para cliente ID: {}", armaId, cliente.getId());
                return null;
            }
            
            Arma arma = armaOpt.get();
            
            // Extraer número de serie si existe
            log.info("DEBUG - armaData completo recibido: {}", armaData);
            String numeroSerie = extraerNumeroSerie(armaData);
            log.info("Número de serie extraído: {}", numeroSerie);
            
            ClienteArma clienteArma = crearClienteArma(cliente, arma, armaData, numeroSerie);
            
            // NOTA: No validamos stock aquí porque estas son armas para importación
            // que aún no están físicamente disponibles. Se reservan para el cliente
            // y se importarán posteriormente.
            Integer cantidad = clienteArma.getCantidad();
            log.info("Reservando arma ID={}, cantidad={} para cliente (proceso de importación - sin validación de stock)", armaId, cantidad);
            
            // CRÍTICO: Guardar ClienteArma PRIMERO antes de asignar la serie
            ClienteArma clienteArmaGuardado = clienteArmaRepository.save(clienteArma);
            log.info("ClienteArma guardado con ID: {}", clienteArmaGuardado.getId());
            
            // AHORA sí, asignar la serie (clienteArma ya está persistido)
            if (numeroSerie != null && !numeroSerie.isEmpty()) {
                asignarSerieAClienteArma(clienteArmaGuardado, numeroSerie, arma.getId());
            }
            
            log.info("Arma asignada exitosamente: cliente={}, arma={}, precio={}, cantidad={}", 
                cliente.getId(), arma.getModelo(), clienteArmaGuardado.getPrecioUnitario(), 
                clienteArmaGuardado.getCantidad());
            
            // NOTA: El contrato se genera en ClienteCompletoService, no aquí
            log.info("Arma asignada. El contrato será generado por ClienteCompletoService");
            
            return clienteArmaGuardado;
            
        } catch (Exception e) {
            log.error("Error asignando arma a cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new BadRequestException("Error asignando arma: " + e.getMessage());
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
                log.warn("Campo 'id' o 'armaId' no encontrado en datos de arma: {}", armaData);
                return null;
            }
            
            Long armaId = Long.valueOf(armaIdObj.toString());
            log.info("Arma ID extraído: {} desde datos: {}", armaId, armaData);
            return armaId;
        } catch (NumberFormatException e) {
            log.warn("Error parseando armaId: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Crea la relación ClienteArma con todos los datos necesarios
     */
    private ClienteArma crearClienteArma(Cliente cliente, Arma arma, Map<String, Object> armaData, String numeroSerie) {
        ClienteArma clienteArma = new ClienteArma();
        clienteArma.setCliente(cliente);
        clienteArma.setArma(arma);
        
        // Establecer precio usando datos del frontend o precio de referencia de la arma
        BigDecimal precio = calcularPrecioArma(armaData, arma);
        clienteArma.setPrecioUnitario(precio);
        
        // Establecer cantidad usando datos del frontend o valor por defecto
        Integer cantidad = calcularCantidadArma(armaData);
        clienteArma.setCantidad(cantidad);
        
        // Si hay número de serie, asignarlo y cambiar estado a ASIGNADA
        if (numeroSerie != null && !numeroSerie.isEmpty()) {
            clienteArma.setNumeroSerie(numeroSerie);
            clienteArma.setEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
            log.info("Serie asignada al cliente-arma: {}", numeroSerie);
        } else {
            // Si no hay serie, estado es RESERVADA
            clienteArma.setEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        }
        
        clienteArma.setFechaAsignacion(LocalDateTime.now());
        
        log.info("ClienteArma creado: precio={}, cantidad={}, estado={}, numeroSerie={}", 
            precio, cantidad, clienteArma.getEstado(), numeroSerie);
        
        return clienteArma;
    }
    
    /**
     * Extrae el número de serie de los datos del arma
     */
    private String extraerNumeroSerie(Map<String, Object> armaData) {
        Object numeroSerieObj = armaData.get("numeroSerie");
        if (numeroSerieObj == null) {
            log.info("No se encontró número de serie en los datos del arma");
            return null;
        }
        return numeroSerieObj.toString();
    }
    
    /**
     * Asigna la serie a la relación cliente-arma y actualiza el estado de la serie
     */
    private void asignarSerieAClienteArma(ClienteArma clienteArma, String numeroSerie, Long armaId) {
        try {
            log.info("Buscando serie con número: {} para arma ID: {}", numeroSerie, armaId);
            
            // Buscar la serie en la base de datos
            Optional<ArmaSerie> serieOpt = armaSerieRepository.findByNumeroSerieAndArmaId(numeroSerie, armaId);
            
            if (serieOpt.isEmpty()) {
                log.error("No se encontró la serie {} para el arma ID: {}", numeroSerie, armaId);
                throw new ResourceNotFoundException("Serie no encontrada: " + numeroSerie);
            }
            
            ArmaSerie serie = serieOpt.get();
            
            // Verificar que la serie esté disponible
            if (!ArmaSerie.EstadoSerie.DISPONIBLE.equals(serie.getEstado())) {
                log.error("La serie {} no está disponible. Estado actual: {}", numeroSerie, serie.getEstado());
                throw new BadRequestException("La serie " + numeroSerie + " no está disponible");
            }
            
            // Obtener usuario asignador (vendedor) desde el cliente
            // El vendedor es el usuario_creador del cliente
            Usuario vendedor = clienteArma.getCliente().getUsuarioCreador();
            
            // Usar el método asignar() del modelo para establecer todas las relaciones correctamente
            serie.asignar(clienteArma, vendedor);
            armaSerieRepository.save(serie);
            
            log.info("Serie {} asignada correctamente al cliente-arma. Estado: ASIGNADO, Vendedor: {}", 
                numeroSerie, vendedor != null ? vendedor.getNombres() : "N/A");
            
        } catch (Exception e) {
            log.error("Error asignando serie: {}", e.getMessage(), e);
            throw new BadRequestException("Error asignando serie: " + e.getMessage());
        }
    }

    /**
     * Calcula el precio de la arma usando datos del frontend o precio de referencia
     */
    private BigDecimal calcularPrecioArma(Map<String, Object> armaData, Arma arma) {
        log.info("DEBUG - armaData recibido en calcularPrecioArma: {}", armaData);
        
        // Intentar obtener precioUnitario del frontend (el vendedor ingresa este precio)
        Optional<BigDecimal> precioFrontend = Optional.ofNullable(armaData.get("precioUnitario"))
            .map(Object::toString)
            .map(precioStr -> {
                try {
                    BigDecimal precio = new BigDecimal(precioStr);
                    log.info("Precio recibido del frontend (precioUnitario): {}", precio);
                    return precio;
                } catch (NumberFormatException e) {
                    log.warn("Error parseando precioUnitario del frontend '{}': {}", precioStr, e.getMessage());
                    return null;
                }
            });
        
        // Si no hay precioUnitario, intentar con "precio" (para compatibilidad)
        if (precioFrontend.isEmpty()) {
            precioFrontend = Optional.ofNullable(armaData.get("precio"))
                .map(Object::toString)
                .map(precioStr -> {
                    try {
                        BigDecimal precio = new BigDecimal(precioStr);
                        log.info("Precio recibido del frontend (precio): {}", precio);
                        return precio;
                    } catch (NumberFormatException e) {
                        log.warn("Error parseando precio del frontend '{}': {}", precioStr, e.getMessage());
                        return null;
                    }
                });
        }
        
        // Si no hay precio del frontend, usar precio de referencia de la arma como fallback
        BigDecimal precioFinal = precioFrontend.orElseGet(() -> {
            BigDecimal precioReferencia = arma.getPrecioReferencia();
            if (precioReferencia != null) {
                log.warn("No se encontró precioUnitario ni precio en requestData, usando precioReferencia de arma como fallback: {}", precioReferencia);
                return precioReferencia;
            } else {
                log.warn("Arma sin precio de referencia, usando cero");
                return BigDecimal.ZERO;
            }
        });
        
        log.info("Precio final calculado para arma '{}': {}", arma.getModelo(), precioFinal);
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
                    log.warn("Error parseando cantidad '{}': {}", cantidadStr, e.getMessage());
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
            log.warn("Datos de arma son nulos");
            return false;
        }
        
        Long armaId = obtenerArmaIdDesdeDatos(armaData);
        if (armaId == null) {
            log.warn("ID de arma inválido");
            return false;
        }
        
        Optional<Arma> armaOpt = armaRepository.findById(armaId);
        if (armaOpt.isEmpty()) {
            log.warn("Arma no encontrada con ID: {}", armaId);
            return false;
        }
        
        log.info("Datos de arma validados correctamente: arma={}", armaOpt.get().getModelo());
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
            log.error("Error calculando precio total de armas para cliente ID: {}: {}", clienteId, e.getMessage());
            return BigDecimal.ZERO;
        }
    }
}
