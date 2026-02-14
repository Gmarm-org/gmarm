package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteArmaDTO;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de relaciones cliente-arma
 * Reemplaza a AsignacionArmaService para mantener consistencia
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClienteArmaService {

    private final ClienteArmaRepository clienteArmaRepository;
    private final ClienteRepository clienteRepository;
    private final ArmaRepository armaRepository;
    private final DocumentoClienteService documentoClienteService;
    private final GrupoImportacionClienteService grupoImportacionClienteService;
    private final GrupoImportacionMatchingService grupoImportacionMatchingService;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;

    /**
     * Verifica si un cliente tiene armas asignadas (en estado ASIGNADA)
     * @param clienteId ID del cliente
     * @return true si tiene al menos una arma asignada, false en caso contrario
     */
    public boolean tieneArmasAsignadas(Long clienteId) {
        List<ClienteArma> armasAsignadas = clienteArmaRepository.findByClienteIdAndEstado(
            clienteId, ClienteArma.EstadoClienteArma.ASIGNADA);
        return armasAsignadas != null && !armasAsignadas.isEmpty();
    }
    
    /**
     * Crear una nueva reserva de arma para un cliente
     */
    public ClienteArmaDTO crearReserva(Long clienteId, Long armaId, Integer cantidad, BigDecimal precioUnitario) {
        log.info("MÉTODO crearReserva INICIADO - Cliente: {}, Arma: {}", clienteId, armaId);
        log.info("Creando reserva de arma {} para cliente {}", armaId, clienteId);
        
        // Validar que el cliente existe
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        // Validar que el arma existe
        Arma arma = armaRepository.findById(armaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
        
        // Obtener reservas activas del cliente (no canceladas ni completadas)
        List<ClienteArma> reservasActivas = clienteArmaRepository.findByClienteIdWithArmaAndCategoria(clienteId).stream()
            .filter(ca -> !ca.estaCancelada()) // Solo las que no estén canceladas
            .filter(ca -> !ca.estaCompletada()) // No las completadas (ya entregadas)
            .collect(java.util.stream.Collectors.toList());
        
        // Validar límites según tipo de cliente
        if (cliente.getTipoCliente() != null) {
            String tipoClienteCodigo = cliente.getTipoCliente().getCodigo();
            String tipoClienteNombre = cliente.getTipoCliente().getNombre();
            boolean esCivil = "CIVIL".equals(tipoClienteCodigo) || 
                             "Civil".equalsIgnoreCase(tipoClienteNombre) ||
                             "Cliente Civil".equalsIgnoreCase(tipoClienteNombre);
            
            if (esCivil) {
                // Cliente Civil: máximo 2 armas
                if (reservasActivas.size() >= 2) {
                    throw new BadRequestException(
                        String.format("Cliente Civil puede solicitar máximo 2 armas. " +
                                    "Actualmente tiene %d reserva(s) activa(s). " +
                                    "Debe cancelar una reserva antes de crear una nueva.", 
                                    reservasActivas.size()));
                }
                
                // Verificar que no exista ya una reserva de la misma arma
                boolean existeMismaArma = reservasActivas.stream()
                    .anyMatch(ca -> ca.getArma().getId().equals(armaId));
                
                if (existeMismaArma) {
                    throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
                }
                
                log.info("Cliente Civil detectado. Reservas activas: {}/2", reservasActivas.size());
            } else {
                // Para otros tipos (Deportista, Militar, etc.): sin límite
                // Pero verificamos que no exista ya una reserva de la misma arma
                boolean existeMismaArma = reservasActivas.stream()
                    .anyMatch(ca -> ca.getArma().getId().equals(armaId));
                
                if (existeMismaArma) {
                    throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
                }
                
                log.info("Cliente tipo {} detectado. Sin límite de armas. Reservas activas: {}",
                        tipoClienteNombre, reservasActivas.size());
            }
        } else {
            // Si no tiene tipo de cliente definido, comportamiento conservador: máximo 2 armas
            if (reservasActivas.size() >= 2) {
                throw new BadRequestException(
                    String.format("El cliente puede solicitar máximo 2 armas. " +
                                "Actualmente tiene %d reserva(s) activa(s).", 
                                reservasActivas.size()));
            }
            
            // Verificar que no exista ya una reserva de la misma arma
            boolean existeMismaArma = reservasActivas.stream()
                .anyMatch(ca -> ca.getArma().getId().equals(armaId));
            
            if (existeMismaArma) {
                throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
            }
        }
        
        // Validar cantidad
        if (cantidad == null || cantidad <= 0) {
            cantidad = 1;
        }
        
        // NOTA: No cancelamos reservas anteriores automáticamente ahora
        // El frontend puede crear múltiples reservas si el tipo de cliente lo permite
        // Las reservas anteriores solo se cancelan si el usuario lo hace explícitamente
        
        // NOTA: No validamos stock aquí porque estas son armas para importación
        // que aún no están físicamente disponibles. Se reservan para el cliente
        // y se importarán posteriormente.
        log.info("Reservando arma ID={}, cantidad={} para cliente (proceso de importación - sin validación de stock)", armaId, cantidad);
        
        // Validar que el cliente tenga todos sus documentos obligatorios completos y aprobados
        // EXCEPCIÓN: Los clientes fantasma (PENDIENTE_ASIGNACION_CLIENTE) no requieren documentos
        // ya que son temporales y solo sirven para almacenar armas del vendedor
        if (cliente.getEstado() != EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(clienteId);
            if (!documentosCompletos) {
                throw new BadRequestException("El cliente no tiene todos sus documentos obligatorios completos. " +
                        "Debe cargar y aprobar todos los documentos requeridos antes de seleccionar un arma.");
            }
        } else {
            log.info("Cliente fantasma detectado - omitiendo validación de documentos obligatorios");
        }
        
        // Crear la reserva
        ClienteArma clienteArma = new ClienteArma();
        clienteArma.setCliente(cliente);
        clienteArma.setArma(arma);
        clienteArma.setCantidad(cantidad);
        clienteArma.setPrecioUnitario(precioUnitario);
        clienteArma.reservar(); // Usa el nuevo método que establece RESERVADA
        
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva creada exitosamente con ID: {}", saved.getId());
        
        // ASIGNACIÓN AUTOMÁTICA INTELIGENTE: Asignar cliente a grupo basado en la categoría del arma
        // Para cliente fantasma, asignar como CUPO (mismo flujo de civil)
        {
            try {
                // Obtener vendedor del cliente
                Long vendedorId = cliente.getUsuarioCreador() != null ? cliente.getUsuarioCreador().getId() : null;
                
                if (vendedorId != null) {
                    if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
                        ClienteGrupoImportacion asignacion =
                            grupoImportacionClienteService.asignarClienteAGrupoDisponible(cliente, vendedorId);
                        if (asignacion == null) {
                            log.warn("No se encontró grupo CUPO disponible para cliente fantasma ID {}", cliente.getId());
                        }
                    } else {
                        // Obtener categoría del arma
                        Long categoriaArmaId = arma.getCategoria() != null ? arma.getCategoria().getId() : null;
                    
                        if (categoriaArmaId != null) {
                        // Verificar si es segunda arma (para Cliente Civil con 2 armas)
                        // reservasActivas ya incluye la reserva que acabamos de crear (aún no está guardada, pero la contamos)
                        boolean esSegundaArma = reservasActivas.size() >= 1; // Si ya había 1 reserva activa, esta es la segunda
                        
                        // Buscar grupo disponible para esta categoría de arma
                        GrupoImportacion grupoDisponible = 
                            grupoImportacionMatchingService.encontrarGrupoDisponibleParaArma(
                                vendedorId, 
                                cliente, 
                                categoriaArmaId,
                                esSegundaArma
                            );
                        
                        if (grupoDisponible != null) {
                            // Verificar si el cliente ya está asignado a este grupo
                            boolean yaAsignado = clienteGrupoImportacionRepository.existsByClienteAndGrupoImportacion(
                                cliente, grupoDisponible);
                            
                            if (!yaAsignado) {
                                // Crear asignación al grupo (estado PENDIENTE)
                                ClienteGrupoImportacion clienteGrupo = 
                                    new ClienteGrupoImportacion();
                                clienteGrupo.setCliente(cliente);
                                clienteGrupo.setGrupoImportacion(grupoDisponible);
                                clienteGrupo.setEstado(EstadoClienteGrupo.PENDIENTE);
                                clienteGrupo.setFechaAsignacion(java.time.LocalDateTime.now());
                                
                                clienteGrupoImportacionRepository.save(clienteGrupo);
                                
                                log.info("Cliente ID {} asignado automáticamente al grupo ID {} (categoría arma: {}, segunda arma: {})",
                                    cliente.getId(), grupoDisponible.getId(), categoriaArmaId, esSegundaArma);
                            } else {
                                log.info("Cliente ID {} ya está asignado al grupo ID {}",
                                    cliente.getId(), grupoDisponible.getId());
                            }
                        } else {
                            // Si no hay grupo disponible, informar pero solo lanzar excepción si no es cliente fantasma
                            String mensajeError = esSegundaArma
                                ? String.format(
                                    "No se encontró un segundo grupo de importación disponible para asignar la segunda arma del cliente. " +
                                    "El cliente ya está asignado a un grupo para su primera arma. " +
                                    "Solo se procesará la primera arma seleccionada. Por favor, contacte al jefe de ventas para crear grupos adicionales."
                                )
                                : String.format(
                                    "No se encontró grupo de importación disponible para asignar el cliente con arma de categoría %s. " +
                                    "Por favor, comuníquese con el jefe de ventas para crear un grupo de importación o verificar la disponibilidad.",
                                    categoriaArmaId
                                );
                            
                            log.warn("No se encontró grupo disponible para asignar cliente ID {} con arma categoría {} (segunda arma: {})",
                                cliente.getId(), categoriaArmaId, esSegundaArma);
                            
                            throw new BadRequestException(mensajeError);
                        }
                        }
                    }
                }
            } catch (Exception e) {
                // No fallar la creación de la reserva si falla la asignación automática
                log.error("Error en asignación automática a grupo (no crítico): {}", e.getMessage(), e);
            }
        }
        
        // NOTA: El contrato se genera en ClienteCompletoService, no aquí
        log.info("Reserva creada. El contrato será generado por ClienteCompletoService");
        
        return convertirADTO(saved);
    }

    /**
     * Obtener todas las reservas de un cliente
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorCliente(Long clienteId) {
        log.info("Obteniendo reservas para cliente: {}", clienteId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findByClienteIdWithArmaAndCategoria(clienteId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener todas las reservas de una arma
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorArma(Long armaId) {
        log.info("Obteniendo reservas para arma: {}", armaId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findByArmaId(armaId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Confirmar una reserva
     */
    public ClienteArmaDTO confirmarReserva(Long id) {
        log.info("Confirmando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaReservada()) {
            throw new BadRequestException("Solo se pueden confirmar reservas en estado RESERVADA");
        }
        
        clienteArma.completar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva confirmada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Cancelar una reserva
     */
    public ClienteArmaDTO cancelarReserva(Long id) {
        log.info("Cancelando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (clienteArma.estaCancelada() || clienteArma.estaCompletada()) {
            throw new BadRequestException("No se puede cancelar una reserva en estado: " + clienteArma.getEstado());
        }
        
        clienteArma.cancelar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        // NOTA: No devolvemos stock al inventario porque estas son armas para importación
        // que aún no están físicamente disponibles (no tienen stock físico).
        log.info("Reserva cancelada exitosamente: {} (proceso de importación - sin devolución de stock)", id);
        
        return convertirADTO(saved);
    }

    /**
     * Completar una reserva
     */
    public ClienteArmaDTO completarReserva(Long id) {
        log.info("Completando reserva: {}", id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaAsignada()) {
            throw new BadRequestException("Solo se pueden completar reservas asignadas");
        }
        
        clienteArma.completar();
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva completada exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Asignar número de serie a una reserva (pasa a ASIGNADA)
     */
    public ClienteArmaDTO asignarNumeroSerie(Long id, String numeroSerie) {
        log.info("Asignando número de serie {} a reserva: {}", numeroSerie, id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaReservada()) {
            throw new BadRequestException("Solo se pueden asignar números de serie a reservas en estado RESERVADA");
        }
        
        // Validar que el número de serie no esté ya asignado
        if (clienteArmaRepository.existsByNumeroSerie(numeroSerie)) {
            throw new BadRequestException("El número de serie ya está asignado a otra arma");
        }
        
        clienteArma.asignar(numeroSerie);
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        log.info("Número de serie asignado exitosamente: {} - Reserva: {}", numeroSerie, id);
        
        return convertirADTO(saved);
    }

    /**
     * Obtener reservas pendientes para asignación de números de serie
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPendientes() {
        log.info("Obteniendo reservas pendientes para asignación de series");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener reservas pendientes de asignación de número de serie (estado RESERVADA)
     * Con información completa del cliente y arma para el módulo de finanzas
     */
    public List<ClienteArmaDTO> obtenerReservasPendientesAsignacion() {
        log.info("Obteniendo reservas pendientes de asignación de número de serie");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Eliminar una reserva
     */
    public void eliminarReserva(Long id) {
        log.info("Eliminando reserva: {}", id);
        
        clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        // NOTA: No devolvemos stock al inventario porque estas son armas para importación
        // que aún no están físicamente disponibles (no tienen stock físico).
        
        clienteArmaRepository.deleteById(id);
        log.info("Reserva eliminada exitosamente: {}", id);
    }

    /**
     * Obtener estadísticas de reservas
     */
    @Transactional(readOnly = true)
    public ClienteArmaStatsDTO obtenerEstadisticas() {
        long totalReservas = clienteArmaRepository.count();
        long reservasPendientes = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        long reservasAsignadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
        long reservasCanceladas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.CANCELADA);
        long reservasCompletadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.COMPLETADA);
        
        return new ClienteArmaStatsDTO(totalReservas, reservasPendientes, reservasAsignadas, reservasCanceladas, reservasCompletadas);
    }

    /**
     * Obtener armas en stock del vendedor (armas asignadas a clientes fantasma del vendedor)
     * Estas son armas que el vendedor solicitó sin cliente y que pueden ser reasignadas
     * 
     * @param usuarioId ID del vendedor
     * @return Lista de armas en stock del vendedor
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerArmasEnStockVendedor(Long usuarioId) {
        log.info("Obteniendo armas en stock del vendedor ID: {}", usuarioId);
        
        // Buscar clientes fantasma del vendedor
        List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
            usuarioId,
            EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
        );
        
        if (clientesFantasma.isEmpty()) {
            log.info("No se encontraron clientes fantasma para el vendedor, no hay armas en stock");
            return List.of();
        }
        
        // Obtener todas las armas asignadas a estos clientes fantasma
        // Solo armas en estado RESERVADA (no canceladas ni completadas)
        List<ClienteArma> armasEnStock = clientesFantasma.stream()
            .flatMap(cliente -> clienteArmaRepository.findByClienteIdWithArmaAndCategoria(cliente.getId()).stream())
            .filter(ca -> ca.getEstado() == ClienteArma.EstadoClienteArma.RESERVADA 
                       || ca.getEstado() == ClienteArma.EstadoClienteArma.ASIGNADA)
            .collect(Collectors.toList());
        
        log.info("Se encontraron {} armas en stock del vendedor", armasEnStock.size());
        
        return armasEnStock.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Actualizar el arma asignada en una reserva existente
     * Permite al Jefe de Ventas cambiar el arma que un cliente tiene reservada
     * 
     * @param clienteArmaId ID de la relación ClienteArma a actualizar
     * @param nuevaArmaId ID de la nueva arma a asignar
     * @param nuevoPrecioUnitario Nuevo precio unitario (opcional, mantiene el anterior si es null)
     * @return ClienteArmaDTO actualizado
     */
    @Transactional
    public ClienteArmaDTO actualizarArmaReserva(Long clienteArmaId, Long nuevaArmaId, BigDecimal nuevoPrecioUnitario) {
        log.info("Actualizando arma en reserva ID: {}, nueva arma ID: {}", clienteArmaId, nuevaArmaId);
        
        // Obtener la reserva existente
        ClienteArma clienteArma = clienteArmaRepository.findById(clienteArmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + clienteArmaId));
        
        // Validar que el arma existe
        Arma nuevaArma = armaRepository.findById(nuevaArmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + nuevaArmaId));
        
        // Validar que no esté ya asignada o completada (no se puede cambiar si ya fue entregada)
        if (clienteArma.estaAsignada() || clienteArma.estaCompletada()) {
            throw new BadRequestException("No se puede cambiar el arma de una reserva que ya fue asignada o completada");
        }
        
        // Guardar referencia al arma anterior para logging
        Long armaAnteriorId = clienteArma.getArma().getId();
        String nombreArmaAnterior = clienteArma.getArma().getModelo();
        String nombreNuevaArma = nuevaArma.getModelo();
        
        // Actualizar el arma
        clienteArma.setArma(nuevaArma);
        
        // Actualizar precio si se proporciona
        if (nuevoPrecioUnitario != null) {
            clienteArma.setPrecioUnitario(nuevoPrecioUnitario);
        }
        
        // Actualizar fecha de actualización
        clienteArma.setFechaActualizacion(java.time.LocalDateTime.now());
        
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        log.info("Arma actualizada en reserva ID: {} - Anterior: {} (ID: {}), Nueva: {} (ID: {})",
            clienteArmaId, nombreArmaAnterior, armaAnteriorId, nombreNuevaArma, nuevaArmaId);
        
        return convertirADTO(saved);
    }
    
    /**
     * Reasignar un arma de un cliente a otro
     * Útil para transferir armas del stock del vendedor (cliente fantasma) a un cliente real
     * 
     * IMPORTANTE: Valida que el nuevo cliente tenga todos sus documentos obligatorios completos
     * antes de permitir la reasignación. Esto asegura que solo se entreguen armas a clientes
     * con documentación completa.
     * 
     * @param clienteArmaId ID de la relación ClienteArma a reasignar
     * @param nuevoClienteId ID del nuevo cliente al que se asignará el arma
     * @return ClienteArmaDTO actualizado
     */
    @Transactional
    public ClienteArmaDTO reasignarArmaACliente(Long clienteArmaId, Long nuevoClienteId) {
        log.info("Reasignando arma ID {} al cliente ID {}", clienteArmaId, nuevoClienteId);
        
        // Buscar la relación ClienteArma
        ClienteArma clienteArma = clienteArmaRepository.findById(clienteArmaId)
            .orElseThrow(() -> new ResourceNotFoundException("Relación Cliente-Arma no encontrada con ID: " + clienteArmaId));
        
        // Verificar que el nuevo cliente existe
        Cliente nuevoCliente = clienteRepository.findById(nuevoClienteId)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + nuevoClienteId));
        
        // Verificar que la arma esté en un estado válido para reasignación
        if (clienteArma.getEstado() == ClienteArma.EstadoClienteArma.CANCELADA) {
            throw new BadRequestException("No se puede reasignar un arma cancelada");
        }
        
        if (clienteArma.getEstado() == ClienteArma.EstadoClienteArma.COMPLETADA) {
            throw new BadRequestException("No se puede reasignar un arma completada");
        }
        
        // VALIDACIÓN CRÍTICA: Verificar que el nuevo cliente tenga todos sus documentos obligatorios completos
        // Esto asegura que solo se entreguen armas a clientes con documentación completa
        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(nuevoClienteId);
        if (!documentosCompletos) {
            log.warn("Intento de reasignar arma a cliente ID {} sin documentos completos", nuevoClienteId);
            throw new BadRequestException("El cliente no tiene todos sus documentos obligatorios completos. " +
                    "Debe cargar y aprobar todos los documentos requeridos antes de poder recibir el arma.");
        }
        
        // Reasignar el arma al nuevo cliente
        Cliente clienteAnterior = clienteArma.getCliente();
        clienteArma.setCliente(nuevoCliente);
        clienteArma.setFechaAsignacion(java.time.LocalDateTime.now());
        // Cambiar el estado del arma a REASIGNADO cuando se reasigna
        clienteArma.setEstado(ClienteArma.EstadoClienteArma.REASIGNADO);
        
        ClienteArma clienteArmaActualizado = clienteArmaRepository.save(clienteArma);
        
        log.info("Arma reasignada exitosamente: de cliente ID {} a cliente ID {} (documentos verificados)",
            clienteAnterior.getId(), nuevoClienteId);
        
        return convertirADTO(clienteArmaActualizado);
    }

    /**
     * Obtener todas las armas con estado REASIGNADO
     * Estas son armas que fueron reasignadas y están esperando ser asignadas a un nuevo cliente
     * 
     * @return Lista de armas reasignadas con información del cliente anterior
     */
    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerArmasReasignadas() {
        log.info("Obteniendo armas con estado REASIGNADO");
        
        List<ClienteArma> armasReasignadas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.REASIGNADO);
        
        log.info("Se encontraron {} armas reasignadas", armasReasignadas.size());
        
        return armasReasignadas.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convertir entidad a DTO
     */
    private ClienteArmaDTO convertirADTO(ClienteArma clienteArma) {
        ClienteArmaDTO dto = new ClienteArmaDTO();
        dto.setId(clienteArma.getId());
        dto.setClienteId(clienteArma.getCliente().getId());
        dto.setClienteNombre(clienteArma.getCliente().getNombreCompleto());
        dto.setArmaId(clienteArma.getArma().getId());
        dto.setArmaNombre(clienteArma.getArma().getModelo());
        dto.setArmaModelo(clienteArma.getArma().getModelo());
        dto.setArmaCodigo(clienteArma.getArma().getCodigo());
        dto.setArmaCalibre(clienteArma.getArma().getCalibre());
        dto.setArmaCategoriaNombre(clienteArma.getArma().getCategoria() != null ? clienteArma.getArma().getCategoria().getNombre() : null);
        dto.setArmaImagen(clienteArma.getArma().getUrlImagen());
        dto.setCantidad(clienteArma.getCantidad());
        dto.setPrecioUnitario(clienteArma.getPrecioUnitario());
        dto.setEstado(clienteArma.getEstado().name());
        dto.setNumeroSerie(clienteArma.getNumeroSerie());
        dto.setFechaAsignacion(clienteArma.getFechaAsignacion());
        dto.setFechaCreacion(clienteArma.getFechaCreacion());
        dto.setFechaActualizacion(clienteArma.getFechaActualizacion());
        return dto;
    }


    /**
     * DTO para estadísticas
     */
    public static class ClienteArmaStatsDTO {
        private final long totalReservas;
        private final long reservasPendientes;
        private final long reservasConfirmadas;
        private final long reservasCanceladas;
        private final long reservasCompletadas;

        public ClienteArmaStatsDTO(long totalReservas, long reservasPendientes, long reservasConfirmadas, 
                                 long reservasCanceladas, long reservasCompletadas) {
            this.totalReservas = totalReservas;
            this.reservasPendientes = reservasPendientes;
            this.reservasConfirmadas = reservasConfirmadas;
            this.reservasCanceladas = reservasCanceladas;
            this.reservasCompletadas = reservasCompletadas;
        }

        // Getters
        public long getTotalReservas() { return totalReservas; }
        public long getReservasPendientes() { return reservasPendientes; }
        public long getReservasConfirmadas() { return reservasConfirmadas; }
        public long getReservasCanceladas() { return reservasCanceladas; }
        public long getReservasCompletadas() { return reservasCompletadas; }
    }
}
