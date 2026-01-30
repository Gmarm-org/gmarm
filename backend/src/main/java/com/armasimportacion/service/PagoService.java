package com.armasimportacion.service;

import com.armasimportacion.dto.CuotaPagoCreateDTO;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.repository.ClienteRepository;
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
    private final ClienteRepository clienteRepository;
    private final com.armasimportacion.service.helper.GestionDocumentosServiceHelper gestionDocumentosServiceHelper;
    private final com.armasimportacion.service.EmailService emailService;
    private final com.armasimportacion.repository.ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    private final LicenciaService licenciaService;
    private final FileStorageService fileStorageService;

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
        return pagarCuota(cuotaId, referenciaPago, usuarioConfirmadorId, null, null, null, null);
    }

    public CuotaPago pagarCuota(Long cuotaId, String referenciaPago, Long usuarioConfirmadorId, 
                                BigDecimal monto, String numeroRecibo, String comprobanteArchivo, String observaciones) {
        Optional<CuotaPago> cuotaOpt = cuotaPagoRepository.findById(cuotaId);
        if (cuotaOpt.isEmpty()) {
            throw new IllegalArgumentException("Cuota no encontrada");
        }

        CuotaPago cuota = cuotaOpt.get();
        Pago pago = cuota.getPago();
        
        // Si la cuota ya estaba pagada, revertir el monto anterior
        BigDecimal montoAnterior = BigDecimal.ZERO;
        if (cuota.getEstado() == com.armasimportacion.enums.EstadoCuotaPago.PAGADA) {
            montoAnterior = cuota.getMonto();
            pago.setMontoPagado(pago.getMontoPagado().subtract(montoAnterior));
            pago.setMontoPendiente(pago.getMontoPendiente().add(montoAnterior));
        }
        
        Cliente cliente = clienteRepository.findById(pago.getClienteId())
            .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        // Actualizar monto si se proporciona uno nuevo
        BigDecimal montoAPagar = monto != null ? monto : cuota.getMonto();
        BigDecimal montoAnteriorCuota = cuota.getMonto();
        boolean montoCambio = montoAPagar.compareTo(montoAnteriorCuota) != 0;
        
        cuota.setMonto(montoAPagar);
        cuota.setEstado(com.armasimportacion.enums.EstadoCuotaPago.PAGADA);
        cuota.setFechaPago(LocalDateTime.now());
        cuota.setReferenciaPago(referenciaPago);
        if (cuota.getNumeroRecibo() == null || cuota.getNumeroRecibo().trim().isEmpty()) {
            cuota.setNumeroRecibo(generarNumeroReciboUnico(cliente));
        }
        if (comprobanteArchivo != null) {
            cuota.setComprobanteArchivo(comprobanteArchivo);
        }
        if (observaciones != null) {
            cuota.setObservaciones(observaciones);
        }
        
        // Actualizar el pago principal con el nuevo monto
        pago.setMontoPagado(pago.getMontoPagado().subtract(montoAnterior).add(montoAPagar));
        pago.setMontoPendiente(pago.getMontoPendiente().add(montoAnterior).subtract(montoAPagar));

        // SIEMPRE recalcular las cuotas pendientes para:
        // 1. Redistribuir el saldo si el monto cambió
        // 2. CANCELAR las cuotas restantes si el saldo llegó a 0
        recalcularCuotasPendientes(pago);

        // Verificar si el pago está completo
        if (pago.getMontoPendiente().compareTo(BigDecimal.ZERO) <= 0) {
            pago.setEstado(EstadoPago.COMPLETADO);
        } else {
            pago.setEstado(EstadoPago.EN_CURSO);
        }
        
        pagoRepository.save(pago);
        CuotaPago cuotaGuardada = cuotaPagoRepository.save(cuota);
        
        // Generar y enviar recibo automáticamente al cliente
        try {
            DocumentoGenerado recibo = generarRecibo(cuotaId);
            log.info("✅ Recibo generado automáticamente para cuota ID: {}", cuotaId);
            
            // Enviar recibo por correo al cliente
            enviarReciboACliente(cliente, recibo, cuotaGuardada);
            
        } catch (Exception e) {
            log.error("⚠️ Error generando/enviando recibo (no crítico): {}", e.getMessage(), e);
            // No fallar el proceso de pago si falla el envío del recibo
        }
        
        return cuotaGuardada;
    }

    private void crearCuotasAutomaticamente(Pago pago) {
        BigDecimal montoPorCuota = pago.getMontoTotal().divide(BigDecimal.valueOf(pago.getNumeroCuotas()), 2, java.math.RoundingMode.HALF_UP);
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

    private String generarNumeroReciboUnico(Cliente cliente) {
        int year = LocalDate.now().getYear();
        String inicialesImportador = obtenerInicialesImportador(cliente);
        String prefix = String.format("RC-%s-%d-", inicialesImportador, year);
        Integer maxSeq = cuotaPagoRepository.findMaxReciboSequence(prefix + "%");
        int nextSeq = (maxSeq == null) ? 100 : maxSeq + 1;
        return String.format("RC-%s-%d-%06d", inicialesImportador, year, nextSeq);
    }

    private String obtenerInicialesImportador(Cliente cliente) {
        try {
            List<com.armasimportacion.model.ClienteGrupoImportacion> gruposCliente =
                clienteGrupoImportacionRepository.findByClienteId(cliente.getId());
            for (com.armasimportacion.model.ClienteGrupoImportacion cgi : gruposCliente) {
                if (cgi.getGrupoImportacion() == null) {
                    continue;
                }
                com.armasimportacion.enums.EstadoGrupoImportacion estado = cgi.getGrupoImportacion().getEstado();
                if (estado != com.armasimportacion.enums.EstadoGrupoImportacion.COMPLETADO &&
                    estado != com.armasimportacion.enums.EstadoGrupoImportacion.CANCELADO) {
                    String iniciales = licenciaService.obtenerInicialesImportadorDesdeLicencia(
                        cgi.getGrupoImportacion().getLicencia());
                    if (!iniciales.isEmpty()) {
                        return iniciales;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ No se pudo obtener iniciales desde licencia, usando fallback: {}", e.getMessage());
        }
        return licenciaService.obtenerInicialesFallback();
    }

    public List<CuotaPago> obtenerCuotasVencidas() {
        return cuotaPagoRepository.findCuotasVencidas(LocalDate.now());
    }

    public List<CuotaPago> obtenerCuotasPorCliente(Long clienteId) {
        return cuotaPagoRepository.findByClienteIdOrderByVencimiento(clienteId);
    }

    public CuotaPago crearCuotaManual(Long pagoId, CuotaPagoCreateDTO dto) {
        Optional<Pago> pagoOpt = pagoRepository.findById(pagoId);
        if (pagoOpt.isEmpty()) {
            throw new IllegalArgumentException("Pago no encontrado");
        }

        Pago pago = pagoOpt.get();
        
        // Obtener todas las cuotas existentes
        List<CuotaPago> cuotasExistentes = cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pagoId);
        
        // Separar cuotas pagadas de cuotas pendientes
        List<CuotaPago> cuotasPagadas = cuotasExistentes.stream()
            .filter(c -> c.getEstado() == com.armasimportacion.enums.EstadoCuotaPago.PAGADA)
            .collect(java.util.stream.Collectors.toList());
        
        List<CuotaPago> cuotasPendientes = cuotasExistentes.stream()
            .filter(c -> c.getEstado() != com.armasimportacion.enums.EstadoCuotaPago.PAGADA)
            .collect(java.util.stream.Collectors.toList());
        
        // Calcular monto ya pagado
        BigDecimal montoPagado = cuotasPagadas.stream()
            .map(CuotaPago::getMonto)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calcular saldo pendiente (monto total - monto pagado)
        BigDecimal saldoPendiente = pago.getMontoTotal().subtract(montoPagado);
        
        // Obtener el siguiente número de cuota
        int siguienteNumeroCuota = cuotasExistentes.isEmpty() 
            ? 1 
            : cuotasExistentes.stream()
                .mapToInt(CuotaPago::getNumeroCuota)
                .max()
                .orElse(0) + 1;

        // VALIDAR: El monto especificado no debe exceder el saldo pendiente
        BigDecimal montoCuotaNueva = dto.getMonto();
        if (montoCuotaNueva.compareTo(saldoPendiente) > 0) {
            throw new IllegalArgumentException(
                String.format("El monto de la cuota (%.2f) no puede ser mayor al saldo pendiente (%.2f)", 
                    montoCuotaNueva, saldoPendiente));
        }
        
        // Crear nueva cuota con el monto especificado por el usuario
        CuotaPago cuota = new CuotaPago();
        cuota.setPago(pago);
        cuota.setNumeroCuota(dto.getNumeroCuota() != null ? dto.getNumeroCuota() : siguienteNumeroCuota);
        cuota.setFechaVencimiento(dto.getFechaVencimiento());
        cuota.setMonto(montoCuotaNueva); // RESPETAR el monto especificado
        cuota.setEstado(com.armasimportacion.enums.EstadoCuotaPago.PENDIENTE);
        cuota.setReferenciaPago(dto.getReferenciaPago());
        
        if (dto.getUsuarioConfirmadorId() != null) {
            // Crear usuario con solo el ID
            com.armasimportacion.model.Usuario usuario = new com.armasimportacion.model.Usuario();
            usuario.setId(dto.getUsuarioConfirmadorId());
            cuota.setUsuarioConfirmador(usuario);
        }

        // RECALCULAR: Dividir el saldo RESTANTE (después de restar esta cuota) solo entre las cuotas pendientes EXISTENTES
        BigDecimal saldoRestante = saldoPendiente.subtract(montoCuotaNueva);
        
        if (!cuotasPendientes.isEmpty() && saldoRestante.compareTo(BigDecimal.ZERO) > 0) {
            // Dividir saldo restante entre las cuotas pendientes existentes
            int numeroCuotasPendientes = cuotasPendientes.size();
            BigDecimal montoPorCuota = saldoRestante.divide(
                BigDecimal.valueOf(numeroCuotasPendientes), 
                2, 
                java.math.RoundingMode.HALF_UP
            );
            
            // Actualizar montos de cuotas pendientes existentes
            BigDecimal totalRedistribuido = BigDecimal.ZERO;
            for (int i = 0; i < cuotasPendientes.size(); i++) {
                CuotaPago cuotaExistente = cuotasPendientes.get(i);
                // Para la última cuota, asignar lo que sobra para compensar redondeos
                if (i == cuotasPendientes.size() - 1) {
                    BigDecimal montoUltimaCuota = saldoRestante.subtract(totalRedistribuido);
                    cuotaExistente.setMonto(montoUltimaCuota);
                } else {
                    cuotaExistente.setMonto(montoPorCuota);
                    totalRedistribuido = totalRedistribuido.add(montoPorCuota);
                }
                cuotaPagoRepository.save(cuotaExistente);
            }
            
            log.info("✅ Cuotas pendientes recalculadas. Saldo restante: {} distribuido en {} cuotas", 
                saldoRestante, numeroCuotasPendientes);
        } else if (!cuotasPendientes.isEmpty()) {
            log.warn("⚠️ Saldo restante es 0 o negativo. Las cuotas pendientes mantienen su monto original.");
        }
        
        // Guardar nueva cuota
        CuotaPago cuotaGuardada = cuotaPagoRepository.save(cuota);
        
        // El monto total y pendiente del pago NO cambian (solo se redistribuye)
        // El monto pendiente ya es correcto: montoTotal - montoPagado
        pago.setMontoPendiente(saldoPendiente);
        pagoRepository.save(pago);
        
        log.info("✅ Nueva cuota creada con monto {} y cuotas pendientes recalculadas. Saldo restante: {}", 
            montoCuotaNueva, saldoRestante);

        return cuotaGuardada;
    }

    /**
     * Recalcula las cuotas pendientes después de registrar un pago con monto variable
     * Divide el saldo pendiente restante entre las cuotas pendientes
     * Si el saldo es 0 o menor, CANCELA las cuotas pendientes restantes
     */
    private void recalcularCuotasPendientes(Pago pago) {
        log.info("🔄 Recalculando cuotas pendientes para pago ID: {}", pago.getId());

        // Obtener todas las cuotas del pago
        List<CuotaPago> todasLasCuotas = cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pago.getId());

        // Separar cuotas pagadas de pendientes (excluir las ya canceladas)
        List<CuotaPago> cuotasPendientes = todasLasCuotas.stream()
            .filter(c -> c.getEstado() != com.armasimportacion.enums.EstadoCuotaPago.PAGADA &&
                        c.getEstado() != com.armasimportacion.enums.EstadoCuotaPago.CANCELADA)
            .collect(java.util.stream.Collectors.toList());

        if (cuotasPendientes.isEmpty()) {
            log.info("ℹ️ No hay cuotas pendientes para recalcular");
            return;
        }

        // El saldo pendiente ya está actualizado en el pago
        BigDecimal saldoPendiente = pago.getMontoPendiente();

        // Si el saldo pendiente es 0 o menor, CANCELAR todas las cuotas pendientes
        if (saldoPendiente.compareTo(BigDecimal.ZERO) <= 0) {
            log.info("🔄 Saldo pendiente es {} (≤0). Cancelando {} cuotas pendientes restantes.",
                saldoPendiente, cuotasPendientes.size());

            for (CuotaPago cuotaPendiente : cuotasPendientes) {
                cuotaPendiente.setEstado(com.armasimportacion.enums.EstadoCuotaPago.CANCELADA);
                cuotaPendiente.setMonto(BigDecimal.ZERO); // Poner monto en 0 ya que no se debe nada
                cuotaPendiente.setObservaciones("Cuota cancelada - Saldo total cubierto");
                cuotaPagoRepository.save(cuotaPendiente);
                log.info("❌ Cuota #{} cancelada (saldo ya cubierto)", cuotaPendiente.getNumeroCuota());
            }

            log.info("✅ {} cuotas pendientes fueron canceladas porque el saldo total ya fue cubierto",
                cuotasPendientes.size());
            return;
        }

        // Dividir saldo pendiente entre las cuotas pendientes
        int numeroCuotasPendientes = cuotasPendientes.size();
        BigDecimal montoPorCuota = saldoPendiente.divide(
            BigDecimal.valueOf(numeroCuotasPendientes),
            2,
            java.math.RoundingMode.HALF_UP
        );

        // Actualizar montos de cuotas pendientes
        BigDecimal totalRedistribuido = BigDecimal.ZERO;
        for (int i = 0; i < cuotasPendientes.size(); i++) {
            CuotaPago cuotaPendiente = cuotasPendientes.get(i);
            // Para la última cuota, asignar lo que sobra para compensar redondeos
            if (i == cuotasPendientes.size() - 1) {
                BigDecimal montoUltimaCuota = saldoPendiente.subtract(totalRedistribuido);
                cuotaPendiente.setMonto(montoUltimaCuota);
            } else {
                cuotaPendiente.setMonto(montoPorCuota);
                totalRedistribuido = totalRedistribuido.add(montoPorCuota);
            }
            cuotaPagoRepository.save(cuotaPendiente);
        }

        log.info("✅ Cuotas pendientes recalculadas. Saldo pendiente: {} distribuido en {} cuotas",
            saldoPendiente, numeroCuotasPendientes);
    }

    /**
     * Envía el recibo de pago automáticamente al cliente por correo
     */
    private void enviarReciboACliente(Cliente cliente, DocumentoGenerado recibo, CuotaPago cuota) {
        try {
            log.info("📧 Enviando recibo automáticamente al cliente: {}", cliente.getEmail());
            
            if (cliente.getEmail() == null || cliente.getEmail().trim().isEmpty()) {
                log.warn("⚠️ Cliente no tiene email configurado. No se puede enviar recibo.");
                return;
            }
            
            // Leer archivo PDF
            byte[] pdfBytes = fileStorageService.loadFile(recibo.getRutaArchivo());
            
            // Enviar recibo por correo
            List<String> emails = java.util.Arrays.asList(cliente.getEmail());
            String numeroRecibo = cuota.getNumeroRecibo() != null
                ? cuota.getNumeroRecibo()
                : String.format("RC-%s-%d-%06d", obtenerInicialesImportador(cliente), java.time.LocalDate.now().getYear(), cuota.getId());
            String nombreCompleto = cliente.getNombres() + " " + cliente.getApellidos();
            
            emailService.enviarReciboPorCorreo(emails, nombreCompleto, pdfBytes, 
                recibo.getNombreArchivo(), numeroRecibo, cuota.getMonto());
            
            log.info("✅ Recibo enviado exitosamente al cliente: {}", cliente.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Error enviando recibo al cliente: {}", e.getMessage(), e);
            // No lanzar excepción para no interrumpir el proceso de pago
        }
    }

    public DocumentoGenerado generarRecibo(Long cuotaId) {
        Optional<CuotaPago> cuotaOpt = cuotaPagoRepository.findById(cuotaId);
        if (cuotaOpt.isEmpty()) {
            throw new IllegalArgumentException("Cuota no encontrada");
        }

        CuotaPago cuota = cuotaOpt.get();
        Pago pago = cuota.getPago();
        Cliente cliente = clienteRepository.findById(pago.getClienteId())
            .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        if (cuota.getNumeroRecibo() == null || cuota.getNumeroRecibo().trim().isEmpty()) {
            cuota.setNumeroRecibo(generarNumeroReciboUnico(cliente));
            cuotaPagoRepository.save(cuota);
        }

        return gestionDocumentosServiceHelper.generarYGuardarRecibo(cliente, pago, cuota);
    }

    public CuotaPago obtenerCuotaPorId(Long cuotaId) {
        return cuotaPagoRepository.findById(cuotaId)
            .orElseThrow(() -> new IllegalArgumentException("Cuota no encontrada"));
    }
} 