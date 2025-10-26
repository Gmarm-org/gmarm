package com.armasimportacion.service.helper;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.CuotaPagoRepository;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import com.armasimportacion.service.FlyingSaucerPdfService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio especializado para la gestión de documentos del cliente
 * Maneja la generación, almacenamiento y gestión de contratos y documentos
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GestionDocumentosServiceHelper {

    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CuotaPagoRepository cuotaPagoRepository;
    private final FlyingSaucerPdfService flyingSaucerPdfService;
    private final com.armasimportacion.service.NumberToTextService numberToTextService;
    private final com.armasimportacion.service.ConfiguracionSistemaService configuracionService;
    private final com.armasimportacion.service.LocalizacionService localizacionService;

    /**
     * Genera y guarda un contrato PDF para el cliente usando Flying Saucer + Thymeleaf
     */
    public DocumentoGenerado generarYGuardarContrato(Cliente cliente, Pago pago) {
        try {
            log.info("📄 GENERANDO CONTRATO CON FLYING SAUCER PARA CLIENTE ID: {}", cliente.getId());
            log.info("🔍 DEBUG: Cliente nombres: {}, apellidos: {}", cliente.getNombres(), cliente.getApellidos());
            
                // SOLUCIÓN DEFINITIVA: Usar Flying Saucer con template HTML/CSS
                log.info("🔧 Generando PDF profesional con Flying Saucer + Thymeleaf");
                byte[] pdfBytes = generarPDFConFlyingSaucer(cliente, pago);
                log.info("🔍 DEBUG: PDF profesional generado con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            
            String nombreArchivo = generarNombreArchivoContrato(cliente, pago);
            String rutaArchivo = construirRutaArchivoContrato(cliente);
            
            DocumentoGenerado documento = crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            // Escribir el archivo PDF físicamente al sistema de archivos
            escribirArchivoPDF(rutaArchivo, nombreArchivo, pdfBytes);
            
            log.info("✅ Contrato generado y guardado con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando contrato para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando contrato", e);
        }
    }
    

    /**
     * Genera el nombre del archivo de contrato siguiendo el patrón estándar
     */
    private String generarNombreArchivoContrato(Cliente cliente, Pago pago) {
        String fechaActual = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("contrato_%s_%s.pdf", 
            cliente.getNumeroIdentificacion(), fechaActual);
    }

    /**
     * Construye la ruta del archivo de contrato usando la cédula del cliente
     */
    private String construirRutaArchivoContrato(Cliente cliente) {
        return String.format("documentacion/contratos_generados/cliente_%s/", 
            cliente.getNumeroIdentificacion());
    }

    /**
     * Crea el objeto DocumentoGenerado con todos los datos necesarios
     */
    private DocumentoGenerado crearDocumentoGenerado(Cliente cliente, Pago pago, 
                                                   String nombreArchivo, String rutaArchivo, byte[] pdfBytes) {
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setCliente(cliente);
        documento.setNombre("Contrato de Compraventa");
        documento.setDescripcion("Contrato generado automáticamente para la compra de arma");
        documento.setTipoDocumento(TipoDocumentoGenerado.CONTRATO);
        documento.setNombreArchivo(nombreArchivo);
        documento.setRutaArchivo(rutaArchivo);
        documento.setTamanioBytes((long) pdfBytes.length);
        documento.setFechaGeneracion(LocalDateTime.now());
        documento.setEstado(com.armasimportacion.enums.EstadoDocumentoGenerado.GENERADO);
        // Obtener el usuario actual del contexto de seguridad
        try {
            String emailUsuarioActual = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
            log.info("🔍 Usuario actual del contexto: {}", emailUsuarioActual);
            
            // Buscar el usuario por email
            Usuario usuarioActual = buscarUsuarioPorEmail(emailUsuarioActual);
            if (usuarioActual != null) {
                documento.setUsuarioGenerador(usuarioActual);
                log.info("✅ Usuario generador establecido: ID={}, email={}", 
                    usuarioActual.getId(), usuarioActual.getEmail());
            } else {
                log.warn("⚠️ No se encontró usuario con email: {}", emailUsuarioActual);
                // Fallback a usuario admin por defecto
                Usuario usuarioAdmin = new Usuario();
                usuarioAdmin.setId(1L);
                documento.setUsuarioGenerador(usuarioAdmin);
            }
        } catch (Exception e) {
            log.error("❌ Error obteniendo usuario actual: {}", e.getMessage());
            // Fallback a usuario admin por defecto
            Usuario usuarioAdmin = new Usuario();
            usuarioAdmin.setId(1L);
            documento.setUsuarioGenerador(usuarioAdmin);
        }
        
        return documento;
    }

    /**
     * Busca un usuario por su email
     */
    private Usuario buscarUsuarioPorEmail(String email) {
        try {
            return usuarioRepository.findByEmail(email)
                .orElse(null);
        } catch (Exception e) {
            log.error("❌ Error buscando usuario por email {}: {}", email, e.getMessage());
            return null;
        }
    }

    /**
     * Escribe el archivo PDF físicamente al sistema de archivos
     */
    private void escribirArchivoPDF(String rutaArchivo, String nombreArchivo, byte[] pdfBytes) {
        try {
            log.info("🔍 Escribiendo archivo PDF: {}{}", rutaArchivo, nombreArchivo);
            
            // Crear el directorio si no existe
            java.io.File directorio = new java.io.File(rutaArchivo);
            if (!directorio.exists()) {
                boolean creado = directorio.mkdirs();
                log.info("📁 Directorio creado: {}, éxito: {}", rutaArchivo, creado);
            }
            
            // Escribir el archivo
            java.io.File archivo = new java.io.File(directorio, nombreArchivo);
            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(archivo)) {
                fos.write(pdfBytes);
                fos.flush();
            }
            
            log.info("✅ Archivo PDF escrito exitosamente: {}", archivo.getAbsolutePath());
            
        } catch (Exception e) {
            log.error("❌ Error escribiendo archivo PDF: {}", e.getMessage(), e);
        }
    }

    /**
     * Valida que el cliente tenga todos los datos necesarios para generar un contrato
     */
    public boolean validarDatosClienteParaContrato(Cliente cliente) {
        if (cliente == null) {
            log.warn("⚠️ Cliente es nulo");
            return false;
        }
        
        if (cliente.getNombres() == null || cliente.getNombres().trim().isEmpty()) {
            log.warn("⚠️ Cliente sin nombres: ID {}", cliente.getId());
            return false;
        }
        
        if (cliente.getApellidos() == null || cliente.getApellidos().trim().isEmpty()) {
            log.warn("⚠️ Cliente sin apellidos: ID {}", cliente.getId());
            return false;
        }
        
        if (cliente.getNumeroIdentificacion() == null || cliente.getNumeroIdentificacion().trim().isEmpty()) {
            log.warn("⚠️ Cliente sin número de identificación: ID {}", cliente.getId());
            return false;
        }
        
        log.info("✅ Cliente validado correctamente para contrato: ID {}", cliente.getId());
        return true;
    }
    
    /**
     * Genera PDF profesional usando Flying Saucer con template HTML/CSS
     */
    private byte[] generarPDFConFlyingSaucer(Cliente cliente, Pago pago) throws Exception {
        log.info("🔧 Generando PDF con Flying Saucer para cliente: {}", cliente.getNombres());
        
        try {
            // Buscar arma asignada al cliente
            ClienteArma clienteArma = clienteArmaRepository.findByClienteId(cliente.getId())
                .stream()
                .findFirst()
                .orElse(null);
            
            if (clienteArma == null) {
                log.error("❌ No se encontró arma asignada al cliente ID: {}", cliente.getId());
                throw new RuntimeException("No se encontró arma asignada al cliente");
            }
            
            log.info("✅ Arma encontrada: {}", clienteArma.getArma().getNombre());
            
            // Obtener IVA dinámicamente desde configuración del sistema
            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;
            
            log.info("💰 IVA obtenido desde configuración: {}% ({})", ivaPorcentaje, ivaDecimal);
            
            // Cargar cuotas para obtener fechas dinámicas
            java.util.List<CuotaPago> cuotas = new java.util.ArrayList<>();
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
            
            // Preparar variables para el template
            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago);
            variables.put("arma", clienteArma.getArma());
            variables.put("ivaPorcentaje", ivaPorcentaje);  // Ej: 15
            variables.put("ivaDecimal", ivaDecimal);        // Ej: 0.15
            variables.put("cuotas", cuotas);                // Lista de cuotas para fechas dinámicas
            variables.put("numberToTextService", numberToTextService); // Servicio para convertir números a texto
            
            // Agregar rango del cliente
            log.info("🎖️ Rango del cliente: '{}'", cliente.getRango());
            variables.put("clienteRango", cliente.getRango());
            
            // Construir dirección completa con nombres legibles
            String nombreProvincia = localizacionService.getNombreProvinciaPorCodigo(cliente.getProvincia());
            String nombreCanton = cliente.getCanton(); // El cantón ya debería estar como nombre
            
            log.info("🗺️ Provincia - Código: {}, Nombre: {}", cliente.getProvincia(), nombreProvincia);
            log.info("🗺️ Cantón: {}", nombreCanton);
            log.info("🗺️ Dirección: {}", cliente.getDireccion());
            
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
            
            log.info("🗺️ Dirección completa construida: {}", direccionCompleta.toString());
            variables.put("clienteDireccionCompleta", direccionCompleta.toString());
            
            log.info("🔧 Variables preparadas para template: cliente={}, pago={}, arma={}, IVA={}%, numeroCuotas={}", 
                cliente.getNombres(), pago.getMontoTotal(), clienteArma.getArma().getNombre(), ivaPorcentaje, pago.getNumeroCuotas());
            
            // Generar PDF usando Flying Saucer con template profesional
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate("contrato_profesional", variables);
            
            log.info("✅ PDF generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF con Flying Saucer: {}", e.getMessage(), e);
            throw e;
        }
    }
    
}
