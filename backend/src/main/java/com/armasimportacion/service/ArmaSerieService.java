package com.armasimportacion.service;

import com.armasimportacion.dto.ArmaSerieDTO;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ArmaSerie;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ArmaSerie.EstadoSerie;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.repository.ArmaSerieRepository;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
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
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    // private final EmailService emailService;  // TODO: Configurar cuando se implemente envío de correos

    /**
     * Carga números de serie desde un archivo Excel/CSV
     * Formato esperado con armaId: NUMERO_SERIE
     * Formato esperado sin armaId: MODELO_ARMA, NUMERO_SERIE
     */
    @Transactional
    public Map<String, Object> cargarSeriesDesdeArchivo(MultipartFile archivo, Long armaId, String lote) {
        try {
            log.info("Cargando números de serie desde archivo: {}", archivo.getOriginalFilename());
            
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
                            log.info("Formato detectado: MODELO_ARMA, NUMERO_SERIE");
                        } else {
                            log.info("Formato detectado: NUMERO_SERIE");
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
                        // Buscar arma por modelo o código
                        final String modeloArmaFinal = modeloArma; // Para usar en lambda
                        armaParaSerie = armaRepository.findByModelo(modeloArmaFinal)
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

            log.info("Cargadas {} series", seriesCreadas.size());
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("success", true);
            resultado.put("totalProcesadas", linea - 1);
            resultado.put("totalCargadas", seriesCreadas.size());
            resultado.put("totalDuplicados", duplicados.size());
            resultado.put("totalErrores", errores.size());
            resultado.put("duplicados", duplicados);
            resultado.put("errores", errores);
            resultado.put("arma", armaUnica != null ? armaUnica.getModelo() : "Múltiples armas");
            resultado.put("lote", lote);
            resultado.put("formato", esFormatoDobleColumna ? "MODELO_ARMA, NUMERO_SERIE" : "NUMERO_SERIE");

            return resultado;
            
        } catch (Exception e) {
            log.error("Error cargando números de serie: {}", e.getMessage(), e);
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
        log.info("Asignando serie {} a cliente_arma ID: {}", numeroSerie, clienteArmaId);

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

        // Validar que el cliente esté en el mismo grupo de importación que la serie
        if (serie.getGrupoImportacion() != null) {
            Cliente cliente = clienteArma.getCliente();
            List<ClienteGrupoImportacion> gruposCliente = 
                clienteGrupoImportacionRepository.findByClienteId(cliente.getId());
            
            boolean clienteEnGrupo = gruposCliente.stream()
                .anyMatch(cgi -> cgi.getGrupoImportacion().getId().equals(serie.getGrupoImportacion().getId()));
            
            if (!clienteEnGrupo) {
                throw new IllegalStateException("El cliente no está en el mismo grupo de importación que la serie. Solo se pueden asignar series del grupo al que pertenece el cliente.");
            }
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

        log.info("Serie {} asignada a cliente {} {}", 
                numeroSerie, 
                clienteArma.getCliente().getNombres(),
                clienteArma.getCliente().getApellidos());

        // Enviar correo de notificación
        enviarCorreoAsignacion(clienteArma, serie);

        return ArmaSerieDTO.fromEntity(serie);
    }

    /**
     * Obtiene todas las series disponibles de un arma
     * Si se proporciona grupoImportacionId, filtra solo las series de ese grupo
     */
    @Transactional(readOnly = true)
    public List<ArmaSerieDTO> getSeriesDisponiblesByArma(Long armaId, Long grupoImportacionId) {
        List<ArmaSerie> series;
        if (grupoImportacionId != null) {
            // Filtrar por arma y grupo de importación
            series = armaSerieRepository.findSeriesDisponiblesByArmaIdAndGrupoImportacionId(armaId, grupoImportacionId);
        } else {
            // Obtener todas las series disponibles del arma (sin filtro de grupo)
            series = armaSerieRepository.findSeriesDisponiblesByArmaId(armaId);
        }
        return series.stream()
                .map(ArmaSerieDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las series disponibles de un arma (sin filtro de grupo)
     * Mantiene compatibilidad con código existente
     */
    @Transactional(readOnly = true)
    public List<ArmaSerieDTO> getSeriesDisponiblesByArma(Long armaId) {
        return getSeriesDisponiblesByArma(armaId, null);
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
            log.info("Serie {} liberada", serie.getNumeroSerie());
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
        log.info("Serie {} marcada como VENDIDA", serie.getNumeroSerie());
    }

    /**
     * Envía correo de notificación cuando se asigna una serie
     * TODO: Implementar cuando se configure el servidor SMTP
     */
    private void enviarCorreoAsignacion(ClienteArma clienteArma, ArmaSerie serie) {
        try {
            log.info("Notificación de asignación para: {} {}", 
                    clienteArma.getCliente().getNombres(),
                    clienteArma.getCliente().getApellidos());
            log.info("   Arma: {}, Serie: {}", 
                    serie.getArma().getModelo(),
                    serie.getNumeroSerie());
            
            // TODO: Implementar envío de correo cuando se configure SMTP
            // String destinatario = clienteArma.getCliente().getEmail();
            // String asunto = "Asignación de Número de Serie - " + serie.getArma().getNombre();
            // String cuerpo = ...
            // emailService.enviarCorreoAsignacion(destinatario, asunto, cuerpo);
            
            log.info("Correo de asignación registrado (SMTP no configurado)");
            
        } catch (Exception e) {
            log.error("Error en notificación de asignación: {}", e.getMessage(), e);
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
     * @param grupoImportacionId ID del grupo de importación al que pertenecen estas series
     * @return Map con success (cantidad) y errors (lista de errores)
     */
    @Transactional
    public Map<String, Object> bulkUploadSeriesFromJson(List<Map<String, String>> seriesData, Long grupoImportacionId) {
        log.info("Iniciando carga masiva de {} series desde JSON para grupo de importación ID: {}", seriesData.size(), grupoImportacionId);
        
        // Obtener el grupo de importación y su licencia
        GrupoImportacion grupoImportacion = grupoImportacionRepository.findById(grupoImportacionId)
            .orElseThrow(() -> new IllegalArgumentException("Grupo de importación no encontrado con ID: " + grupoImportacionId));
        
        Licencia licencia = grupoImportacion.getLicencia();
        if (licencia == null) {
            throw new IllegalArgumentException("El grupo de importación no tiene una licencia asociada");
        }
        
        int successCount = 0;
        List<String> errors = new ArrayList<>();
        
        List<Arma> armasCatalogo = armaRepository.findAllActiveWithCategoria();
        for (int i = 0; i < seriesData.size(); i++) {
            Map<String, String> row = seriesData.get(i);
            int rowNum = i + 1;
            
            try {
                String serialNumber = row.get("serialNumber");
                String codigo = row.get("codigo");
                String modelo = firstNonBlank(row.get("model"), row.get("modelo"));
                String calibre = firstNonBlank(row.get("caliber"), row.get("calibre"));
                String categoria = firstNonBlank(row.get("tipo"), row.get("categoria"));
                String marca = row.get("marca");
                String observaciones = row.get("observaciones");
                
                // Validar datos requeridos
                if (serialNumber == null || serialNumber.trim().isEmpty()) {
                    errors.add("Fila " + rowNum + ": Número de serie vacío");
                    continue;
                }
                
                // Verificar si la serie ya existe
                if (armaSerieRepository.existsByNumeroSerie(serialNumber)) {
                    errors.add("Fila " + rowNum + ": Serie " + serialNumber + " ya existe (duplicada)");
                    continue;
                }
                
                // Buscar el arma por código (si viene), o por características del Excel
                Arma arma = null;
                if (codigo != null && !codigo.trim().isEmpty()) {
                    arma = armaRepository.findByCodigo(codigo.trim()).orElse(null);
                }
                if (arma == null) {
                    if (isBlank(modelo) || isBlank(calibre) || isBlank(categoria) || isBlank(marca)) {
                        errors.add("Fila " + rowNum + ": Modelo, Calibre, Categoria y Marca son obligatorios");
                        continue;
                    }
                    arma = buscarArmaPorCaracteristicas(armasCatalogo, modelo, calibre, categoria, marca);
                }
                
                if (arma == null) {
                    errors.add("Fila " + rowNum + ": No se encontró arma que coincida con Modelo/Calibre/Categoria/Marca");
                    continue;
                }
                
                // Crear la serie con grupo de importación y licencia
                ArmaSerie serie = new ArmaSerie();
                serie.setNumeroSerie(serialNumber);
                serie.setArma(arma);
                serie.setEstado(EstadoSerie.DISPONIBLE);
                serie.setObservaciones(observaciones);
                serie.setGrupoImportacion(grupoImportacion);
                serie.setLicencia(licencia);
                // fechaCreacion y fechaCarga se setean automáticamente con @PrePersist
                
                armaSerieRepository.save(serie);
                successCount++;
                
                log.debug("Fila {}: Serie {} asignada a arma {} en grupo {}", rowNum, serialNumber, arma.getModelo(), grupoImportacion.getCodigo());
                
            } catch (Exception e) {
                String errorMsg = "Fila " + rowNum + ": Error procesando - " + e.getMessage();
                errors.add(errorMsg);
                log.error("{}", errorMsg, e);
            }
        }
        
        log.info("Carga masiva completada: {} éxitos, {} errores", successCount, errors.size());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", successCount);
        result.put("errors", errors);
        result.put("total", seriesData.size());
        
        return result;
    }

    private Arma buscarArmaPorCaracteristicas(List<Arma> armasCatalogo, String modelo, String calibre, String categoria, String marca) {
        String modeloNorm = normalizeText(modelo);
        String calibreNorm = normalizeCompact(calibre);
        String categoriaNorm = normalizeText(categoria);
        String marcaNorm = normalizeText(marca);
        
        List<Arma> coincidencias = armasCatalogo.stream()
            .filter(arma -> normalizeText(arma.getModelo()).equals(modeloNorm))
            .filter(arma -> normalizeCompact(arma.getCalibre()).equals(calibreNorm))
            .filter(arma -> normalizeText(arma.getMarca()).equals(marcaNorm))
            .filter(arma -> arma.getCategoria() != null && normalizeText(arma.getCategoria().getNombre()).equals(categoriaNorm))
            .collect(Collectors.toList());
        
        if (coincidencias.size() == 1) {
            return coincidencias.get(0);
        }
        if (coincidencias.size() > 1) {
            log.warn("Múltiples armas coinciden con Modelo/Calibre/Categoria/Marca: {}", modelo);
        }
        return null;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String normalizeCompact(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replaceAll("\\s+", "").toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String firstNonBlank(String first, String second) {
        if (!isBlank(first)) {
            return first;
        }
        return second;
    }
}

