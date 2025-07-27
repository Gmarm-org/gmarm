package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.LicenciaRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoLicencia;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LicenciaService {
    
    private final LicenciaRepository licenciaRepository;
    private final UsuarioRepository usuarioRepository;
    
    // CRUD Operations
    public Licencia crearLicencia(Licencia licencia, Long usuarioId) {
        log.info("Creando nueva licencia: {}", licencia.getNumeroLicencia());
        
        // Validaciones
        if (licenciaRepository.existsByNumeroLicencia(licencia.getNumeroLicencia())) {
            throw new BadRequestException("Ya existe una licencia con el número: " + licencia.getNumeroLicencia());
        }
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        licencia.setUsuarioCreador(usuario);
        licencia.setEstado(EstadoLicencia.ACTIVA);
        licencia.setFechaCreacion(LocalDateTime.now());
        
        return licenciaRepository.save(licencia);
    }
    
    public Licencia actualizarLicencia(Long id, Licencia licenciaActualizada, Long usuarioId) {
        log.info("Actualizando licencia con ID: {}", id);
        
        Licencia licencia = licenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada con ID: " + id));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar número de licencia único si cambió
        if (!licencia.getNumeroLicencia().equals(licenciaActualizada.getNumeroLicencia()) &&
            licenciaRepository.existsByNumeroLicencia(licenciaActualizada.getNumeroLicencia())) {
            throw new BadRequestException("Ya existe una licencia con el número: " + licenciaActualizada.getNumeroLicencia());
        }
        
        // Actualizar campos
        licencia.setNumeroLicencia(licenciaActualizada.getNumeroLicencia());
        licencia.setTipoLicencia(licenciaActualizada.getTipoLicencia());
        licencia.setFechaEmision(licenciaActualizada.getFechaEmision());
        licencia.setFechaVencimiento(licenciaActualizada.getFechaVencimiento());
        licencia.setCupoCivil(licenciaActualizada.getCupoCivil());
        licencia.setCupoEmpresa(licenciaActualizada.getCupoEmpresa());
        licencia.setCupoMilitar(licenciaActualizada.getCupoMilitar());
        licencia.setCupoDeportista(licenciaActualizada.getCupoDeportista());
        licencia.setObservaciones(licenciaActualizada.getObservaciones());
        licencia.setUsuarioActualizador(usuario);
        licencia.setFechaActualizacion(LocalDateTime.now());
        
        return licenciaRepository.save(licencia);
    }
    
    public Licencia obtenerLicencia(Long id) {
        return licenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada con ID: " + id));
    }
    
    public Page<Licencia> obtenerLicencias(Pageable pageable) {
        return licenciaRepository.findAll(pageable);
    }
    
    public void eliminarLicencia(Long id) {
        if (!licenciaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Licencia no encontrada con ID: " + id);
        }
        licenciaRepository.deleteById(id);
    }
    
    // Business Logic
    public List<Licencia> obtenerLicenciasActivas() {
        return licenciaRepository.findLicenciasActivas(LocalDateTime.now());
    }
    
    public List<Licencia> obtenerLicenciasConCupoCivilDisponible() {
        return licenciaRepository.findLicenciasConCupoCivilDisponible();
    }
    
    public boolean tieneCupoDisponible(Long licenciaId, String tipoCliente) {
        Licencia licencia = obtenerLicencia(licenciaId);
        return licencia.tieneCupoDisponible(tipoCliente);
    }
    
    public void decrementarCupo(Long licenciaId, String tipoCliente) {
        Licencia licencia = obtenerLicencia(licenciaId);
        licencia.decrementarCupo(tipoCliente);
        licenciaRepository.save(licencia);
    }
    
    public List<Licencia> obtenerLicenciasProximasAVencer(int dias) {
        LocalDateTime fechaInicio = LocalDateTime.now();
        LocalDateTime fechaFin = fechaInicio.plusDays(dias);
        return licenciaRepository.findLicenciasProximasAVencer(fechaInicio, fechaFin);
    }
    
    public Page<Licencia> buscarLicencias(String numeroLicencia, String tipoLicencia, EstadoLicencia estado, Pageable pageable) {
        return licenciaRepository.findWithFilters(numeroLicencia, tipoLicencia, estado, pageable);
    }
    
    public List<Object[]> obtenerEstadisticasPorEstado() {
        return licenciaRepository.countByEstado();
    }
    
    public void cambiarEstado(Long id, EstadoLicencia nuevoEstado) {
        Licencia licencia = obtenerLicencia(id);
        licencia.setEstado(nuevoEstado);
        licencia.setFechaActualizacion(LocalDateTime.now());
        licenciaRepository.save(licencia);
    }
} 