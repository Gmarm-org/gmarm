package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.service.ConfiguracionSistemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Generador de autorizaciones de venta en PDF.
 * Incluye datos del coordinador militar y datos de factura.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutorizacionPDFGenerator {

    private final DocumentoPDFUtils utils;
    private final ConfiguracionSistemaService configuracionService;

    public DocumentoGenerado generarYGuardar(Cliente cliente, ClienteArma clienteArma,
                                              String numeroFactura, String tramite) {
        try {
            log.info("📄 GENERANDO AUTORIZACIÓN DE VENTA PARA CLIENTE ID: {}", cliente.getId());

            utils.eliminarDocumentosAnterioresDelTipo(cliente.getId(), TipoDocumentoGenerado.AUTORIZACION);

            byte[] pdfBytes = generarPDF(cliente, clienteArma, numeroFactura, tramite);
            log.info("🔍 DEBUG: PDF autorización generado, tamaño: {} bytes", pdfBytes.length);

            String nombreArchivo = generarNombreArchivo(cliente);
            String rutaArchivo = utils.guardarArchivo(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

            DocumentoGenerado documento = crearDocumentoAutorizacion(cliente, nombreArchivo, rutaArchivo, pdfBytes);
            DocumentoGenerado documentoGuardado = utils.guardarDocumento(documento);

            log.info("✅ Autorización generada y guardada con ID: {}, archivo: {}",
                documentoGuardado.getId(), nombreArchivo);

            return documentoGuardado;

        } catch (Exception e) {
            log.error("❌ Error generando autorización para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando autorización", e);
        }
    }

    private byte[] generarPDF(Cliente cliente, ClienteArma clienteArma,
                              String numeroFactura, String tramite) throws Exception {
        log.info("🔧 Generando PDF de autorización con Flying Saucer para cliente: {}", cliente.getNombres());

        try {
            String ultimos4Numeros = "0000";
            if (numeroFactura != null && !numeroFactura.isEmpty()) {
                String soloNumeros = numeroFactura.replaceAll("[^0-9]", "");

                if (soloNumeros.length() >= 4) {
                    ultimos4Numeros = soloNumeros.substring(soloNumeros.length() - 4);
                } else if (soloNumeros.length() > 0) {
                    ultimos4Numeros = String.format("%04d", Integer.parseInt(soloNumeros));
                }
            }

            String anioActual = String.valueOf(java.time.LocalDate.now().getYear());

            Licencia licencia = utils.obtenerLicenciaActiva(cliente);
            String licenciaTitulo = licencia != null && licencia.getTitulo() != null && !licencia.getTitulo().trim().isEmpty()
                ? licencia.getTitulo() : "";
            String licenciaNombre = licencia != null && licencia.getNombre() != null ? licencia.getNombre() : "";
            String licenciaRUC = licencia != null && licencia.getRuc() != null ? licencia.getRuc() : "";
            String licenciaTelefono = licencia != null && licencia.getTelefono() != null ? licencia.getTelefono() : "";
            String licenciaEmail = licencia != null && licencia.getEmail() != null ? licencia.getEmail() : "";

            String licenciaIniciales = utils.obtenerInicialesImportador(cliente);

            String coordinadorNombre = "TCRN.EMT.AVC. JULIO VILLALTA ESPINOZA";
            String coordinadorCargo = "COORDINADOR MILITAR CENTRO \"PICHINCHA\"";
            String coordinadorDireccion = "COMANDO CONJUNTO DE LAS FUERZA ARMADAS";

            try {
                coordinadorNombre = configuracionService.getValorConfiguracion("COORDINADOR_NOMBRE");
            } catch (Exception e) {
                log.debug("Usando valor por defecto para COORDINADOR_NOMBRE");
            }
            try {
                coordinadorCargo = configuracionService.getValorConfiguracion("COORDINADOR_CARGO");
            } catch (Exception e) {
                log.debug("Usando valor por defecto para COORDINADOR_CARGO");
            }
            try {
                coordinadorDireccion = configuracionService.getValorConfiguracion("COORDINADOR_DIRECCION");
            } catch (Exception e) {
                log.debug("Usando valor por defecto para COORDINADOR_DIRECCION");
            }

            String fechaActual = utils.obtenerFechaActualFormateada();

            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("arma", clienteArma.getArma());
            variables.put("numeroSerie", clienteArma.getNumeroSerie());
            variables.put("numeroFactura", numeroFactura);
            variables.put("tramite", tramite);
            variables.put("licenciaIniciales", licenciaIniciales);
            variables.put("ultimos4NumerosFactura", ultimos4Numeros);
            variables.put("anioActual", anioActual);
            variables.put("fechaActual", fechaActual);
            variables.put("licenciaTitulo", licenciaTitulo);
            variables.put("licenciaNombre", licenciaNombre);
            variables.put("licenciaRUC", licenciaRUC);
            variables.put("licenciaTelefono", licenciaTelefono);
            variables.put("licenciaEmail", licenciaEmail);
            variables.put("coordinadorNombre", coordinadorNombre);
            variables.put("coordinadorCargo", coordinadorCargo);
            variables.put("coordinadorDireccion", coordinadorDireccion);

            variables.put("logoImageUrl", "../../../static/images/logos/cz-logo.png");
            variables.put("watermarkImageUrl", "../../../static/images/logos/cz-watermark.png");

            log.info("🔧 Variables preparadas para template de autorización: cliente={}, arma={}, factura={}, tramite={}",
                cliente.getNombres(), clienteArma.getArma().getModelo(), numeroFactura, tramite);

            byte[] pdfBytes = utils.generarPdf("autorizaciones/autorizacion_venta", variables);

            log.info("✅ PDF de autorización generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("❌ Error generando PDF de autorización: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String generarNombreArchivo(Cliente cliente) {
        String fechaActual = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("autorizacion_venta_%s_%s.pdf",
            cliente.getNumeroIdentificacion(), fechaActual);
    }

    private DocumentoGenerado crearDocumentoAutorizacion(Cliente cliente,
                                                         String nombreArchivo, String rutaArchivo, byte[] pdfBytes) {
        return utils.crearDocumentoGenerado(cliente, null, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.AUTORIZACION);
    }
}
