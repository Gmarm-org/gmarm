package com.armasimportacion.service;

import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.ModeloArma;
import com.armasimportacion.repository.ModeloArmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ModeloArmaService {
    
    private final ModeloArmaRepository modeloArmaRepository;
    
    public List<ModeloArma> findArmasDisponibles() {
        return modeloArmaRepository.findDisponibles();
    }
    
    public Map<String, Object> getPrecioArma(Long armaId) {
        ModeloArma arma = modeloArmaRepository.findById(armaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
        
        Map<String, Object> precio = Map.of(
            "armaId", armaId,
            "nombre", arma.getNombre(),
            "precio", arma.getPrecioReferencia(),
            "disponible", arma.getEstado()
        );
        
        return precio;
    }
    
    public ModeloArma findById(Long id) {
        return modeloArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + id));
    }
    
    public List<ModeloArma> findAll() {
        return modeloArmaRepository.findAll();
    }
} 