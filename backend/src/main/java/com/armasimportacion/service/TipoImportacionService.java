package com.armasimportacion.service;

import com.armasimportacion.model.TipoImportacion;
import com.armasimportacion.repository.TipoImportacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoImportacionService {
    
    private final TipoImportacionRepository repository;
    
    public List<TipoImportacion> findAll() {
        return repository.findAll();
    }
    
    public List<TipoImportacion> findAllActive() {
        return repository.findByEstado(true);
    }
    
    public TipoImportacion findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de importación no encontrado con ID: " + id));
    }
    
    public TipoImportacion findByNombre(String nombre) {
        return repository.findByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Tipo de importación no encontrado con nombre: " + nombre));
    }
    
    public TipoImportacion save(TipoImportacion tipoImportacion) {
        log.info("Guardando tipo de importación: {}", tipoImportacion.getNombre());
        return repository.save(tipoImportacion);
    }
    
    public void delete(Long id) {
        log.info("Eliminando tipo de importación con ID: {}", id);
        repository.deleteById(id);
    }
}

