package com.armasimportacion.service;

import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.model.*;
import com.armasimportacion.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContratoService {

    private static final DateTimeFormatter FECHA_CONTRATO_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FECHA_ARCHIVO_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;
    private final LocalizacionService localizacionService;

    /**
     * Genera y envía el contrato de compra al cliente y vendedor.
     * La transacción solo cubre la lectura de datos y el guardado del documento,
     * no el envío de email ni la generación del PDF.
     */
    public void generarYEnviarContrato(Long clienteId, Long pagoId, Long vendedorId) {
        try {
            log.info("🎯 Generando contrato para cliente: {} y pago: {}", clienteId, pagoId);

            // 1. Leer datos y guardar documento en transacción corta
            ContratoData datos = guardarContrato(clienteId, pagoId, vendedorId);

            // 2. Enviar email fuera de la transacción
            enviarContratoPorEmail(datos.cliente, datos.vendedor, datos.pago, datos.pdfBytes, datos.nombreArchivo);

            log.info("✅ Contrato generado y enviado exitosamente para cliente: {}", datos.cliente.getNombreCompleto());

        } catch (Exception e) {
            log.error("❌ Error al generar contrato: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar contrato", e);
        }
    }

    /**
     * Transacción corta: lee datos, genera PDF, guarda archivo y registra documento.
     */
    @Transactional
    protected ContratoData guardarContrato(Long clienteId, Long pagoId, Long vendedorId) throws IOException {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Usuario vendedor = usuarioRepository.findById(vendedorId)
                .orElseThrow(() -> new RuntimeException("Vendedor no encontrado"));
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));

        byte[] pdfBytes = generarPDFContrato(cliente, pago, vendedor);
        String nombreArchivo = generarNombreArchivo(cliente, pago);
        String rutaArchivo = fileStorageService.guardarArchivo(pdfBytes, nombreArchivo, "contratos");

        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setTipoDocumento(TipoDocumentoGenerado.CONTRATO);
        documento.setNombre(nombreArchivo);
        documento.setUrlArchivo(rutaArchivo);
        documento.setCliente(cliente);
        documento.setUsuarioGenerador(vendedor);
        documento.setFechaGeneracion(LocalDateTime.now());
        documento.setDescripcion("Contrato de compra de arma generado automáticamente");
        documentoGeneradoRepository.save(documento);

        return new ContratoData(cliente, vendedor, pago, pdfBytes, nombreArchivo);
    }

    private record ContratoData(Cliente cliente, Usuario vendedor, Pago pago, byte[] pdfBytes, String nombreArchivo) {}

    private byte[] generarPDFContrato(Cliente cliente, Pago pago, Usuario vendedor) throws IOException {
        Map<String, Object> datosContrato = crearDatosContrato(cliente, pago, vendedor);
        return generarPDFSimple(datosContrato);
    }

    private Map<String, Object> crearDatosContrato(Cliente cliente, Pago pago, Usuario vendedor) {
        Map<String, Object> datos = new HashMap<>();

        datos.put("clienteNombre", cliente.getNombres() + " " + cliente.getApellidos());
        datos.put("clienteIdentificacion", cliente.getNumeroIdentificacion());
        datos.put("clienteEmail", cliente.getEmail());
        datos.put("clienteTelefono", cliente.getTelefonoPrincipal());
        datos.put("clienteDireccion", cliente.getDireccion());

        String nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
        String nombreCanton = cliente.getCanton();

        StringBuilder direccionCompleta = new StringBuilder();
        if (nombreProvincia != null && !nombreProvincia.isEmpty()) {
            direccionCompleta.append(nombreProvincia);
        }
        if (nombreCanton != null && !nombreCanton.isEmpty()) {
            if (direccionCompleta.length() > 0) direccionCompleta.append(", ");
            direccionCompleta.append(nombreCanton);
        }
        if (cliente.getDireccion() != null && !cliente.getDireccion().isEmpty()) {
            if (direccionCompleta.length() > 0) direccionCompleta.append(", ");
            direccionCompleta.append(cliente.getDireccion());
        }

        datos.put("clienteDireccionCompleta", direccionCompleta.toString());
        datos.put("clienteRango", cliente.getRango());

        datos.put("vendedorNombre", vendedor.getNombres() + " " + vendedor.getApellidos());
        datos.put("vendedorEmail", vendedor.getEmail());

        datos.put("montoTotal", pago.getMontoTotal());
        datos.put("tipoPago", pago.getTipoPago());
        datos.put("numeroCuotas", pago.getNumeroCuotas());
        datos.put("montoCuota", pago.getMontoCuota());
        datos.put("fechaContrato", LocalDateTime.now().format(FECHA_CONTRATO_FMT));

        datos.put("empresaNombre", "GMARM - Gestión de Armas");
        datos.put("empresaDireccion", "Quito, Ecuador");
        datos.put("empresaTelefono", "+593-2-XXX-XXXX");
        datos.put("empresaEmail", "info@gmarm.com");

        return datos;
    }

    private byte[] generarPDFSimple(Map<String, Object> datos) throws IOException {
        StringBuilder contenido = new StringBuilder();
        contenido.append("CONTRATO DE COMPRA DE ARMA\n");
        contenido.append("==========================\n\n");
        contenido.append("Fecha: ").append(datos.get("fechaContrato")).append("\n\n");
        contenido.append("DATOS DEL CLIENTE:\n");
        contenido.append("Nombre: ").append(datos.get("clienteNombre")).append("\n");
        contenido.append("Identificación: ").append(datos.get("clienteIdentificacion")).append("\n");
        contenido.append("Email: ").append(datos.get("clienteEmail")).append("\n");
        contenido.append("Teléfono: ").append(datos.get("clienteTelefono")).append("\n");
        contenido.append("Dirección: ").append(datos.get("clienteDireccion")).append("\n\n");
        contenido.append("DATOS DEL VENDEDOR:\n");
        contenido.append("Nombre: ").append(datos.get("vendedorNombre")).append("\n");
        contenido.append("Email: ").append(datos.get("vendedorEmail")).append("\n\n");
        contenido.append("DATOS DEL PAGO:\n");
        contenido.append("Monto Total: $").append(datos.get("montoTotal")).append("\n");
        contenido.append("Tipo de Pago: ").append(datos.get("tipoPago")).append("\n");
        contenido.append("Número de Cuotas: ").append(datos.get("numeroCuotas")).append("\n");
        if (datos.get("montoCuota") != null) {
            contenido.append("Monto por Cuota: $").append(datos.get("montoCuota")).append("\n");
        }
        contenido.append("\n");
        contenido.append("TÉRMINOS Y CONDICIONES:\n");
        contenido.append("1. El cliente se compromete a cumplir con todos los pagos acordados.\n");
        contenido.append("2. La entrega del arma está sujeta a la aprobación de todos los documentos.\n");
        contenido.append("3. Este contrato es válido por 30 días desde su emisión.\n");
        contenido.append("4. Cualquier modificación debe ser acordada por ambas partes.\n\n");
        contenido.append("FIRMAS:\n");
        contenido.append("Cliente: _________________________\n");
        contenido.append("Vendedor: _________________________\n");
        contenido.append("Fecha: _________________________\n");

        return contenido.toString().getBytes("UTF-8");
    }

    private String generarNombreArchivo(Cliente cliente, Pago pago) {
        String fecha = LocalDateTime.now().format(FECHA_ARCHIVO_FMT);
        String clienteId = cliente.getId().toString();
        return String.format("contrato_%s_%s_%s.pdf", fecha, clienteId, pago.getId());
    }

    private void enviarContratoPorEmail(Cliente cliente, Usuario vendedor, Pago pago,
                                       byte[] pdfBytes, String nombreArchivo) {
        try {
            emailService.enviarContratoConAdjunto(
                cliente.getEmail(),
                cliente.getNombres() + " " + cliente.getApellidos(),
                pago,
                pdfBytes,
                nombreArchivo
            );

            emailService.enviarConfirmacionContratoVendedor(
                vendedor.getEmail(),
                vendedor.getNombres() + " " + vendedor.getApellidos(),
                cliente,
                pago,
                pdfBytes,
                nombreArchivo
            );

            log.info("✅ Contrato enviado por email a cliente y vendedor");

        } catch (Exception e) {
            log.error("❌ Error al enviar contrato por email: {}", e.getMessage(), e);
            throw new RuntimeException("Error al enviar contrato por email", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentoGenerado> obtenerContratosPorCliente(Long clienteId) {
        return documentoGeneradoRepository.findByClienteIdAndTipo(
            clienteId, TipoDocumentoGenerado.CONTRATO);
    }
}
