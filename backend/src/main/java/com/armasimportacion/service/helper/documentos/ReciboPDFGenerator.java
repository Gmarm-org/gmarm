package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.service.ConfiguracionSistemaService;
import com.armasimportacion.service.NumberToTextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Generador de recibos de pago de cuotas en PDF.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReciboPDFGenerator {

    private static final DateTimeFormatter FECHA_ESPANOL_FMT = DateTimeFormatter.ofPattern("dd 'de' MMMM yyyy", Locale.forLanguageTag("es"));
    private static final DateTimeFormatter FECHA_SIMPLE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_PAGO_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final DocumentoPDFUtils utils;
    private final ClienteArmaRepository clienteArmaRepository;
    private final ConfiguracionSistemaService configuracionService;
    private final NumberToTextService numberToTextService;

    public DocumentoGenerado generarYGuardar(Cliente cliente, Pago pago, CuotaPago cuota) {
        try {
            log.info("📄 GENERANDO RECIBO CON FLYING SAUCER PARA CUOTA ID: {}", cuota.getId());

            byte[] pdfBytes = generarPDF(cliente, pago, cuota);
            log.info("✅ PDF de recibo generado con Flying Saucer, tamaño: {} bytes", pdfBytes.length);

            String nombreArchivo = generarNombreArchivo(cliente, cuota);

            String rutaArchivo = utils.guardarArchivo(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

            DocumentoGenerado documento = crearDocumentoRecibo(cliente, pago, cuota, nombreArchivo, rutaArchivo, pdfBytes);
            DocumentoGenerado documentoGuardado = utils.guardarDocumento(documento);

            log.info("✅ Recibo generado y guardado con ID: {}, archivo: {}",
                documentoGuardado.getId(), nombreArchivo);

            return documentoGuardado;

        } catch (Exception e) {
            log.error("❌ Error generando recibo para cuota ID: {}: {}", cuota.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando recibo", e);
        }
    }

    private byte[] generarPDF(Cliente cliente, Pago pago, CuotaPago cuota) throws Exception {
        log.info("🔧 Generando PDF de recibo con Flying Saucer para cuota: {}", cuota.getNumeroCuota());

        try {
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
            ClienteArma clienteArma = armasCliente != null && !armasCliente.isEmpty() ? armasCliente.get(0) : null;

            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;

            BigDecimal montoAntesIva = cuota.getMonto();
            BigDecimal montoConIva = montoAntesIva.multiply(BigDecimal.valueOf(1 + ivaDecimal));

            LocalDate fechaActual = LocalDate.now();
            String fechaDocumento;
            try {
                fechaDocumento = fechaActual.format(FECHA_ESPANOL_FMT);
            } catch (Exception e) {
                log.warn("⚠️ Error formateando fecha con locale español, usando formato simple: {}", e.getMessage());
                fechaDocumento = fechaActual.format(FECHA_SIMPLE_FMT);
            }

            Map<String, Object> variables = new HashMap<>();
            int year = fechaActual.getYear();
            String iniciales = utils.obtenerInicialesImportador(cliente);
            int fallbackSeq = cuota.getId() != null ? Math.max(cuota.getId().intValue(), 100) : 100;
            String numeroReciboFallback = String.format("RC-%s-%d-%06d", iniciales, year, fallbackSeq);
            variables.put("numeroRecibo", cuota.getNumeroRecibo() != null ? cuota.getNumeroRecibo() : numeroReciboFallback);

            String fechaPagoStr;
            if (cuota.getFechaPago() != null) {
                try {
                    fechaPagoStr = cuota.getFechaPago().format(FECHA_PAGO_FMT);
                } catch (Exception e) {
                    fechaPagoStr = fechaActual.format(FECHA_PAGO_FMT);
                }
            } else {
                fechaPagoStr = fechaActual.format(FECHA_PAGO_FMT);
            }
            variables.put("fechaPago", fechaPagoStr);
            variables.put("fechaDocumento", fechaDocumento);
            variables.put("clienteNombre", cliente.getNombres() + " " + cliente.getApellidos());
            variables.put("clienteCedula", cliente.getNumeroIdentificacion());
            variables.put("clienteDireccion", cliente.getDireccion() != null ? cliente.getDireccion() : "");
            variables.put("clienteTelefono", cliente.getTelefonoPrincipal() != null ? cliente.getTelefonoPrincipal() : "");
            variables.put("clienteEmail", cliente.getEmail() != null ? cliente.getEmail() : "");

            boolean esUniformado = cliente.getTipoCliente() != null && cliente.getTipoCliente().esUniformado();
            String clienteRango = cliente.getRango() != null && !cliente.getRango().trim().isEmpty()
                ? cliente.getRango().toUpperCase()
                : "";
            variables.put("esUniformado", esUniformado);
            variables.put("clienteRango", clienteRango);

            Licencia licencia = utils.obtenerLicenciaActiva(cliente);
            String licenciaTitulo = licencia != null && licencia.getTitulo() != null && !licencia.getTitulo().trim().isEmpty()
                ? licencia.getTitulo() : "";
            String licenciaNombre = licencia != null && licencia.getNombre() != null ? licencia.getNombre() : "CZ ECUADOR";
            variables.put("licenciaTitulo", licenciaTitulo);
            variables.put("licenciaNombre", licenciaNombre);

            variables.put("numeroCuota", cuota.getNumeroCuota());
            variables.put("monto", cuota.getMonto());
            variables.put("montoFormateado", utils.formatCurrency(cuota.getMonto()));
            variables.put("montoAntesIva", montoAntesIva);
            variables.put("montoAntesIvaFormateado", utils.formatCurrency(montoAntesIva));
            variables.put("montoConIva", montoConIva);
            variables.put("montoConIvaFormateado", utils.formatCurrency(montoConIva));
            variables.put("referenciaPago", cuota.getReferenciaPago() != null ? cuota.getReferenciaPago() : "N/A");
            variables.put("observaciones", cuota.getObservaciones() != null ? cuota.getObservaciones() : "");
            variables.put("montoTotalPago", pago.getMontoTotal());
            variables.put("montoTotalPagoFormateado", utils.formatCurrency(pago.getMontoTotal()));
            variables.put("saldoPendiente", pago.getMontoPendiente());
            variables.put("saldoPendienteFormateado", utils.formatCurrency(pago.getMontoPendiente()));
            variables.put("ivaPorcentaje", ivaPorcentaje);

            if (clienteArma != null && clienteArma.getArma() != null) {
                Arma arma = clienteArma.getArma();
                variables.put("armaNombre", arma.getModelo() != null ? arma.getModelo() : "N/A");
                variables.put("armaModelo", arma.getModelo() != null ? arma.getModelo() : "");
                variables.put("armaMarca", arma.getMarca() != null ? arma.getMarca() : "");
                variables.put("armaAlimentadora", arma.getAlimentadora() != null ? arma.getAlimentadora() : "");
                variables.put("armaCalibre", arma.getCalibre() != null ? arma.getCalibre() : "");
                variables.put("cantidadArmas", clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1);
            } else {
                variables.put("armaNombre", "N/A");
                variables.put("armaModelo", "");
                variables.put("armaMarca", "");
                variables.put("armaAlimentadora", "");
                variables.put("armaCalibre", "");
                variables.put("cantidadArmas", 1);
            }

            if (numberToTextService != null) {
                try {
                    variables.put("montoEnLetras", numberToTextService.convertToText(cuota.getMonto()));
                } catch (Exception e) {
                    log.warn("⚠️ Error convirtiendo número a texto: {}", e.getMessage());
                    variables.put("montoEnLetras", "");
                }
            } else {
                variables.put("montoEnLetras", "");
            }

            byte[] pdfBytes = utils.generarPdf("recibo-cuota-pago", variables);

            log.info("✅ PDF de recibo generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("❌ Error generando PDF de recibo con Flying Saucer: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String generarNombreArchivo(Cliente cliente, CuotaPago cuota) {
        int year = java.time.LocalDate.now().getYear();
        String iniciales = utils.obtenerInicialesImportador(cliente);
        int fallbackSeq = cuota.getId() != null ? Math.max(cuota.getId().intValue(), 100) : 100;
        String numeroRecibo = cuota.getNumeroRecibo() != null
            ? cuota.getNumeroRecibo()
            : String.format("RC-%s-%d-%06d", iniciales, year, fallbackSeq);
        String fecha = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("recibo_%s_%s_%s.pdf", numeroRecibo.replaceAll("[^a-zA-Z0-9]", "_"),
            cliente.getNumeroIdentificacion(), fecha);
    }

    private DocumentoGenerado crearDocumentoRecibo(Cliente cliente, Pago pago, CuotaPago cuota,
                                                    String nombreArchivo, String rutaArchivo, byte[] pdfBytes) {
        DocumentoGenerado documento = utils.crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.RECIBO);
        documento.setNombre("Recibo de Pago - Cuota #" + cuota.getNumeroCuota());
        documento.setDescripcion("Recibo generado automáticamente para el pago de cuota #" + cuota.getNumeroCuota());
        return documento;
    }
}
