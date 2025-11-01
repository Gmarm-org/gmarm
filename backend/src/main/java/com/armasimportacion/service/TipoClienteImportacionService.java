package com.armasimportacion.service;

import com.armasimportacion.model.TipoClienteImportacion;
import com.armasimportacion.repository.TipoClienteImportacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoClienteImportacionService {
    
    private final TipoClienteImportacionRepository repository;
    
    public List<TipoClienteImportacion> findAll() {
        return repository.findAll();
    }
    
    public TipoClienteImportacion findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoClienteImportacion no encontrado con ID: " + id));
    }
    
    public List<TipoClienteImportacion> findByTipoClienteId(Long tipoClienteId) {
        return repository.findByTipoClienteId(tipoClienteId);
    }
    
    public List<TipoClienteImportacion> findByTipoImportacionId(Long tipoImportacionId) {
        return repository.findByTipoImportacionId(tipoImportacionId);
    }
    
    public TipoClienteImportacion save(TipoClienteImportacion entity) {
        log.info("Guardando TipoClienteImportacion");
        return repository.save(entity);
    }
    
    public void delete(Long id) {
        log.info("Eliminando TipoClienteImportacion con ID: {}", id);
        repository.deleteById(id);
    }
}

