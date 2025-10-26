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
}
