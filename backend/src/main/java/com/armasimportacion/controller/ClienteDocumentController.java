package com.armasimportacion.controller;

import com.armasimportacion.dto.DatosContratoDTO;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.Pago;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.service.ClienteService;
import com.armasimportacion.service.DocumentoClienteService;
import com.armasimportacion.service.EmailService;
import com.armasimportacion.service.FileStorageService;
import com.armasimportacion.service.GrupoImportacionClienteService;
import com.armasimportacion.service.helper.GestionDocumentosServiceHelper;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.PagoRepository;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller para operaciones de documentos de clientes:
 * generación de contratos, carga de firmados, datos de contrato.
 */
@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Documentos de Clientes", description = "API para generación y gestión de documentos de clientes")
public class ClienteDocumentController {

    private final ClienteService clienteService;
    private final PagoRepository pagoRepository;
    private final GestionDocumentosServiceHelper gestionDocumentosServiceHelper;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    private final GrupoImportacionClienteService grupoImportacionClienteService;
    private final DocumentoClienteService documentoClienteService;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final ClienteRepository clienteRepository;

    @GetMapping("/{id}/datos-contrato")
    @Operation(summary = "Obtener datos del contrato", description = "Obtiene los datos del cliente, pago y armas para mostrar en el popup de generación de contrato")
    public ResponseEntity<DatosContratoDTO> obtenerDatosContrato(@PathVariable Long id) {
        log.info("Obteniendo datos del contrato para cliente ID: {}", id);

        Cliente cliente = clienteService.findById(id);
        List<Pago> pagos = pagoRepository.findByClienteId(id);
        Pago pago = pagos != null && !pagos.isEmpty() ? pagos.get(0) : null;

        List<ClienteArma> armas = cliente.getAsignacionesArma() != null ? cliente.getAsignacionesArma() : new ArrayList<>();

        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(id);

        Boolean emailVerificadoRaw = cliente.getEmailVerificado();
        Boolean emailVerificado = emailVerificadoRaw != null && emailVerificadoRaw;

        log.info("Cliente ID {} - documentosCompletos: {}, emailVerificado (raw): {}, emailVerificado (calculado): {}",
            id, documentosCompletos, emailVerificadoRaw, emailVerificado);

        DatosContratoDTO.ClienteDTO clienteDTO = DatosContratoDTO.ClienteDTO.builder()
            .id(cliente.getId())
            .nombres(cliente.getNombres())
            .apellidos(cliente.getApellidos())
            .numeroIdentificacion(cliente.getNumeroIdentificacion())
            .email(cliente.getEmail())
            .telefonoPrincipal(cliente.getTelefonoPrincipal())
            .direccion(cliente.getDireccion())
            .provincia(cliente.getProvincia())
            .canton(cliente.getCanton())
            .emailVerificado(emailVerificado)
            .tipoClienteEsCivil(cliente.esCivil())
            .tipoClienteEsMilitar(cliente.esMilitar())
            .tipoClienteEsPolicia(cliente.esPolicia())
            .build();

        DatosContratoDTO.PagoDTO pagoDTO = null;
        if (pago != null) {
            pagoDTO = DatosContratoDTO.PagoDTO.builder()
                .id(pago.getId())
                .montoTotal(pago.getMontoTotal())
                .tipoPago(pago.getTipoPago() != null ? pago.getTipoPago().name() : null)
                .numeroCuotas(pago.getNumeroCuotas())
                .build();
        }

        List<DatosContratoDTO.ArmaDTO> armasDTO = armas.stream()
            .map(arma -> DatosContratoDTO.ArmaDTO.builder()
                .id(arma.getId())
                .nombre(arma.getArma() != null ? arma.getArma().getModelo() : "N/A")
                .precioUnitario(arma.getPrecioUnitario())
                .cantidad(arma.getCantidad())
                .build())
            .collect(Collectors.toList());

        DatosContratoDTO datosContratoDTO = DatosContratoDTO.builder()
            .cliente(clienteDTO)
            .pago(pagoDTO)
            .armas(armasDTO)
            .documentosCompletos(documentosCompletos)
            .build();

        log.info("DTO construido - documentosCompletos: {}, emailVerificado: {}",
            datosContratoDTO.getDocumentosCompletos(),
            datosContratoDTO.getCliente() != null ? datosContratoDTO.getCliente().getEmailVerificado() : "null");

        return ResponseEntity.ok(datosContratoDTO);
    }

    @PostMapping("/{id}/generar-contrato")
    @Operation(summary = "Generar contrato del cliente", description = "Genera un contrato PDF para el cliente. Requiere documentos completos y email validado. Confirma asignación definitiva al grupo.")
    public ResponseEntity<Map<String, Object>> generarContrato(@PathVariable Long id) {
        log.info("Generando contrato para cliente ID: {}", id);

        Cliente cliente = clienteService.findById(id);

        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No se puede generar contrato para clientes fantasma (vendedores). Los vendedores no requieren contrato."));
        }

