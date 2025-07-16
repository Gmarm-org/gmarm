package com.armasimportacion.controller;

import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.service.TipoClienteService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tipo-cliente")
@CrossOrigin(origins = "*")
public class TipoClienteController {
    private final TipoClienteService service;

    public TipoClienteController(TipoClienteService service) {
        this.service = service;
    }

    @GetMapping
    public List<TipoCliente> getAll() {
        return service.findAll();
    }
}