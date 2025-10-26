package com.armasimportacion.controller;


import com.armasimportacion.dto.DocumentoGeneradoDTO;
import com.armasimportacion.mapper.DocumentoGeneradoMapper;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contratos")
@CrossOrigin(origins = "*")
public class ContratoController {
    
    private static final Logger log = LoggerFactory.getLogger(ContratoController.class);
    
    @Autowired
    private DocumentoGeneradoRepository documentoGeneradoRepository;
    
    @Autowired
    private DocumentoGeneradoMapper documentoGeneradoMapper;
    
    /**
     * Obtener contratos de un cliente
     */
    @GetMapping("/cliente/{clienteId}")
    public List<DocumentoGeneradoDTO> getContratosCliente(@PathVariable Long clienteId) {
        try {
            log.info("🔍 DEBUG: Obteniendo contratos para cliente ID: {}", clienteId);
            
            List<DocumentoGenerado> contratos = documentoGeneradoRepository.findByClienteId(clienteId);
            
            log.info("🔍 DEBUG: Encontrados {} contratos para cliente {}", contratos.size(), clienteId);
            
            return documentoGeneradoMapper.toDTOList(contratos);
        } catch (Exception e) {
            log.error("❌ Error obteniendo contratos para cliente {}: {}", clienteId, e.getMessage(), e);
            throw new RuntimeException("Error obteniendo contratos: " + e.getMessage(), e);
        }
    }
}