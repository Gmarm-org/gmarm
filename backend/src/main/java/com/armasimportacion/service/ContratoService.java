package com.armasimportacion.service;

import com.armasimportacion.dto.PagoDTO;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.model.*;
import com.armasimportacion.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ContratoService {

    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;
    private final LocalizacionService localizacionService;

    /**
     * Genera y envía el contrato de compra al cliente y vendedor
     */
    public void generarYEnviarContrato(Long clienteId, Long pagoId, Long vendedorId) {
        try {
            log.info("🎯 Generando contrato para cliente: {} y pago: {}", clienteId, pagoId);
            
            // 1. Obtener datos necesarios
            Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            
            Usuario vendedor = usuarioRepository.findById(vendedorId)
                    .orElseThrow(() -> new RuntimeException("Vendedor no encontrado"));
            
            Pago pago = pagoRepository.findById(pagoId)
                    .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
            
            // 2. Generar PDF del contrato
            byte[] pdfBytes = generarPDFContrato(cliente, pago, vendedor);
            
            // 3. Guardar archivo
            String nombreArchivo = generarNombreArchivo(cliente, pago);
            String rutaArchivo = fileStorageService.guardarArchivo(pdfBytes, nombreArchivo, "contratos");
            
            // 4. Registrar documento generado
            DocumentoGenerado documento = new DocumentoGenerado();
            documento.setTipoDocumento(TipoDocumentoGenerado.CONTRATO);
            documento.setNombre(nombreArchivo);
            documento.setUrlArchivo(rutaArchivo);
            documento.setCliente(cliente);
            documento.setUsuarioGenerador(vendedor);
            documento.setFechaGeneracion(LocalDateTime.now());
            documento.setDescripcion("Contrato de compra de arma generado automáticamente");
            
            documentoGeneradoRepository.save(documento);
            
            // 5. Enviar por email
            enviarContratoPorEmail(cliente, vendedor, pago, pdfBytes, nombreArchivo);
            
            log.info("✅ Contrato generado y enviado exitosamente para cliente: {}", cliente.getNombreCompleto());
            
        } catch (Exception e) {
            log.error("❌ Error al generar contrato: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar contrato", e);
        }
    }

    /**
     * Genera el PDF del contrato usando un template
     */
    private byte[] generarPDFContrato(Cliente cliente, Pago pago, Usuario vendedor) throws IOException {
        // Crear datos para el template
        Map<String, Object> datosContrato = crearDatosContrato(cliente, pago, vendedor);
        
        // Por ahora, generar un PDF simple
        // TODO: Implementar generación real con template Word/PDF
        return generarPDFSimple(datosContrato);
    }

    /**
     * Crea los datos del contrato
     */
    private Map<String, Object> crearDatosContrato(Cliente cliente, Pago pago, Usuario vendedor) {
        Map<String, Object> datos = new HashMap<>();
        
        // Datos del cliente
        datos.put("clienteNombre", cliente.getNombres() + " " + cliente.getApellidos());
        datos.put("clienteIdentificacion", cliente.getNumeroIdentificacion());
        datos.put("clienteEmail", cliente.getEmail());
        datos.put("clienteTelefono", cliente.getTelefonoPrincipal());
        datos.put("clienteDireccion", cliente.getDireccion());
        
        // Obtener nombre de provincia en lugar del código
        String nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
        String nombreCanton = cliente.getCanton(); // El cantón ya debería estar como nombre
        
        // Construir dirección completa con nombres legibles
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
        
        // Agregar rango si está disponible
        datos.put("clienteRango", cliente.getRango());
        
        // Datos del vendedor
        datos.put("vendedorNombre", vendedor.getNombres() + " " + vendedor.getApellidos());
        datos.put("vendedorEmail", vendedor.getEmail());
        
        // Datos del pago
        datos.put("montoTotal", pago.getMontoTotal());
        datos.put("tipoPago", pago.getTipoPago());
        datos.put("numeroCuotas", pago.getNumeroCuotas());
        datos.put("montoCuota", pago.getMontoCuota());
        datos.put("fechaContrato", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        
        // Datos de la empresa
        datos.put("empresaNombre", "GMARM - Gestión de Armas");
        datos.put("empresaDireccion", "Quito, Ecuador");
        datos.put("empresaTelefono", "+593-2-XXX-XXXX");
        datos.put("empresaEmail", "info@gmarm.com");
        
        return datos;
    }

    /**
     * Genera un PDF simple (temporal)
     */
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
        
        // Convertir a bytes (simulando PDF)
        return contenido.toString().getBytes("UTF-8");
    }

    /**
     * Genera el nombre del archivo
     */
    private String generarNombreArchivo(Cliente cliente, Pago pago) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String clienteId = cliente.getId().toString();
        return String.format("contrato_%s_%s_%s.pdf", fecha, clienteId, pago.getId());
    }

    /**
     * Envía el contrato por email
     */
    private void enviarContratoPorEmail(Cliente cliente, Usuario vendedor, Pago pago, 
                                       byte[] pdfBytes, String nombreArchivo) {
        try {
            // Enviar al cliente
            emailService.enviarContratoConAdjunto(
                cliente.getEmail(),
                cliente.getNombres() + " " + cliente.getApellidos(),
                pago,
                pdfBytes,
                nombreArchivo
            );
            
            // Enviar copia al vendedor
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

    /**
     * Obtiene contratos generados por cliente
     */
    public List<DocumentoGenerado> obtenerContratosPorCliente(Long clienteId) {
        return documentoGeneradoRepository.findByClienteIdAndTipo(
            clienteId, TipoDocumentoGenerado.CONTRATO);
    }
}
