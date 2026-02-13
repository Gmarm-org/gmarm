package com.armasimportacion.controller;

import com.armasimportacion.dto.CuotaPagoDTO;
import com.armasimportacion.dto.CuotaPagoCreateDTO;
import com.armasimportacion.dto.PagarCuotaDTO;
import com.armasimportacion.enums.EstadoPago;
import com.armasimportacion.mapper.CuotaPagoMapper;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.service.PagoService;
import com.armasimportacion.service.EmailService;
import com.armasimportacion.service.ConfiguracionSistemaService;
import com.armasimportacion.service.FileStorageService;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@Slf4j
public class PagoController {

    private final PagoService pagoService;
    private final CuotaPagoMapper cuotaPagoMapper;
    private final EmailService emailService;
    private final ConfiguracionSistemaService configuracionSistemaService;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ClienteRepository clienteRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<Pago> crearPago(@RequestBody Pago pago) {
        log.info("Creando nuevo pago para cliente: {}", pago.getClienteId());
        Pago pagoCreado = pagoService.crearPago(pago);
        return ResponseEntity.ok(pagoCreado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pago> obtenerPago(@PathVariable Long id) {
        return pagoService.obtenerPagoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Pago>> obtenerPagosPorCliente(@PathVariable Long clienteId) {
        List<Pago> pagos = pagoService.obtenerPagosPorCliente(clienteId);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Pago>> obtenerPagosPorEstado(@PathVariable EstadoPago estado) {
        List<Pago> pagos = pagoService.obtenerPagosPorEstado(estado);
        return ResponseEntity.ok(pagos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pago> actualizarPago(@PathVariable Long id, @RequestBody Pago pago) {
        pago.setId(id);
        Pago pagoActualizado = pagoService.actualizarPago(pago);
        return ResponseEntity.ok(pagoActualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPago(@PathVariable Long id) {
        pagoService.eliminarPago(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<Page<Pago>> buscarPagos(
            @RequestParam(required = false) String numeroComprobante,
            @RequestParam(required = false) EstadoPago estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) LocalDateTime fechaInicio,
            @RequestParam(required = false) LocalDateTime fechaFin,
            Pageable pageable) {
        
        Page<Pago> pagos = pagoService.buscarPagos(numeroComprobante, estado, clienteId, fechaInicio, fechaFin, pageable);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/cliente/{clienteId}/saldo")
    public ResponseEntity<BigDecimal> obtenerSaldoCliente(@PathVariable Long clienteId) {
        BigDecimal saldo = pagoService.obtenerSaldoCliente(clienteId);
        return ResponseEntity.ok(saldo);
    }

    @GetMapping("/cliente/{clienteId}/tiene-saldo")
    public ResponseEntity<Boolean> clienteTieneSaldoPendiente(@PathVariable Long clienteId) {
        boolean tieneSaldo = pagoService.clienteTieneSaldoPendiente(clienteId);
        return ResponseEntity.ok(tieneSaldo);
    }

    @GetMapping("/{pagoId}/cuotas")
    public ResponseEntity<List<CuotaPagoDTO>> obtenerCuotasPorPago(@PathVariable Long pagoId) {
        log.info("📅 Obteniendo cuotas para pago ID: {}", pagoId);
        List<CuotaPago> cuotas = pagoService.obtenerCuotasPorPago(pagoId);
        log.info("✅ Se encontraron {} cuotas para pago ID: {}", cuotas.size(), pagoId);
        List<CuotaPagoDTO> cuotasDTO = cuotas.stream()
                .map(cuotaPagoMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cuotasDTO);
    }

    @PostMapping("/cuota/{cuotaId}/pagar")
    public ResponseEntity<CuotaPago> pagarCuota(
            @PathVariable Long cuotaId,
            @RequestBody PagarCuotaDTO dto) {
        
        CuotaPago cuotaPagada = pagoService.pagarCuota(
            cuotaId, 
            dto.getReferenciaPago(), 
            dto.getUsuarioConfirmadorId(),
            dto.getMonto(),
            dto.getNumeroRecibo(),
            dto.getComprobanteArchivo(),
            dto.getObservaciones()
        );
        return ResponseEntity.ok(cuotaPagada);
    }

    @GetMapping("/cuotas/vencidas")
    public ResponseEntity<List<CuotaPago>> obtenerCuotasVencidas() {
        List<CuotaPago> cuotasVencidas = pagoService.obtenerCuotasVencidas();
        return ResponseEntity.ok(cuotasVencidas);
    }

    @GetMapping("/cliente/{clienteId}/cuotas")
    public ResponseEntity<List<CuotaPago>> obtenerCuotasPorCliente(@PathVariable Long clienteId) {
        List<CuotaPago> cuotas = pagoService.obtenerCuotasPorCliente(clienteId);
        return ResponseEntity.ok(cuotas);
    }

    @PostMapping("/{pagoId}/cuotas")
    public ResponseEntity<CuotaPagoDTO> crearCuotaManual(
            @PathVariable Long pagoId,
            @RequestBody CuotaPagoCreateDTO dto) {
        log.info("Creando cuota manual para pago ID: {}", pagoId);
        dto.setPagoId(pagoId);
        CuotaPago cuotaCreada = pagoService.crearCuotaManual(pagoId, dto);
        CuotaPagoDTO cuotaDTO = cuotaPagoMapper.toDTO(cuotaCreada);
        return ResponseEntity.ok(cuotaDTO);
    }

    @PostMapping("/cuota/{cuotaId}/generar-recibo")
    public ResponseEntity<Map<String, Object>> generarRecibo(@PathVariable Long cuotaId) {
        log.info("Generando recibo para cuota ID: {}", cuotaId);
        try {
            DocumentoGenerado recibo = pagoService.generarRecibo(cuotaId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Recibo generado exitosamente");
            response.put("documentoId", recibo.getId());
            response.put("nombreArchivo", recibo.getNombreArchivo());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generando recibo: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "error", "Error al generar recibo: " + e.getMessage()));
        }
    }

    @GetMapping("/cuota/{cuotaId}/descargar-recibo")
    public ResponseEntity<Resource> descargarRecibo(@PathVariable Long cuotaId) {
        log.info("Descargando recibo para cuota ID: {}", cuotaId);
        try {
            CuotaPago cuota = cuotaPagoRepository.findById(cuotaId)
                .orElseThrow(() -> new RuntimeException("Cuota no encontrada"));
            
            DocumentoGenerado recibo = null;
            if (cuota.getNumeroRecibo() != null && !cuota.getNumeroRecibo().trim().isEmpty()) {
                // Buscar el recibo generado para esta cuota
                List<DocumentoGenerado> recibos = documentoGeneradoRepository.findByClienteIdAndTipo(
                    cuota.getPago().getClienteId(),
                    TipoDocumentoGenerado.RECIBO
                );
                
                recibo = recibos.stream()
                    .filter(doc -> {
                        String numeroRecibo = cuota.getNumeroRecibo();
                        return numeroRecibo != null && doc.getNombreArchivo() != null &&
                               doc.getNombreArchivo().contains(numeroRecibo);
                    })
                    .findFirst()
                    .orElse(null);
                
                if (recibo == null) {
                    // Fallback: usar el último recibo generado del cliente
                    recibo = recibos.stream()
                        .filter(doc -> doc.getNombreArchivo() != null)
                        .sorted((a, b) -> {
                            if (a.getFechaGeneracion() == null || b.getFechaGeneracion() == null) {
                                return 0;
                            }
                            return b.getFechaGeneracion().compareTo(a.getFechaGeneracion());
                        })
                        .findFirst()
                        .orElse(null);
                }
            }
            
            if (recibo == null) {
                recibo = pagoService.generarRecibo(cuotaId);
            }
            
            if (recibo == null) {
                throw new RuntimeException("Recibo no encontrado para esta cuota");
            }

            byte[] pdfBytes = fileStorageService.loadFile(recibo.getRutaArchivo());
            Resource resource = new ByteArrayResource(pdfBytes);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + recibo.getNombreArchivo() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);

        } catch (Exception e) {
            log.error("Error descargando recibo: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/cuota/{cuotaId}/enviar-recibo-correo")
    public ResponseEntity<Map<String, Object>> enviarReciboPorCorreo(
            @PathVariable Long cuotaId,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        log.info("Enviando recibo por correo para cuota ID: {}", cuotaId);
        try {
            CuotaPago cuota = cuotaPagoRepository.findById(cuotaId)
                .orElseThrow(() -> new RuntimeException("Cuota no encontrada"));
            Cliente cliente = clienteRepository.findById(
                cuota.getPago().getClienteId()
            ).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

            // Construir lista de correos: cliente + correos configurados en sistema
            List<String> emails = new ArrayList<>();
            
            // Agregar correo del cliente si existe
            if (cliente.getEmail() != null && !cliente.getEmail().trim().isEmpty()) {
                emails.add(cliente.getEmail().trim());
                log.info("📧 Correo del cliente agregado: {}", cliente.getEmail());
            }
            
            // Obtener correos configurados desde configuracion_sistema
            List<String> correosRecibo = configuracionSistemaService.getCorreosRecibo();
            if (!correosRecibo.isEmpty()) {
                emails.addAll(correosRecibo);
                log.info("📧 {} correo(s) de recibo agregado(s) desde configuración", correosRecibo.size());
            }
            
            // Si el requestBody tiene emails adicionales (opcional, para compatibilidad)
            if (requestBody != null && requestBody.containsKey("emails")) {
                @SuppressWarnings("unchecked")
                List<String> emailsAdicionales = (List<String>) requestBody.get("emails");
                if (emailsAdicionales != null) {
                    for (String email : emailsAdicionales) {
                        if (email != null && !email.trim().isEmpty() && !emails.contains(email.trim())) {
                            emails.add(email.trim());
                        }
                    }
                }
            }
            
            if (emails.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "No hay correos configurados para enviar el recibo. Configure CORREOS_RECIBO en el sistema o asegúrese de que el cliente tenga un correo válido."));
            }
            
            log.info("📧 Total de correos destinatarios: {}", emails.size());

            // Generar recibo si no existe
            DocumentoGenerado recibo;
            List<DocumentoGenerado> recibosExistentes = documentoGeneradoRepository.findByClienteId(cliente.getId());
            recibo = recibosExistentes.stream()
                .filter(doc -> doc.getTipoDocumento() == TipoDocumentoGenerado.RECIBO)
                .filter(doc -> doc.getNombreArchivo().contains("REC-" + cuotaId) || 
                              doc.getNombreArchivo().contains("recibo_"))
                .findFirst()
                .orElse(null);

            if (recibo == null) {
                recibo = pagoService.generarRecibo(cuotaId);
            }

            // Leer archivo PDF
            byte[] pdfBytes = fileStorageService.loadFile(recibo.getRutaArchivo());

            // Enviar por correo
            emailService.enviarReciboPorCorreo(
                emails,
                cliente.getNombres() + " " + cliente.getApellidos(),
                pdfBytes,
                recibo.getNombreArchivo(),
                cuota.getNumeroRecibo() != null ? cuota.getNumeroRecibo() : "REC-" + cuota.getId(),
                cuota.getMonto()
            );

            return ResponseEntity.ok(Map.of("success", true, "message", "Recibo enviado por correo exitosamente"));

        } catch (Exception e) {
            log.error("Error enviando recibo por correo: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "error", "Error al enviar recibo: " + e.getMessage()));
        }
    }
} 