        if (cliente.getEmailVerificado() == null || !cliente.getEmailVerificado()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "El cliente debe tener su email validado antes de generar el contrato. Por favor, valide los datos personales del cliente primero."));
        }

        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(id);
        if (!documentosCompletos) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "El cliente debe tener todos sus documentos obligatorios cargados antes de generar el contrato."));
        }

        List<Pago> pagos = pagoRepository.findByClienteId(id);
        Pago pago = pagos != null && !pagos.isEmpty() ? pagos.get(0) : null;

        List<DocumentoGenerado> documentos = gestionDocumentosServiceHelper.generarYGuardarDocumentos(cliente, pago);

        if (documentos == null || documentos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "No se generaron documentos"));
        }

        try {
            grupoImportacionClienteService.confirmarAsignacionCliente(id);
            log.info("Asignacion del cliente ID {} confirmada definitivamente al grupo", id);
        } catch (Exception e) {
            log.warn("No se pudo confirmar asignacion del cliente al grupo (puede no tener asignacion pendiente): {}", e.getMessage());
        }

        DocumentoGenerado documentoPrincipal = documentos.get(0);

        enviarDocumentosPorCorreo(cliente, documentos);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", documentos.size() + " documento(s) generado(s) exitosamente");
        response.put("documentosGenerados", documentos.size());
        response.put("documentoId", documentoPrincipal.getId());
        response.put("nombreArchivo", documentoPrincipal.getNombreArchivo());
        response.put("urlArchivo", documentoPrincipal.getUrlArchivo());

        List<Map<String, Object>> documentosInfo = documentos.stream()
            .map(doc -> {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("nombre", doc.getNombre());
                docInfo.put("tipoDocumento", doc.getTipoDocumento().name());
                docInfo.put("nombreArchivo", doc.getNombreArchivo());
                docInfo.put("urlArchivo", doc.getUrlArchivo());
                return docInfo;
            })
            .collect(Collectors.toList());
        response.put("documentos", documentosInfo);

        log.info("{} documento(s) generado(s) exitosamente: {}", documentos.size(), documentoPrincipal.getNombreArchivo());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{id}/cargar-contrato-firmado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Cargar contrato firmado", description = "Carga el contrato firmado del cliente, reemplazando el contrato generado")
    public ResponseEntity<Map<String, Object>> cargarContratoFirmado(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "documentoId", required = false) Long documentoId) throws java.io.IOException {
        log.info("Cargando contrato firmado para cliente ID: {}", id);

        Cliente cliente = clienteService.findById(id);

        DocumentoGenerado contratoGenerado;
        if (documentoId != null) {
            contratoGenerado = documentoGeneradoRepository.findById(documentoId)
                .orElse(null);
            if (contratoGenerado == null || contratoGenerado.getCliente() == null
                || !contratoGenerado.getCliente().getId().equals(cliente.getId())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se encontró el documento solicitado para este cliente."));
            }
        } else {
            boolean esCivil = cliente.esCivil();
            List<DocumentoGenerado> documentosCliente = documentoGeneradoRepository.findByClienteId(cliente.getId());
            if (documentosCliente.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se encontró un documento generado para este cliente. Debe generar la solicitud o documentos primero."));
            }

            TipoDocumentoGenerado tipoPreferido = esCivil
                ? TipoDocumentoGenerado.SOLICITUD_COMPRA
                : TipoDocumentoGenerado.CONTRATO;

            List<DocumentoGenerado> documentosFiltrados = documentosCliente.stream()
                .filter(doc -> doc.getTipoDocumento() == tipoPreferido)
                .filter(doc -> doc.getEstado() != EstadoDocumentoGenerado.FIRMADO)
                .toList();

            List<DocumentoGenerado> candidatos = documentosFiltrados.isEmpty()
                ? documentosCliente.stream()
                    .filter(doc -> doc.getEstado() != EstadoDocumentoGenerado.FIRMADO)
                    .toList()
                : documentosFiltrados;

            candidatos.sort((a, b) -> {
                if (a.getFechaGeneracion() == null && b.getFechaGeneracion() == null) return 0;
                if (a.getFechaGeneracion() == null) return 1;
                if (b.getFechaGeneracion() == null) return -1;
                return b.getFechaGeneracion().compareTo(a.getFechaGeneracion());
            });

            contratoGenerado = candidatos.get(0);
        }

        String prefijoArchivo = contratoGenerado.getTipoDocumento() == TipoDocumentoGenerado.SOLICITUD_COMPRA
            ? "solicitud_firmada_"
            : "contrato_firmado_";
        String nombreArchivoFirmado = prefijoArchivo + cliente.getApellidos().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase()
            + "_" + cliente.getNombres().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim().replaceAll("\\s+", "_").toLowerCase()
            + "_" + cliente.getNumeroIdentificacion() + ".pdf";

        byte[] archivoBytes = archivo.getBytes();
        String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
            cliente.getNumeroIdentificacion(), archivoBytes, nombreArchivoFirmado);

        contratoGenerado.setNombreArchivo(nombreArchivoFirmado);
        contratoGenerado.setRutaArchivo(rutaArchivo);
        contratoGenerado.setTamanioBytes(archivo.getSize());
        contratoGenerado.setFechaFirma(LocalDateTime.now());
        contratoGenerado.setEstado(EstadoDocumentoGenerado.FIRMADO);
        contratoGenerado.setDescripcion("Documento firmado por el cliente");

        documentoGeneradoRepository.save(contratoGenerado);

        cliente.setEstado(EstadoCliente.CONTRATO_FIRMADO);
        clienteRepository.save(cliente);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Documento firmado cargado exitosamente");
        response.put("documentoId", contratoGenerado.getId());
        response.put("nombreArchivo", nombreArchivoFirmado);
        response.put("tipoDocumento", contratoGenerado.getTipoDocumento());

        log.info("Documento firmado cargado exitosamente: {}", nombreArchivoFirmado);
        return ResponseEntity.ok(response);
    }

    // ===== HELPERS PRIVADOS =====

    private void enviarDocumentosPorCorreo(Cliente cliente, List<DocumentoGenerado> documentos) {
        try {
            Licencia licencia = obtenerLicenciaActiva(cliente);
            String nombreCliente = (cliente.getNombres() != null ? cliente.getNombres() : "") +
                " " +
                (cliente.getApellidos() != null ? cliente.getApellidos() : "");
            Usuario vendedor = cliente.getUsuarioCreador();
            String nombreVendedor = "Vendedor";
            if (vendedor != null) {
                String nombres = vendedor.getNombres() != null ? vendedor.getNombres() : "";
                String apellidos = vendedor.getApellidos() != null ? vendedor.getApellidos() : "";
                String combinado = (nombres + " " + apellidos).trim();
                if (!combinado.isEmpty()) {
                    nombreVendedor = combinado;
                }
            }

            List<EmailService.DocumentoAdjunto> adjuntos = documentos.stream()
                .map(doc -> {
                    byte[] bytes = cargarDocumentoAdjunto(doc);
                    if (bytes == null) {
                        return null;
                    }
                    return new EmailService.DocumentoAdjunto(doc.getNombreArchivo(), bytes);
                })
                .filter(adj -> adj != null)
                .collect(Collectors.toList());

            if (cliente.getEmail() != null && !cliente.getEmail().isBlank()) {
                emailService.enviarDocumentosGenerados(
                    cliente.getEmail().trim(),
                    nombreCliente.isBlank() ? "Cliente" : nombreCliente.trim(),
                    nombreVendedor,
                    licencia,
                    adjuntos
                );
                log.info("Documentos enviados al cliente: {}", cliente.getEmail());
            }

            if (vendedor != null && vendedor.getEmail() != null && !vendedor.getEmail().isBlank()) {
                emailService.enviarDocumentosGenerados(
                    vendedor.getEmail().trim(),
                    nombreCliente.isBlank() ? "Cliente" : nombreCliente.trim(),
                    nombreVendedor,
                    licencia,
                    adjuntos
                );
                log.info("Documentos enviados al vendedor: {}", vendedor.getEmail());
            }
        } catch (Exception e) {
            log.warn("No se pudieron enviar documentos por correo: {}", e.getMessage());
        }
    }

    private Licencia obtenerLicenciaActiva(Cliente cliente) {
        try {
            List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(cliente.getId());
            if (gruposCliente == null || gruposCliente.isEmpty()) {
                return null;
            }

            return gruposCliente.stream()
                .filter(cgi -> cgi.getEstado() != EstadoClienteGrupo.COMPLETADO && cgi.getEstado() != EstadoClienteGrupo.CANCELADO)
                .sorted((a, b) -> {
                    boolean aConfirmado = a.getEstado() == EstadoClienteGrupo.CONFIRMADO;
                    boolean bConfirmado = b.getEstado() == EstadoClienteGrupo.CONFIRMADO;
                    if (aConfirmado != bConfirmado) {
                        return aConfirmado ? -1 : 1;
                    }
                    LocalDateTime fa = a.getFechaAsignacion() != null ? a.getFechaAsignacion() : a.getFechaCreacion();
                    LocalDateTime fb = b.getFechaAsignacion() != null ? b.getFechaAsignacion() : b.getFechaCreacion();
                    if (fa == null && fb == null) return 0;
                    if (fa == null) return 1;
                    if (fb == null) return -1;
                    return fb.compareTo(fa);
                })
                .map(cgi -> cgi.getGrupoImportacion() != null ? cgi.getGrupoImportacion().getLicencia() : null)
                .filter(licencia -> licencia != null)
                .findFirst()
                .orElse(null);
        } catch (Exception e) {
            log.warn("No se pudo obtener licencia activa del cliente {}: {}", cliente.getId(), e.getMessage());
        }
        return null;
    }

    private byte[] cargarDocumentoAdjunto(DocumentoGenerado documento) {
        try {
            return fileStorageService.loadFile(documento.getRutaArchivo());
        } catch (Exception e) {
            log.warn("No se pudo cargar documento generado {}: {}", documento.getId(), e.getMessage());
            return null;
        }
    }
}
