package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.service.NumberToTextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Generador de solicitudes de compra en PDF.
 * Maneja solicitudes tanto para civiles como uniformados.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SolicitudCompraPDFGenerator {

    private final DocumentoPDFUtils utils;
    private final ClienteArmaRepository clienteArmaRepository;
    private final NumberToTextService numberToTextService;

    public DocumentoGenerado generarYGuardar(Cliente cliente, Pago pago) {
        try {
            log.info("GENERANDO SOLICITUD DE COMPRA PARA CLIENTE ID: {}", cliente.getId());

            utils.eliminarDocumentosAnterioresDelTipo(cliente.getId(), TipoDocumentoGenerado.SOLICITUD_COMPRA);

            byte[] pdfBytes = generarPDF(cliente, pago);
            log.info("DEBUG: PDF de solicitud de compra generado, tamaño: {} bytes", pdfBytes.length);

            String nombreArchivo = generarNombreArchivo(cliente);

            String rutaArchivo = utils.guardarArchivo(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

            DocumentoGenerado documento = utils.crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.SOLICITUD_COMPRA);
            DocumentoGenerado documentoGuardado = utils.guardarDocumento(documento);

            log.info("Solicitud de compra generada y guardada con ID: {}, archivo: {}",
                documentoGuardado.getId(), nombreArchivo);

            return documentoGuardado;

        } catch (Exception e) {
            log.error("Error generando solicitud de compra para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando solicitud de compra", e);
        }
    }

    private byte[] generarPDF(Cliente cliente, Pago pago) throws Exception {
        log.info("Generando PDF de Solicitud de Compra con Flying Saucer para cliente: {}", cliente.getNombres());

        try {
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
            if (armasCliente == null || armasCliente.isEmpty()) {
                log.error("No se encontró arma asignada al cliente ID: {}", cliente.getId());
                throw new RuntimeException("No se encontró arma asignada al cliente");
            }

            int totalArmas = armasCliente.stream()
                .mapToInt(arma -> arma.getCantidad() != null ? arma.getCantidad() : 1)
                .sum();
            String cantidadArmasTexto = totalArmas + (totalArmas == 1 ? " arma" : " armas");

            List<Map<String, Object>> armasDetalle = new java.util.ArrayList<>();
            for (ClienteArma clienteArma : armasCliente) {
                Arma arma = clienteArma.getArma();
                if (arma == null) {
                    continue;
                }
                Map<String, Object> armaDetalle = new java.util.HashMap<>();
                armaDetalle.put("categoria", arma.getCategoria() != null ? arma.getCategoria().getNombre() : "");
                armaDetalle.put("marca", arma.getMarca());
                armaDetalle.put("modelo", arma.getModelo());
                armaDetalle.put("calibre", arma.getCalibre());
                armaDetalle.put("alimentadora", arma.getAlimentadora());
                armaDetalle.put("cantidad", clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1);
                armasDetalle.add(armaDetalle);
            }

            Licencia licencia = utils.obtenerLicenciaActiva(cliente);
            String licenciaTitulo = licencia != null && licencia.getTitulo() != null && !licencia.getTitulo().trim().isEmpty()
                ? licencia.getTitulo() : "";
            String licenciaNombre = licencia != null ? licencia.getNombre() : "";
            String licenciaCiudad = licencia != null && licencia.getCanton() != null
                ? licencia.getCanton().getNombre()
                : null;
            if (licenciaCiudad == null || licenciaCiudad.trim().isEmpty()) {
                licenciaCiudad = "Quito";
            }
            String fechaSolicitud = utils.obtenerFechaActualFormateadaConCiudad(licenciaCiudad);

            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null);
            variables.put("numberToTextService", numberToTextService);
            variables.put("fechaSolicitud", fechaSolicitud);
            variables.put("licenciaTitulo", licenciaTitulo);
            variables.put("licenciaNombre", licenciaNombre);
            variables.put("licenciaCiudad", licenciaCiudad);
            variables.put("cantidadArmas", totalArmas);
            variables.put("cantidadArmasTexto", cantidadArmasTexto);
            variables.put("cantidadArmasSolicitud", construirCantidadArmasSolicitud(totalArmas));
            variables.put("armasDetalle", armasDetalle);

            String nombreTemplate;
            if (cliente.esCivil()) {
                nombreTemplate = "contratos/civiles/solicitud_compra";
            } else if (cliente.esMilitar() || cliente.esPolicia()) {
                nombreTemplate = utils.determinarTemplateUniformado(cliente, "solicitud_compra");
            } else {
                log.warn("Tipo de cliente no identificado, usando template de civiles");
                nombreTemplate = "contratos/civiles/solicitud_compra";
            }
            log.info("Usando template de solicitud: {}", nombreTemplate);

            byte[] pdfBytes = utils.generarPdf(nombreTemplate, variables);

            log.info("PDF de solicitud de compra generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("Error generando PDF de solicitud de compra: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String construirCantidadArmasSolicitud(int totalArmas) {
        totalArmas = Math.max(totalArmas, 1);
        String numeroEnLetras = utils.convertirNumeroALetras(totalArmas);
        String armaPlural = totalArmas == 1 ? "arma" : "armas";
        return String.format("%s %s (%d)", numeroEnLetras, armaPlural, totalArmas);
    }

    private String generarNombreArchivo(Cliente cliente) {
        String apellidos = utils.normalizarNombreArchivo(cliente.getApellidos());
        String nombres = utils.normalizarNombreArchivo(cliente.getNombres());
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        return String.format("solicitud_compra_%s_%s_%s.pdf", apellidos, nombres, cedula);
    }
}
