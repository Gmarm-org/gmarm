package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.AsignacionArma;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.ModeloArma;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.AsignacionArmaRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.ModeloArmaRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoAsignacion;
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
public class AsignacionArmaService {
    
    private final AsignacionArmaRepository asignacionArmaRepository;
    private final ClienteRepository clienteRepository;
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ModeloArmaRepository modeloArmaRepository;
    private final UsuarioRepository usuarioRepository;
    
    public AsignacionArma asignarArma(Long clienteId, Long armaId, Long grupoImportacionId, Integer cantidad, Long usuarioId) {
        log.info("Asignando arma {} al cliente {} con cantidad {}", armaId, clienteId, cantidad);
        
        // Validar cliente
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        
        // Validar arma
        ModeloArma arma = modeloArmaRepository.findById(armaId)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + armaId));
        
        // Validar grupo de importación
        GrupoImportacion grupoImportacion = grupoImportacionRepository.findById(grupoImportacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + grupoImportacionId));
        
        // Validar usuario
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));
        
        // Validar disponibilidad
        if (!arma.getEstado()) {
            throw new BadRequestException("La arma no está disponible para asignación");
        }
        
        // Validar cantidad
        if (cantidad <= 0) {
            throw new BadRequestException("La cantidad debe ser mayor a 0");
        }
        
        // Crear asignación
        AsignacionArma asignacion = new AsignacionArma();
        asignacion.setCliente(cliente);
        asignacion.setGrupoImportacion(grupoImportacion);
        asignacion.setModeloArma(arma);
        asignacion.setCantidad(cantidad);
        asignacion.setPrecioUnitario(arma.getPrecioReferencia());
        asignacion.setEstado(EstadoAsignacion.RESERVADO);
        asignacion.setUsuarioAsignador(usuario);
        asignacion.setFechaAsignacion(LocalDateTime.now());
        
        return asignacionArmaRepository.save(asignacion);
    }
    
    public AsignacionArma findById(Long id) {
        return asignacionArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación no encontrada con ID: " + id));
    }
    
    public List<AsignacionArma> findByClienteId(Long clienteId) {
        return asignacionArmaRepository.findByClienteId(clienteId);
    }
    
    public List<AsignacionArma> findByUsuarioAsignador(Long usuarioId) {
        return asignacionArmaRepository.findByUsuarioAsignadorId(usuarioId);
    }
    
    public List<AsignacionArma> findByEstado(EstadoAsignacion estado) {
        return asignacionArmaRepository.findByEstado(estado);
    }
    
    public void delete(Long id) {
        AsignacionArma asignacion = findById(id);
        asignacionArmaRepository.delete(asignacion);
    }
    
    public AsignacionArma update(Long id, AsignacionArma asignacionUpdate) {
        AsignacionArma asignacion = findById(id);
        
        // Actualizar campos permitidos
        asignacion.setCantidad(asignacionUpdate.getCantidad());
        asignacion.setFechaActualizacion(LocalDateTime.now());
        
        return asignacionArmaRepository.save(asignacion);
    }
    
    public void cambiarEstado(Long id, EstadoAsignacion nuevoEstado) {
        AsignacionArma asignacion = findById(id);
        asignacion.setEstado(nuevoEstado);
        asignacion.setFechaActualizacion(LocalDateTime.now());
        asignacionArmaRepository.save(asignacion);
    }
} 