package com.armasimportacion.service;

import com.armasimportacion.dto.AccesorioDTO;
import com.armasimportacion.model.Accesorio;
import com.armasimportacion.repository.AccesorioRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de accesorios
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccesorioService {

    private final AccesorioRepository accesorioRepository;

    /**
     * Crear un nuevo accesorio
     */
    public AccesorioDTO crearAccesorio(AccesorioDTO accesorioDTO) {
        log.info("Creando nuevo accesorio: {}", accesorioDTO.getNombre());
        
        // Validar código único
        if (accesorioRepository.existsByCodigo(accesorioDTO.getCodigo())) {
            throw new BadRequestException("Ya existe un accesorio con el código: " + accesorioDTO.getCodigo());
        }
        
        // Validar nombre
        if (accesorioDTO.getNombre() == null || accesorioDTO.getNombre().isBlank()) {
            throw new BadRequestException("El nombre del accesorio es obligatorio");
        }
        
        Accesorio accesorio = new Accesorio();
        accesorio.setNombre(accesorioDTO.getNombre().trim());
        accesorio.setCodigo(accesorioDTO.getCodigo().trim());
        accesorio.setDescripcion(accesorioDTO.getDescripcion());
        accesorio.setCategoria(accesorioDTO.getCategoria());
        accesorio.setPrecioReferencia(accesorioDTO.getPrecioReferencia());
        accesorio.setEstado(true);
        
        Accesorio saved = accesorioRepository.save(accesorio);
        log.info("Accesorio creado exitosamente con ID: {}", saved.getId());
        
        return convertirADTO(saved);
    }

    /**
     * Obtener todos los accesorios
     */
    @Transactional(readOnly = true)
    public List<AccesorioDTO> obtenerTodos() {
        log.info("Obteniendo todos los accesorios");
        
        List<Accesorio> accesorios = accesorioRepository.findAll();
        return accesorios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener solo accesorios activos
     */
    @Transactional(readOnly = true)
    public List<AccesorioDTO> obtenerActivos() {
        log.info("Obteniendo accesorios activos");
        
        List<Accesorio> accesorios = accesorioRepository.findByEstadoTrue();
        return accesorios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener accesorio por ID
     */
    @Transactional(readOnly = true)
    public AccesorioDTO obtenerPorId(Long id) {
        log.info("Obteniendo accesorio con ID: {}", id);
        
        Accesorio accesorio = accesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con ID: " + id));
        
        return convertirADTO(accesorio);
    }

    /**
     * Obtener accesorio por código
     */
    @Transactional(readOnly = true)
    public AccesorioDTO obtenerPorCodigo(String codigo) {
        log.info("Obteniendo accesorio con código: {}", codigo);
        
        Accesorio accesorio = accesorioRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con código: " + codigo));
        
        return convertirADTO(accesorio);
    }

    /**
     * Buscar accesorios por nombre
     */
    @Transactional(readOnly = true)
    public List<AccesorioDTO> buscarPorNombre(String nombre) {
        log.info("Buscando accesorios por nombre: {}", nombre);
        
        List<Accesorio> accesorios = accesorioRepository.findByNombreContainingIgnoreCase(nombre);
        return accesorios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar accesorios por categoría
     */
    @Transactional(readOnly = true)
    public List<AccesorioDTO> buscarPorCategoria(String categoria) {
        log.info("Buscando accesorios por categoría: {}", categoria);
        
        List<Accesorio> accesorios = accesorioRepository.findByCategoria(categoria);
        return accesorios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar accesorios por rango de precio
     */
    @Transactional(readOnly = true)
    public List<AccesorioDTO> buscarPorRangoPrecio(BigDecimal precioMin, BigDecimal precioMax) {
        log.info("Buscando accesorios por rango de precio: {} - {}", precioMin, precioMax);
        
        List<Accesorio> accesorios = accesorioRepository.findByPrecioReferenciaBetween(precioMin, precioMax);
        return accesorios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Actualizar accesorio
     */
    public AccesorioDTO actualizarAccesorio(Long id, AccesorioDTO accesorioDTO) {
        log.info("Actualizando accesorio con ID: {}", id);
        
        Accesorio accesorio = accesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con ID: " + id));
        
        // Validar código único si cambió
        if (!accesorio.getCodigo().equals(accesorioDTO.getCodigo()) && 
            accesorioRepository.existsByCodigo(accesorioDTO.getCodigo())) {
            throw new BadRequestException("Ya existe un accesorio con el código: " + accesorioDTO.getCodigo());
        }
        
        // Actualizar campos
        if (accesorioDTO.getNombre() != null && !accesorioDTO.getNombre().isBlank()) {
            accesorio.setNombre(accesorioDTO.getNombre().trim());
        }
        if (accesorioDTO.getCodigo() != null && !accesorioDTO.getCodigo().isBlank()) {
            accesorio.setCodigo(accesorioDTO.getCodigo().trim());
        }
        if (accesorioDTO.getDescripcion() != null) {
            accesorio.setDescripcion(accesorioDTO.getDescripcion());
        }
        if (accesorioDTO.getCategoria() != null) {
            accesorio.setCategoria(accesorioDTO.getCategoria());
        }
        if (accesorioDTO.getPrecioReferencia() != null) {
            accesorio.setPrecioReferencia(accesorioDTO.getPrecioReferencia());
        }
        if (accesorioDTO.getEstado() != null) {
            accesorio.setEstado(accesorioDTO.getEstado());
        }
        
        Accesorio saved = accesorioRepository.save(accesorio);
        log.info("Accesorio actualizado exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Activar accesorio
     */
    public AccesorioDTO activarAccesorio(Long id) {
        log.info("Activando accesorio con ID: {}", id);
        
        Accesorio accesorio = accesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con ID: " + id));
        
        accesorio.activar();
        Accesorio saved = accesorioRepository.save(accesorio);
        log.info("Accesorio activado exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Desactivar accesorio
     */
    public AccesorioDTO desactivarAccesorio(Long id) {
        log.info("Desactivando accesorio con ID: {}", id);
        
        Accesorio accesorio = accesorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accesorio no encontrado con ID: " + id));
        
        accesorio.desactivar();
        Accesorio saved = accesorioRepository.save(accesorio);
        log.info("Accesorio desactivado exitosamente: {}", id);
        
        return convertirADTO(saved);
    }

    /**
     * Eliminar accesorio
     */
    public void eliminarAccesorio(Long id) {
        log.info("Eliminando accesorio con ID: {}", id);
        
        if (!accesorioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Accesorio no encontrado con ID: " + id);
        }
        
        accesorioRepository.deleteById(id);
        log.info("Accesorio eliminado exitosamente: {}", id);
    }

    /**
     * Obtener estadísticas de accesorios
     */
    @Transactional(readOnly = true)
    public AccesorioStatsDTO obtenerEstadisticas() {
        long totalAccesorios = accesorioRepository.count();
        long accesoriosActivos = accesorioRepository.countByEstado(true);
        long accesoriosInactivos = accesorioRepository.countByEstado(false);
        long accesoriosConPrecio = accesorioRepository.findAccesoriosConPrecio().size();
        long accesoriosSinPrecio = accesorioRepository.findAccesoriosSinPrecio().size();
        
        return new AccesorioStatsDTO(totalAccesorios, accesoriosActivos, accesoriosInactivos, accesoriosConPrecio, accesoriosSinPrecio);
    }

    /**
     * Convertir entidad a DTO
     */
    private AccesorioDTO convertirADTO(Accesorio accesorio) {
        AccesorioDTO dto = new AccesorioDTO();
        dto.setId(accesorio.getId());
        dto.setNombre(accesorio.getNombre());
        dto.setCodigo(accesorio.getCodigo());
        dto.setDescripcion(accesorio.getDescripcion());
        dto.setCategoria(accesorio.getCategoria());
        dto.setPrecioReferencia(accesorio.getPrecioReferencia());
        dto.setEstado(accesorio.getEstado());
        dto.setFechaCreacion(accesorio.getFechaCreacion());
        dto.setFechaActualizacion(accesorio.getFechaActualizacion());
        return dto;
    }

    /**
     * DTO para estadísticas
     */
    public static class AccesorioStatsDTO {
        private final long totalAccesorios;
        private final long accesoriosActivos;
        private final long accesoriosInactivos;
        private final long accesoriosConPrecio;
        private final long accesoriosSinPrecio;

        public AccesorioStatsDTO(long totalAccesorios, long accesoriosActivos, long accesoriosInactivos, 
                                long accesoriosConPrecio, long accesoriosSinPrecio) {
            this.totalAccesorios = totalAccesorios;
            this.accesoriosActivos = accesoriosActivos;
            this.accesoriosInactivos = accesoriosInactivos;
            this.accesoriosConPrecio = accesoriosConPrecio;
            this.accesoriosSinPrecio = accesoriosSinPrecio;
        }

        // Getters
        public long getTotalAccesorios() { return totalAccesorios; }
        public long getAccesoriosActivos() { return accesoriosActivos; }
        public long getAccesoriosInactivos() { return accesoriosInactivos; }
        public long getAccesoriosConPrecio() { return accesoriosConPrecio; }
        public long getAccesoriosSinPrecio() { return accesoriosSinPrecio; }
    }
}
