package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.service.ConfiguracionSistemaService;
import com.armasimportacion.service.NumberToTextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Generador de cotizaciones en PDF.
 * Incluye lógica de numeración secuencial y detalle de armas con IVA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CotizacionPDFGenerator {

    private final DocumentoPDFUtils utils;
    private final ClienteArmaRepository clienteArmaRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ConfiguracionSistemaService configuracionService;
    private final NumberToTextService numberToTextService;

    public DocumentoGenerado generarYGuardar(Cliente cliente, Pago pago) {
        try {
            log.info("GENERANDO COTIZACIÓN PARA CLIENTE ID: {}", cliente.getId());

            String numeroCotizacion = determinarNumeroCotizacion(cliente);

            utils.eliminarDocumentosAnterioresDelTipo(cliente.getId(), TipoDocumentoGenerado.COTIZACION);

            byte[] pdfBytes = generarPDF(cliente, pago, numeroCotizacion);
            log.info("DEBUG: PDF de cotización generado, tamaño: {} bytes", pdfBytes.length);

            String nombreArchivo = generarNombreArchivo(cliente);

            String rutaArchivo = utils.guardarArchivo(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

            DocumentoGenerado documento = utils.crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.COTIZACION);
            documento.setNombre(numeroCotizacion);
            DocumentoGenerado documentoGuardado = utils.guardarDocumento(documento);

            log.info("Cotización generada y guardada con ID: {}, archivo: {}",
                documentoGuardado.getId(), nombreArchivo);

            return documentoGuardado;

        } catch (Exception e) {
            log.error("Error generando cotización para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando cotización", e);
        }
    }

    private String determinarNumeroCotizacion(Cliente cliente) {
        int year = java.time.LocalDate.now().getYear();
        String iniciales = utils.obtenerInicialesImportador(cliente);

        java.util.Optional<Integer> maxSeq = documentoGeneradoRepository.findMaxSecuenciaCotizacion(iniciales, year);

        int seq;
        if (maxSeq.isPresent()) {
            seq = maxSeq.get() + 1;
            log.info("Secuencia encontrada: máx existente = {}, nuevo = {}", maxSeq.get(), seq);
        } else {
            Licencia licencia = utils.obtenerLicenciaActiva(cliente);
            String licenciaNombre = licencia != null && licencia.getNombre() != null ? licencia.getNombre() : "";

            if (licenciaNombre.toLowerCase().contains("marcia") && licenciaNombre.toLowerCase().contains("loyaga")) {
                seq = 9;
                log.info("Licencia Marcia Loyaga - iniciando numeración en {}", seq);
            } else {
                seq = 1;
            }
        }

        String numeroCotizacion = String.format("%s-%04d-%d", iniciales, seq, year);
        log.info("Nueva cotización generada: {}", numeroCotizacion);
        return numeroCotizacion;
    }

    private byte[] generarPDF(Cliente cliente, Pago pago, String numeroCotizacion) throws Exception {
        log.info("Generando PDF de Cotización con Flying Saucer para cliente: {}", cliente.getNombres());

        try {
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
            if (armasCliente == null || armasCliente.isEmpty()) {
                log.error("No se encontró arma asignada al cliente ID: {}", cliente.getId());
                throw new RuntimeException("No se encontró arma asignada al cliente");
            }

            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;

            java.util.List<CuotaPago> cuotas = new java.util.ArrayList<>();
            if (pago != null && pago.getId() != null && "CREDITO".equals(pago.getTipoPago())) {
                cuotas = cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pago.getId());
                log.info("Cuotas cargadas para cotización: {} cuotas encontradas para pago ID: {}", cuotas.size(), pago.getId());
            }

            List<Map<String, Object>> armasDetalle = new java.util.ArrayList<>();
            int totalArmas = 0;
            for (ClienteArma clienteArma : armasCliente) {
                Arma arma = clienteArma.getArma();
                if (arma == null) {
                    continue;
                }
                int cantidad = clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1;
                totalArmas += cantidad;

                BigDecimal precioBase = clienteArma.getPrecioUnitario() != null
                    ? clienteArma.getPrecioUnitario()
                    : (arma.getPrecioReferencia() != null ? arma.getPrecioReferencia() : BigDecimal.ZERO);
                BigDecimal precioConIva = precioBase.multiply(BigDecimal.valueOf(1 + ivaDecimal));

                Map<String, Object> armaDetalle = new java.util.HashMap<>();
                armaDetalle.put("categoria", arma.getCategoria() != null ? arma.getCategoria().getNombre() : "N/A");
                armaDetalle.put("marca", arma.getMarca() != null ? arma.getMarca() : "N/A");
                armaDetalle.put("modelo", arma.getModelo() != null ? arma.getModelo() : "N/A");
                armaDetalle.put("calibre", arma.getCalibre() != null ? arma.getCalibre() : "N/A");
                armaDetalle.put("alimentadora", arma.getAlimentadora() != null ? arma.getAlimentadora() : "N/A");
                armaDetalle.put("cantidad", cantidad);
                armaDetalle.put("precioConIva", precioConIva);
                armaDetalle.put("precioConIvaFormateado", utils.formatCurrency(precioConIva));
                armasDetalle.add(armaDetalle);
            }
            String cantidadArmasTexto = Math.max(totalArmas, 1)
                + (totalArmas == 1 ? " arma" : " armas");

            Licencia licencia = utils.obtenerLicenciaActiva(cliente);
            String licenciaTitulo = licencia != null && licencia.getTitulo() != null && !licencia.getTitulo().trim().isEmpty()
                ? licencia.getTitulo() : "";
            String licenciaNombre = licencia != null && licencia.getNombre() != null ? licencia.getNombre() : "";
            String licenciaCedula = "";
            if (licencia != null) {
                if (licencia.getCedulaCuenta() != null && !licencia.getCedulaCuenta().trim().isEmpty()) {
                    licenciaCedula = licencia.getCedulaCuenta();
                } else if (licencia.getRuc() != null) {
                    licenciaCedula = licencia.getRuc();
                }
            }
            String licenciaNombreBanco = licencia != null && licencia.getNombreBanco() != null ? licencia.getNombreBanco() : "";
            String licenciaTipoCuenta = licencia != null && licencia.getTipoCuenta() != null ? licencia.getTipoCuenta() : "";
            String licenciaCuentaBancaria = licencia != null && licencia.getCuentaBancaria() != null ? licencia.getCuentaBancaria() : "";
            String licenciaTitular = licenciaNombre;

            log.info("Usando número de cotización: {}", numeroCotizacion);

            String licenciaCiudad = licencia != null && licencia.getCanton() != null
                ? licencia.getCanton().getNombre()
                : "Quito";
            String fechaCotizacion = utils.obtenerFechaActualFormateadaConCiudad(licenciaCiudad);

            String tipoUniformadoLabel = "MILITAR";
            if (cliente.getTipoCliente() != null && "Uniformado Policial".equalsIgnoreCase(cliente.getTipoCliente().getNombre())) {
                tipoUniformadoLabel = "POLICIA";
            }
            String estadoMilitarUpper = cliente.getEstadoMilitar() != null
                ? cliente.getEstadoMilitar().toString().toUpperCase()
                : "ACTIVO";

            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null);
            variables.put("ivaPorcentaje", ivaPorcentaje);
            variables.put("ivaDecimal", ivaDecimal);
            variables.put("numberToTextService", numberToTextService);
            variables.put("cuotas", cuotas);
            variables.put("armasDetalle", armasDetalle);
            variables.put("cantidadArmasTexto", cantidadArmasTexto);
            variables.put("numeroCotizacion", numeroCotizacion);
            variables.put("fechaCotizacion", fechaCotizacion);
            variables.put("tipoUniformadoLabel", tipoUniformadoLabel);
            variables.put("estadoMilitarUpper", estadoMilitarUpper);
            variables.put("clienteRango", cliente.getRango());
            variables.put("licenciaTitulo", licenciaTitulo);
            variables.put("licenciaNombre", licenciaNombre);
            variables.put("licenciaCedula", licenciaCedula);
            variables.put("licenciaNombreBanco", licenciaNombreBanco);
            variables.put("licenciaTipoCuenta", licenciaTipoCuenta);
            variables.put("licenciaCuentaBancaria", licenciaCuentaBancaria);
            variables.put("licenciaTitular", licenciaTitular);

            String nombreTemplate = utils.determinarTemplateUniformado(cliente, "cotizacion");
            log.info("Usando template de cotización: {}", nombreTemplate);

            byte[] pdfBytes = utils.generarPdf(nombreTemplate, variables);

            log.info("PDF de cotización generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("Error generando PDF de cotización: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String generarNombreArchivo(Cliente cliente) {
        String apellidos = utils.normalizarNombreArchivo(cliente.getApellidos());
        String nombres = utils.normalizarNombreArchivo(cliente.getNombres());
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        return String.format("cotizacion_%s_%s_%s.pdf", apellidos, nombres, cedula);
    }
}
