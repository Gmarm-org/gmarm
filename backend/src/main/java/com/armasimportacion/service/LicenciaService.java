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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
        log.info("Creando nueva licencia: {}", licencia.getNumero());
        
        // Validaciones
        if (licenciaRepository.existsByNumero(licencia.getNumero())) {
            throw new BadRequestException("Ya existe una licencia con el número: " + licencia.getNumero());
        }
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        licencia.setUsuarioCreador(usuario);
        licencia.setEstado(EstadoLicencia.ACTIVA);
        licencia.setFechaCreacion(LocalDateTime.now());
        
        // Inferir tipo de licencia si no se especifica
        if (licencia.getTipoLicencia() == null || licencia.getTipoLicencia().isEmpty()) {
            licencia.setTipoLicencia(licencia.getTipoLicenciaInferido());
        }
        
        return licenciaRepository.save(licencia);
    }
    
    public Licencia actualizarLicencia(Long id, Licencia licenciaActualizada, Long usuarioId) {
        log.info("Actualizando licencia con ID: {}", id);
        
        Licencia licencia = licenciaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada con ID: " + id));
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        
        // Validar número de licencia único si cambió
        if (!licencia.getNumero().equals(licenciaActualizada.getNumero()) &&
            licenciaRepository.existsByNumero(licenciaActualizada.getNumero())) {
            throw new BadRequestException("Ya existe una licencia con el número: " + licenciaActualizada.getNumero());
        }
        
        // Actualizar campos
        licencia.setNumero(licenciaActualizada.getNumero());
        licencia.setNombre(licenciaActualizada.getNombre());
        licencia.setRuc(licenciaActualizada.getRuc());
        licencia.setCuentaBancaria(licenciaActualizada.getCuentaBancaria());
        licencia.setNombreBanco(licenciaActualizada.getNombreBanco());
        licencia.setTipoCuenta(licenciaActualizada.getTipoCuenta());
        licencia.setCedulaCuenta(licenciaActualizada.getCedulaCuenta());
        licencia.setEmail(licenciaActualizada.getEmail());
        licencia.setTelefono(licenciaActualizada.getTelefono());
        licencia.setTipoLicencia(licenciaActualizada.getTipoLicencia());
        licencia.setDescripcion(licenciaActualizada.getDescripcion());
        licencia.setFechaEmision(licenciaActualizada.getFechaEmision());
        licencia.setFechaVencimiento(licenciaActualizada.getFechaVencimiento());
        licencia.setCupoTotal(licenciaActualizada.getCupoTotal());
        licencia.setCupoDisponible(licenciaActualizada.getCupoDisponible());
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
        return licenciaRepository.findLicenciasActivas(LocalDate.now());
    }
    
    public List<Licencia> obtenerLicenciasConCupoCivilDisponible() {
        return licenciaRepository.findLicenciasConCupoCivilDisponible();
    }
    
    public List<Licencia> obtenerLicenciasConCupoMilitarDisponible() {
        return licenciaRepository.findLicenciasConCupoMilitarDisponible();
    }
    
    public List<Licencia> obtenerLicenciasConCupoEmpresaDisponible() {
        return licenciaRepository.findLicenciasConCupoEmpresaDisponible();
    }
    
    public List<Licencia> obtenerLicenciasConCupoDeportistaDisponible() {
        return licenciaRepository.findLicenciasConCupoDeportistaDisponible();
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
        LocalDate fechaInicio = LocalDate.now();
        LocalDate fechaFin = fechaInicio.plusDays(dias);
        return licenciaRepository.findLicenciasProximasAVencer(fechaInicio, fechaFin);
    }
    
    public Page<Licencia> buscarLicencias(String numero, String nombre, String tipoLicencia, EstadoLicencia estado, String ruc, Pageable pageable) {
        return licenciaRepository.findWithFilters(numero, nombre, tipoLicencia, estado, ruc, pageable);
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
    
    // Métodos adicionales para la nueva estructura
    public List<Licencia> obtenerLicenciasPorRuc(String ruc) {
        return licenciaRepository.findByRuc(ruc);
    }
    
    public List<Licencia> obtenerLicenciasPorEmail(String email) {
        return licenciaRepository.findByEmail(email);
    }
    
    public List<Licencia> obtenerLicenciasVencidas() {
        return licenciaRepository.findLicenciasVencidas(LocalDate.now());
    }
    
    public List<Licencia> obtenerLicenciasConCupoDisponible() {
        return licenciaRepository.findLicenciasConCupoDisponible();
    }
    
    public List<Object[]> obtenerEstadisticasCupos() {
        return licenciaRepository.getEstadisticasCupos();
    }
    
    public List<Licencia> obtenerLicenciasDisponiblesPorTipo(String tipo) {
        return licenciaRepository.findLicenciasDisponiblesPorTipo(tipo);
    }
    
    // ===== MÉTODOS PARA JEFE DE VENTAS =====
    
    public List<Licencia> findLicenciasDisponibles() {
        return licenciaRepository.findLicenciasConCupoDisponible();
    }
    
    public Map<String, Object> getCuposDetallados(Long licenciaId) {
        Licencia licencia = obtenerLicencia(licenciaId);
        Map<String, Object> cupos = new java.util.HashMap<>();
        
        cupos.put("licencia", licencia);
        cupos.put("cupoCivil", licencia.getCupoCivil() != null ? licencia.getCupoCivil() : 0);
        cupos.put("cupoEmpresa", licencia.getCupoEmpresa() != null ? licencia.getCupoEmpresa() : 0);
        cupos.put("cupoMilitar", licencia.getCupoMilitar() != null ? licencia.getCupoMilitar() : 0);
        cupos.put("cupoDeportista", licencia.getCupoDeportista() != null ? licencia.getCupoDeportista() : 0);
        cupos.put("totalCupos", (licencia.getCupoCivil() != null ? licencia.getCupoCivil() : 0) + 
                                 (licencia.getCupoEmpresa() != null ? licencia.getCupoEmpresa() : 0) + 
                                 (licencia.getCupoMilitar() != null ? licencia.getCupoMilitar() : 0) + 
                                 (licencia.getCupoDeportista() != null ? licencia.getCupoDeportista() : 0));
        cupos.put("diasRestantes", licencia.getDiasRestantes());
        cupos.put("vencida", licencia.isVencida());
        
        return cupos;
    }
    
    public Map<String, Object> asignarCliente(Long licenciaId, Long clienteId) {
        Licencia licencia = obtenerLicencia(licenciaId);
        // Aquí implementarías la lógica de asignación
        // Por ahora retornamos un mapa con información básica
        
        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("licenciaId", licenciaId);
        resultado.put("clienteId", clienteId);
        resultado.put("asignado", true);
        resultado.put("fechaAsignacion", LocalDateTime.now());
        
        return resultado;
    }
    
    public void removerCliente(Long licenciaId, Long clienteId) {
        Licencia licencia = obtenerLicencia(licenciaId);
        // Aquí implementarías la lógica de remoción
        log.info("Removiendo cliente {} de licencia {}", clienteId, licenciaId);
    }
    
    public Map<String, Object> getEstadisticasJefeVentas() {
        Map<String, Object> estadisticas = new java.util.HashMap<>();
        
        estadisticas.put("totalLicencias", licenciaRepository.count());
        estadisticas.put("licenciasActivas", licenciaRepository.findByEstado(EstadoLicencia.ACTIVA).size());
        estadisticas.put("licenciasVencidas", licenciaRepository.findLicenciasVencidas(LocalDate.now()).size());
        estadisticas.put("estadisticasPorEstado", licenciaRepository.countByEstado());
        estadisticas.put("estadisticasCupos", licenciaRepository.getEstadisticasCupos());
        
        return estadisticas;
    }
} 