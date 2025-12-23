package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteCreateDTO;
import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.Pago;
import com.armasimportacion.service.helper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio principal para la creación de clientes completos
 * Coordina todos los servicios especializados para crear un cliente con todos sus datos relacionados
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClienteCompletoService {

    private final ClienteService clienteService;
    private final GestionDocumentosServiceHelper documentosHelper;
    private final GestionPagosServiceHelper pagosHelper;
    private final GestionArmasServiceHelper armasHelper;
    private final GestionRespuestasServiceHelper respuestasHelper;
    private final EmailService emailService;

    /**
     * Actualiza un cliente completo con todos sus datos relacionados
     * Este método se ejecuta en una transacción - Si cualquier paso falla, se revierte todo
     * 
     * @param clienteId ID del cliente a actualizar
     * @param requestData Datos actualizados del cliente desde el frontend
     * @return Resultado de la operación
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> actualizarClienteCompleto(Long clienteId, Map<String, Object> requestData) {
        log.info("🔄🔄🔄 ClienteCompletoService.actualizarClienteCompleto EJECUTÁNDOSE 🔄🔄🔄");
        log.info("🔄 Actualizando cliente completo ID: {}", clienteId);
        logDatosRecibidos(requestData);
        
        // Verificar que el cliente existe
        Cliente cliente = clienteService.findById(clienteId);
        log.info("✅ Cliente encontrado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());
        
        // 1. Actualizar cliente básico
        actualizarClienteBasico(requestData, cliente);
        
        // 2. Actualizar respuestas del formulario (eliminar las existentes y crear las nuevas)
        actualizarRespuestasDelCliente(requestData, cliente);
        
        // 3. Actualizar arma del cliente (solo si viene en requestData)
        // NOTA: La actualización de arma generalmente no se hace aquí, pero si viene en requestData, se procesa
        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null) {
            log.warn("⚠️ Actualización de arma en actualizarClienteCompleto no está implementada. " +
                    "La actualización de arma debe hacerse mediante ClienteArmaService directamente.");
        }
        
        log.info("✅ Cliente actualizado exitosamente: ID={}", cliente.getId());
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Cliente actualizado exitosamente");
        response.put("clienteId", clienteId);
        response.put("timestamp", LocalDateTime.now());
        
        return response;
    }

    /**
     * Crea un cliente completo con todos sus datos relacionados
     * Este método se ejecuta en una transacción - Si cualquier paso falla, se revierte todo
     * 
     * @param requestData Datos completos del cliente desde el frontend
     * @param usuarioId ID del usuario que está creando el cliente (vendedor)
     * @return Resultado de la operación con IDs de las entidades creadas
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> crearClienteCompleto(Map<String, Object> requestData, Long usuarioId) {
        log.info("🚀🚀🚀 ClienteCompletoService.crearClienteCompleto EJECUTÁNDOSE 🚀🚀🚀");
        log.info("🚀 Iniciando creación de cliente completo con usuarioId={}", usuarioId);
        logDatosRecibidos(requestData);
        
        // 1. Crear cliente básico
        Cliente cliente = crearClienteBasico(requestData, usuarioId);
        
        // 2. Guardar respuestas del formulario
        guardarRespuestasDelCliente(requestData, cliente);
        
        // 3. Asignar arma al cliente (si hay)
        asignarArmaAlCliente(requestData, cliente);
        
        // 4. Crear pago del cliente (opcional - solo si viene en requestData)
        Pago pago = null;
        Map<String, Object> pagoData = extraerDatosPago(requestData);
        if (pagoData != null && !pagoData.isEmpty()) {
            pago = crearPagoDelCliente(requestData, cliente.getId());
            
            // 5. Generar contrato (solo si hay pago)
            // NOTA: El contrato es secundario, si falla no debe revertir la transacción completa
            log.info("🔍 DEBUG: Llamando a generarContratoDelCliente...");
            try {
                generarContratoDelCliente(cliente, pago);
                log.info("🔍 DEBUG: generarContratoDelCliente completado");
            } catch (Exception e) {
                log.error("❌ Error en generarContratoDelCliente (no crítico): {}", e.getMessage(), e);
                // NO relanzar la excepción porque el contrato es secundario
                // La transacción continuará y se confirmará
            }
        } else {
            log.info("📝 No hay datos de pago, se creará más adelante en el flujo");
        }
        
        return crearRespuestaExitoso(cliente, pago);
    }

    /**
     * Crea el cliente básico usando ClienteService
     */
    private Cliente crearClienteBasico(Map<String, Object> requestData, Long usuarioId) {
        log.info("👤 Paso 1: Creando cliente básico con usuarioId={}", usuarioId);
        log.info("🔍 DEBUG: requestData completo: {}", requestData);
        
        Map<String, Object> clientData = extraerDatosCliente(requestData);
        log.info("🔍 DEBUG: clientData extraído: {}", clientData);
        
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        log.info("🔍 DEBUG: DTO construido - fechaNacimiento: {}", clienteCreateDTO.getFechaNacimiento());
        
        ClienteDTO clienteDTO = clienteService.createFromDTO(clienteCreateDTO, usuarioId);
        Cliente cliente = clienteService.findById(clienteDTO.getId());
        
        log.info("✅ Cliente creado: ID={}, nombres={}, apellidos={}, fechaNacimiento={}, usuarioCreadorId={}", 
            cliente.getId(), cliente.getNombres(), cliente.getApellidos(), cliente.getFechaNacimiento(), usuarioId);
        
        return cliente;
    }

    /**
     * Guarda las respuestas del formulario del cliente
     */
    private void guardarRespuestasDelCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("📝 Paso 2: Guardando respuestas del formulario");
        
        List<Map<String, Object>> respuestasData = extraerDatosRespuestas(requestData);
        if (respuestasData != null && !respuestasData.isEmpty()) {
            int respuestasGuardadas = respuestasHelper.guardarRespuestasCliente(respuestasData, cliente);
            log.info("✅ Respuestas guardadas: {} respuestas", respuestasGuardadas);
        } else {
            log.info("📝 No hay respuestas para guardar");
        }
    }

    /**
     * Actualiza el cliente básico usando ClienteService
     */
    private void actualizarClienteBasico(Map<String, Object> requestData, Cliente cliente) {
        log.info("👤 Actualizando cliente básico ID: {}", cliente.getId());
        
        Map<String, Object> clientData = extraerDatosCliente(requestData);
        if (clientData == null || clientData.isEmpty()) {
            log.warn("⚠️ No hay datos de cliente para actualizar");
            return;
        }
        
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        ClienteDTO clienteDTO = clienteService.updateFromDTO(cliente.getId(), clienteCreateDTO);
        
        log.info("✅ Cliente actualizado: ID={}, nombres={}, apellidos={}", 
            clienteDTO.getId(), clienteDTO.getNombres(), clienteDTO.getApellidos());
    }

    /**
     * Actualiza las respuestas del formulario del cliente
     * Elimina las respuestas existentes y crea las nuevas
     */
    private void actualizarRespuestasDelCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("📝 Actualizando respuestas del formulario para cliente ID: {}", cliente.getId());
        
        List<Map<String, Object>> respuestasData = extraerDatosRespuestas(requestData);
        if (respuestasData != null && !respuestasData.isEmpty()) {
            // Eliminar respuestas existentes y guardar las nuevas
            // El helper ya maneja esto internamente
            int respuestasGuardadas = respuestasHelper.guardarRespuestasCliente(respuestasData, cliente);
            log.info("✅ Respuestas actualizadas: {} respuestas", respuestasGuardadas);
        } else {
            log.info("📝 No hay respuestas para actualizar");
        }
    }

    /**
     * Asigna una arma al cliente
     */
    private void asignarArmaAlCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("🔫 Paso 3: Asignando arma al cliente");
        
        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null) {
            var clienteArma = armasHelper.asignarArmaACliente(armaData, cliente);
            if (clienteArma != null) {
                log.info("✅ Arma asignada: {}", clienteArma.getArma().getNombre());
            } else {
                log.warn("⚠️ No se pudo asignar arma al cliente");
            }
        } else {
            log.info("📝 No hay datos de arma para asignar");
        }
    }

    /**
     * Crea el pago del cliente
     */
    private Pago crearPagoDelCliente(Map<String, Object> requestData, Long clienteId) {
        log.info("💰 Paso 4: Creando pago del cliente");
        
        Map<String, Object> pagoData = extraerDatosPago(requestData);
        // Agregar cuotas al pagoData si existen (vienen en requestData.cuotas, no en pago.cuotas)
        if (requestData.containsKey("cuotas")) {
            pagoData.put("cuotas", requestData.get("cuotas"));
        }
        Pago pago = pagosHelper.crearPagoCompleto(pagoData, clienteId);
        
        log.info("✅ Pago creado: ID={}, monto={}, tipo={}", 
            pago.getId(), pago.getMontoTotal(), pago.getTipoPago());
        
        return pago;
    }

    /**
     * Genera el contrato del cliente usando JasperReports
     */
    private void generarContratoDelCliente(Cliente cliente, Pago pago) {
        log.info("📄📄📄 GENERANDO CONTRATO DEL CLIENTE - MÉTODO EJECUTÁNDOSE 📄📄📄");
        log.info("📄 Paso 5: Generando contrato con Thymeleaf");
        log.info("🔍 DEBUG: Cliente ID: {}, Nombres: {}, Apellidos: {}", 
            cliente.getId(), cliente.getNombres(), cliente.getApellidos());
        log.info("🔍 DEBUG: Pago ID: {}, Tipo Pago: {}, Monto Total: {}", 
            pago.getId(), pago.getTipoPago(), pago.getMontoTotal());
        
        try {
            log.info("🔍 DEBUG: Iniciando generación de contrato con Thymeleaf...");
            // Generar y guardar el contrato usando Thymeleaf
            var documento = documentosHelper.generarYGuardarContrato(cliente, pago);
            log.info("✅ Contrato generado y guardado exitosamente: ID={}", documento.getId());
            
            // 📧 Enviar email con el contrato adjunto
            if (cliente.getEmail() != null && !cliente.getEmail().isEmpty()) {
                try {
                    log.info("📧 Enviando contrato por email a: {}", cliente.getEmail());
                    String nombreCompleto = cliente.getNombres() + " " + cliente.getApellidos();
                    
                    // Construir path completo del archivo
                    // getRutaArchivo() ya incluye el nombre del archivo según FileStorageService.guardarDocumentoGeneradoCliente
                    String rutaCompleta = documento.getRutaArchivo();
                    log.info("📄 Path completo del contrato (desde BD): {}", rutaCompleta);
                    
                    emailService.enviarContratoAdjunto(
                        cliente.getEmail(),
                        nombreCompleto,
                        rutaCompleta
                    );
                    log.info("✅ Email enviado exitosamente a: {}", cliente.getEmail());
                } catch (Exception emailError) {
                    log.error("❌ Error enviando email: {}", emailError.getMessage());
                    // No interrumpir el flujo si falla el email
                }
            } else {
                log.warn("⚠️ Cliente sin email, no se puede enviar contrato por correo");
            }
            
        } catch (Exception e) {
            log.error("❌ Error generando contrato: {}", e.getMessage(), e);
            // No lanzar la excepción para no interrumpir el flujo de creación del cliente
            log.warn("⚠️ Continuando con la creación del cliente sin contrato");
        }
    }

    // Métodos auxiliares para extraer datos

    private Map<String, Object> extraerDatosCliente(Map<String, Object> requestData) {
        return Optional.ofNullable(requestData.get("cliente"))
            .filter(obj -> obj instanceof Map)
            .map(obj -> (Map<String, Object>) obj)
            .orElseThrow(() -> new RuntimeException("No se encontró campo 'cliente' en requestData"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extraerDatosRespuestas(Map<String, Object> requestData) {
        return Optional.ofNullable(requestData.get("respuestas"))
            .filter(obj -> obj instanceof List)
            .map(obj -> (List<Map<String, Object>>) obj)
            .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extraerDatosArma(Map<String, Object> requestData) {
        return Optional.ofNullable(requestData.get("arma"))
            .filter(obj -> obj instanceof Map)
            .map(obj -> (Map<String, Object>) obj)
            .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extraerDatosPago(Map<String, Object> requestData) {
        return Optional.ofNullable(requestData.get("pago"))
            .filter(obj -> obj instanceof Map)
            .map(obj -> (Map<String, Object>) obj)
            .orElse(null);
    }

    private ClienteCreateDTO construirClienteCreateDTO(Map<String, Object> clientData) {
        log.info("🔍 DEBUG: construirClienteCreateDTO EJECUTÁNDOSE con clientData: {}", clientData);
        ClienteCreateDTO dto = new ClienteCreateDTO();
        dto.setNumeroIdentificacion((String) clientData.get("numeroIdentificacion"));
        dto.setNombres((String) clientData.get("nombres"));
        dto.setApellidos((String) clientData.get("apellidos"));
        dto.setEmail((String) clientData.get("email"));
        dto.setTelefonoPrincipal((String) clientData.get("telefonoPrincipal"));
        dto.setTelefonoSecundario((String) clientData.get("telefonoSecundario"));
        dto.setTipoIdentificacionCodigo((String) clientData.get("tipoIdentificacionCodigo"));
        dto.setTipoClienteCodigo((String) clientData.get("tipoClienteCodigo"));
        
        // Campos de dirección - CORREGIDO: Agregar mapeo de campos faltantes
        log.warn("🔍 DEBUG: Antes de mapear - direccion: '{}', provincia: '{}', canton: '{}'", 
            clientData.get("direccion"), clientData.get("provincia"), clientData.get("canton"));
        
        dto.setDireccion((String) clientData.get("direccion"));
        dto.setProvincia((String) clientData.get("provincia"));
        dto.setCanton((String) clientData.get("canton"));
        
        log.warn("🔍 DEBUG: Después de mapear - direccion: '{}', provincia: '{}', canton: '{}'", 
            dto.getDireccion(), dto.getProvincia(), dto.getCanton());
        
        // Campos de empresa
        dto.setRepresentanteLegal((String) clientData.get("representanteLegal"));
        dto.setRuc((String) clientData.get("ruc"));
        dto.setNombreEmpresa((String) clientData.get("nombreEmpresa"));
        dto.setDireccionFiscal((String) clientData.get("direccionFiscal"));
        dto.setTelefonoReferencia((String) clientData.get("telefonoReferencia"));
        dto.setCorreoEmpresa((String) clientData.get("correoEmpresa"));
        dto.setProvinciaEmpresa((String) clientData.get("provinciaEmpresa"));
        dto.setCantonEmpresa((String) clientData.get("cantonEmpresa"));
        
        // Campo militar
        dto.setEstadoMilitar((String) clientData.get("estadoMilitar"));
        dto.setCodigoIssfa((String) clientData.get("codigoIssfa"));
        dto.setRango((String) clientData.get("rango"));
        
        // Parsear fecha de nacimiento
        parsearFechaNacimiento(clientData, dto);
        
        log.warn("🔍 DEBUG: DTO construido con direccion='{}', provincia='{}', canton='{}'", 
            dto.getDireccion(), dto.getProvincia(), dto.getCanton());
        
        return dto;
    }

    private void parsearFechaNacimiento(Map<String, Object> clientData, ClienteCreateDTO dto) {
        log.info("🔍 DEBUG: parsearFechaNacimiento llamado con clientData: {}", clientData);
        log.info("🔍 DEBUG: fechaNacimiento raw: {}", clientData.get("fechaNacimiento"));
        
        Optional.ofNullable(clientData.get("fechaNacimiento"))
            .map(Object::toString)
            .ifPresentOrElse(
                fechaStr -> {
                    try {
                        java.time.LocalDate fechaParseada = parsearFechaCompleta(fechaStr);
                        dto.setFechaNacimiento(fechaParseada.toString()); // Guardar como String ISO YYYY-MM-DD
                    } catch (Exception e) {
                        dto.setFechaNacimiento(LocalDateTime.now().toLocalDate().minusYears(30).toString());
                    }
                },
                () -> {
                    dto.setFechaNacimiento(LocalDateTime.now().toLocalDate().minusYears(30).toString());
                }
            );
    }

    /**
     * Parsea fecha usando múltiples formatos compatibles
     */
    private java.time.LocalDate parsearFechaCompleta(String fechaStr) {
        log.info("🔍 Parseando fecha: '{}'", fechaStr);
        
        if (fechaStr == null || fechaStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Fecha vacía");
        }
        
        fechaStr = fechaStr.trim();
        
        // Si la fecha viene con hora (ISO DateTime con 'T'), extraer solo la parte de la fecha
        if (fechaStr.contains("T")) {
            String fechaSola = fechaStr.split("T")[0]; // Tomar solo YYYY-MM-DD
            log.info("🔍 Detectado formato ISO DateTime, extrayendo fecha: {}", fechaSola);
            return java.time.LocalDate.parse(fechaSola);
        }
        
        // Formato ISO: YYYY-MM-DD
        if (fechaStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
            log.info("🔍 Detectado formato ISO: {}", fechaStr);
            return java.time.LocalDate.parse(fechaStr);
        }
        
        // Formato DD/MM/YYYY
        if (fechaStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
            log.info("🔍 Detectado formato DD/MM/YYYY: {}", fechaStr);
            String[] partes = fechaStr.split("/");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        // Formato DD-MM-YYYY
        if (fechaStr.matches("\\d{1,2}-\\d{1,2}-\\d{4}")) {
            log.info("🔍 Detectado formato DD-MM-YYYY: {}", fechaStr);
            String[] partes = fechaStr.split("-");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        // Formato YYYYMMDD (8 dígitos)
        if (fechaStr.matches("\\d{8}")) {
            log.info("🔍 Detectado formato YYYYMMDD: {}", fechaStr);
            int año = Integer.parseInt(fechaStr.substring(0, 4));
            int mes = Integer.parseInt(fechaStr.substring(4, 6));
            int dia = Integer.parseInt(fechaStr.substring(6, 8));
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        throw new IllegalArgumentException("Formato de fecha no reconocido: " + fechaStr);
    }

    private void logDatosRecibidos(Map<String, Object> requestData) {
        log.info("📋 === DATOS RECIBIDOS ===");
        log.info("📋 Cliente: {}", requestData.get("cliente"));
        log.info("📋 Arma: {}", requestData.get("arma"));
        log.info("📋 Respuestas: {}", requestData.get("respuestas"));
        log.info("📋 Pago: {}", requestData.get("pago"));
        log.info("📋 ======================");
    }

    private Map<String, Object> crearRespuestaExitoso(Cliente cliente, Pago pago) {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Cliente creado exitosamente");
        response.put("clienteId", cliente.getId());
        response.put("id", cliente.getId()); // También incluir 'id' para compatibilidad
        if (pago != null) {
            response.put("pagoId", pago.getId());
        }
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    private Map<String, Object> crearRespuestaError(String mensaje) {
        return Map.of(
            "success", false,
            "message", mensaje,
            "timestamp", LocalDateTime.now()
        );
    }
}
