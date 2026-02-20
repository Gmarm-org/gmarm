package com.armasimportacion.service.helper;

import com.armasimportacion.exception.DocumentGenerationException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.Pago;
import com.armasimportacion.service.helper.documentos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Orquestador para la generación de documentos del cliente.
 * Delega la generación de cada tipo de documento a generadores especializados.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GestionDocumentosServiceHelper {

    private final ContratoPDFGenerator contratoPDFGenerator;
    private final CotizacionPDFGenerator cotizacionPDFGenerator;
    private final SolicitudCompraPDFGenerator solicitudCompraPDFGenerator;
    private final AutorizacionPDFGenerator autorizacionPDFGenerator;
    private final ReciboPDFGenerator reciboPDFGenerator;

    /**
     * Genera y guarda los documentos según el tipo de cliente
     * - CIVILES: Solo Solicitud de compra
     * - UNIFORMADOS (Militar Fuerza Aérea/Terrestre/Naval, Policía): Solicitud de compra, Contrato, Cotización
     */
    public List<DocumentoGenerado> generarYGuardarDocumentos(Cliente cliente, Pago pago) {
        try {
            log.info("GENERANDO DOCUMENTOS PARA CLIENTE ID: {}", cliente.getId());
            log.info("DEBUG: Cliente nombres: {}, apellidos: {}, tipo: {}",
                cliente.getNombres(), cliente.getApellidos(),
                cliente.getTipoCliente() != null ? cliente.getTipoCliente().getNombre() : "N/A");

            List<DocumentoGenerado> documentosGenerados = new ArrayList<>();

            boolean esCivil = cliente.esCivil();
            boolean esDeportista = cliente.esDeportista();
            boolean esUniformado = cliente.esMilitar() || cliente.esPolicia();

            log.info("Tipo de cliente: Civil={}, Uniformado={}", esCivil, esUniformado);

            if (esCivil || esDeportista) {
                log.info("Generando Solicitud de compra para cliente CIVIL/DEPORTISTA");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);
            } else if (esUniformado) {
                log.info("Generando documentos para cliente UNIFORMADO");

                log.info("1/3: Generando Solicitud de compra");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);

                log.info("2/3: Generando Contrato");
                DocumentoGenerado contrato = generarYGuardarContrato(cliente, pago);
                documentosGenerados.add(contrato);

                log.info("3/3: Generando Cotización");
                DocumentoGenerado cotizacion = generarYGuardarCotizacion(cliente, pago);
                documentosGenerados.add(cotizacion);
            } else {
                log.warn("Tipo de cliente no identificado, tratando como CIVIL (solo solicitud)");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);
            }

            log.info("{} documento(s) generado(s) exitosamente para cliente ID: {}",
                documentosGenerados.size(), cliente.getId());

            return documentosGenerados;

        } catch (Exception e) {
            log.error("Error generando documentos para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new DocumentGenerationException("Error generando documentos", e);
        }
    }

    public DocumentoGenerado generarYGuardarContrato(Cliente cliente, Pago pago) {
        return contratoPDFGenerator.generarYGuardar(cliente, pago);
    }

    public DocumentoGenerado generarYGuardarCotizacion(Cliente cliente, Pago pago) {
        return cotizacionPDFGenerator.generarYGuardar(cliente, pago);
    }

    public DocumentoGenerado generarYGuardarSolicitudCompra(Cliente cliente, Pago pago) {
        return solicitudCompraPDFGenerator.generarYGuardar(cliente, pago);
    }

    public DocumentoGenerado generarYGuardarAutorizacion(Cliente cliente, ClienteArma clienteArma,
                                                          String numeroFactura, String tramite) {
        return autorizacionPDFGenerator.generarYGuardar(cliente, clienteArma, numeroFactura, tramite);
    }

    public DocumentoGenerado generarYGuardarRecibo(Cliente cliente, Pago pago, CuotaPago cuota) {
        return reciboPDFGenerator.generarYGuardar(cliente, pago, cuota);
    }

    /**
     * Valida que el cliente tenga todos los datos necesarios para generar un contrato
     */
    public boolean validarDatosClienteParaContrato(Cliente cliente) {
        if (cliente == null) {
            log.warn("Cliente es nulo");
            return false;
        }

        if (cliente.getNombres() == null || cliente.getNombres().isBlank()) {
            log.warn("Cliente sin nombres: ID {}", cliente.getId());
            return false;
        }

        if (cliente.getApellidos() == null || cliente.getApellidos().isBlank()) {
            log.warn("Cliente sin apellidos: ID {}", cliente.getId());
            return false;
        }

        if (cliente.getNumeroIdentificacion() == null || cliente.getNumeroIdentificacion().isBlank()) {
            log.warn("Cliente sin número de identificación: ID {}", cliente.getId());
            return false;
        }

        log.info("Cliente validado correctamente para contrato: ID {}", cliente.getId());
        return true;
    }
}
