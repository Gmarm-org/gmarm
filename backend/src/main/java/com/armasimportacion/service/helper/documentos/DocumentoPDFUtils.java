package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.*;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.service.FlyingSaucerPdfService;
import com.armasimportacion.service.FileStorageService;
import com.armasimportacion.service.LicenciaService;
import com.armasimportacion.service.NumberToTextService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * Utilidades compartidas para la generación de documentos PDF.
 * Centraliza dependencias y métodos comunes usados por los generadores especializados.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentoPDFUtils {

    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    private final FlyingSaucerPdfService flyingSaucerPdfService;
    private final FileStorageService fileStorageService;
    private final LicenciaService licenciaService;
    @Getter
    private final NumberToTextService numberToTextService;

    // ======================== Fecha formatting ========================

    public String obtenerFechaActualFormateada() {
        LocalDate fecha = LocalDate.now(ZoneId.of("America/Guayaquil"));
        String mes = obtenerNombreMes(fecha.getMonthValue());
        return String.format("Quito, %d de %s del %d", fecha.getDayOfMonth(), mes, fecha.getYear());
    }

    public String obtenerFechaActualFormateadaSinCiudad() {
        LocalDate fecha = LocalDate.now(ZoneId.of("America/Guayaquil"));
        String mes = obtenerNombreMes(fecha.getMonthValue());
        return String.format("%d de %s del %d", fecha.getDayOfMonth(), mes, fecha.getYear());
    }

    public String obtenerFechaActualFormateadaConCiudad(String ciudad) {
        LocalDate fecha = LocalDate.now(ZoneId.of("America/Guayaquil"));
        String ciudadFinal = ciudad != null && !ciudad.trim().isEmpty() ? ciudad.trim() : "Quito";
        String mes = obtenerNombreMes(fecha.getMonthValue());
        return String.format("%s, %d de %s del %d", ciudadFinal, fecha.getDayOfMonth(), mes, fecha.getYear());
    }

    private String obtenerNombreMes(int monthValue) {
        String[] meses = {
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        };
        return meses[monthValue - 1];
    }

    // ======================== Licencia / Importador ========================

    public Licencia obtenerLicenciaActiva(Cliente cliente) {
        try {
            List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(cliente.getId());
            if (gruposCliente == null || gruposCliente.isEmpty()) {
                return null;
            }
            for (ClienteGrupoImportacion cgi : gruposCliente) {
                EstadoClienteGrupo estado = cgi.getEstado();
                if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                    if (cgi.getGrupoImportacion() != null && cgi.getGrupoImportacion().getLicencia() != null) {
                        return cgi.getGrupoImportacion().getLicencia();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ No se pudo obtener licencia activa del cliente {}: {}", cliente.getId(), e.getMessage());
        }
        return null;
    }

    public String obtenerInicialesImportador(Cliente cliente) {
        try {
            List<ClienteGrupoImportacion> gruposCliente =
                clienteGrupoImportacionRepository.findByClienteId(cliente.getId());
            for (ClienteGrupoImportacion cgi : gruposCliente) {
                if (cgi.getGrupoImportacion() == null) {
                    continue;
                }
                EstadoGrupoImportacion estado = cgi.getGrupoImportacion().getEstado();
                if (estado != EstadoGrupoImportacion.COMPLETADO &&
                    estado != EstadoGrupoImportacion.CANCELADO) {
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

    // ======================== Template determination ========================

    public String determinarTemplateUniformado(Cliente cliente, String tipoDocumento) {
        if (cliente.getTipoCliente() == null || cliente.getTipoCliente().getNombre() == null) {
            log.warn("⚠️ Tipo de cliente no definido, usando template por defecto");
            return "contratos/uniformados/" + tipoDocumento + "_fuerza_terrestre";
        }

        String nombreTipoCliente = cliente.getTipoCliente().getNombre();
        log.info("🔍 Tipo de cliente: {}, tipoDocumento: {}", nombreTipoCliente, tipoDocumento);

        String sufijoTemplate = switch (nombreTipoCliente) {
            case "Militar Fuerza Terrestre" -> "fuerza_terrestre";
            case "Militar Fuerza Naval" -> "fuerza_naval";
            case "Militar Fuerza Aérea" -> "fuerza_aerea";
            case "Uniformado Policial" -> "policia";
            default -> {
                log.warn("⚠️ Tipo de cliente desconocido para uniformado: {}, usando template por defecto", nombreTipoCliente);
                yield "fuerza_terrestre";
            }
        };

        return String.format("contratos/uniformados/%s_%s", tipoDocumento, sufijoTemplate);
    }

    // ======================== Number / Currency formatting ========================

    public String formatCurrency(BigDecimal amount) {
        if (amount == null) return "$0.00";
        java.text.NumberFormat formatter = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("es", "EC"));
        return formatter.format(amount);
    }

    public String convertirNumeroALetras(int numero) {
        String[] numerosEnLetras = {
            "", "un", "dos", "tres", "cuatro", "cinco",
            "seis", "siete", "ocho", "nueve", "diez",
            "once", "doce", "trece", "catorce", "quince",
            "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"
        };
        if (numero >= 1 && numero <= 20) {
            return numerosEnLetras[numero];
        }
        if (numberToTextService != null) {
            return numberToTextService.convertToText(BigDecimal.valueOf(numero)).toLowerCase();
        }
        return String.valueOf(numero);
    }

    // ======================== Document lifecycle ========================

    public void eliminarDocumentosAnterioresDelTipo(Long clienteId, TipoDocumentoGenerado tipoDocumento) {
        try {
            List<DocumentoGenerado> documentosAnteriores = documentoGeneradoRepository
                .findByClienteIdAndTipo(clienteId, tipoDocumento);

            if (!documentosAnteriores.isEmpty()) {
                log.info("⚠️ Se encontraron {} documento(s) anterior(es) de tipo {} para el cliente ID {}, se eliminarán",
                    documentosAnteriores.size(), tipoDocumento, clienteId);

                for (DocumentoGenerado documentoAnterior : documentosAnteriores) {
                    try {
                        String rutaCompletaAnterior = construirRutaCompletaDocumentoGenerado(
                            documentoAnterior.getRutaArchivo(),
                            documentoAnterior.getNombreArchivo()
                        );
                        File archivoAnterior = new File(rutaCompletaAnterior);
                        if (archivoAnterior.exists()) {
                            archivoAnterior.delete();
                            log.info("🗑️ Archivo físico anterior eliminado: {}", rutaCompletaAnterior);
                        } else {
                            log.debug("⚠️ Archivo físico no existe en: {}", rutaCompletaAnterior);
                        }
                    } catch (Exception e) {
                        log.warn("⚠️ No se pudo eliminar archivo físico anterior: {}", e.getMessage());
                    }

                    documentoGeneradoRepository.delete(documentoAnterior);
                    log.info("🗑️ Registro anterior eliminado de BD: ID={}, tipo={}", documentoAnterior.getId(), tipoDocumento);
                }

                log.info("✅ Se eliminaron {} documento(s) anterior(es) de tipo {}", documentosAnteriores.size(), tipoDocumento);
            } else {
                log.debug("ℹ️ No hay documentos anteriores de tipo {} para el cliente ID {}", tipoDocumento, clienteId);
            }
        } catch (Exception e) {
            log.error("❌ Error eliminando documentos anteriores de tipo {}: {}", tipoDocumento, e.getMessage(), e);
        }
    }

    public String construirRutaCompletaDocumentoGenerado(String rutaBD, String nombreArchivo) {
        if (rutaBD.startsWith("/app/")) {
            if (rutaBD.endsWith(nombreArchivo)) {
                return rutaBD;
            }
            return rutaBD.endsWith("/") ? rutaBD + nombreArchivo : rutaBD + "/" + nombreArchivo;
        }

        if (rutaBD.endsWith(nombreArchivo)) {
            if (rutaBD.startsWith("documentos_clientes/") || rutaBD.startsWith("documentos_importacion/")) {
                return "/app/documentacion/" + rutaBD;
            }
            if (rutaBD.startsWith("documentacion/")) {
                return "/app/" + rutaBD;
            }
            return "/app/documentacion/" + rutaBD;
        }

        if (rutaBD.startsWith("documentos_clientes/") || rutaBD.startsWith("documentos_importacion/")) {
            String rutaCompleta = "/app/documentacion/" + rutaBD;
            if (!rutaCompleta.endsWith("/")) {
                rutaCompleta = rutaCompleta + "/";
            }
            return rutaCompleta + nombreArchivo;
        }

        if (rutaBD.startsWith("documentacion/")) {
            String rutaCompleta = "/app/" + rutaBD;
            if (!rutaCompleta.endsWith("/") && !rutaCompleta.endsWith(nombreArchivo)) {
                rutaCompleta = rutaCompleta + "/";
            }
            if (!rutaCompleta.endsWith(nombreArchivo)) {
                return rutaCompleta + nombreArchivo;
            }
            return rutaCompleta;
        }

        String rutaCompleta = "/app/documentacion/contratos_generados/" + rutaBD;
        if (!rutaCompleta.endsWith("/") && !rutaCompleta.endsWith(nombreArchivo)) {
            rutaCompleta = rutaCompleta + "/";
        }
        if (!rutaCompleta.endsWith(nombreArchivo)) {
            return rutaCompleta + nombreArchivo;
        }

        return rutaCompleta;
    }

    public DocumentoGenerado crearDocumentoGenerado(Cliente cliente, Pago pago,
                                                   String nombreArchivo, String rutaArchivo, byte[] pdfBytes,
                                                   TipoDocumentoGenerado tipoDocumento) {
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setCliente(cliente);

        switch (tipoDocumento) {
            case CONTRATO:
                documento.setNombre("Contrato de Compraventa");
                documento.setDescripcion("Contrato generado automáticamente para la compra de arma");
                break;
            case COTIZACION:
                documento.setNombre("Cotización");
                documento.setDescripcion("Cotización de arma generada automáticamente");
                break;
            case SOLICITUD_COMPRA:
                documento.setNombre("Solicitud de Compra");
                documento.setDescripcion("Solicitud de compra de arma generada automáticamente");
                break;
            case AUTORIZACION:
                documento.setNombre("Autorización de Venta de Arma");
                documento.setDescripcion("Autorización de venta generada automáticamente para el arma asignada al cliente");
                break;
            case RECIBO:
                documento.setNombre("Recibo de Pago");
                documento.setDescripcion("Recibo de pago generado automáticamente");
                break;
            default:
                documento.setNombre("Documento Generado");
                documento.setDescripcion("Documento generado automáticamente");
                break;
        }

        documento.setTipoDocumento(tipoDocumento);
        documento.setNombreArchivo(nombreArchivo);
        documento.setRutaArchivo(rutaArchivo);
        documento.setTamanioBytes((long) pdfBytes.length);
        documento.setFechaGeneracion(LocalDateTime.now());
        documento.setEstado(EstadoDocumentoGenerado.GENERADO);

        try {
            String emailUsuarioActual = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
            log.info("🔍 Usuario actual del contexto: {}", emailUsuarioActual);

            Usuario usuarioActual = buscarUsuarioPorEmail(emailUsuarioActual);
            if (usuarioActual != null) {
                documento.setUsuarioGenerador(usuarioActual);
                log.info("✅ Usuario generador establecido: ID={}, email={}",
                    usuarioActual.getId(), usuarioActual.getEmail());
            } else {
                log.warn("⚠️ No se encontró usuario con email: {}", emailUsuarioActual);
                Usuario usuarioAdmin = new Usuario();
                usuarioAdmin.setId(1L);
                documento.setUsuarioGenerador(usuarioAdmin);
            }
        } catch (Exception e) {
            log.error("❌ Error obteniendo usuario actual: {}", e.getMessage());
            Usuario usuarioAdmin = new Usuario();
            usuarioAdmin.setId(1L);
            documento.setUsuarioGenerador(usuarioAdmin);
        }

        return documento;
    }

    // ======================== Delegate methods ========================

    public byte[] generarPdf(String nombreTemplate, Map<String, Object> variables) throws Exception {
        return flyingSaucerPdfService.generarPdfDesdeTemplate(nombreTemplate, variables);
    }

    public String guardarArchivo(String cedula, byte[] pdfBytes, String nombreArchivo) throws java.io.IOException {
        return fileStorageService.guardarDocumentoGeneradoCliente(cedula, pdfBytes, nombreArchivo);
    }

    public DocumentoGenerado guardarDocumento(DocumentoGenerado documento) {
        return documentoGeneradoRepository.save(documento);
    }

    // ======================== File naming helpers ========================

    public String normalizarNombreArchivo(String texto) {
        if (texto == null) return "";
        return texto.replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim()
            .replaceAll("\\s+", "_").toLowerCase();
    }

    // ======================== Private helpers ========================

    private Usuario buscarUsuarioPorEmail(String email) {
        try {
            return usuarioRepository.findByEmail(email)
                .orElse(null);
        } catch (Exception e) {
            log.error("❌ Error buscando usuario por email {}: {}", email, e.getMessage());
            return null;
        }
    }
}
