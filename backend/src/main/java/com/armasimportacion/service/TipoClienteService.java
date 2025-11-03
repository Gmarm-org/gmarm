package com.armasimportacion.service;

import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.repository.TipoClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoClienteService {
    
    private final TipoClienteRepository repository;

    public List<TipoCliente> findAll() {
        return repository.findAll();
    }
    
    public List<TipoCliente> findAllActive() {
        return repository.findByEstado(true);
    }
    
    public TipoCliente findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de cliente no encontrado con ID: " + id));
    }
    
    public TipoCliente findByNombre(String nombre) {
        return repository.findByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Tipo de cliente no encontrado con nombre: " + nombre));
    }
    
    public TipoCliente create(TipoCliente tipoCliente) {
        log.info("Creando nuevo tipo de cliente: {}", tipoCliente.getNombre());
        return repository.save(tipoCliente);
    }
    
    public TipoCliente update(Long id, TipoCliente tipoCliente) {
        log.info("Actualizando tipo de cliente ID: {}", id);
        TipoCliente existing = findById(id);
        
        if (tipoCliente.getNombre() != null) {
            existing.setNombre(tipoCliente.getNombre());
        }
        if (tipoCliente.getCodigo() != null) {
            existing.setCodigo(tipoCliente.getCodigo());
        }
        if (tipoCliente.getEstado() != null) {
            existing.setEstado(tipoCliente.getEstado());
        }
        if (tipoCliente.getRequiereIssfa() != null) {
            existing.setRequiereIssfa(tipoCliente.getRequiereIssfa());
        }
        if (tipoCliente.getEsMilitar() != null) {
            existing.setEsMilitar(tipoCliente.getEsMilitar());
        }
        
        return repository.save(existing);
    }
    
    public void delete(Long id) {
        log.info("Desactivando tipo de cliente ID: {}", id);
        TipoCliente tipoCliente = findById(id);
        tipoCliente.setEstado(false);
        repository.save(tipoCliente);
    }
}
