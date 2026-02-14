package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteCreateDTO;
import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.Pago;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import com.armasimportacion.service.ClienteQueryService;
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
    private final ClienteQueryService clienteQueryService;
    private final GestionPagosServiceHelper pagosHelper;
    private final GestionArmasServiceHelper armasHelper;
    private final GestionRespuestasServiceHelper respuestasHelper;
    private final EmailVerificationService emailVerificationService;
    private final TipoIdentificacionRepository tipoIdentificacionRepository;
    private final TipoClienteRepository tipoClienteRepository;
    private final ClienteRepository clienteRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final GrupoImportacionClienteService grupoImportacionClienteService;

    /**
     * Actualiza un cliente de forma parcial - solo los campos modificados
     * Este método es más eficiente que actualizarClienteCompleto porque solo procesa lo que cambió
     * 
     * @param clienteId ID del cliente a actualizar
     * @param requestData Solo los campos que cambiaron (cliente, respuestas, etc.)
     * @return Resultado de la operación
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> actualizarClienteParcial(Long clienteId, Map<String, Object> requestData) {
        log.info("ClienteCompletoService.actualizarClienteParcial EJECUTÁNDOSE (OPTIMIZADO)");
        log.info("Actualizando cliente parcial ID: {}, campos recibidos: {}", clienteId, requestData.keySet());
        
        // Verificar que el cliente existe
        Cliente cliente = clienteService.findById(clienteId);
        log.info("Cliente encontrado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());

        ClienteDTO clienteDTOActualizado = null;

        // 1. Actualizar cliente básico SOLO si viene en requestData
        if (requestData.containsKey("cliente") && requestData.get("cliente") != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> clientData = (Map<String, Object>) requestData.get("cliente");
            if (clientData != null && !clientData.isEmpty()) {
                log.info("Actualizando datos básicos del cliente (solo campos enviados)");
                clienteDTOActualizado = actualizarClienteBasicoParcial(clientData, cliente);
            } else {
                log.info("No hay datos de cliente para actualizar, usando cliente actual");
                clienteDTOActualizado = clienteQueryService.findByIdAsDTO(cliente.getId());
            }
        } else {
            log.info("No se envió objeto 'cliente' en requestData, manteniendo datos actuales");
            clienteDTOActualizado = clienteQueryService.findByIdAsDTO(cliente.getId());
        }
        
        // 2. Actualizar respuestas SOLO si vienen en requestData
        if (requestData.containsKey("respuestas") && requestData.get("respuestas") != null) {
            log.info("Actualizando respuestas del formulario (solo si cambiaron)");
            actualizarRespuestasDelCliente(requestData, cliente);
        } else {
            log.info("No se enviaron respuestas, manteniendo respuestas actuales");
        }
        
        // 3. Actualizar arma del cliente SOLO si viene en requestData (PATCH - actualizar relación existente)
        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null && !armaData.isEmpty()) {
            log.info("Actualizando precio de arma del cliente (PATCH)");
            actualizarArmaDelCliente(armaData, cliente);
        } else {
            log.info("No se envió arma, manteniendo arma actual");
        }
        
        // 4. Si se actualizaron datos PERSONALES del cliente, reenviar correo de verificación
        // Solo reenviar si se modificaron campos de datos personales (no documentos, preguntas, armas, etc.)
        boolean datosPersonalesActualizados = false;
        if (requestData.containsKey("cliente") && requestData.get("cliente") != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> clientData = (Map<String, Object>) requestData.get("cliente");
            
            // Lista de campos que se consideran "datos personales" y requieren reenvío de correo
            java.util.Set<String> camposDatosPersonales = java.util.Set.of(
                "nombres",
                "apellidos",
                "numeroIdentificacion",
                "email",
                "telefonoPrincipal",
                "telefonoSecundario",
                "direccion",
                "provincia",
                "canton",
                "fechaNacimiento",
                "representanteLegal",
                "tipoIdentificacionCodigo",
                "tipoClienteCodigo"
            );
            
            // Verificar si alguno de los campos de datos personales fue actualizado
            for (String campo : camposDatosPersonales) {
                if (clientData.containsKey(campo)) {
                    datosPersonalesActualizados = true;
                    log.info("Campo de datos personales actualizado: {}", campo);
                    break;
                }
            }
        }
        
        if (datosPersonalesActualizados) {
            log.info("Datos personales del cliente actualizados, reenviando correo de verificación");
            // Recargar el cliente actualizado para enviar el correo con los datos más recientes
            Cliente clienteActualizado = clienteService.findById(clienteId);
            // Invalidar verificación anterior y reenviar correo
            clienteActualizado.setEmailVerificado(null); // Resetear a pendiente
            clienteRepository.save(clienteActualizado);
            enviarCorreoVerificacion(clienteActualizado);
        } else {
            log.info("No se actualizaron datos personales, no se reenviará correo de verificación");
        }
        
        log.info("Cliente actualizado parcialmente: ID={}", clienteId);
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Cliente actualizado exitosamente");
        response.put("clienteId", clienteId);
        response.put("cliente", clienteDTOActualizado);
        response.put("timestamp", LocalDateTime.now());
        
        return response;
    }
    
    /**
     * Actualiza solo los campos del cliente que vienen en clientData
     * No reescribe campos que no están presentes
     */
    private ClienteDTO actualizarClienteBasicoParcial(Map<String, Object> clientData, Cliente cliente) {
        log.info("Actualizando cliente parcial - campos recibidos: {}", clientData.keySet());
        
        // Actualizar solo los campos que están presentes en clientData
        if (clientData.containsKey("nombres")) {
            cliente.setNombres((String) clientData.get("nombres"));
        }
        if (clientData.containsKey("apellidos")) {
            cliente.setApellidos((String) clientData.get("apellidos"));
        }
        if (clientData.containsKey("numeroIdentificacion")) {
            cliente.setNumeroIdentificacion((String) clientData.get("numeroIdentificacion"));
        }
        if (clientData.containsKey("email")) {
            cliente.setEmail((String) clientData.get("email"));
        }
        if (clientData.containsKey("telefonoPrincipal")) {
            cliente.setTelefonoPrincipal((String) clientData.get("telefonoPrincipal"));
        }
        if (clientData.containsKey("telefonoSecundario")) {
            cliente.setTelefonoSecundario((String) clientData.get("telefonoSecundario"));
        }
        if (clientData.containsKey("direccion")) {
            cliente.setDireccion((String) clientData.get("direccion"));
        }
        if (clientData.containsKey("provincia")) {
            cliente.setProvincia((String) clientData.get("provincia"));
        }
        if (clientData.containsKey("canton")) {
            cliente.setCanton((String) clientData.get("canton"));
        }
        if (clientData.containsKey("representanteLegal")) {
            cliente.setRepresentanteLegal((String) clientData.get("representanteLegal"));
        }
        if (clientData.containsKey("ruc")) {
            cliente.setRuc((String) clientData.get("ruc"));
        }
        if (clientData.containsKey("nombreEmpresa")) {
            cliente.setNombreEmpresa((String) clientData.get("nombreEmpresa"));
        }
        if (clientData.containsKey("direccionFiscal")) {
            cliente.setDireccionFiscal((String) clientData.get("direccionFiscal"));
        }
        if (clientData.containsKey("telefonoReferencia")) {
            cliente.setTelefonoReferencia((String) clientData.get("telefonoReferencia"));
        }
        if (clientData.containsKey("correoEmpresa")) {
            cliente.setCorreoEmpresa((String) clientData.get("correoEmpresa"));
        }
        if (clientData.containsKey("provinciaEmpresa")) {
            cliente.setProvinciaEmpresa((String) clientData.get("provinciaEmpresa"));
        }
        if (clientData.containsKey("cantonEmpresa")) {
            cliente.setCantonEmpresa((String) clientData.get("cantonEmpresa"));
        }
        if (clientData.containsKey("estadoMilitar")) {
            String estadoMilitarStr = (String) clientData.get("estadoMilitar");
            if (estadoMilitarStr != null && !estadoMilitarStr.isEmpty()) {
                try {
                    cliente.setEstadoMilitar(EstadoMilitar.valueOf(estadoMilitarStr.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Estado militar inválido: {}", estadoMilitarStr);
                }
            }
        }
        if (clientData.containsKey("codigoIssfa")) {
            cliente.setCodigoIssfa((String) clientData.get("codigoIssfa"));
        }
        if (clientData.containsKey("codigoIsspol")) {
            cliente.setCodigoIsspol((String) clientData.get("codigoIsspol"));
        }
        if (clientData.containsKey("rango")) {
            cliente.setRango((String) clientData.get("rango"));
        }
        if (clientData.containsKey("estado")) {
            String estadoStr = (String) clientData.get("estado");
            if (estadoStr != null && !estadoStr.isEmpty()) {
                try {
                    cliente.setEstado(EstadoCliente.valueOf(estadoStr.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    log.warn("Estado cliente inválido: {}", estadoStr);
                }
            }
        }
        
        // Parsear fecha de nacimiento si viene
        if (clientData.containsKey("fechaNacimiento")) {
            Object fechaObj = clientData.get("fechaNacimiento");
            if (fechaObj != null) {
                try {
                    String fechaStr = fechaObj.toString();
                    if (fechaStr.contains("T")) {
                        fechaStr = fechaStr.split("T")[0];
                    }
                    java.time.LocalDate fechaParsed = java.time.LocalDate.parse(fechaStr);
                    cliente.setFechaNacimiento(fechaParsed);
                } catch (Exception e) {
                    log.warn("Error parseando fecha de nacimiento: {}", fechaObj);
                }
            }
        }
        
        // Actualizar relaciones solo si vienen los códigos
        if (clientData.containsKey("tipoIdentificacionCodigo")) {
            String codigo = (String) clientData.get("tipoIdentificacionCodigo");
            if (codigo != null && !codigo.isEmpty()) {
                var tipoIdentificacion = tipoIdentificacionRepository
                    .findByCodigo(codigo)
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de identificación no encontrado con código: " + codigo));
                cliente.setTipoIdentificacion(tipoIdentificacion);
            }
        }
        
        if (clientData.containsKey("tipoClienteCodigo")) {
            String codigo = (String) clientData.get("tipoClienteCodigo");
            if (codigo != null && !codigo.isEmpty()) {
                var tipoCliente = tipoClienteRepository
                    .findByCodigo(codigo)
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de cliente no encontrado con código: " + codigo));
                cliente.setTipoCliente(tipoCliente);
            }
        }
        
        // Guardar cambios
        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO clienteDTO = clienteQueryService.findByIdAsDTO(clienteActualizado.getId());
        
        log.info("Cliente actualizado parcialmente: ID={}, nombres={}",
            clienteDTO.getId(), clienteDTO.getNombres());
        
        return clienteDTO;
    }

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
        log.info("ClienteCompletoService.actualizarClienteCompleto EJECUTÁNDOSE");
        log.info("Actualizando cliente completo ID: {}", clienteId);
        logDatosRecibidos(requestData);
        
        // Verificar que el cliente existe
        Cliente cliente = clienteService.findById(clienteId);
        log.info("Cliente encontrado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());

        // 1. Actualizar cliente básico
        ClienteDTO clienteDTOActualizado = actualizarClienteBasico(requestData, cliente);

        // 2. Actualizar respuestas del formulario (eliminar las existentes y crear las nuevas)
        actualizarRespuestasDelCliente(requestData, cliente);

        // 3. Actualizar arma del cliente (solo si viene en requestData)
        // NOTA: La actualización de arma generalmente no se hace aquí, pero si viene en requestData, se procesa
        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null) {
            log.warn("Actualización de arma en actualizarClienteCompleto no está implementada. " +
                    "La actualización de arma debe hacerse mediante ClienteArmaService directamente.");
        }
        
        log.info("Cliente actualizado exitosamente: ID={}", cliente.getId());
        
        // Retornar el ClienteDTO completo para que el frontend pueda usarlo
        // Convertir ClienteDTO a Map para mantener compatibilidad con el formato actual
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Cliente actualizado exitosamente");
        response.put("clienteId", clienteId);
        response.put("cliente", clienteDTOActualizado); // Incluir el cliente completo
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
        log.info("ClienteCompletoService.crearClienteCompleto EJECUTÁNDOSE");
        log.info("Iniciando creación de cliente completo con usuarioId={}", usuarioId);
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
            // Contrato se genera en paso posterior del flujo
        } else {
            log.info("No hay datos de pago, se creará más adelante en el flujo");
        }
        
        // 6. Asignar automáticamente a grupo de importación disponible (provisional)
        // Solo si el cliente no es fantasma (PENDIENTE_ASIGNACION_CLIENTE)
        if (cliente.getEstado() != EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            // VALIDACIÓN OBLIGATORIA: Debe existir un grupo de importación disponible
            ClienteGrupoImportacion asignacion = 
                grupoImportacionClienteService.asignarClienteAGrupoDisponible(cliente, usuarioId);
            
            if (asignacion == null) {
                log.error("No hay grupo de importación disponible para asignar cliente ID: {}", cliente.getId());
                throw new BadRequestException(
                    "No hay grupos de importación disponibles. Por favor, comuníquese con el jefe de ventas para crear un grupo de importación antes de crear clientes."
                );
            }
            
            log.info("Cliente ID {} asignado automáticamente a grupo disponible (estado: PENDIENTE)", cliente.getId());
        }
        
        // 7. Enviar correo de verificación (si el cliente tiene email)
        // IMPORTANTE: Se envía DESPUÉS de guardar las respuestas para poder verificar si respondió NO a Sicoar
        enviarCorreoVerificacion(cliente);
        
        return crearRespuestaExitoso(cliente, pago);
    }

    /**
     * Crea el cliente básico usando ClienteService
     */
    private Cliente crearClienteBasico(Map<String, Object> requestData, Long usuarioId) {
        log.info("Paso 1: Creando cliente basico con usuarioId={}", usuarioId);

        Map<String, Object> clientData = extraerDatosCliente(requestData);
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        
        ClienteDTO clienteDTO = clienteService.createFromDTO(clienteCreateDTO, usuarioId);
        Cliente cliente = clienteService.findById(clienteDTO.getId());
        
        log.info("Cliente creado: ID={}, usuarioCreadorId={}", cliente.getId(), usuarioId);
        
        return cliente;
    }

    /**
     * Guarda las respuestas del formulario del cliente
     */
    private void guardarRespuestasDelCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("Paso 2: Guardando respuestas del formulario");
        
        List<Map<String, Object>> respuestasData = extraerDatosRespuestas(requestData);
        if (respuestasData != null && !respuestasData.isEmpty()) {
            int respuestasGuardadas = respuestasHelper.guardarRespuestasCliente(respuestasData, cliente);
            log.info("Respuestas guardadas: {} respuestas", respuestasGuardadas);
        } else {
            log.info("No hay respuestas para guardar");
        }
    }

    /**
     * Actualiza el cliente básico usando ClienteService
     * @return ClienteDTO actualizado
     */
    private ClienteDTO actualizarClienteBasico(Map<String, Object> requestData, Cliente cliente) {
        log.info("Actualizando cliente básico ID: {}", cliente.getId());
        
        Map<String, Object> clientData = extraerDatosCliente(requestData);
        if (clientData == null || clientData.isEmpty()) {
            log.warn("No hay datos de cliente para actualizar, retornando cliente actual");
            // Si no hay datos para actualizar, retornar el DTO actual del cliente
            return clienteQueryService.findByIdAsDTO(cliente.getId());
        }
        
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        ClienteDTO clienteDTO = clienteService.updateFromDTO(cliente.getId(), clienteCreateDTO);
        
        log.info("Cliente actualizado: ID={}, nombres={}, apellidos={}",
            clienteDTO.getId(), clienteDTO.getNombres(), clienteDTO.getApellidos());
        
        return clienteDTO;
    }

    /**
     * Actualiza las respuestas del formulario del cliente
     * Elimina las respuestas existentes y crea las nuevas
     */
    private void actualizarRespuestasDelCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("Actualizando respuestas del formulario para cliente ID: {}", cliente.getId());
        
        List<Map<String, Object>> respuestasData = extraerDatosRespuestas(requestData);
        if (respuestasData != null && !respuestasData.isEmpty()) {
            // Eliminar respuestas existentes y guardar las nuevas
            // El helper ya maneja esto internamente
            int respuestasGuardadas = respuestasHelper.guardarRespuestasCliente(respuestasData, cliente);
            log.info("Respuestas actualizadas: {} respuestas", respuestasGuardadas);
        } else {
            log.info("No hay respuestas para actualizar");
        }
    }

    /**
     * Asigna una arma al cliente (usado en POST - creación)
     */
    private void asignarArmaAlCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("Paso 3: Asignando arma al cliente (POST - creación)");
        
        List<Map<String, Object>> armasData = extraerDatosArmas(requestData);
        if (armasData != null && !armasData.isEmpty()) {
            for (Map<String, Object> armaData : armasData) {
                var clienteArma = armasHelper.asignarArmaACliente(armaData, cliente);
                if (clienteArma != null) {
                    log.info("Arma asignada: {}", clienteArma.getArma().getModelo());
                } else {
                    log.warn("No se pudo asignar arma al cliente");
                }
            }
            return;
        }

        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null) {
            var clienteArma = armasHelper.asignarArmaACliente(armaData, cliente);
            if (clienteArma != null) {
                log.info("Arma asignada: {}", clienteArma.getArma().getModelo());
            } else {
                log.warn("No se pudo asignar arma al cliente");
            }
            return;
        }

        log.info("No hay datos de arma para asignar");
    }
    
    /**
     * Actualiza el precio de la arma del cliente (usado en PATCH - actualización)
     */
    private void actualizarArmaDelCliente(Map<String, Object> armaData, Cliente cliente) {
        log.info("Actualizando precio de arma del cliente (PATCH - actualización)");
        
        if (armaData == null || armaData.isEmpty()) {
            log.info("No hay datos de arma para actualizar");
            return;
        }

        // Obtener armaId del JSON
        Object armaIdObj = armaData.get("armaId");
        if (armaIdObj == null) {
            log.warn("No se encontró armaId en armaData");
            return;
        }
        
        Long armaId;
        try {
            armaId = Long.parseLong(armaIdObj.toString());
        } catch (NumberFormatException e) {
            log.error("Error parseando armaId: {}", armaIdObj, e);
            return;
        }
        
        // Obtener precioUnitario del JSON
        Object precioUnitarioObj = armaData.get("precioUnitario");
        if (precioUnitarioObj == null) {
            log.warn("No se encontró precioUnitario en armaData");
            return;
        }
        
        java.math.BigDecimal precioUnitario;
        try {
            precioUnitario = new java.math.BigDecimal(precioUnitarioObj.toString());
        } catch (NumberFormatException e) {
            log.error("Error parseando precioUnitario: {}", precioUnitarioObj, e);
            return;
        }
        
        // Buscar relación cliente_arma existente (reservada o asignada)
        List<ClienteArma> reservasActivas = 
            clienteArmaRepository.findReservasActivasByClienteId(cliente.getId());
        
        // Buscar la reserva que corresponde al armaId
        ClienteArma reservaExistente = reservasActivas.stream()
            .filter(ca -> ca.getArma().getId().equals(armaId))
            .findFirst()
            .orElse(null);
        
        if (reservaExistente != null) {
            // Actualizar precio de la reserva existente
            reservaExistente.setPrecioUnitario(precioUnitario);
            reservaExistente.setFechaActualizacion(java.time.LocalDateTime.now());
            clienteArmaRepository.save(reservaExistente);
            log.info("Precio de arma actualizado: cliente={}, arma={}, precio={}",
                cliente.getId(), armaId, precioUnitario);
        } else {
            log.warn("No se encontró reserva activa para cliente {} y arma {}", cliente.getId(), armaId);
            // Si no existe, crear nueva relación (fallback - aunque no debería pasar en PATCH)
            log.info("Creando nueva relación cliente_arma como fallback");
            java.util.Map<String, Object> requestData = new java.util.HashMap<>();
            requestData.put("arma", armaData);
            asignarArmaAlCliente(requestData, cliente);
        }
    }

    /**
     * Crea el pago del cliente
     */
    private Pago crearPagoDelCliente(Map<String, Object> requestData, Long clienteId) {
        log.info("Paso 4: Creando pago del cliente");
        
        Map<String, Object> pagoData = extraerDatosPago(requestData);
        // Agregar cuotas al pagoData si existen (vienen en requestData.cuotas, no en pago.cuotas)
        if (requestData.containsKey("cuotas")) {
            pagoData.put("cuotas", requestData.get("cuotas"));
        }
        Pago pago = pagosHelper.crearPagoCompleto(pagoData, clienteId);
        
        log.info("Pago creado: ID={}, monto={}, tipo={}",
            pago.getId(), pago.getMontoTotal(), pago.getTipoPago());
        
        return pago;
    }


    // Métodos auxiliares para extraer datos

    @SuppressWarnings("unchecked")
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
    private List<Map<String, Object>> extraerDatosArmas(Map<String, Object> requestData) {
        return Optional.ofNullable(requestData.get("armas"))
            .filter(obj -> obj instanceof List)
            .map(obj -> (List<Map<String, Object>>) obj)
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
        ClienteCreateDTO dto = new ClienteCreateDTO();
        dto.setNumeroIdentificacion((String) clientData.get("numeroIdentificacion"));
        dto.setNombres((String) clientData.get("nombres"));
        dto.setApellidos((String) clientData.get("apellidos"));
        dto.setEmail((String) clientData.get("email"));
        dto.setTelefonoPrincipal((String) clientData.get("telefonoPrincipal"));
        dto.setTelefonoSecundario((String) clientData.get("telefonoSecundario"));
        dto.setTipoIdentificacionCodigo((String) clientData.get("tipoIdentificacionCodigo"));
        dto.setTipoClienteCodigo((String) clientData.get("tipoClienteCodigo"));
        
        // Campos de dirección
        dto.setDireccion((String) clientData.get("direccion"));
        dto.setProvincia((String) clientData.get("provincia"));
        dto.setCanton((String) clientData.get("canton"));
        
        // Campos de empresa
        dto.setRepresentanteLegal((String) clientData.get("representanteLegal"));
        dto.setRuc((String) clientData.get("ruc"));
        dto.setNombreEmpresa((String) clientData.get("nombreEmpresa"));
        dto.setDireccionFiscal((String) clientData.get("direccionFiscal"));
        dto.setTelefonoReferencia((String) clientData.get("telefonoReferencia"));
        dto.setCorreoEmpresa((String) clientData.get("correoEmpresa"));
        dto.setProvinciaEmpresa((String) clientData.get("provinciaEmpresa"));
        dto.setCantonEmpresa((String) clientData.get("cantonEmpresa"));
        
        // Campo militar/policial
        dto.setEstadoMilitar((String) clientData.get("estadoMilitar"));
        dto.setCodigoIssfa((String) clientData.get("codigoIssfa"));
        dto.setCodigoIsspol((String) clientData.get("codigoIsspol"));
        dto.setRango((String) clientData.get("rango"));
        
        // Campo estado (si viene, se establecerá en el cliente)
        if (clientData.containsKey("estado")) {
            dto.setEstado((String) clientData.get("estado"));
        }
        
        // Parsear fecha de nacimiento
        parsearFechaNacimiento(clientData, dto);
        
        return dto;
    }

    private void parsearFechaNacimiento(Map<String, Object> clientData, ClienteCreateDTO dto) {
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
        log.info("Parseando fecha: '{}'", fechaStr);
        
        if (fechaStr == null || fechaStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Fecha vacía");
        }
        
        fechaStr = fechaStr.trim();
        
        // Si la fecha viene con hora (ISO DateTime con 'T'), extraer solo la parte de la fecha
        if (fechaStr.contains("T")) {
            String fechaSola = fechaStr.split("T")[0]; // Tomar solo YYYY-MM-DD
            log.info("Detectado formato ISO DateTime, extrayendo fecha: {}", fechaSola);
            return java.time.LocalDate.parse(fechaSola);
        }
        
        // Formato ISO: YYYY-MM-DD
        if (fechaStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
            log.info("Detectado formato ISO: {}", fechaStr);
            return java.time.LocalDate.parse(fechaStr);
        }
        
        // Formato DD/MM/YYYY
        if (fechaStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
            log.info("Detectado formato DD/MM/YYYY: {}", fechaStr);
            String[] partes = fechaStr.split("/");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        // Formato DD-MM-YYYY
        if (fechaStr.matches("\\d{1,2}-\\d{1,2}-\\d{4}")) {
            log.info("Detectado formato DD-MM-YYYY: {}", fechaStr);
            String[] partes = fechaStr.split("-");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        // Formato YYYYMMDD (8 dígitos)
        if (fechaStr.matches("\\d{8}")) {
            log.info("Detectado formato YYYYMMDD: {}", fechaStr);
            int año = Integer.parseInt(fechaStr.substring(0, 4));
            int mes = Integer.parseInt(fechaStr.substring(4, 6));
            int dia = Integer.parseInt(fechaStr.substring(6, 8));
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        throw new IllegalArgumentException("Formato de fecha no reconocido: " + fechaStr);
    }

    private void logDatosRecibidos(Map<String, Object> requestData) {
        log.info("Datos recibidos - keys: {}", requestData.keySet());
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


    /**
     * Envía correo de verificación al cliente después de crearlo
     * Solo se envía si el cliente tiene email
     */
    private void enviarCorreoVerificacion(Cliente cliente) {
        // NO enviar correo a clientes fantasma (vendedores)
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            log.info("Cliente ID {} es cliente fantasma (vendedor), no se enviará correo de verificación", cliente.getId());
            return;
        }
        
        // NO enviar correo a compañías de seguridad - auto-validar datos
        if (cliente.esEmpresa()) {
            log.info("Cliente ID {} es compañía de seguridad, auto-validando datos sin enviar correo", cliente.getId());
            cliente.setEmailVerificado(true);
            clienteRepository.save(cliente);
            log.info("Datos auto-validados para cliente empresa ID: {}", cliente.getId());
            return;
        }
        
        if (cliente.getEmail() == null || cliente.getEmail().trim().isEmpty()) {
            log.info("Cliente ID {} no tiene email, no se enviará correo de verificación", cliente.getId());
            return;
        }

        try {
            log.info("Enviando correo de verificación a cliente ID: {}, email: {}",
                cliente.getId(), cliente.getEmail());
            emailVerificationService.generateAndSendVerificationToken(cliente);
            log.info("Correo de verificación enviado exitosamente");
        } catch (Exception e) {
            log.error("Error enviando correo de verificación (no crítico): {}", e.getMessage(), e);
            // No lanzamos excepción para no romper el flujo de creación del cliente
            // El cliente se crea exitosamente aunque falle el envío del correo
        }
    }
}
