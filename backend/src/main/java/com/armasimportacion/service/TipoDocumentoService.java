package com.armasimportacion.service;

import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.repository.TipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoDocumentoService {

    private final TipoDocumentoRepository repository;

    public List<TipoDocumento> findByTipoProcesoId(Long tipoProcesoId) {
        return repository.findByTipoProcesoIdAndEstado(tipoProcesoId, true);
    }

    public List<TipoDocumento> findAllActive() {
        return repository.findByEstado(true);
    }

    public List<TipoDocumento> findAll() {
        return repository.findAll();
    }

    public TipoDocumento findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado con ID: " + id));
    }

    public TipoDocumento save(TipoDocumento tipoDocumento) {
        log.info("Guardando tipo de documento: {}", tipoDocumento.getNombre());
        return repository.save(tipoDocumento);
    }

    public void delete(Long id) {
        log.info("Eliminando tipo de documento con ID: {}", id);
        repository.deleteById(id);
    }
}
