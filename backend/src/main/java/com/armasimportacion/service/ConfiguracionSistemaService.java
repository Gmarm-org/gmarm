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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        
        // Crear configuraciones por defecto
        List<ConfiguracionSistema> configuraciones = List.of(
            crearConfiguracion("EMAIL_NOTIFICACIONES", "notificaciones@gmarm.com", "Email para enviar notificaciones", true),
            crearConfiguracion("DIAS_VALIDEZ_DOCUMENTOS", "30", "Días de validez para documentos subidos", true),
            crearConfiguracion("PORCENTAJE_ANTICIPO", "40", "Porcentaje de anticipo requerido", true),
            crearConfiguracion("IVA", "15", "Porcentaje de IVA aplicable", false),
            crearConfiguracion("EDAD_MINIMA_CLIENTE", "25", "Edad mínima para clientes", false),
            crearConfiguracion("MAX_INTENTOS_LOGIN", "3", "Máximo intentos de login antes de bloquear", false),
            crearConfiguracion("TIPOS_PAGO_VALIDOS", "CONTADO,CUOTAS", "Tipos de pago válidos en el sistema", false),
            crearConfiguracion("MAX_CUOTAS_PERMITIDAS", "6", "Máximo número de cuotas permitidas", false),
            crearConfiguracion("MIN_MONTO_CUOTA", "100.00", "Monto mínimo por cuota", false)
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
