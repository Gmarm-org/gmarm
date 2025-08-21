package com.armasimportacion.service;

import com.armasimportacion.model.ConfiguracionDocumentoExterno;
import com.armasimportacion.repository.ConfiguracionDocumentoExternoRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class DocumentoExternoService {
    
    @Autowired
    private ConfiguracionDocumentoExternoRepository configuracionDocumentoExternoRepository;
    
    /**
     * Obtiene todos los documentos externos activos
     */
    public List<ConfiguracionDocumentoExterno> getAllDocumentosExternos() {
        return configuracionDocumentoExternoRepository.findByActivoTrueOrderByOrdenVisualAscNombreAsc();
    }
    
    /**
     * Obtiene documentos externos que aplican para un tipo de cliente específico
     */
    public List<ConfiguracionDocumentoExterno> getDocumentosExternosPorTipoCliente(String tipoCliente) {
        return configuracionDocumentoExternoRepository.findByTipoCliente(tipoCliente);
    }
    
    /**
     * Obtiene documentos externos que aplican para un tipo de cliente con estado militar
     * (maneja la lógica especial para Uniformado en servicio pasivo)
     */
    public List<ConfiguracionDocumentoExterno> getDocumentosExternosPorTipoCliente(String tipoCliente, String estadoMilitar) {
        // Si es Uniformado y está en servicio pasivo, usar documentos de Civil
        if ("Uniformado".equals(tipoCliente) && "PASIVO".equals(estadoMilitar)) {
            return configuracionDocumentoExternoRepository.findByTipoCliente("Civil");
        }
        
        return configuracionDocumentoExternoRepository.findByTipoCliente(tipoCliente);
    }
    
    /**
     * Obtiene un documento externo por ID
     */
    public ConfiguracionDocumentoExterno getDocumentoExternoById(Long id) {
        return configuracionDocumentoExternoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Documento externo no encontrado con ID: " + id));
    }
    
    /**
     * Crea un nuevo documento externo
     */
    public ConfiguracionDocumentoExterno createDocumentoExterno(ConfiguracionDocumentoExterno documentoExterno) {
        if (configuracionDocumentoExternoRepository.existsByNombre(documentoExterno.getNombre())) {
            throw new IllegalArgumentException("Ya existe un documento externo con el nombre: " + documentoExterno.getNombre());
        }
        
        return configuracionDocumentoExternoRepository.save(documentoExterno);
    }
    
    /**
     * Actualiza un documento externo existente
     */
    public ConfiguracionDocumentoExterno updateDocumentoExterno(Long id, ConfiguracionDocumentoExterno documentoExterno) {
        ConfiguracionDocumentoExterno existing = getDocumentoExternoById(id);
        
        if (!existing.getNombre().equals(documentoExterno.getNombre()) && 
            configuracionDocumentoExternoRepository.existsByNombreAndIdNot(documentoExterno.getNombre(), id)) {
            throw new IllegalArgumentException("Ya existe un documento externo con el nombre: " + documentoExterno.getNombre());
        }
        
        existing.setNombre(documentoExterno.getNombre());
        existing.setDescripcion(documentoExterno.getDescripcion());
        existing.setLinkExterno(documentoExterno.getLinkExterno());
        existing.setInstruccionesDescarga(documentoExterno.getInstruccionesDescarga());
        existing.setAplicaParaTiposCliente(documentoExterno.getAplicaParaTiposCliente());
        existing.setExcluyeTiposCliente(documentoExterno.getExcluyeTiposCliente());
        existing.setOrdenVisual(documentoExterno.getOrdenVisual());
        existing.setActivo(documentoExterno.getActivo());
        
        return configuracionDocumentoExternoRepository.save(existing);
    }
    
    /**
     * Elimina lógicamente un documento externo (marca como inactivo)
     */
    public void deleteDocumentoExterno(Long id) {
        ConfiguracionDocumentoExterno documentoExterno = getDocumentoExternoById(id);
        documentoExterno.setActivo(false);
        configuracionDocumentoExternoRepository.save(documentoExterno);
    }
    
    /**
     * Busca documentos externos por nombre
     */
    public List<ConfiguracionDocumentoExterno> searchDocumentosExternos(String nombre) {
        return configuracionDocumentoExternoRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre);
    }
    
    /**
     * Obtiene estadísticas de documentos externos
     */
    public Map<String, Object> getEstadisticasDocumentosExternos() {
        List<ConfiguracionDocumentoExterno> todos = getAllDocumentosExternos();
        
        Map<String, Object> estadisticas = new HashMap<>();
        estadisticas.put("totalDocumentos", todos.size());
        estadisticas.put("documentosActivos", todos.stream().filter(d -> d.getActivo()).count());
        estadisticas.put("documentosInactivos", todos.stream().filter(d -> !d.getActivo()).count());
        
        // Agrupar por tipos de cliente que aplican
        Map<String, Long> aplicacionPorTipo = todos.stream()
            .flatMap(d -> {
                if (d.getAplicaParaTiposCliente() != null) {
                    return java.util.Arrays.stream(d.getAplicaParaTiposCliente());
                }
                return java.util.stream.Stream.empty();
            })
            .collect(Collectors.groupingBy(tipo -> tipo, Collectors.counting()));
        
        estadisticas.put("aplicacionPorTipo", aplicacionPorTipo);
        
        return estadisticas;
    }
    
    /**
     * Valida si un link externo es válido (formato básico)
     */
    public boolean validarLinkExterno(String link) {
        if (link == null || link.trim().isEmpty()) {
            return false;
        }
        
        // Validación básica de URL
        return link.startsWith("http://") || link.startsWith("https://");
    }
} 
