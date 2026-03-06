package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteArmaDTO;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.model.Pago;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoCuotaPago;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.enums.TipoPago;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.service.helper.documentos.DocumentoPDFUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final NotificacionService notificacionService;
    private final PagoRepository pagoRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final ConfiguracionSistemaService configuracionSistemaService;
    private final DocumentoPDFUtils documentoPDFUtils;

    /**
     * Verifica si un cliente tiene armas asignadas (RESERVADA o ASIGNADA).
     * RESERVADA = arma seleccionada pero sin número de serie.
     * ASIGNADA = arma confirmada con número de serie.
     */
    public boolean tieneArmasAsignadas(Long clienteId) {
        List<ClienteArma> armas = clienteArmaRepository.findByClienteIdInAndEstadoIn(
            List.of(clienteId),
            List.of(ClienteArma.EstadoClienteArma.RESERVADA, ClienteArma.EstadoClienteArma.ASIGNADA));
        return armas != null && !armas.isEmpty();
    }
    
    public ClienteArmaDTO crearReserva(Long clienteId, Long armaId, Integer cantidad, BigDecimal precioUnitario) {
        log.info("MÉTODO crearReserva INICIADO - Cliente: {}, Arma: {}", clienteId, armaId);
        log.info("Creando reserva de arma {} para cliente {}", armaId, clienteId);
        
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        Arma arma = armaRepository.findById(armaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
        
        List<ClienteArma> reservasActivas = clienteArmaRepository.findActiveByClienteIdWithArmaAndCategoria(clienteId).stream()
            .filter(ca -> !ca.estaCompletada()) // No las completadas (ya entregadas)
            .collect(java.util.stream.Collectors.toList());
        
        if (cliente.getTipoCliente() != null) {
            String tipoClienteCodigo = cliente.getTipoCliente().getCodigo();
            String tipoClienteNombre = cliente.getTipoCliente().getNombre();
            boolean esCivil = "CIVIL".equals(tipoClienteCodigo) || 
                             "Civil".equalsIgnoreCase(tipoClienteNombre) ||
                             "Cliente Civil".equalsIgnoreCase(tipoClienteNombre);
            
            if (esCivil) {
                if (reservasActivas.size() >= 2) {
                    throw new BadRequestException(
                        String.format("Cliente Civil puede solicitar máximo 2 armas. " +
                                    "Actualmente tiene %d reserva(s) activa(s). " +
                                    "Debe cancelar una reserva antes de crear una nueva.", 
                                    reservasActivas.size()));
                }
                
                boolean existeMismaArma = reservasActivas.stream()
                    .anyMatch(ca -> ca.getArma().getId().equals(armaId));

                if (existeMismaArma) {
                    throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
                }

                log.info("Cliente Civil detectado. Reservas activas: {}/2", reservasActivas.size());
            } else {
                boolean existeMismaArma = reservasActivas.stream()
                    .anyMatch(ca -> ca.getArma().getId().equals(armaId));
                
                if (existeMismaArma) {
                    throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
                }
                
                log.info("Cliente tipo {} detectado. Sin límite de armas. Reservas activas: {}",
                        tipoClienteNombre, reservasActivas.size());
            }
        } else {
            // Comportamiento conservador si no tiene tipo: máximo 2 armas
            if (reservasActivas.size() >= 2) {
                throw new BadRequestException(
                    String.format("El cliente puede solicitar máximo 2 armas. " +
                                "Actualmente tiene %d reserva(s) activa(s).", 
                                reservasActivas.size()));
            }
            
            boolean existeMismaArma = reservasActivas.stream()
                .anyMatch(ca -> ca.getArma().getId().equals(armaId));

            if (existeMismaArma) {
                throw new BadRequestException("Ya existe una reserva activa de esta arma para este cliente");
            }
        }

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
        
        ClienteArma clienteArma = new ClienteArma();
        clienteArma.setCliente(cliente);
        clienteArma.setArma(arma);
        clienteArma.setCantidad(cantidad);
        clienteArma.setPrecioUnitario(precioUnitario);
        clienteArma.reservar(); // Usa el nuevo método que establece RESERVADA
        
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        log.info("Reserva creada exitosamente con ID: {}", saved.getId());
        
        // ASIGNACIÓN AUTOMÁTICA INTELIGENTE: Asignar cliente a grupo basado en la categoría del arma
        List<String> advertencias = new ArrayList<>();

        try {
            Long vendedorId = cliente.getUsuarioCreador() != null ? cliente.getUsuarioCreador().getId() : null;

            if (vendedorId != null) {
                if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
                    ClienteGrupoImportacion asignacion =
                        grupoImportacionClienteService.asignarClienteAGrupoDisponible(cliente, vendedorId);
                    if (asignacion == null) {
                        saved.ponerEnEspera();
                        saved = clienteArmaRepository.save(saved);
                        advertencias.add("No se encontró grupo CUPO disponible. El arma quedó en espera de asignación.");
                        notificarArmaEnEsperaSeguro(cliente.getNombreCompleto(),
                            arma.getCategoria() != null ? arma.getCategoria().getNombre() : "Sin categoría");
                    }
                } else {
                    Long categoriaArmaId = arma.getCategoria() != null ? arma.getCategoria().getId() : null;
                    String categoriaNombre = arma.getCategoria() != null ? arma.getCategoria().getNombre() : "Sin categoría";

                    if (categoriaArmaId != null) {
                        boolean esSegundaArma = reservasActivas.size() >= 1;

                        String grupoPrimeraArmaNombre = null;
                        if (esSegundaArma) {
                            List<ClienteGrupoImportacion> asignacionesExistentes = clienteGrupoImportacionRepository.findByClienteId(clienteId);
                            grupoPrimeraArmaNombre = asignacionesExistentes.stream()
                                .filter(cgi -> cgi.getEstado() != EstadoClienteGrupo.CANCELADO && cgi.getEstado() != EstadoClienteGrupo.COMPLETADO)
                                .map(cgi -> cgi.getGrupoImportacion().getNombre())
                                .findFirst().orElse(null);
                        }

                        GrupoImportacion grupoDisponible =
                            grupoImportacionMatchingService.encontrarGrupoDisponibleParaArma(
                                vendedorId, cliente, categoriaArmaId, esSegundaArma);

                        if (grupoDisponible != null) {
                            boolean yaAsignado = clienteGrupoImportacionRepository.existsByClienteAndGrupoImportacion(
                                cliente, grupoDisponible);

                            if (!yaAsignado) {
                                ClienteGrupoImportacion clienteGrupo = new ClienteGrupoImportacion();
                                clienteGrupo.setCliente(cliente);
                                clienteGrupo.setGrupoImportacion(grupoDisponible);
                                clienteGrupo.setEstado(EstadoClienteGrupo.PENDIENTE);
                                clienteGrupo.setFechaAsignacion(java.time.LocalDateTime.now());
                                clienteGrupoImportacionRepository.save(clienteGrupo);

                                log.info("Cliente ID {} asignado al grupo ID {} (categoría: {}, segunda arma: {})",
                                    cliente.getId(), grupoDisponible.getId(), categoriaArmaId, esSegundaArma);
                            }

                            if (esSegundaArma && grupoPrimeraArmaNombre != null
                                && !grupoPrimeraArmaNombre.equals(grupoDisponible.getNombre())) {
                                String advertenciaSplit = String.format(
                                    "Esta arma fue asignada al grupo \"%s\" porque el grupo \"%s\" no tiene cupo disponible para esta categoría.",
                                    grupoDisponible.getNombre(), grupoPrimeraArmaNombre);
                                advertencias.add(advertenciaSplit);
                                notificarSplitSeguro(cliente.getNombreCompleto(), grupoPrimeraArmaNombre, grupoDisponible.getNombre());
                            }

                            verificarYNotificarCupoBajo(grupoDisponible, categoriaArmaId, categoriaNombre);

                        } else {
                            saved.ponerEnEspera();
                            saved = clienteArmaRepository.save(saved);

                            String mensajeEspera = esSegundaArma
                                ? String.format("La segunda arma (%s) quedó en espera porque no hay grupo CUPO disponible. " +
                                    "Se asignará automáticamente cuando se cree un nuevo grupo.", categoriaNombre)
                                : String.format("El arma (%s) quedó en espera porque no hay grupo CUPO disponible. " +
                                    "Se asignará automáticamente cuando se cree un nuevo grupo.", categoriaNombre);
                            advertencias.add(mensajeEspera);

                            notificarArmaEnEsperaSeguro(cliente.getNombreCompleto(), categoriaNombre);

                            log.warn("Arma en espera: cliente ID {} con arma categoría {} (segunda arma: {})",
                                cliente.getId(), categoriaArmaId, esSegundaArma);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error en asignación automática a grupo (no crítico): {}", e.getMessage(), e);
            advertencias.add("Error en asignación automática: " + e.getMessage());
        }

        log.info("Reserva creada. El contrato será generado por ClienteCompletoService");

        ClienteArmaDTO resultado = convertirADTO(saved);
        resultado.setAdvertencias(advertencias);
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorCliente(Long clienteId) {
        log.info("Obteniendo reservas para cliente: {}", clienteId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findActiveByClienteIdWithArmaAndCategoria(clienteId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPorArma(Long armaId) {
        log.info("Obteniendo reservas para arma: {}", armaId);
        
        List<ClienteArma> reservas = clienteArmaRepository.findByArmaId(armaId);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

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

    public ClienteArmaDTO asignarNumeroSerie(Long id, String numeroSerie) {
        log.info("Asignando número de serie {} a reserva: {}", numeroSerie, id);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        if (!clienteArma.estaReservada()) {
            throw new BadRequestException("Solo se pueden asignar números de serie a reservas en estado RESERVADA");
        }
        
        if (clienteArmaRepository.existsByNumeroSerie(numeroSerie)) {
            throw new BadRequestException("El número de serie ya está asignado a otra arma");
        }
        
        clienteArma.asignar(numeroSerie);
        ClienteArma saved = clienteArmaRepository.save(clienteArma);
        
        log.info("Número de serie asignado exitosamente: {} - Reserva: {}", numeroSerie, id);
        
        return convertirADTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerReservasPendientes() {
        log.info("Obteniendo reservas pendientes para asignación de series");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<ClienteArmaDTO> obtenerReservasPendientesAsignacion() {
        log.info("Obteniendo reservas pendientes de asignación de número de serie");
        
        List<ClienteArma> reservas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        return reservas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public void eliminarReserva(Long id) {
        log.info("Eliminando reserva: {}", id);
        
        clienteArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));
        
        // NOTA: No devolvemos stock al inventario porque estas son armas para importación
        // que aún no están físicamente disponibles (no tienen stock físico).
        
        clienteArmaRepository.deleteById(id);
        log.info("Reserva eliminada exitosamente: {}", id);
    }

    @Transactional(readOnly = true)
    public ClienteArmaStatsDTO obtenerEstadisticas() {
        long totalReservas = clienteArmaRepository.count();
        long reservasPendientes = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        long reservasAsignadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.ASIGNADA);
        long reservasCanceladas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.CANCELADA);
        long reservasCompletadas = clienteArmaRepository.countByEstado(ClienteArma.EstadoClienteArma.COMPLETADA);
        
        return new ClienteArmaStatsDTO(totalReservas, reservasPendientes, reservasAsignadas, reservasCanceladas, reservasCompletadas);
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerArmasEnStockVendedor(Long usuarioId) {
        log.info("Obteniendo armas en stock del vendedor ID: {}", usuarioId);
        
        List<Cliente> clientesFantasma = clienteRepository.findByUsuarioCreadorIdAndEstado(
            usuarioId,
            EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE
        );
        
        if (clientesFantasma.isEmpty()) {
            log.info("No se encontraron clientes fantasma para el vendedor, no hay armas en stock");
            return List.of();
        }
        
        List<ClienteArma> armasEnStock = clientesFantasma.stream()
            .flatMap(cliente -> clienteArmaRepository.findActiveByClienteIdWithArmaAndCategoria(cliente.getId()).stream())
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
        log.info("Cambio de arma solicitado - reserva ID: {}, nueva arma ID: {}", clienteArmaId, nuevaArmaId);

        ClienteArma clienteArmaAnterior = clienteArmaRepository.findById(clienteArmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + clienteArmaId));

        Arma nuevaArma = armaRepository.findById(nuevaArmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + nuevaArmaId));

        if (clienteArmaAnterior.estaCompletada()) {
            throw new BadRequestException("No se puede cambiar el arma de una reserva que ya fue completada/entregada");
        }

        Long clienteId = clienteArmaAnterior.getCliente().getId();
        List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(clienteId);
        for (ClienteGrupoImportacion cg : gruposCliente) {
            if (cg.getGrupoImportacion() != null) {
                EstadoGrupoImportacion estadoGrupo = cg.getGrupoImportacion().getEstado();
                if (estadoGrupo != EstadoGrupoImportacion.BORRADOR
                    && estadoGrupo != EstadoGrupoImportacion.EN_PREPARACION
                    && estadoGrupo != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES) {
                    throw new BadRequestException(
                        "No se puede cambiar el arma después de que se definió el pedido del grupo de importación");
                }
            }
        }

        List<Pago> pagosCliente = pagoRepository.findByClienteIdOrderByIdDesc(clienteId);
        Pago pagoAnterior = pagosCliente.stream()
            .filter(p -> p.getEstado() != EstadoPago.CANCELADO)
            .findFirst()
            .orElse(null);

        if (pagoAnterior != null) {
            List<CuotaPago> cuotasPagadas = cuotaPagoRepository
                .findByPagoIdAndEstado(pagoAnterior.getId(), EstadoCuotaPago.PAGADA);
            if (cuotasPagadas != null && !cuotasPagadas.isEmpty()) {
                throw new BadRequestException(
                    "No se puede cambiar el arma porque ya existen cuotas pagadas. Contacte al administrador.");
            }
        }

        String nombreArmaAnterior = clienteArmaAnterior.getArma().getModelo();
        String nombreNuevaArma = nuevaArma.getModelo();
        Cliente cliente = clienteArmaAnterior.getCliente();
        Integer cantidadAnterior = clienteArmaAnterior.getCantidad();
        log.info("CAMBIO DE ARMA - Cliente ID: {}, Anterior: {} (ID: {}), Nueva: {} (ID: {})",
            clienteId, nombreArmaAnterior, clienteArmaAnterior.getArma().getId(), nombreNuevaArma, nuevaArmaId);

        clienteArmaRepository.delete(clienteArmaAnterior);
        log.info("ClienteArma anterior ID: {} eliminado", clienteArmaId);

        BigDecimal precioNuevo = nuevoPrecioUnitario != null ? nuevoPrecioUnitario : nuevaArma.getPrecioReferencia();
        ClienteArma nuevoClienteArma = new ClienteArma();
        nuevoClienteArma.setCliente(cliente);
        nuevoClienteArma.setArma(nuevaArma);
        nuevoClienteArma.setCantidad(cantidadAnterior);
        nuevoClienteArma.setPrecioUnitario(precioNuevo);
        nuevoClienteArma.setEstado(ClienteArma.EstadoClienteArma.RESERVADA);
        nuevoClienteArma.setFechaAsignacion(LocalDateTime.now());
        ClienteArma saved = clienteArmaRepository.save(nuevoClienteArma);
        log.info("Nuevo ClienteArma creado con ID: {}, arma: {}, precio: {}", saved.getId(), nombreNuevaArma, precioNuevo);

        if (pagoAnterior != null) {
            recalcularPago(pagoAnterior, precioNuevo, clienteId);
        }

        eliminarDocumentosGenerados(clienteId);

        return convertirADTO(saved);
    }

    private void recalcularPago(Pago pagoAnterior, BigDecimal nuevoPrecioBase, Long clienteId) {
        double ivaDecimal;
        try {
            String ivaValor = configuracionSistemaService.getValorConfiguracion("IVA");
            ivaDecimal = Double.parseDouble(ivaValor) / 100.0;
        } catch (Exception e) {
            log.warn("Error obteniendo IVA del sistema, usando 15%: {}", e.getMessage());
            ivaDecimal = 0.15;
        }

        List<CuotaPago> cuotasAnteriores = cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pagoAnterior.getId());
        cuotaPagoRepository.deleteAll(cuotasAnteriores);
        log.info("Eliminadas {} cuotas del pago anterior ID: {}", cuotasAnteriores.size(), pagoAnterior.getId());

        Long pagoAnteriorId = pagoAnterior.getId();
        pagoRepository.delete(pagoAnterior);
        log.info("Pago anterior ID: {} eliminado por cambio de arma", pagoAnteriorId);

        BigDecimal subtotal = nuevoPrecioBase;
        BigDecimal montoIva = subtotal.multiply(BigDecimal.valueOf(ivaDecimal)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal montoTotal = subtotal.add(montoIva);

        TipoPago tipoPago = pagoAnterior.getTipoPago();
        Integer numeroCuotas = pagoAnterior.getNumeroCuotas();
        BigDecimal montoCuota = montoTotal.divide(BigDecimal.valueOf(numeroCuotas), 2, RoundingMode.HALF_UP);

        Pago nuevoPago = new Pago();
        nuevoPago.setClienteId(clienteId);
        nuevoPago.setSubtotal(subtotal);
        nuevoPago.setMontoIva(montoIva);
        nuevoPago.setMontoTotal(montoTotal);
        nuevoPago.setTipoPago(tipoPago);
        nuevoPago.setNumeroCuotas(numeroCuotas);
        nuevoPago.setMontoCuota(montoCuota);
        nuevoPago.setMontoPagado(BigDecimal.ZERO);
        nuevoPago.setMontoPendiente(montoTotal);
        nuevoPago.setEstado(EstadoPago.PENDIENTE);
        nuevoPago.setCuotaActual(1);
        nuevoPago.setFechaCreacion(LocalDateTime.now());
        Pago pagoGuardado = pagoRepository.save(nuevoPago);
        log.info("Nuevo pago creado ID: {}, total: {}, tipo: {}, cuotas: {}",
            pagoGuardado.getId(), montoTotal, tipoPago, numeroCuotas);

        if (tipoPago == TipoPago.CREDITO && numeroCuotas > 1) {
            LocalDate fechaVencimiento = LocalDate.now().plusMonths(1);
            for (int i = 1; i <= numeroCuotas; i++) {
                CuotaPago cuota = new CuotaPago();
                cuota.setPago(pagoGuardado);
                cuota.setNumeroCuota(i);
                cuota.setMonto(montoCuota);
                cuota.setFechaVencimiento(fechaVencimiento.plusMonths(i - 1));
                cuota.setEstado(EstadoCuotaPago.PENDIENTE);
                cuotaPagoRepository.save(cuota);
            }
            log.info("Creadas {} cuotas de {} para pago ID: {}", numeroCuotas, montoCuota, pagoGuardado.getId());
        }
    }

    private void eliminarDocumentosGenerados(Long clienteId) {
        try {
            documentoPDFUtils.eliminarDocumentosAnterioresDelTipo(clienteId, TipoDocumentoGenerado.CONTRATO);
            documentoPDFUtils.eliminarDocumentosAnterioresDelTipo(clienteId, TipoDocumentoGenerado.SOLICITUD_COMPRA);
            documentoPDFUtils.eliminarDocumentosAnterioresDelTipo(clienteId, TipoDocumentoGenerado.COTIZACION);
            log.info("Documentos generados eliminados para cliente ID: {} (deben regenerarse)", clienteId);
        } catch (Exception e) {
            log.warn("Error eliminando documentos generados para cliente ID: {}: {}", clienteId, e.getMessage());
        }
    }
    
    /**
     * IMPORTANTE: Valida que el nuevo cliente tenga todos sus documentos obligatorios completos
     * antes de permitir la reasignación. Solo se reasignan armas a clientes con documentación completa.
     */
    @Transactional
    public ClienteArmaDTO reasignarArmaACliente(Long clienteArmaId, Long nuevoClienteId) {
        log.info("Reasignando arma ID {} al cliente ID {}", clienteArmaId, nuevoClienteId);
        
        ClienteArma clienteArma = clienteArmaRepository.findById(clienteArmaId)
            .orElseThrow(() -> new ResourceNotFoundException("Relación Cliente-Arma no encontrada con ID: " + clienteArmaId));
        
        Cliente nuevoCliente = clienteRepository.findById(nuevoClienteId)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + nuevoClienteId));
        
        if (clienteArma.getEstado() == ClienteArma.EstadoClienteArma.CANCELADA) {
            throw new BadRequestException("No se puede reasignar un arma cancelada");
        }
        
        if (clienteArma.getEstado() == ClienteArma.EstadoClienteArma.COMPLETADA) {
            throw new BadRequestException("No se puede reasignar un arma completada");
        }
        
        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(nuevoClienteId);
        if (!documentosCompletos) {
            log.warn("Intento de reasignar arma a cliente ID {} sin documentos completos", nuevoClienteId);
            throw new BadRequestException("El cliente no tiene todos sus documentos obligatorios completos. " +
                    "Debe cargar y aprobar todos los documentos requeridos antes de poder recibir el arma.");
        }
        
        Cliente clienteAnterior = clienteArma.getCliente();
        clienteArma.setCliente(nuevoCliente);
        clienteArma.setFechaAsignacion(java.time.LocalDateTime.now());
        clienteArma.setEstado(ClienteArma.EstadoClienteArma.REASIGNADO);
        
        ClienteArma clienteArmaActualizado = clienteArmaRepository.save(clienteArma);
        
        log.info("Arma reasignada exitosamente: de cliente ID {} a cliente ID {} (documentos verificados)",
            clienteAnterior.getId(), nuevoClienteId);
        
        return convertirADTO(clienteArmaActualizado);
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerArmasReasignadas() {
        log.info("Obteniendo armas con estado REASIGNADO");
        
        List<ClienteArma> armasReasignadas = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.REASIGNADO);
        
        log.info("Se encontraron {} armas reasignadas", armasReasignadas.size());
        
        return armasReasignadas.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }
    
    private void verificarYNotificarCupoBajo(GrupoImportacion grupo, Long categoriaArmaId, String categoriaNombre) {
        try {
            Map<Long, Integer> cupos = grupoImportacionMatchingService.calcularCuposDisponiblesPorCategoria(grupo.getId());
            Integer cuposRestantes = cupos.get(categoriaArmaId);
            if (cuposRestantes == null) return;

            int limiteMaximo = cuposRestantes; // fallback
            if (grupo.getLimitesCategoria() != null) {
                limiteMaximo = grupo.getLimitesCategoria().stream()
                    .filter(l -> l.getCategoriaArma().getId().equals(categoriaArmaId))
                    .findFirst()
                    .map(l -> l.getLimiteMaximo())
                    .orElse(cuposRestantes);
            }

            if (cuposRestantes <= NotificacionService.getUmbralAlertaAmarilla()) {
                notificacionService.notificarCupoBajo(
                    grupo.getId(), grupo.getNombre(), categoriaNombre, cuposRestantes, limiteMaximo);
            }
        } catch (Exception e) {
            log.warn("Error verificando cupo bajo (no crítico): {}", e.getMessage());
        }
    }

    private void notificarArmaEnEsperaSeguro(String clienteNombre, String categoriaNombre) {
        try {
            notificacionService.notificarArmaEnEspera(clienteNombre, categoriaNombre);
        } catch (Exception e) {
            log.warn("Error notificando arma en espera (no crítico): {}", e.getMessage());
        }
    }

    private void notificarSplitSeguro(String clienteNombre, String grupo1, String grupo2) {
        try {
            notificacionService.notificarArmasDistribuidasEnGrupos(clienteNombre, grupo1, grupo2);
        } catch (Exception e) {
            log.warn("Error notificando split de grupos (no crítico): {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ClienteArmaDTO> obtenerArmasEnEspera() {
        log.info("Obteniendo armas en estado EN_ESPERA");
        List<ClienteArma> armasEnEspera = clienteArmaRepository.findByEstado(ClienteArma.EstadoClienteArma.EN_ESPERA);
        log.info("Se encontraron {} armas en espera", armasEnEspera.size());
        return armasEnEspera.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }

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

        public long getTotalReservas() { return totalReservas; }
        public long getReservasPendientes() { return reservasPendientes; }
        public long getReservasConfirmadas() { return reservasConfirmadas; }
        public long getReservasCanceladas() { return reservasCanceladas; }
        public long getReservasCompletadas() { return reservasCompletadas; }
    }
}
