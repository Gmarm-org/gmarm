package com.armasimportacion.service;

import com.armasimportacion.dto.ConfiguracionSistemaDTO;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.mapper.ConfiguracionSistemaMapper;
import com.armasimportacion.model.ConfiguracionSistema;
import com.armasimportacion.repository.ConfiguracionSistemaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ConfiguracionSistemaService {

    private final ConfiguracionSistemaRepository repository;
    private final ConfiguracionSistemaMapper mapper;

    public Map<String, Object> getConfiguracionCompleta() {
        log.info("Obteniendo configuración completa del sistema");
        
        List<ConfiguracionSistema> configuraciones = repository.findAll();
        Map<String, Object> configuracionMap = new HashMap<>();
        
        for (ConfiguracionSistema config : configuraciones) {
            // Intentar convertir a número si es posible
            try {
                int valorNumerico = Integer.parseInt(config.getValor());
                configuracionMap.put(config.getClave(), valorNumerico);
            } catch (NumberFormatException e) {
                // Si no es número, mantener como string
                configuracionMap.put(config.getClave(), config.getValor());
            }
        }
        
        log.info("Configuración completa obtenida: {} elementos", configuracionMap.size());
        return configuracionMap;
    }

    public ConfiguracionSistemaDTO getConfiguracionPorClave(String clave) {
        log.info("Obteniendo configuración para clave: {}", clave);
        
        ConfiguracionSistema configuracion = repository.findByClave(clave)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con clave: " + clave));
        
        log.info("Configuración obtenida exitosamente para clave: {}", clave);
        return mapper.toDTO(configuracion);
    }

    public String getValorConfiguracion(String clave) {
        log.info("Obteniendo valor de configuración para clave: {}", clave);
        
        ConfiguracionSistema configuracion = repository.findByClave(clave)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con clave: " + clave));
        
        log.info("Valor obtenido para clave {}: {}", clave, configuracion.getValor());
        return configuracion.getValor();
    }

    /**
     * Obtiene la lista de correos electrónicos desde la configuración CORREOS_RECIBO
     * El valor puede estar en formato JSON array o separado por comas
     * 
     * @return Lista de correos electrónicos configurados para recibir copias de recibos
     */
    public List<String> getCorreosRecibo() {
        log.info("Obteniendo lista de correos para recibos desde configuración");
        
        try {
            String valor = getValorConfiguracion("CORREOS_RECIBO");
            if (valor == null || valor.trim().isEmpty()) {
                log.warn("⚠️ CORREOS_RECIBO está vacío o no configurado");
                return new ArrayList<>();
            }
            
            List<String> correos = new ArrayList<>();
            
            // Intentar parsear como JSON array
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                List<String> correosJson = objectMapper.readValue(valor, new TypeReference<List<String>>() {});
                if (correosJson != null && !correosJson.isEmpty()) {
                    correos = correosJson;
                }
            } catch (Exception e) {
                // Si no es JSON válido, intentar separar por comas
                log.debug("No es JSON válido, intentando separar por comas: {}", e.getMessage());
                String[] correosArray = valor.split(",");
                for (String correo : correosArray) {
                    String correoTrimmed = correo.trim();
                    if (!correoTrimmed.isEmpty()) {
                        correos.add(correoTrimmed);
                    }
                }
            }
            
            // Filtrar correos vacíos
            correos = correos.stream()
                    .filter(correo -> correo != null && !correo.trim().isEmpty())
                    .map(String::trim)
                    .collect(Collectors.toList());
            
            log.info("✅ Correos de recibo obtenidos: {} correo(s)", correos.size());
            return correos;
            
        } catch (ResourceNotFoundException e) {
            log.warn("⚠️ Configuración CORREOS_RECIBO no encontrada, retornando lista vacía");
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("❌ Error obteniendo correos de recibo: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    public ConfiguracionSistemaDTO updateConfiguracion(String clave, ConfiguracionSistemaDTO configuracionDTO) {
        log.info("Actualizando configuración para clave: {}", clave);
        
        ConfiguracionSistema configuracion = repository.findByClave(clave)
                .orElseThrow(() -> new ResourceNotFoundException("Configuración no encontrada con clave: " + clave));
        
        // Verificar si es editable
        if (!configuracion.getEditable()) {
            throw new IllegalArgumentException("La configuración con clave '" + clave + "' no es editable");
        }
        
        // Actualizar solo los campos permitidos
        if (configuracionDTO.getValor() != null) {
            configuracion.setValor(configuracionDTO.getValor());
        }
        if (configuracionDTO.getDescripcion() != null) {
            configuracion.setDescripcion(configuracionDTO.getDescripcion());
        }
        
        configuracion.setFechaActualizacion(LocalDateTime.now());
        
        ConfiguracionSistema configuracionActualizada = repository.save(configuracion);
        log.info("Configuración actualizada exitosamente para clave: {}", clave);
        
        return mapper.toDTO(configuracionActualizada);
    }

    public List<ConfiguracionSistemaDTO> getConfiguracionesEditables() {
        log.info("Obteniendo configuraciones editables");
        
        List<ConfiguracionSistema> configuraciones = repository.findByEditableTrue();
        List<ConfiguracionSistemaDTO> configuracionesDTO = configuraciones.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
        
        log.info("Configuraciones editables obtenidas: {}", configuracionesDTO.size());
        return configuracionesDTO;
    }

    public void inicializarConfiguracionPorDefecto() {
        log.info("Inicializando configuración por defecto del sistema");
        
        // Verificar si ya existe configuración
        if (repository.count() > 0) {
            log.info("La configuración ya existe, saltando inicialización");
            return;
        }
        
        // Crear configuraciones por defecto (solo las que se usan activamente en el código)
        // NOTA: Las configuraciones SMTP y COORDINADOR se manejan directamente en el SQL maestro
        List<ConfiguracionSistema> configuraciones = List.of(
            crearConfiguracion("IVA", "15", "Porcentaje de IVA aplicable", true),
            crearConfiguracion("DIAS_ALERTA_PROCESO_IMPORTACION", "7", "Días de anticipación para alertas de procesos de importación", true)
        );
        
        repository.saveAll(configuraciones);
        log.info("Configuración por defecto inicializada exitosamente");
    }

    private ConfiguracionSistema crearConfiguracion(String clave, String valor, String descripcion, Boolean editable) {
        ConfiguracionSistema config = new ConfiguracionSistema();
        config.setClave(clave);
        config.setValor(valor);
        config.setDescripcion(descripcion);
        config.setEditable(editable);
        config.setFechaCreacion(LocalDateTime.now());
        config.setFechaActualizacion(LocalDateTime.now());
        return config;
    }
}
