package com.armasimportacion.service;

import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.repository.TipoClienteRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TipoClienteService {
    private final TipoClienteRepository repository;

    public TipoClienteService(TipoClienteRepository repository) {
        this.repository = repository;
    }

    public List<TipoCliente> findAll() {
        return repository.findAll();
    }
}
