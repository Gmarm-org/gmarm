package com.armasimportacion.service;

import com.armasimportacion.dto.ArmaSerieDTO;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.ArmaSerie.EstadoSerie;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.repository.ArmaSerieRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar números de serie de armas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ArmaSerieService {

    private final ArmaSerieRepository armaSerieRepository;
    private final ArmaRepository armaRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final UsuarioRepository usuarioRepository;
    // private final EmailService emailService;  // TODO: Configurar cuando se implemente envío de correos

    /**
     * Carga números de serie desde un archivo Excel/CSV
     * Formato esperado con armaId: NUMERO_SERIE
     * Formato esperado sin armaId: MODELO_ARMA, NUMERO_SERIE
     */
    @Transactional
    public Map<String, Object> cargarSeriesDesdeArchivo(MultipartFile archivo, Long armaId, String lote) {
        try {
            log.info("📂 Cargando números de serie desde archivo: {}", archivo.getOriginalFilename());
            
            // Si se proporciona armaId, validar que existe
            Arma armaUnica = null;
            if (armaId != null) {
                armaUnica = armaRepository.findById(armaId)
                        .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
            }
            
            List<String> errores = new ArrayList<>();
            List<String> duplicados = new ArrayList<>();
            List<ArmaSerie> seriesCreadas = new ArrayList<>();
            int linea = 0;
            boolean esFormatoDobleColumna = false;

            // Leer el archivo
            try (BufferedReader br = new BufferedReader(new InputStreamReader(archivo.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    linea++;
                    
                    // Saltar línea de encabezado y detectar formato
                    if (linea == 1) {
                        String headerLower = line.toLowerCase();
                        if (headerLower.contains("modelo") || headerLower.contains("arma")) {
                            esFormatoDobleColumna = true;
                            log.info("📋 Formato detectado: MODELO_ARMA, NUMERO_SERIE");
                        } else {
                            log.info("📋 Formato detectado: NUMERO_SERIE");
                        }
                        continue;
                    }
                    
                    // Procesar línea
                    String[] columnas = line.trim().split(",");
                    if (columnas.length == 0 || line.trim().isEmpty()) {
                        continue;
                    }
                    
                    String modeloArma = null;
                    String numeroSerie = null;
                    
                    if (esFormatoDobleColumna && columnas.length >= 2) {
                        modeloArma = columnas[0].trim();
                        numeroSerie = columnas[1].trim();
                    } else {
                        numeroSerie = columnas[0].trim();
                    }
                    
                    if (numeroSerie.isEmpty()) {
                        continue;
                    }
                    
                    // Validar que no exista ya en la BD
                    if (armaSerieRepository.existsByNumeroSerie(numeroSerie)) {
                        duplicados.add(numeroSerie);
                        continue;
                    }
                    
                    // Determinar el arma a usar
                    Arma armaParaSerie;
                    if (armaUnica != null) {
                        armaParaSerie = armaUnica;
                    } else if (modeloArma != null && !modeloArma.isEmpty()) {
                        // Buscar arma por nombre o código
                        final String modeloArmaFinal = modeloArma; // Para usar en lambda
                        armaParaSerie = armaRepository.findByNombre(modeloArmaFinal)
                                .or(() -> armaRepository.findByCodigo(modeloArmaFinal))
                                .orElse(null);
                        
                        if (armaParaSerie == null) {
                            errores.add("Línea " + linea + ": Arma no encontrada: " + modeloArmaFinal);
                            continue;
                        }
                    } else {
                        errores.add("Línea " + linea + ": No se especificó arma y no se proporcionó armaId");
                        continue;
                    }
                    
                    // Crear la serie
                    ArmaSerie serie = ArmaSerie.builder()
                            .numeroSerie(numeroSerie)
                            .arma(armaParaSerie)
                            .estado(EstadoSerie.DISPONIBLE)
                            .lote(lote)
                            .fechaCarga(LocalDateTime.now())
                            .build();
                    
                    seriesCreadas.add(armaSerieRepository.save(serie));
                }
            }

            log.info("✅ Cargadas {} series", seriesCreadas.size());
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("success", true);
            resultado.put("totalProcesadas", linea - 1);
            resultado.put("totalCargadas", seriesCreadas.size());
            resultado.put("totalDuplicados", duplicados.size());
            resultado.put("totalErrores", errores.size());
            resultado.put("duplicados", duplicados);
            resultado.put("errores", errores);
            resultado.put("arma", armaUnica != null ? armaUnica.getNombre() : "Múltiples armas");
            resultado.put("lote", lote);
            resultado.put("formato", esFormatoDobleColumna ? "MODELO_ARMA, NUMERO_SERIE" : "NUMERO_SERIE");

            return resultado;
            
        } catch (Exception e) {
            log.error("❌ Error cargando números de serie: {}", e.getMessage(), e);
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("success", false);
            resultado.put("error", e.getMessage());
            return resultado;
        }
    }

    /**
     * Asigna un número de serie a una reserva de cliente
     */
    @Transactional
    public ArmaSerieDTO asignarSerieACliente(Long clienteArmaId, String numeroSerie, Long usuarioAsignadorId) {
        log.info("🔧 Asignando serie {} a cliente_arma ID: {}", numeroSerie, clienteArmaId);

        // Buscar la reserva del cliente
        ClienteArma clienteArma = clienteArmaRepository.findById(clienteArmaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva de cliente no encontrada con ID: " + clienteArmaId));

        // Validar que la reserva esté en estado RESERVADA
        if (!clienteArma.estaReservada()) {
            throw new IllegalStateException("La reserva debe estar en estado RESERVADA para asignar serie");
        }

        // Buscar el número de serie
        ArmaSerie serie = armaSerieRepository.findByNumeroSerie(numeroSerie)
                .orElseThrow(() -> new ResourceNotFoundException("Número de serie no encontrado: " + numeroSerie));

        // Validar que la serie esté disponible
        if (!serie.estaDisponible()) {
            throw new IllegalStateException("El número de serie no está disponible: " + numeroSerie);
        }

        // Validar que la serie sea del mismo arma que la reserva
        if (!serie.getArma().getId().equals(clienteArma.getArma().getId())) {
            throw new IllegalStateException("El número de serie no corresponde al arma reservada");
        }

        // Buscar el usuario asignador
        Usuario usuarioAsignador = usuarioRepository.findById(usuarioAsignadorId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioAsignadorId));

        // Asignar la serie
        serie.asignar(clienteArma, usuarioAsignador);
        armaSerieRepository.save(serie);

        // Actualizar el estado de cliente_arma a ASIGNADA y guardar el número de serie
        clienteArma.asignar(numeroSerie);
        clienteArmaRepository.save(clienteArma);

        log.info("✅ Serie {} asignada a cliente {} {}", 
                numeroSerie, 
                clienteArma.getCliente().getNombres(),
                clienteArma.getCliente().getApellidos());

        // Enviar correo de notificación
        enviarCorreoAsignacion(clienteArma, serie);

        return ArmaSerieDTO.fromEntity(serie);
    }

    /**
     * Obtiene todas las series disponibles de un arma
     */
    @Transactional(readOnly = true)
    public List<ArmaSerieDTO> getSeriesDisponiblesByArma(Long armaId) {
        List<ArmaSerie> series = armaSerieRepository.findSeriesDisponiblesByArmaId(armaId);
        return series.stream()
                .map(ArmaSerieDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las series de un arma (cualquier estado)
     */
    @Transactional(readOnly = true)
    public List<ArmaSerieDTO> getSeriesByArma(Long armaId) {
        List<ArmaSerie> series = armaSerieRepository.findByArmaId(armaId);
        return series.stream()
                .map(ArmaSerieDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene las estadísticas de series por arma
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEstadisticasSeries() {
        List<Object[]> estadisticas = armaSerieRepository.getEstadisticasPorArma();
        
        return estadisticas.stream()
                .map(stat -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("armaId", stat[0]);
                    map.put("armaNombre", stat[1]);
                    map.put("total", stat[2]);
                    map.put("disponibles", stat[3]);
                    map.put("asignadas", stat[4]);
                    map.put("vendidas", stat[5]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Libera una serie asignada (en caso de cancelación)
     */
    @Transactional
    public void liberarSerie(Long serieId) {
        ArmaSerie serie = armaSerieRepository.findById(serieId)
                .orElseThrow(() -> new ResourceNotFoundException("Serie no encontrada con ID: " + serieId));
        
        if (serie.estaAsignado()) {
            serie.liberar();
            armaSerieRepository.save(serie);
            log.info("✅ Serie {} liberada", serie.getNumeroSerie());
        }
    }

    /**
     * Marca una serie como vendida
     */
    @Transactional
    public void marcarComoVendida(Long serieId) {
        ArmaSerie serie = armaSerieRepository.findById(serieId)
                .orElseThrow(() -> new ResourceNotFoundException("Serie no encontrada con ID: " + serieId));
        
        serie.marcarComoVendido();
        armaSerieRepository.save(serie);
        log.info("✅ Serie {} marcada como VENDIDA", serie.getNumeroSerie());
    }

    /**
     * Envía correo de notificación cuando se asigna una serie
     * TODO: Implementar cuando se configure el servidor SMTP
     */
    private void enviarCorreoAsignacion(ClienteArma clienteArma, ArmaSerie serie) {
        try {
            log.info("📧 Notificación de asignación para: {} {}", 
                    clienteArma.getCliente().getNombres(),
                    clienteArma.getCliente().getApellidos());
            log.info("   Arma: {}, Serie: {}", 
                    serie.getArma().getNombre(),
                    serie.getNumeroSerie());
            
            // TODO: Implementar envío de correo cuando se configure SMTP
            // String destinatario = clienteArma.getCliente().getEmail();
            // String asunto = "Asignación de Número de Serie - " + serie.getArma().getNombre();
            // String cuerpo = ...
            // emailService.enviarCorreoAsignacion(destinatario, asunto, cuerpo);
            
            log.info("📧 Correo de asignación registrado (SMTP no configurado)");
            
        } catch (Exception e) {
            log.error("❌ Error en notificación de asignación: {}", e.getMessage(), e);
            // No lanzar excepción para no interrumpir el flujo
        }
    }

    /**
     * Obtiene una serie por su número
     */
    @Transactional(readOnly = true)
    public ArmaSerieDTO getSerieByNumero(String numeroSerie) {
        ArmaSerie serie = armaSerieRepository.findByNumeroSerie(numeroSerie)
                .orElseThrow(() -> new ResourceNotFoundException("Número de serie no encontrado: " + numeroSerie));
        return ArmaSerieDTO.fromEntity(serie);
    }

    /**
     * Obtiene todas las series por estado
     */
    @Transactional(readOnly = true)
    public List<ArmaSerieDTO> getSeriesByEstado(String estado) {
        EstadoSerie estadoEnum = EstadoSerie.valueOf(estado);
        List<ArmaSerie> series = armaSerieRepository.findByEstado(estadoEnum);
        return series.stream()
                .map(ArmaSerieDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Carga masiva de series desde JSON procesado en frontend
     * 
     * @param seriesData Lista de mapas con: serialNumber, codigo, model, caliber, observaciones
     * @return Map con success (cantidad) y errors (lista de errores)
     */
    @Transactional
    public Map<String, Object> bulkUploadSeriesFromJson(List<Map<String, String>> seriesData) {
        log.info("📤 Iniciando carga masiva de {} series desde JSON", seriesData.size());
        
        int successCount = 0;
        List<String> errors = new ArrayList<>();
        
        for (int i = 0; i < seriesData.size(); i++) {
            Map<String, String> row = seriesData.get(i);
            int rowNum = i + 1;
            
            try {
                String serialNumber = row.get("serialNumber");
                String codigo = row.get("codigo");
                String observaciones = row.get("observaciones");
                
                // Validar datos requeridos
                if (serialNumber == null || serialNumber.trim().isEmpty()) {
                    errors.add("Fila " + rowNum + ": Número de serie vacío");
                    continue;
                }
                
                if (codigo == null || codigo.trim().isEmpty()) {
                    errors.add("Fila " + rowNum + ": Código de arma vacío");
                    continue;
                }
                
                // Verificar si la serie ya existe
                if (armaSerieRepository.existsByNumeroSerie(serialNumber)) {
                    errors.add("Fila " + rowNum + ": Serie " + serialNumber + " ya existe (duplicada)");
                    continue;
                }
                
                // Buscar el arma por código
                Arma arma = armaRepository.findByCodigo(codigo)
                        .orElse(null);
                
                if (arma == null) {
                    errors.add("Fila " + rowNum + ": Arma con código " + codigo + " no encontrada");
                    continue;
                }
                
                // Crear la serie
                ArmaSerie serie = new ArmaSerie();
                serie.setNumeroSerie(serialNumber);
                serie.setArma(arma);
                serie.setEstado(EstadoSerie.DISPONIBLE);
                serie.setObservaciones(observaciones);
                // fechaCreacion y fechaCarga se setean automáticamente con @PrePersist
                
                armaSerieRepository.save(serie);
                successCount++;
                
                log.debug("✅ Fila {}: Serie {} asignada a arma {}", rowNum, serialNumber, arma.getNombre());
                
            } catch (Exception e) {
                String errorMsg = "Fila " + rowNum + ": Error procesando - " + e.getMessage();
                errors.add(errorMsg);
                log.error("❌ {}", errorMsg, e);
            }
        }
        
        log.info("✅ Carga masiva completada: {} éxitos, {} errores", successCount, errors.size());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", successCount);
        result.put("errors", errors);
        result.put("total", seriesData.size());
        
        return result;
    }
}

