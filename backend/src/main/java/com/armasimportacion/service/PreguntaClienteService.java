package com.armasimportacion.service;

import com.armasimportacion.model.PreguntaCliente;
import com.armasimportacion.repository.PreguntaClienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreguntaClienteService {

    private final PreguntaClienteRepository repository;

    public List<PreguntaCliente> findByTipoProcesoId(Long tipoProcesoId) {
        return repository.findByTipoProcesoIdAndEstado(tipoProcesoId, true);
    }

    public List<PreguntaCliente> findAllActive() {
        return repository.findByEstado(true);
    }

    public List<PreguntaCliente> findAll() {
        return repository.findAll();
    }

    public PreguntaCliente findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pregunta no encontrada con ID: " + id));
    }

    public PreguntaCliente save(PreguntaCliente pregunta) {
        log.info("Guardando pregunta: {}", pregunta.getPregunta());
        return repository.save(pregunta);
    }

    public void delete(Long id) {
        log.info("Eliminando pregunta con ID: {}", id);
        repository.deleteById(id);
    }
}
