package com.armasimportacion.service;

import com.armasimportacion.model.TipoIdentificacion;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoIdentificacionService {
    
    private final TipoIdentificacionRepository repository;
    
    public List<TipoIdentificacion> findAllActive() {
        return repository.findByEstado(true);
    }
    
    public List<TipoIdentificacion> findAll() {
        return repository.findAll();
    }
    
    public TipoIdentificacion findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de identificación no encontrado con ID: " + id));
    }
    
    public TipoIdentificacion findByNombre(String nombre) {
        return repository.findByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Tipo de identificación no encontrado con nombre: " + nombre));
    }
}
