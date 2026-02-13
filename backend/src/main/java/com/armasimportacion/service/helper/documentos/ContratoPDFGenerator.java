package com.armasimportacion.service.helper.documentos;

import com.armasimportacion.model.*;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.service.ConfiguracionSistemaService;
import com.armasimportacion.service.LocalizacionService;
import com.armasimportacion.service.NumberToTextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Generador de contratos de compraventa en PDF.
 * Maneja contratos para uniformados (ISSPOL/ISSFA) y compañías de seguridad.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContratoPDFGenerator {

    private final DocumentoPDFUtils utils;
    private final ClienteArmaRepository clienteArmaRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final ConfiguracionSistemaService configuracionService;
    private final LocalizacionService localizacionService;
    private final NumberToTextService numberToTextService;

    public DocumentoGenerado generarYGuardar(Cliente cliente, Pago pago) {
        try {
            log.info("📄 GENERANDO CONTRATO CON FLYING SAUCER PARA CLIENTE ID: {}", cliente.getId());
            log.info("🔍 DEBUG: Cliente nombres: {}, apellidos: {}", cliente.getNombres(), cliente.getApellidos());

            utils.eliminarDocumentosAnterioresDelTipo(cliente.getId(), TipoDocumentoGenerado.CONTRATO);

            log.info("🔧 Generando PDF profesional con Flying Saucer + Thymeleaf");
            byte[] pdfBytes = generarPDF(cliente, pago);
            log.info("🔍 DEBUG: PDF profesional generado con Flying Saucer, tamaño: {} bytes", pdfBytes.length);

            String nombreArchivo = generarNombreArchivo(cliente);

            String rutaArchivo = utils.guardarArchivo(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);

            DocumentoGenerado documento = utils.crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.CONTRATO);
            DocumentoGenerado documentoGuardado = utils.guardarDocumento(documento);

            log.info("✅ Contrato generado y guardado con ID: {}, archivo: {}",
                documentoGuardado.getId(), nombreArchivo);

            return documentoGuardado;

        } catch (Exception e) {
            log.error("❌ Error generando contrato para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando contrato", e);
        }
    }

    private byte[] generarPDF(Cliente cliente, Pago pago) throws Exception {
        log.info("🔧 Generando PDF con Flying Saucer para cliente: {}", cliente.getNombres());

        try {
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
            ClienteArma clienteArma = armasCliente.stream().findFirst().orElse(null);
            if (clienteArma == null) {
                log.error("❌ No se encontró arma asignada al cliente ID: {}", cliente.getId());
                throw new RuntimeException("No se encontró arma asignada al cliente");
            }

            log.info("✅ Arma encontrada: {}", clienteArma.getArma().getModelo());

            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;

            log.info("💰 IVA obtenido desde configuración: {}% ({})", ivaPorcentaje, ivaDecimal);

            java.util.List<CuotaPago> cuotas = new java.util.ArrayList<>();
            if (pago != null) {
                log.info("🔍 DEBUG: Pago ID: {}, tipoPago: {}", pago.getId(), pago.getTipoPago());
                if (pago.getId() != null && "CREDITO".equals(pago.getTipoPago())) {
                    cuotas = cuotaPagoRepository.findByPagoIdOrderByNumeroCuota(pago.getId());
                    log.info("📅 Cuotas cargadas: {} cuotas encontradas para pago ID: {}", cuotas.size(), pago.getId());
                    for (CuotaPago cuota : cuotas) {
                        log.info("🔍 DEBUG Cuota: numero={}, monto={}, fecha={}", cuota.getNumeroCuota(), cuota.getMonto(), cuota.getFechaVencimiento());
                    }
                } else {
                    log.info("⚠️ No se cargaron cuotas - pago ID: {}, tipoPago: {}", pago.getId(), pago.getTipoPago());
                }
            } else {
                log.info("⚠️ No hay pago asociado al cliente, generando contrato sin información de pago");
            }

            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null);
            variables.put("arma", clienteArma.getArma());
            variables.put("ivaPorcentaje", ivaPorcentaje);
            variables.put("ivaDecimal", ivaDecimal);
            variables.put("cuotas", cuotas);
            variables.put("numberToTextService", numberToTextService);
            variables.put("armasDetalle", construirDetalleArmasContrato(armasCliente));
            variables.put("cantidadArmasTexto", construirCantidadArmasTexto(armasCliente));
            variables.put("armasResumenTexto", construirResumenArmasContrato(armasCliente));

            log.info("🎖️ Rango del cliente: '{}'", cliente.getRango());
            variables.put("clienteRango", cliente.getRango());

            log.info("🆔 Código ISSFA del cliente: '{}'", cliente.getCodigoIssfa());
            log.info("🆔 Código ISSPOL del cliente: '{}'", cliente.getCodigoIsspol());

            String estadoMilitarLowercase = "activo";
            if (cliente.getEstadoMilitar() != null) {
                estadoMilitarLowercase = cliente.getEstadoMilitar().toString().toLowerCase();
            }
            log.info("🪖 Estado militar: '{}'", estadoMilitarLowercase);
            variables.put("estadoMilitarLowercase", estadoMilitarLowercase);

            java.time.LocalDate fechaActualEcuador = java.time.LocalDate.now(java.time.ZoneId.of("America/Guayaquil"));
            variables.put("fechaActual", fechaActualEcuador);

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
            String licenciaNumero = licencia != null && licencia.getNumero() != null ? licencia.getNumero() : "";
            String licenciaRuc = licencia != null && licencia.getRuc() != null ? licencia.getRuc() : "";
            variables.put("licenciaTitulo", licenciaTitulo);
            variables.put("licenciaNombre", licenciaNombre);
            variables.put("licenciaCedula", licenciaCedula);
            variables.put("licenciaNumero", licenciaNumero);
            variables.put("licenciaRuc", licenciaRuc);

            String nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
            String nombreCanton = cliente.getCanton();
            String direccionCliente = cliente.getDireccion();

            log.info("🗺️ Provincia - Código: {}, Nombre: {}", cliente.getProvincia(), nombreProvincia);
            log.info("🗺️ Cantón: {}", nombreCanton);
            log.info("🗺️ Dirección: {}", direccionCliente);

            StringBuilder direccionCompleta = new StringBuilder();
            if (nombreProvincia != null && !nombreProvincia.isEmpty()) {
                direccionCompleta.append(nombreProvincia);
            }
            if (nombreCanton != null && !nombreCanton.isEmpty()) {
                String cantonUpper = nombreCanton.toUpperCase();
                String provinciaUpper = nombreProvincia != null ? nombreProvincia.toUpperCase() : "";
                if (!provinciaUpper.contains(cantonUpper) && !cantonUpper.equals(provinciaUpper)) {
                    if (direccionCompleta.length() > 0) direccionCompleta.append(", ");
                    direccionCompleta.append(nombreCanton);
                }
            }
            if (direccionCliente != null && !direccionCliente.isEmpty()) {
                String direccionUpper = direccionCliente.toUpperCase();
                String cantonUpper = nombreCanton != null ? nombreCanton.toUpperCase() : "";
                if (!direccionUpper.equals(cantonUpper)) {
                    if (direccionCompleta.length() > 0) direccionCompleta.append(", ");
                    direccionCompleta.append(direccionCliente);
                }
            }

            log.info("🗺️ Dirección completa construida: {}", direccionCompleta.toString());
            variables.put("clienteDireccionCompleta", direccionCompleta.toString());

            log.info("🔧 Variables preparadas para template: cliente={}, pago={}, arma={}, IVA={}%, numeroCuotas={}",
                cliente.getNombres(),
                pago != null ? pago.getMontoTotal() : "N/A",
                clienteArma.getArma().getModelo(),
                ivaPorcentaje,
                pago != null ? pago.getNumeroCuotas() : 0);

            String nombreTemplate = determinarTemplateContrato(cliente);
            log.info("📄 Usando template: {}", nombreTemplate);

            byte[] pdfBytes = utils.generarPdf(nombreTemplate, variables);

            log.info("✅ PDF generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("❌ Error generando PDF con Flying Saucer: {}", e.getMessage(), e);
            throw e;
        }
    }

    private String determinarTemplateContrato(Cliente cliente) {
        if (cliente.getTipoCliente() == null || cliente.getTipoCliente().getNombre() == null) {
            log.warn("⚠️ Tipo de cliente no definido, usando template de uniformados por defecto");
            return utils.determinarTemplateUniformado(cliente, "contrato_compra");
        }

        String nombreTipoCliente = cliente.getTipoCliente().getNombre();
        if ("Compañía de Seguridad".equalsIgnoreCase(nombreTipoCliente)
            || "Compania de Seguridad".equalsIgnoreCase(nombreTipoCliente)
            || "Empresa Seguridad".equalsIgnoreCase(nombreTipoCliente)) {
            return "contratos/companias/contrato_compania_seguridad";
        }

        return utils.determinarTemplateUniformado(cliente, "contrato_compra");
    }

    private String generarNombreArchivo(Cliente cliente) {
        String apellidos = utils.normalizarNombreArchivo(cliente.getApellidos());
        String nombres = utils.normalizarNombreArchivo(cliente.getNombres());
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        return String.format("contrato_%s_%s_%s.pdf", apellidos, nombres, cedula);
    }

    private List<Map<String, Object>> construirDetalleArmasContrato(List<ClienteArma> armasCliente) {
        List<Map<String, Object>> armasDetalle = new java.util.ArrayList<>();
        if (armasCliente == null) {
            return armasDetalle;
        }
        for (ClienteArma clienteArma : armasCliente) {
            Arma arma = clienteArma.getArma();
            if (arma == null) {
                continue;
            }
            Map<String, Object> armaDetalle = new java.util.HashMap<>();
            armaDetalle.put("categoria", arma.getCategoria() != null ? arma.getCategoria().getNombre() : "N/A");
            armaDetalle.put("marca", arma.getMarca() != null ? arma.getMarca() : "N/A");
            armaDetalle.put("modelo", arma.getModelo() != null ? arma.getModelo() : "N/A");
            armaDetalle.put("calibre", arma.getCalibre() != null ? arma.getCalibre() : "N/A");
            armaDetalle.put("cantidad", clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1);
            armasDetalle.add(armaDetalle);
        }
        return armasDetalle;
    }

    private String construirCantidadArmasTexto(List<ClienteArma> armasCliente) {
        int totalArmas = 0;
        if (armasCliente != null) {
            totalArmas = armasCliente.stream()
                .mapToInt(arma -> arma.getCantidad() != null ? arma.getCantidad() : 1)
                .sum();
        }
        totalArmas = Math.max(totalArmas, 1);
        return totalArmas + (totalArmas == 1 ? " arma" : " armas");
    }

    private String construirResumenArmasContrato(List<ClienteArma> armasCliente) {
        if (armasCliente == null || armasCliente.isEmpty()) {
            return "N/A";
        }
        StringBuilder resumen = new StringBuilder();
        for (ClienteArma clienteArma : armasCliente) {
            Arma arma = clienteArma.getArma();
            if (arma == null) {
                continue;
            }
            int cantidad = clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1;
            String cantidadTexto = utils.convertirNumeroALetras(cantidad);
            String categoriaNombre = arma.getCategoria() != null ? arma.getCategoria().getNombre() : "";
            boolean esFemenino = categoriaNombre != null &&
                (categoriaNombre.toUpperCase().contains("PISTOLA") ||
                 categoriaNombre.toUpperCase().contains("ESCOPETA") ||
                 categoriaNombre.toUpperCase().contains("CARABINA"));
            if (cantidad == 1 && esFemenino) {
                cantidadTexto = "una";
            }
            if (resumen.length() > 0) {
                resumen.append("; ");
            }
            resumen.append(cantidadTexto.toUpperCase())
                .append(" (").append(cantidad).append(") ");
            if (categoriaNombre != null && !categoriaNombre.isEmpty()) {
                resumen.append(categoriaNombre.toUpperCase()).append(" ");
            }
            if (arma.getMarca() != null) {
                resumen.append(arma.getMarca()).append(" ");
            }
            if (arma.getModelo() != null) {
                resumen.append("MODELO ").append(arma.getModelo());
            }
        }
        return resumen.toString().trim();
    }
}
