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

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
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
    private final com.armasimportacion.service.FileStorageService fileStorageService;
    private final com.armasimportacion.repository.ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;

    /**
     * Genera y guarda los documentos según el tipo de cliente
     * - CIVILES: Solo Solicitud de compra
     * - UNIFORMADOS (Militar Fuerza Aérea/Terrestre/Naval, Policía): Solicitud de compra, Contrato, Cotización
     */
    public List<DocumentoGenerado> generarYGuardarDocumentos(Cliente cliente, Pago pago) {
        try {
            log.info("📄 GENERANDO DOCUMENTOS PARA CLIENTE ID: {}", cliente.getId());
            log.info("🔍 DEBUG: Cliente nombres: {}, apellidos: {}, tipo: {}", 
                cliente.getNombres(), cliente.getApellidos(), 
                cliente.getTipoCliente() != null ? cliente.getTipoCliente().getNombre() : "N/A");
            
            java.util.List<DocumentoGenerado> documentosGenerados = new java.util.ArrayList<>();
            
            // Determinar si es civil o uniformado
            boolean esCivil = cliente.esCivil();
            boolean esUniformado = cliente.esMilitar() || cliente.esPolicia();
            
            log.info("📋 Tipo de cliente: Civil={}, Uniformado={}", esCivil, esUniformado);
            
            if (esCivil) {
                // CIVILES: Solo Solicitud de compra
                log.info("📄 Generando Solicitud de compra para cliente CIVIL");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);
            } else if (esUniformado) {
                // UNIFORMADOS: Solicitud de compra, Contrato, Cotización
                log.info("📄 Generando documentos para cliente UNIFORMADO");
                
                // 1. Solicitud de compra
                log.info("📄 1/3: Generando Solicitud de compra");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);
                
                // 2. Contrato
                log.info("📄 2/3: Generando Contrato");
                DocumentoGenerado contrato = generarYGuardarContrato(cliente, pago);
                documentosGenerados.add(contrato);
                
                // 3. Cotización
                log.info("📄 3/3: Generando Cotización");
                DocumentoGenerado cotizacion = generarYGuardarCotizacion(cliente, pago);
                documentosGenerados.add(cotizacion);
            } else {
                // Por defecto, tratar como civil (solo solicitud)
                log.warn("⚠️ Tipo de cliente no identificado, tratando como CIVIL (solo solicitud)");
                DocumentoGenerado solicitud = generarYGuardarSolicitudCompra(cliente, pago);
                documentosGenerados.add(solicitud);
            }
            
            log.info("✅ {} documento(s) generado(s) exitosamente para cliente ID: {}", 
                documentosGenerados.size(), cliente.getId());
            
            return documentosGenerados;
            
        } catch (Exception e) {
            log.error("❌ Error generando documentos para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando documentos", e);
        }
    }
    
    /**
     * Obtiene el tipo de grupo de importación asignado al cliente
     * @param clienteId ID del cliente
     * @return Tipo de grupo (CUPO o JUSTIFICATIVO) o null si no tiene grupo asignado
     */
    private String obtenerTipoGrupoCliente(Long clienteId) {
        List<com.armasimportacion.model.ClienteGrupoImportacion> gruposCliente = 
            clienteGrupoImportacionRepository.findByClienteId(clienteId);
        
        if (gruposCliente == null || gruposCliente.isEmpty()) {
            return null;
        }
        
        // Buscar el grupo activo (no completado ni cancelado)
        for (com.armasimportacion.model.ClienteGrupoImportacion cgi : gruposCliente) {
            com.armasimportacion.enums.EstadoClienteGrupo estado = cgi.getEstado();
            if (estado != com.armasimportacion.enums.EstadoClienteGrupo.COMPLETADO && 
                estado != com.armasimportacion.enums.EstadoClienteGrupo.CANCELADO) {
                String tipoGrupo = cgi.getGrupoImportacion().getTipoGrupo();
                return tipoGrupo != null ? tipoGrupo : "CUPO"; // Valor por defecto
            }
        }
        
        return null;
    }
    
    /**
     * Genera y guarda un contrato PDF para el cliente usando Flying Saucer + Thymeleaf
     * (Método mantenido para compatibilidad, ahora es parte de generarYGuardarDocumentos)
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
            
            // Guardar archivo usando FileStorageService en documentos_clientes/{numeroIdentificacion}/documentos_generados/
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);
            
            DocumentoGenerado documento = crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.CONTRATO);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            log.info("✅ Contrato generado y guardado con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando contrato para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando contrato", e);
        }
    }
    
    /**
     * Genera y guarda una Cotización PDF para el cliente
     */
    public DocumentoGenerado generarYGuardarCotizacion(Cliente cliente, Pago pago) {
        try {
            log.info("📄 GENERANDO COTIZACIÓN PARA CLIENTE ID: {}", cliente.getId());
            
            // Generar PDF de cotización
            byte[] pdfBytes = generarPDFCotizacion(cliente, pago);
            log.info("🔍 DEBUG: PDF de cotización generado, tamaño: {} bytes", pdfBytes.length);
            
            String nombreArchivo = generarNombreArchivoCotizacion(cliente, pago);
            
            // Guardar archivo
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);
            
            DocumentoGenerado documento = crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.COTIZACION);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            log.info("✅ Cotización generada y guardada con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando cotización para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando cotización", e);
        }
    }
    
    /**
     * Genera y guarda una Solicitud de Compra PDF para el cliente
     */
    public DocumentoGenerado generarYGuardarSolicitudCompra(Cliente cliente, Pago pago) {
        try {
            log.info("📄 GENERANDO SOLICITUD DE COMPRA PARA CLIENTE ID: {}", cliente.getId());
            
            // Generar PDF de solicitud de compra
            byte[] pdfBytes = generarPDFSolicitudCompra(cliente, pago);
            log.info("🔍 DEBUG: PDF de solicitud de compra generado, tamaño: {} bytes", pdfBytes.length);
            
            String nombreArchivo = generarNombreArchivoSolicitudCompra(cliente, pago);
            
            // Guardar archivo
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);
            
            DocumentoGenerado documento = crearDocumentoGenerado(cliente, pago, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.SOLICITUD_COMPRA);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            log.info("✅ Solicitud de compra generada y guardada con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando solicitud de compra para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando solicitud de compra", e);
        }
    }

    /**
     * Genera y guarda una autorización de venta PDF para el cliente usando Flying Saucer + Thymeleaf
     */
    public DocumentoGenerado generarYGuardarAutorizacion(Cliente cliente, ClienteArma clienteArma, 
                                                         String numeroFactura, String tramite) {
        try {
            log.info("📄 GENERANDO AUTORIZACIÓN DE VENTA PARA CLIENTE ID: {}", cliente.getId());
            
            // Verificar y eliminar autorizaciones anteriores del cliente (sobrescribir)
            List<DocumentoGenerado> autorizacionesAnteriores = documentoGeneradoRepository
                .findByClienteIdAndTipo(cliente.getId(), TipoDocumentoGenerado.AUTORIZACION);
            
            if (!autorizacionesAnteriores.isEmpty()) {
                log.info("⚠️ Se encontraron {} autorización(es) anterior(es) para el cliente, se sobrescribirán", autorizacionesAnteriores.size());
                
                for (DocumentoGenerado autorizacionAnterior : autorizacionesAnteriores) {
                    // Eliminar archivo físico si existe
                    try {
                        String rutaCompletaAnterior = construirRutaCompletaDocumentoGenerado(
                            autorizacionAnterior.getRutaArchivo(), 
                            autorizacionAnterior.getNombreArchivo()
                        );
                        File archivoAnterior = new File(rutaCompletaAnterior);
                        if (archivoAnterior.exists()) {
                            archivoAnterior.delete();
                            log.info("🗑️ Archivo anterior eliminado: {}", rutaCompletaAnterior);
                        }
                    } catch (Exception e) {
                        log.warn("⚠️ No se pudo eliminar archivo anterior: {}", e.getMessage());
                    }
                    
                    // Eliminar registro de BD
                    documentoGeneradoRepository.delete(autorizacionAnterior);
                    log.info("🗑️ Registro anterior eliminado de BD: ID={}", autorizacionAnterior.getId());
                }
            }
            
            byte[] pdfBytes = generarPDFAutorizacion(cliente, clienteArma, numeroFactura, tramite);
            log.info("🔍 DEBUG: PDF autorización generado, tamaño: {} bytes", pdfBytes.length);
            
            String nombreArchivo = generarNombreArchivoAutorizacion(cliente);
            // Guardar archivo usando FileStorageService en documentos_clientes/{numeroIdentificacion}/documentos_generados/
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);
            
            DocumentoGenerado documento = crearDocumentoAutorizacion(cliente, nombreArchivo, rutaArchivo, pdfBytes);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            log.info("✅ Autorización generada y guardada con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando autorización para cliente ID: {}: {}", cliente.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando autorización", e);
        }
    }
    

    /**
     * Genera el nombre del archivo de contrato siguiendo el patrón estándar
     */
    private String generarNombreArchivoContrato(Cliente cliente, Pago pago) {
        // Formato: contrato_apellidos_nombres_cedula.pdf
        String apellidos = cliente.getApellidos() != null ? cliente.getApellidos().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String nombres = cliente.getNombres() != null ? cliente.getNombres().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        
        // Normalizar: reemplazar espacios por guiones bajos y convertir a minúsculas
        apellidos = apellidos.replaceAll("\\s+", "_").toLowerCase();
        nombres = nombres.replaceAll("\\s+", "_").toLowerCase();
        
        return String.format("contrato_%s_%s_%s.pdf", apellidos, nombres, cedula);
    }
    
    private String generarNombreArchivoCotizacion(Cliente cliente, Pago pago) {
        // Formato: cotizacion_apellidos_nombres_cedula.pdf
        String apellidos = cliente.getApellidos() != null ? cliente.getApellidos().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String nombres = cliente.getNombres() != null ? cliente.getNombres().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        
        apellidos = apellidos.replaceAll("\\s+", "_").toLowerCase();
        nombres = nombres.replaceAll("\\s+", "_").toLowerCase();
        
        return String.format("cotizacion_%s_%s_%s.pdf", apellidos, nombres, cedula);
    }
    
    private String generarNombreArchivoSolicitudCompra(Cliente cliente, Pago pago) {
        // Formato: solicitud_compra_apellidos_nombres_cedula.pdf
        String apellidos = cliente.getApellidos() != null ? cliente.getApellidos().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String nombres = cliente.getNombres() != null ? cliente.getNombres().replaceAll("[^a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]", "").trim() : "";
        String cedula = cliente.getNumeroIdentificacion() != null ? cliente.getNumeroIdentificacion() : "";
        
        apellidos = apellidos.replaceAll("\\s+", "_").toLowerCase();
        nombres = nombres.replaceAll("\\s+", "_").toLowerCase();
        
        return String.format("solicitud_compra_%s_%s_%s.pdf", apellidos, nombres, cedula);
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
                                                   String nombreArchivo, String rutaArchivo, byte[] pdfBytes,
                                                   TipoDocumentoGenerado tipoDocumento) {
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setCliente(cliente);
        
        // Establecer nombre y descripción según el tipo de documento
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
     * Determina el template correcto según el tipo de cliente para CONTRATOS
     * (Solo para uniformados - los civiles no generan contrato)
     */
    private String determinarTemplateContrato(Cliente cliente) {
        return determinarTemplateUniformado(cliente, "contrato_compra");
    }
    
    /**
     * Determina el template correcto según el tipo de cliente para documentos uniformados
     * @param cliente Cliente
     * @param tipoDocumento Tipo de documento: "solicitud_compra", "contrato_compra", "cotizacion"
     * @return Ruta del template (ej: "contratos/uniformados/solicitud_compra_fuerza_aerea")
     */
    private String determinarTemplateUniformado(Cliente cliente, String tipoDocumento) {
        if (cliente.getTipoCliente() == null || cliente.getTipoCliente().getNombre() == null) {
            log.warn("⚠️ Tipo de cliente no definido, usando template por defecto");
            return "contratos/uniformados/" + tipoDocumento + "_fuerza_terrestre";
        }
        
        String nombreTipoCliente = cliente.getTipoCliente().getNombre();
        log.info("🔍 Tipo de cliente: {}, tipoDocumento: {}", nombreTipoCliente, tipoDocumento);
        
        // Mapear nombres de tipos de cliente a sufijos de templates
        String sufijoTemplate = switch (nombreTipoCliente) {
            case "Militar Fuerza Terrestre" -> "fuerza_terrestre";
            case "Militar Fuerza Naval" -> "fuerza_naval";
            case "Militar Fuerza Aérea" -> "fuerza_aerea";
            case "Uniformado Policial" -> "policia";
            default -> {
                log.warn("⚠️ Tipo de cliente desconocido para uniformado: {}, usando template por defecto", nombreTipoCliente);
                yield "fuerza_terrestre"; // Por defecto
            }
        };
        
        return String.format("contratos/uniformados/%s_%s", tipoDocumento, sufijoTemplate);
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
            
            log.info("✅ Arma encontrada: {}", clienteArma.getArma().getModelo());
            
            // Obtener IVA dinámicamente desde configuración del sistema
            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;
            
            log.info("💰 IVA obtenido desde configuración: {}% ({})", ivaPorcentaje, ivaDecimal);
            
            // Cargar cuotas para obtener fechas dinámicas
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
            
            // Preparar variables para el template
            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null); // Pago puede ser null
            variables.put("arma", clienteArma.getArma());
            variables.put("ivaPorcentaje", ivaPorcentaje);  // Ej: 15
            variables.put("ivaDecimal", ivaDecimal);        // Ej: 0.15
            variables.put("cuotas", cuotas);                // Lista de cuotas para fechas dinámicas
            variables.put("numberToTextService", numberToTextService); // Servicio para convertir números a texto
            
            // Agregar rango del cliente
            log.info("🎖️ Rango del cliente: '{}'", cliente.getRango());
            variables.put("clienteRango", cliente.getRango());
            
            // Agregar estado militar en lowercase para el template
            String estadoMilitarLowercase = "activo"; // Valor por defecto
            if (cliente.getEstadoMilitar() != null) {
                estadoMilitarLowercase = cliente.getEstadoMilitar().toString().toLowerCase();
            }
            log.info("🪖 Estado militar: '{}'", estadoMilitarLowercase);
            variables.put("estadoMilitarLowercase", estadoMilitarLowercase);
            
        // Agregar fecha actual en timezone de Ecuador para firma del contrato
        java.time.LocalDate fechaActualEcuador = java.time.LocalDate.now(java.time.ZoneId.of("America/Guayaquil"));
        variables.put("fechaActual", fechaActualEcuador);
            
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
                cliente.getNombres(), 
                pago != null ? pago.getMontoTotal() : "N/A", 
                clienteArma.getArma().getModelo(), 
                ivaPorcentaje, 
                pago != null ? pago.getNumeroCuotas() : 0);
            
            // Determinar el template correcto según el tipo de cliente
            String nombreTemplate = determinarTemplateContrato(cliente);
            log.info("📄 Usando template: {}", nombreTemplate);
            
            // Generar PDF usando Flying Saucer con template específico
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate(nombreTemplate, variables);
            
            log.info("✅ PDF generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF con Flying Saucer: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Genera PDF de Cotización usando Flying Saucer con template HTML/CSS
     */
    private byte[] generarPDFCotizacion(Cliente cliente, Pago pago) throws Exception {
        log.info("🔧 Generando PDF de Cotización con Flying Saucer para cliente: {}", cliente.getNombres());
        
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
            
            // Obtener IVA dinámicamente
            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;
            
            // Preparar variables para el template
            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null);
            variables.put("arma", clienteArma.getArma());
            variables.put("ivaPorcentaje", ivaPorcentaje);
            variables.put("ivaDecimal", ivaDecimal);
            variables.put("numberToTextService", numberToTextService);
            
            // Determinar template según tipo de cliente (solo uniformados generan cotización)
            String nombreTemplate = determinarTemplateUniformado(cliente, "cotizacion");
            log.info("📄 Usando template de cotización: {}", nombreTemplate);
            
            // Generar PDF usando Flying Saucer con template específico
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate(nombreTemplate, variables);
            
            log.info("✅ PDF de cotización generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF de cotización: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Genera PDF de Solicitud de Compra usando Flying Saucer con template HTML/CSS
     */
    private byte[] generarPDFSolicitudCompra(Cliente cliente, Pago pago) throws Exception {
        log.info("🔧 Generando PDF de Solicitud de Compra con Flying Saucer para cliente: {}", cliente.getNombres());
        
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
            
            // Preparar variables para el template
            Map<String, Object> variables = new HashMap<>();
            variables.put("cliente", cliente);
            variables.put("pago", pago != null ? pago : null);
            variables.put("arma", clienteArma.getArma());
            variables.put("numberToTextService", numberToTextService);
            
            // Determinar template según tipo de cliente
            String nombreTemplate;
            if (cliente.esCivil()) {
                // Civiles: usar template en carpeta civiles
                nombreTemplate = "contratos/civiles/solicitud_compra";
            } else if (cliente.esMilitar() || cliente.esPolicia()) {
                // Uniformados: usar template específico según tipo
                nombreTemplate = determinarTemplateUniformado(cliente, "solicitud_compra");
            } else {
                // Por defecto, usar template de civiles
                log.warn("⚠️ Tipo de cliente no identificado, usando template de civiles");
                nombreTemplate = "contratos/civiles/solicitud_compra";
            }
            log.info("📄 Usando template de solicitud: {}", nombreTemplate);
            
            // Generar PDF usando Flying Saucer con template específico
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate(nombreTemplate, variables);
            
            log.info("✅ PDF de solicitud de compra generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF de solicitud de compra: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Genera PDF de autorización de venta usando Flying Saucer con template HTML/CSS
     */
    private byte[] generarPDFAutorizacion(Cliente cliente, ClienteArma clienteArma, 
                                         String numeroFactura, String tramite) throws Exception {
        log.info("🔧 Generando PDF de autorización con Flying Saucer para cliente: {}", cliente.getNombres());
        
        try {
            // Obtener los últimos 4 dígitos del número de factura para el código del oficio
            String ultimos4Numeros = "0000"; // Valor por defecto
            if (numeroFactura != null && !numeroFactura.isEmpty()) {
                // Extraer solo los dígitos del número de factura
                String soloNumeros = numeroFactura.replaceAll("[^0-9]", "");
                
                if (soloNumeros.length() >= 4) {
                    // Tomar los últimos 4 dígitos
                    ultimos4Numeros = soloNumeros.substring(soloNumeros.length() - 4);
                } else if (soloNumeros.length() > 0) {
                    // Rellenar con ceros a la izquierda para asegurar 4 dígitos
                    ultimos4Numeros = String.format("%04d", Integer.parseInt(soloNumeros));
                }
            }
            
            // Obtener año actual
            String anioActual = String.valueOf(java.time.LocalDate.now().getYear());
            
            // Obtener información de la licencia
            String licenciaIniciales = "JL";
            String licenciaRepresentante = "Dr. José Luis Guerrero";
            String licenciaRUC = "1707815922001";
            String licenciaTelefono = "0984167983";
            String licenciaEmail = "joseluis@guerreromartinez.com";
            
            // TODO: Obtener dinámicamente desde configuración del sistema o licencia activa
            
            // Obtener información del coordinador desde configuración (con fallback)
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
            
            // Fecha actual en formato legible
            String fechaActual = obtenerFechaActualFormateada();
            
            // Preparar variables para el template
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
            variables.put("licenciaRepresentante", licenciaRepresentante);
            variables.put("licenciaRUC", licenciaRUC);
            variables.put("licenciaTelefono", licenciaTelefono);
            variables.put("licenciaEmail", licenciaEmail);
            variables.put("coordinadorNombre", coordinadorNombre);
            variables.put("coordinadorCargo", coordinadorCargo);
            variables.put("coordinadorDireccion", coordinadorDireccion);
            
            // URLs de logo y marca de agua
            // Las imágenes deben estar en: backend/src/main/resources/static/images/logos/
            // Usamos rutas relativas desde el classpath base
            variables.put("logoImageUrl", "../../../static/images/logos/cz-logo.png");
            variables.put("watermarkImageUrl", "../../../static/images/logos/cz-watermark.png");
            
            log.info("🔧 Variables preparadas para template de autorización: cliente={}, arma={}, factura={}, tramite={}", 
                cliente.getNombres(), clienteArma.getArma().getModelo(), numeroFactura, tramite);
            
            // Generar PDF usando Flying Saucer con template de autorización
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate("autorizaciones/autorizacion_venta", variables);
            
            log.info("✅ PDF de autorización generado exitosamente, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF de autorización: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Obtiene la fecha actual formateada en español
     */
    private String obtenerFechaActualFormateada() {
        java.time.LocalDate fecha = java.time.LocalDate.now(java.time.ZoneId.of("America/Guayaquil"));
        
        String[] meses = {
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        };
        
        int dia = fecha.getDayOfMonth();
        String mes = meses[fecha.getMonthValue() - 1];
        int anio = fecha.getYear();
        
        return String.format("Quito, %d de %s del %d", dia, mes, anio);
    }

    /**
     * Genera el nombre del archivo de autorización
     */
    private String generarNombreArchivoAutorizacion(Cliente cliente) {
        String fechaActual = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return String.format("autorizacion_venta_%s_%s.pdf", 
            cliente.getNumeroIdentificacion(), fechaActual);
    }

    /**
     * Construye la ruta del archivo de autorización
     */
    private String construirRutaArchivoAutorizacion(Cliente cliente) {
        return String.format("documentacion/autorizaciones/cliente_%s/", 
            cliente.getNumeroIdentificacion());
    }

    /**
     * Crea el objeto DocumentoGenerado para autorización
     */
    private DocumentoGenerado crearDocumentoAutorizacion(Cliente cliente, 
                                                        String nombreArchivo, String rutaArchivo, byte[] pdfBytes) {
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setCliente(cliente);
        documento.setNombre("Autorización de Venta de Arma");
        documento.setDescripcion("Autorización de venta generada automáticamente para el arma asignada al cliente");
        // Usar el método sobrecargado con tipo de documento
        return crearDocumentoGenerado(cliente, null, nombreArchivo, rutaArchivo, pdfBytes, TipoDocumentoGenerado.AUTORIZACION);
    }
    
    /**
     * Construye la ruta completa física para un documento generado (contrato/autorización)
     * Ruta en BD puede ser:
     * - Nueva estructura: "documentos_clientes/{cedula}/documentos_generados/archivo.pdf"
     * - Estructura antigua: "documentacion/contratos_generados/cliente_X/archivo.pdf" (compatibilidad)
     * Ruta física: "/app/documentacion/{rutaBD}"
     */
    private String construirRutaCompletaDocumentoGenerado(String rutaBD, String nombreArchivo) {
        // Si la ruta ya es absoluta con /app/, usarla como base
        if (rutaBD.startsWith("/app/")) {
            // Si ya incluye el nombre del archivo, devolverla tal cual
            if (rutaBD.endsWith(nombreArchivo)) {
                return rutaBD;
            }
            // Si no, agregar el nombre del archivo
            return rutaBD.endsWith("/") ? rutaBD + nombreArchivo : rutaBD + "/" + nombreArchivo;
        }
        
        // Si la ruta ya incluye el nombre del archivo, solo agregar prefijo
        if (rutaBD.endsWith(nombreArchivo)) {
            // Si empieza con "documentos_clientes/" o "documentos_importacion/", agregar /app/documentacion/
            if (rutaBD.startsWith("documentos_clientes/") || rutaBD.startsWith("documentos_importacion/")) {
                return "/app/documentacion/" + rutaBD;
            }
            // Si ya incluye "documentacion/", agregar /app/
            if (rutaBD.startsWith("documentacion/")) {
                return "/app/" + rutaBD;
            }
            // En cualquier otro caso, asumir que falta el prefijo
            return "/app/documentacion/" + rutaBD;
        }
        
        // Si la ruta empieza con "documentos_clientes/" o "documentos_importacion/", agregar /app/documentacion/
        if (rutaBD.startsWith("documentos_clientes/") || rutaBD.startsWith("documentos_importacion/")) {
            String rutaCompleta = "/app/documentacion/" + rutaBD;
            if (!rutaCompleta.endsWith("/")) {
                rutaCompleta = rutaCompleta + "/";
            }
            return rutaCompleta + nombreArchivo;
        }
        
        // Si la ruta empieza con "documentacion/", agregar /app/ al inicio (compatibilidad con estructura antigua)
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
        
        // En cualquier otro caso (compatibilidad con rutas antiguas), asumir estructura antigua
        String rutaCompleta = "/app/documentacion/contratos_generados/" + rutaBD;
        if (!rutaCompleta.endsWith("/") && !rutaCompleta.endsWith(nombreArchivo)) {
            rutaCompleta = rutaCompleta + "/";
        }
        if (!rutaCompleta.endsWith(nombreArchivo)) {
            return rutaCompleta + nombreArchivo;
        }
        
        return rutaCompleta;
    }

    /**
     * Genera y guarda un RECIBO PDF para una cuota de pago usando Flying Saucer + Thymeleaf
     */
    public DocumentoGenerado generarYGuardarRecibo(Cliente cliente, Pago pago, CuotaPago cuota) {
        try {
            log.info("📄 GENERANDO RECIBO CON FLYING SAUCER PARA CUOTA ID: {}", cuota.getId());
            
            // Generar PDF del recibo
            byte[] pdfBytes = generarPDFRecibo(cliente, pago, cuota);
            log.info("✅ PDF de recibo generado con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            
            String nombreArchivo = generarNombreArchivoRecibo(cliente, cuota);
            
            // Guardar archivo usando FileStorageService
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoCliente(
                cliente.getNumeroIdentificacion(), pdfBytes, nombreArchivo);
            
            DocumentoGenerado documento = crearDocumentoRecibo(cliente, pago, cuota, nombreArchivo, rutaArchivo, pdfBytes);
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            log.info("✅ Recibo generado y guardado con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando recibo para cuota ID: {}: {}", cuota.getId(), e.getMessage(), e);
            throw new RuntimeException("Error generando recibo", e);
        }
    }

    /**
     * Genera PDF de recibo usando Flying Saucer con template HTML/CSS
     */
    private byte[] generarPDFRecibo(Cliente cliente, Pago pago, CuotaPago cuota) throws Exception {
        log.info("🔧 Generando PDF de recibo con Flying Saucer para cuota: {}", cuota.getNumeroCuota());
        
        try {
            // Obtener información del arma asignada al cliente
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());
            ClienteArma clienteArma = armasCliente != null && !armasCliente.isEmpty() ? armasCliente.get(0) : null;
            
            // Obtener IVA dinámicamente desde configuración del sistema
            String ivaValor = configuracionService.getValorConfiguracion("IVA");
            double ivaPorcentaje = Double.parseDouble(ivaValor);
            double ivaDecimal = ivaPorcentaje / 100.0;
            
            // Calcular monto antes de IVA y monto con IVA
            BigDecimal montoAntesIva = cuota.getMonto();
            BigDecimal montoConIva = montoAntesIva.multiply(BigDecimal.valueOf(1 + ivaDecimal));
            
            // Fecha del documento (fecha actual) - formato simplificado
            java.time.LocalDate fechaActual = java.time.LocalDate.now();
            String fechaDocumento;
            try {
                // Intentar con locale español
                fechaDocumento = fechaActual.format(
                    java.time.format.DateTimeFormatter.ofPattern("dd 'de' MMMM yyyy", 
                        java.util.Locale.forLanguageTag("es")));
            } catch (Exception e) {
                // Si falla, usar formato simple
                log.warn("⚠️ Error formateando fecha con locale español, usando formato simple: {}", e.getMessage());
                fechaDocumento = fechaActual.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            
            // Preparar variables para el template
            Map<String, Object> variables = new HashMap<>();
            String numeroReciboFallback = String.format("RC-%d-%06d", java.time.LocalDate.now().getYear(), cuota.getId());
            variables.put("numeroRecibo", cuota.getNumeroRecibo() != null ? cuota.getNumeroRecibo() : numeroReciboFallback);
            
            // Fecha de pago
            String fechaPagoStr;
            if (cuota.getFechaPago() != null) {
                try {
                    fechaPagoStr = cuota.getFechaPago().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                } catch (Exception e) {
                    fechaPagoStr = fechaActual.format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                }
            } else {
                fechaPagoStr = fechaActual.format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
            }
            variables.put("fechaPago", fechaPagoStr);
            variables.put("fechaDocumento", fechaDocumento);
            variables.put("clienteNombre", cliente.getNombres() + " " + cliente.getApellidos());
            variables.put("clienteCedula", cliente.getNumeroIdentificacion());
            variables.put("clienteDireccion", cliente.getDireccion() != null ? cliente.getDireccion() : "");
            variables.put("clienteTelefono", cliente.getTelefonoPrincipal() != null ? cliente.getTelefonoPrincipal() : "");
            variables.put("clienteEmail", cliente.getEmail() != null ? cliente.getEmail() : "");
            variables.put("numeroCuota", cuota.getNumeroCuota());
            variables.put("monto", cuota.getMonto());
            variables.put("montoFormateado", formatCurrency(cuota.getMonto()));
            variables.put("montoAntesIva", montoAntesIva);
            variables.put("montoAntesIvaFormateado", formatCurrency(montoAntesIva));
            variables.put("montoConIva", montoConIva);
            variables.put("montoConIvaFormateado", formatCurrency(montoConIva));
            variables.put("referenciaPago", cuota.getReferenciaPago() != null ? cuota.getReferenciaPago() : "N/A");
            variables.put("observaciones", cuota.getObservaciones() != null ? cuota.getObservaciones() : "");
            variables.put("montoTotalPago", pago.getMontoTotal());
            variables.put("montoTotalPagoFormateado", formatCurrency(pago.getMontoTotal()));
            variables.put("saldoPendiente", pago.getMontoPendiente());
            variables.put("saldoPendienteFormateado", formatCurrency(pago.getMontoPendiente()));
            variables.put("ivaPorcentaje", ivaPorcentaje);
            
            // Información del arma
            if (clienteArma != null && clienteArma.getArma() != null) {
                com.armasimportacion.model.Arma arma = clienteArma.getArma();
                variables.put("armaNombre", arma.getModelo() != null ? arma.getModelo() : "N/A"); // Cambiado de nombre a modelo
                variables.put("armaModelo", arma.getModelo() != null ? arma.getModelo() : ""); // Cambiado de nombre a modelo
                variables.put("armaMarca", arma.getMarca() != null ? arma.getMarca() : ""); // Nuevo campo
                variables.put("armaAlimentadora", arma.getAlimentadora() != null ? arma.getAlimentadora() : ""); // Nuevo campo
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
            
            // Convertir número a texto para el monto
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
            
            // Generar PDF usando Flying Saucer con template de recibo
            byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate("recibo-cuota-pago", variables);
            
            log.info("✅ PDF de recibo generado exitosamente con Flying Saucer, tamaño: {} bytes", pdfBytes.length);
            return pdfBytes;
            
        } catch (Exception e) {
            log.error("❌ Error generando PDF de recibo con Flying Saucer: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Genera el nombre del archivo para el recibo
     */
    private String generarNombreArchivoRecibo(Cliente cliente, CuotaPago cuota) {
        String numeroRecibo = cuota.getNumeroRecibo() != null
            ? cuota.getNumeroRecibo()
            : String.format("RC-%d-%06d", java.time.LocalDate.now().getYear(), cuota.getId());
        String fecha = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("recibo_%s_%s_%s.pdf", numeroRecibo.replaceAll("[^a-zA-Z0-9]", "_"), 
            cliente.getNumeroIdentificacion(), fecha);
    }

    /**
     * Crea el objeto DocumentoGenerado para recibo
     */
    private DocumentoGenerado crearDocumentoRecibo(Cliente cliente, Pago pago, CuotaPago cuota,
                                                   String nombreArchivo, String rutaArchivo, byte[] pdfBytes) {
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setCliente(cliente);
        documento.setNombre("Recibo de Pago - Cuota #" + cuota.getNumeroCuota());
        documento.setDescripcion("Recibo generado automáticamente para el pago de cuota #" + cuota.getNumeroCuota());
        documento.setTipoDocumento(TipoDocumentoGenerado.RECIBO);
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
            
            Usuario usuarioActual = buscarUsuarioPorEmail(emailUsuarioActual);
            if (usuarioActual != null) {
                documento.setUsuarioGenerador(usuarioActual);
            } else {
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

    /**
     * Formatea un BigDecimal como moneda
     */
    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "$0.00";
        java.text.NumberFormat formatter = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("es", "EC"));
        return formatter.format(amount);
    }
    
}
