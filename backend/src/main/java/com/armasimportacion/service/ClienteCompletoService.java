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

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> actualizarClienteParcial(Long clienteId, Map<String, Object> requestData) {
        log.info("ClienteCompletoService.actualizarClienteParcial EJECUTÁNDOSE (OPTIMIZADO)");
        log.info("Actualizando cliente parcial ID: {}, campos recibidos: {}", clienteId, requestData.keySet());
        
        Cliente cliente = clienteService.findById(clienteId);
        log.info("Cliente encontrado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());

        ClienteDTO clienteDTOActualizado = null;

        if (requestData.containsKey("cliente") && requestData.get("cliente") != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> clientData = (Map<String, Object>) requestData.get("cliente");
            if (clientData != null && !clientData.isEmpty()) {
                clienteDTOActualizado = actualizarClienteBasicoParcial(clientData, cliente);
            } else {
                clienteDTOActualizado = clienteQueryService.findByIdAsDTO(cliente.getId());
            }
        } else {
            clienteDTOActualizado = clienteQueryService.findByIdAsDTO(cliente.getId());
        }
        
        if (requestData.containsKey("respuestas") && requestData.get("respuestas") != null) {
            actualizarRespuestasDelCliente(requestData, cliente);
        }

        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null && !armaData.isEmpty()) {
            actualizarArmaDelCliente(armaData, cliente);
        }
        
        // Reenviar correo de verificación solo si se modificaron datos personales
        boolean datosPersonalesActualizados = false;
        if (requestData.containsKey("cliente") && requestData.get("cliente") != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> clientData = (Map<String, Object>) requestData.get("cliente");
            
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
            Cliente clienteActualizado = clienteService.findById(clienteId);
            clienteActualizado.setEmailVerificado(null);
            clienteRepository.save(clienteActualizado);
            enviarCorreoVerificacion(clienteActualizado);
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
    
    private ClienteDTO actualizarClienteBasicoParcial(Map<String, Object> clientData, Cliente cliente) {
        log.info("Actualizando cliente parcial - campos recibidos: {}", clientData.keySet());
        
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
        
        Cliente clienteActualizado = clienteRepository.save(cliente);
        ClienteDTO clienteDTO = clienteQueryService.findByIdAsDTO(clienteActualizado.getId());
        
        log.info("Cliente actualizado parcialmente: ID={}, nombres={}",
            clienteDTO.getId(), clienteDTO.getNombres());
        
        return clienteDTO;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> actualizarClienteCompleto(Long clienteId, Map<String, Object> requestData) {
        log.info("ClienteCompletoService.actualizarClienteCompleto EJECUTÁNDOSE");
        log.info("Actualizando cliente completo ID: {}", clienteId);
        logDatosRecibidos(requestData);
        
        Cliente cliente = clienteService.findById(clienteId);
        log.info("Cliente encontrado: ID={}, nombres={}", cliente.getId(), cliente.getNombres());

        ClienteDTO clienteDTOActualizado = actualizarClienteBasico(requestData, cliente);
        actualizarRespuestasDelCliente(requestData, cliente);

        Map<String, Object> armaData = extraerDatosArma(requestData);
        if (armaData != null) {
            log.warn("Actualización de arma en actualizarClienteCompleto no está implementada. " +
                    "La actualización de arma debe hacerse mediante ClienteArmaService directamente.");
        }
        
        log.info("Cliente actualizado exitosamente: ID={}", cliente.getId());

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Cliente actualizado exitosamente");
        response.put("clienteId", clienteId);
        response.put("cliente", clienteDTOActualizado);
        response.put("timestamp", LocalDateTime.now());
        
        return response;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> crearClienteCompleto(Map<String, Object> requestData, Long usuarioId) {
        log.info("ClienteCompletoService.crearClienteCompleto EJECUTÁNDOSE");
        log.info("Iniciando creación de cliente completo con usuarioId={}", usuarioId);
        logDatosRecibidos(requestData);
        
        Cliente cliente = crearClienteBasico(requestData, usuarioId);
        guardarRespuestasDelCliente(requestData, cliente);
        asignarArmaAlCliente(requestData, cliente);

        Pago pago = null;
        Map<String, Object> pagoData = extraerDatosPago(requestData);
        if (pagoData != null && !pagoData.isEmpty()) {
            pago = crearPagoDelCliente(requestData, cliente.getId());
        } else {
            log.info("No hay datos de pago, se creará más adelante en el flujo");
        }
        
        // No asignar clientes fantasma (PENDIENTE_ASIGNACION_CLIENTE) a grupos
        if (cliente.getEstado() != EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
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
        
        // Se envía DESPUÉS de guardar las respuestas para poder verificar si respondió NO a Sicoar
        enviarCorreoVerificacion(cliente);
        
        return crearRespuestaExitoso(cliente, pago);
    }

    private Cliente crearClienteBasico(Map<String, Object> requestData, Long usuarioId) {
        log.info("Paso 1: Creando cliente basico con usuarioId={}", usuarioId);

        Map<String, Object> clientData = extraerDatosCliente(requestData);
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        
        ClienteDTO clienteDTO = clienteService.createFromDTO(clienteCreateDTO, usuarioId);
        Cliente cliente = clienteService.findById(clienteDTO.getId());
        
        log.info("Cliente creado: ID={}, usuarioCreadorId={}", cliente.getId(), usuarioId);
        
        return cliente;
    }

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

    private ClienteDTO actualizarClienteBasico(Map<String, Object> requestData, Cliente cliente) {
        log.info("Actualizando cliente básico ID: {}", cliente.getId());
        
        Map<String, Object> clientData = extraerDatosCliente(requestData);
        if (clientData == null || clientData.isEmpty()) {
            return clienteQueryService.findByIdAsDTO(cliente.getId());
        }
        
        ClienteCreateDTO clienteCreateDTO = construirClienteCreateDTO(clientData);
        ClienteDTO clienteDTO = clienteService.updateFromDTO(cliente.getId(), clienteCreateDTO);
        
        log.info("Cliente actualizado: ID={}, nombres={}, apellidos={}",
            clienteDTO.getId(), clienteDTO.getNombres(), clienteDTO.getApellidos());
        
        return clienteDTO;
    }

    private void actualizarRespuestasDelCliente(Map<String, Object> requestData, Cliente cliente) {
        log.info("Actualizando respuestas del formulario para cliente ID: {}", cliente.getId());
        
        List<Map<String, Object>> respuestasData = extraerDatosRespuestas(requestData);
        if (respuestasData != null && !respuestasData.isEmpty()) {
            int respuestasGuardadas = respuestasHelper.guardarRespuestasCliente(respuestasData, cliente);
            log.info("Respuestas actualizadas: {} respuestas", respuestasGuardadas);
        } else {
            log.info("No hay respuestas para actualizar");
        }
    }

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
    
    private void actualizarArmaDelCliente(Map<String, Object> armaData, Cliente cliente) {
        if (armaData == null || armaData.isEmpty()) {
            return;
        }

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
        
        List<ClienteArma> reservasActivas =
            clienteArmaRepository.findReservasActivasByClienteId(cliente.getId());
        
        ClienteArma reservaExistente = reservasActivas.stream()
            .filter(ca -> ca.getArma().getId().equals(armaId))
            .findFirst()
            .orElse(null);
        
        if (reservaExistente != null) {
            reservaExistente.setPrecioUnitario(precioUnitario);
            reservaExistente.setFechaActualizacion(java.time.LocalDateTime.now());
            clienteArmaRepository.save(reservaExistente);
            log.info("Precio de arma actualizado: cliente={}, arma={}, precio={}",
                cliente.getId(), armaId, precioUnitario);
        } else {
            log.warn("No se encontró reserva activa para cliente {} y arma {}, creando como fallback", cliente.getId(), armaId);
            java.util.Map<String, Object> requestData = new java.util.HashMap<>();
            requestData.put("arma", armaData);
            asignarArmaAlCliente(requestData, cliente);
        }
    }

    private Pago crearPagoDelCliente(Map<String, Object> requestData, Long clienteId) {
        log.info("Paso 4: Creando pago del cliente");
        
        Map<String, Object> pagoData = extraerDatosPago(requestData);
        // Cuotas vienen en requestData.cuotas, no en pago.cuotas
        if (requestData.containsKey("cuotas")) {
            pagoData.put("cuotas", requestData.get("cuotas"));
        }
        Pago pago = pagosHelper.crearPagoCompleto(pagoData, clienteId);
        
        log.info("Pago creado: ID={}, monto={}, tipo={}",
            pago.getId(), pago.getMontoTotal(), pago.getTipoPago());
        
        return pago;
    }


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
        
        dto.setDireccion((String) clientData.get("direccion"));
        dto.setProvincia((String) clientData.get("provincia"));
        dto.setCanton((String) clientData.get("canton"));
        
        dto.setRepresentanteLegal((String) clientData.get("representanteLegal"));
        dto.setRuc((String) clientData.get("ruc"));
        dto.setNombreEmpresa((String) clientData.get("nombreEmpresa"));
        dto.setDireccionFiscal((String) clientData.get("direccionFiscal"));
        dto.setTelefonoReferencia((String) clientData.get("telefonoReferencia"));
        dto.setCorreoEmpresa((String) clientData.get("correoEmpresa"));
        dto.setProvinciaEmpresa((String) clientData.get("provinciaEmpresa"));
        dto.setCantonEmpresa((String) clientData.get("cantonEmpresa"));
        
        dto.setEstadoMilitar((String) clientData.get("estadoMilitar"));
        dto.setCodigoIssfa((String) clientData.get("codigoIssfa"));
        dto.setCodigoIsspol((String) clientData.get("codigoIsspol"));
        dto.setRango((String) clientData.get("rango"));
        
        if (clientData.containsKey("estado")) {
            dto.setEstado((String) clientData.get("estado"));
        }
        
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

    private java.time.LocalDate parsearFechaCompleta(String fechaStr) {
        log.info("Parseando fecha: '{}'", fechaStr);
        
        if (fechaStr == null || fechaStr.isBlank()) {
            throw new IllegalArgumentException("Fecha vacía");
        }
        
        fechaStr = fechaStr.trim();
        
        if (fechaStr.contains("T")) {
            String fechaSola = fechaStr.split("T")[0];
            log.info("Detectado formato ISO DateTime, extrayendo fecha: {}", fechaSola);
            return java.time.LocalDate.parse(fechaSola);
        }
        
        if (fechaStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return java.time.LocalDate.parse(fechaStr);
        }

        if (fechaStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
            String[] partes = fechaStr.split("/");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        if (fechaStr.matches("\\d{1,2}-\\d{1,2}-\\d{4}")) {
            String[] partes = fechaStr.split("-");
            int dia = Integer.parseInt(partes[0]);
            int mes = Integer.parseInt(partes[1]);
            int año = Integer.parseInt(partes[2]);
            return java.time.LocalDate.of(año, mes, dia);
        }
        
        if (fechaStr.matches("\\d{8}")) {
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
        response.put("id", cliente.getId());
        if (pago != null) {
            response.put("pagoId", pago.getId());
        }
        response.put("timestamp", LocalDateTime.now());
        return response;
    }


    private void enviarCorreoVerificacion(Cliente cliente) {
        // Clientes fantasma (vendedores) no reciben correo
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            log.info("Cliente ID {} es cliente fantasma (vendedor), no se enviará correo de verificación", cliente.getId());
            return;
        }
        
        // Compañías de seguridad se auto-validan sin correo
        if (cliente.esEmpresa()) {
            log.info("Cliente ID {} es compañía de seguridad, auto-validando datos sin enviar correo", cliente.getId());
            cliente.setEmailVerificado(true);
            clienteRepository.save(cliente);
            log.info("Datos auto-validados para cliente empresa ID: {}", cliente.getId());
            return;
        }
        
        if (cliente.getEmail() == null || cliente.getEmail().isBlank()) {
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
