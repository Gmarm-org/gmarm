package com.armasimportacion.service;

import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.repository.TipoProcesoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TipoProcesoService {

    private final TipoProcesoRepository repository;

    public List<TipoProceso> findAllActive() {
        log.info("Obteniendo todos los tipos de proceso activos");
        return repository.findByEstado(true);
    }

    public TipoProceso findById(Long id) {
        log.info("Buscando tipo de proceso con ID: {}", id);
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de proceso no encontrado con ID: " + id));
    }

    public TipoProceso findByCodigo(String codigo) {
        log.info("Buscando tipo de proceso con código: {}", codigo);
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de proceso no encontrado con código: " + codigo));
    }
}
