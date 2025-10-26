package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionCupo;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.GrupoImportacionCupoRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoClienteGrupo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionService {
    
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final GrupoImportacionCupoRepository cupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    // CRUD Operations
    public GrupoImportacion crearGrupoImportacion(GrupoImportacion grupo, Long usuarioId) {
        log.info("Creando nuevo grupo de importación: {}", grupo.getCodigo());
        
        // Validaciones
        if (grupoImportacionRepository.existsByCodigo(grupo.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupo.getCodigo());
        }
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Generar código automático si no se proporciona
        if (grupo.getCodigo() == null || grupo.getCodigo().trim().isEmpty()) {
            grupo.setCodigo(generarCodigoAutomatico());
        }
        
        grupo.setUsuarioCreador(usuario);
        grupo.setEstado(EstadoGrupoImportacion.BORRADOR);
        grupo.setFechaCreacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    public GrupoImportacion actualizarGrupoImportacion(Long id, GrupoImportacion grupoActualizado, Long usuarioId) {
        log.info("Actualizando grupo de importación con ID: {}", id);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar código único si cambió
        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }
        
        // Actualizar campos
        grupo.setCodigo(grupoActualizado.getCodigo());
        grupo.setDescripcion(grupoActualizado.getDescripcion());
        grupo.setFechaEstimadaLlegada(grupoActualizado.getFechaEstimadaLlegada());
        grupo.setCostoTotal(grupoActualizado.getCostoTotal());
        grupo.setObservaciones(grupoActualizado.getObservaciones());
        grupo.setUsuarioActualizador(usuario);
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    public GrupoImportacion obtenerGrupoImportacion(Long id) {
        return grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
    }
    
    public Page<GrupoImportacion> obtenerGruposImportacion(Pageable pageable) {
        return grupoImportacionRepository.findAll(pageable);
    }
    
    public Page<GrupoImportacion> findAll(Pageable pageable) {
        return grupoImportacionRepository.findAll(pageable);
    }
    
    public GrupoImportacion findById(Long id) {
        return grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
    }
    
    public GrupoImportacion create(GrupoImportacion grupoImportacion) {
        log.info("Creando nuevo grupo de importación: {}", grupoImportacion.getCodigo());
        
        // Validaciones
        if (grupoImportacionRepository.existsByCodigo(grupoImportacion.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoImportacion.getCodigo());
        }
        
        // Generar código automático si no se proporciona
        if (grupoImportacion.getCodigo() == null || grupoImportacion.getCodigo().trim().isEmpty()) {
            grupoImportacion.setCodigo(generarCodigoAutomatico());
        }
        
        grupoImportacion.setEstado(EstadoGrupoImportacion.BORRADOR);
        grupoImportacion.setFechaCreacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupoImportacion);
    }
    
    public GrupoImportacion update(Long id, GrupoImportacion grupoActualizado) {
        log.info("Actualizando grupo de importación con ID: {}", id);
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id));
        
        // Validar código único si cambió
        if (!grupo.getCodigo().equals(grupoActualizado.getCodigo()) &&
            grupoImportacionRepository.existsByCodigo(grupoActualizado.getCodigo())) {
            throw new BadRequestException("Ya existe un grupo con el código: " + grupoActualizado.getCodigo());
        }
        
        // Actualizar campos
        grupo.setCodigo(grupoActualizado.getCodigo());
        grupo.setDescripcion(grupoActualizado.getDescripcion());
        grupo.setFechaEstimadaLlegada(grupoActualizado.getFechaEstimadaLlegada());
        grupo.setCostoTotal(grupoActualizado.getCostoTotal());
        grupo.setObservaciones(grupoActualizado.getObservaciones());
        grupo.setFechaActualizacion(LocalDateTime.now());
        
        return grupoImportacionRepository.save(grupo);
    }
    
    public void eliminarGrupoImportacion(Long id) {
        if (!grupoImportacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Grupo de importación no encontrado con ID: " + id);
        }
        grupoImportacionRepository.deleteById(id);
    }
    
    // Business Logic
    public List<GrupoImportacion> obtenerGruposActivos() {
        return grupoImportacionRepository.findGruposActivos();
    }
    
    public List<GrupoImportacion> obtenerGruposCompletos() {
        return grupoImportacionRepository.findGruposCompletos();
    }
    
    public List<GrupoImportacion> obtenerGruposIncompletos() {
        return grupoImportacionRepository.findGruposIncompletos();
    }
    
    public void cambiarEstado(Long id, EstadoGrupoImportacion nuevoEstado) {
        GrupoImportacion grupo = obtenerGrupoImportacion(id);
        grupo.setEstado(nuevoEstado);
        grupo.setFechaActualizacion(LocalDateTime.now());
        grupoImportacionRepository.save(grupo);
    }
    
    // Gestión de Clientes
    public void agregarCliente(Long grupoId, Long clienteId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        if (clienteGrupoRepository.existsByClienteAndGrupoImportacion(cliente, grupo)) {
            throw new BadRequestException("El cliente ya está asignado a este grupo");
        }
        
        ClienteGrupoImportacion clienteGrupo = new ClienteGrupoImportacion();
        clienteGrupo.setCliente(cliente);
        clienteGrupo.setGrupoImportacion(grupo);
        clienteGrupo.setEstado(EstadoClienteGrupo.PENDIENTE);
        clienteGrupo.setFechaCreacion(LocalDateTime.now());
        
        clienteGrupoRepository.save(clienteGrupo);
    }
    
    public void removerCliente(Long grupoId, Long clienteId) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        ClienteGrupoImportacion clienteGrupo = clienteGrupoRepository
                .findByClienteAndGrupoImportacion(cliente, grupo)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no está asignado a este grupo"));
        
        clienteGrupoRepository.delete(clienteGrupo);
    }
    
    public List<ClienteGrupoImportacion> obtenerClientesPorGrupo(Long grupoId) {
        return clienteGrupoRepository.findByGrupoImportacionId(grupoId);
    }
    
    // Gestión de Cupos
    public void configurarCupo(Long grupoId, String tipoCliente, Integer cupoAsignado) {
        GrupoImportacion grupo = obtenerGrupoImportacion(grupoId);
        
        Optional<GrupoImportacionCupo> cupoExistente = cupoRepository
                .findByGrupoImportacionIdAndTipoCliente(grupoId, tipoCliente);
        
        GrupoImportacionCupo cupo;
        if (cupoExistente.isPresent()) {
            cupo = cupoExistente.get();
            cupo.setCupoConsumido(cupoAsignado);
            cupo.setCupoDisponibleLicencia(cupoAsignado);
        } else {
            cupo = new GrupoImportacionCupo();
            cupo.setGrupoImportacion(grupo);
            cupo.setTipoCliente(tipoCliente);
            cupo.setCupoConsumido(cupoAsignado);
            cupo.setCupoDisponibleLicencia(cupoAsignado);
            cupo.setFechaCreacion(LocalDateTime.now());
        }
        
        cupoRepository.save(cupo);
    }
    
    public boolean tieneCupoDisponible(Long grupoId, String tipoCliente) {
        return cupoRepository.tieneCupoDisponible(grupoId, tipoCliente);
    }
    
    public void decrementarCupo(Long grupoId, String tipoCliente) {
        GrupoImportacionCupo cupo = cupoRepository
                .findByGrupoImportacionIdAndTipoCliente(grupoId, tipoCliente)
                .orElseThrow(() -> new ResourceNotFoundException("Cupo no encontrado"));
        
        if (!cupo.tieneCupoDisponible()) {
            throw new BadRequestException("No hay cupo disponible para el tipo: " + tipoCliente);
        }
        
        cupo.incrementarCupoConsumido();
        cupoRepository.save(cupo);
    }
    
    // Búsquedas
    public Page<GrupoImportacion> buscarGrupos(String codigo, EstadoGrupoImportacion estado, 
                                              Long usuarioCreadorId, LocalDateTime fechaInicio, 
                                              LocalDateTime fechaFin, Pageable pageable) {
        return grupoImportacionRepository.findWithFilters(codigo, estado, usuarioCreadorId, fechaInicio, fechaFin, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return grupoImportacionRepository.countByEstado();
    }
    
    public List<GrupoImportacion> obtenerGruposProximosALlegar(int dias) {
        LocalDateTime fechaInicio = LocalDateTime.now();
        LocalDateTime fechaFin = fechaInicio.plusDays(dias);
        return grupoImportacionRepository.findGruposProximosALlegar(fechaInicio, fechaFin);
    }
    
    // Utilidades
    private String generarCodigoAutomatico() {
        String prefijo = "IMP";
        LocalDateTime ahora = LocalDateTime.now();
        String timestamp = ahora.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        Long contador = grupoImportacionRepository.countByCodigoPrefijo(prefijo + timestamp);
        String numero = String.format("%04d", contador + 1);
        
        return prefijo + timestamp + numero;
    }
    
    public BigDecimal calcularCostoTotal(Long grupoId) {
        // Implementar lógica de cálculo de costos
        return BigDecimal.ZERO;
    }
} 
