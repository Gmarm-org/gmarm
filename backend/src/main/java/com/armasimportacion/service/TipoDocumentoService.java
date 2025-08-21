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
}
