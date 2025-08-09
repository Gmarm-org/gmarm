package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.DocumentoGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.DocumentoClienteRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.DocumentoGrupoImportacionRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoDocumentoGrupo;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentoService {
    
    private final DocumentoGrupoImportacionRepository documentoGrupoRepository;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final DocumentoClienteRepository documentoClienteRepository;
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    
    // Documentos de Grupo de Importación
    public DocumentoGrupoImportacion cargarDocumentoGrupo(Long grupoId, String nombre, String tipoDocumento, 
                                                         String urlArchivo, Long usuarioId) {
        log.info("Cargando documento para grupo: {}", grupoId);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Verificar si ya existe un documento del mismo tipo
        if (documentoGrupoRepository.existsByGrupoImportacionAndTipoDocumento(grupo, tipoDocumento)) {
            throw new BadRequestException("Ya existe un documento del tipo: " + tipoDocumento);
        }
        
        DocumentoGrupoImportacion documento = new DocumentoGrupoImportacion();
        documento.setNombre(nombre);
        documento.setUrlArchivo(urlArchivo);
        documento.setTipoDocumento(tipoDocumento);
        documento.setEstado(EstadoDocumentoGrupo.CARGADO);
        documento.setGrupoImportacion(grupo);
        documento.setUsuarioCarga(usuario);
        documento.setFechaCarga(LocalDateTime.now());
        documento.setFechaCreacion(LocalDateTime.now());
        
        return documentoGrupoRepository.save(documento);
    }
    
    public DocumentoGrupoImportacion actualizarDocumentoGrupo(Long documentoId, String nombre, String observaciones) {
        DocumentoGrupoImportacion documento = documentoGrupoRepository.findById(documentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
        
        documento.setNombre(nombre);
        documento.setObservaciones(observaciones);
        documento.setFechaActualizacion(LocalDateTime.now());
        
        return documentoGrupoRepository.save(documento);
    }
    
    public void cambiarEstadoDocumentoGrupo(Long documentoId, EstadoDocumentoGrupo nuevoEstado) {
        DocumentoGrupoImportacion documento = documentoGrupoRepository.findById(documentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
        
        documento.setEstado(nuevoEstado);
        documento.setFechaActualizacion(LocalDateTime.now());
        documentoGrupoRepository.save(documento);
    }
    
    public List<DocumentoGrupoImportacion> obtenerDocumentosPorGrupo(Long grupoId) {
        return documentoGrupoRepository.findByGrupoImportacionId(grupoId);
    }
    
    public List<DocumentoGrupoImportacion> obtenerDocumentosCompletosPorGrupo(Long grupoId) {
        return documentoGrupoRepository.findCompletosByGrupoImportacionId(grupoId);
    }
    
    public List<DocumentoGrupoImportacion> obtenerDocumentosPendientesPorGrupo(Long grupoId) {
        return documentoGrupoRepository.findPendientesByGrupoImportacionId(grupoId);
    }
    
    // Documentos Generados
    public DocumentoGenerado generarDocumento(Long grupoId, Long clienteId, TipoDocumentoGenerado tipo, 
                                            String nombre, String urlArchivo, Long usuarioId) {
        log.info("Generando documento tipo: {} para cliente: {}", tipo, clienteId);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        DocumentoGenerado documento = new DocumentoGenerado();
        documento.setNombre(nombre);
        documento.setTipoDocumento(tipo);
        documento.setUrlArchivo(urlArchivo);
        documento.setEstado(EstadoDocumentoGenerado.GENERADO);
        documento.setGrupoImportacion(grupo);
        documento.setCliente(cliente);
        documento.setUsuarioGenerador(usuario);
        documento.setFechaGeneracion(LocalDateTime.now());
        documento.setFechaCreacion(LocalDateTime.now());
        
        return documentoGeneradoRepository.save(documento);
    }
    
    public DocumentoGenerado firmarDocumento(Long documentoId) {
        DocumentoGenerado documento = documentoGeneradoRepository.findById(documentoId)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado"));
        
        documento.setFechaFirma(LocalDateTime.now());
        documento.setEstado(EstadoDocumentoGenerado.FIRMADO);
        documento.setFechaActualizacion(LocalDateTime.now());
        
        return documentoGeneradoRepository.save(documento);
    }
    
    public List<DocumentoGenerado> obtenerDocumentosGeneradosPorGrupo(Long grupoId) {
        return documentoGeneradoRepository.findByGrupoImportacionId(grupoId);
    }

    public List<DocumentoGenerado> obtenerDocumentosGeneradosPorCliente(Long clienteId) {
        return documentoGeneradoRepository.findByClienteId(clienteId);
    }

    public List<DocumentoCliente> obtenerDocumentosClientePorCliente(Long clienteId) {
        return documentoClienteRepository.findByClienteId(clienteId);
    }
    
    // Documentos de Cliente
    public DocumentoCliente cargarDocumentoCliente(Long clienteId, Long tipoDocumentoId, 
                                                  String urlArchivo, Long usuarioId) {
        log.info("Cargando documento para cliente: {}", clienteId);
        
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        DocumentoCliente documento = new DocumentoCliente();
        documento.setCliente(cliente);
        documento.setUrlArchivo(urlArchivo);
        documento.setUsuarioCarga(usuario);
        documento.setFechaCarga(LocalDateTime.now());
        documento.setFechaCreacion(LocalDateTime.now());
        
        return documentoClienteRepository.save(documento);
    }
    
    public List<DocumentoCliente> obtenerDocumentosPorCliente(Long clienteId) {
        return documentoClienteRepository.findByClienteId(clienteId);
    }
    
    // Utilidades
    public String generarNumeroOficio(String licenciaIniciales, String tipoImportacion, 
                                     String cedula, String numeroFactura) {
        // Lógica: (Licencia Iniciales)-(Importacion)-(Cedula 4 primeros)-(Factura 4 últimos)
        String cedula4 = cedula.length() >= 4 ? cedula.substring(0, 4) : cedula;
        String factura4 = numeroFactura.length() >= 4 ? numeroFactura.substring(numeroFactura.length() - 4) : numeroFactura;
        
        return String.format("%s-%s-%s-%s", licenciaIniciales, tipoImportacion, cedula4, factura4);
    }
    
    public boolean validarDocumentoRequerido(String tipoCliente, String tipoDocumento) {
        // Implementar lógica de validación según tipo de cliente
        switch (tipoCliente.toUpperCase()) {
            case "CIVIL":
                return "CEDULA".equals(tipoDocumento) || "FISCALIA".equals(tipoDocumento) || "SATJE".equals(tipoDocumento);
            case "MILITAR":
            case "UNIFORMADO":
                return "CEDULA".equals(tipoDocumento) || "CREDENCIAL_MILITAR".equals(tipoDocumento) || 
                       "FISCALIA".equals(tipoDocumento) || "SATJE".equals(tipoDocumento);
            case "EMPRESA":
                return "RUC".equals(tipoDocumento) || "CEDULA_REPRESENTANTE".equals(tipoDocumento);
            case "DEPORTISTA":
                return "CEDULA".equals(tipoDocumento) || "CREDENCIAL_CLUB".equals(tipoDocumento) || 
                       "CREDENCIAL_TENENCIA".equals(tipoDocumento) || "FISCALIA".equals(tipoDocumento) || 
                       "SATJE".equals(tipoDocumento);
            default:
                return false;
        }
    }
    
    public List<String> obtenerDocumentosRequeridos(String tipoCliente) {
        switch (tipoCliente.toUpperCase()) {
            case "CIVIL":
                return List.of("CEDULA", "FISCALIA", "SATJE");
            case "MILITAR":
            case "UNIFORMADO":
                return List.of("CEDULA", "CREDENCIAL_MILITAR", "FISCALIA", "SATJE");
            case "EMPRESA":
                return List.of("RUC", "CEDULA_REPRESENTANTE");
            case "DEPORTISTA":
                return List.of("CEDULA", "CREDENCIAL_CLUB", "CREDENCIAL_TENENCIA", "FISCALIA", "SATJE");
            default:
                return List.of();
        }
    }
} 