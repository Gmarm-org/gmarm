package com.armasimportacion.service;

import com.armasimportacion.model.Arma;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ArmaService {
    
    private final ArmaRepository armaRepository;
    
    /**
     * Obtener todas las armas activas
     */
    public List<Arma> findAllActive() {
        log.info("Obteniendo todas las armas activas");
        return armaRepository.findByEstado(true);
    }
    
    /**
     * Obtener todas las armas activas con categoría
     */
    public List<Arma> findAllActiveWithCategoria() {
        log.info("Obteniendo todas las armas activas con categoría");
        return armaRepository.findAllActiveWithCategoria();
    }
    
    /**
     * Obtener arma por ID
     */
    public Arma findById(Long id) {
        log.info("Buscando arma con ID: {}", id);
        return armaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con ID: " + id));
    }
    
    /**
     * Obtener arma por código
     */
    public Arma findByCodigo(String codigo) {
        log.info("Buscando arma con código: {}", codigo);
        return armaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Arma no encontrada con código: " + codigo));
    }
    
    /**
     * Obtener armas por categoría
     */
    public List<Arma> findByCategoriaId(Long categoriaId) {
        log.info("Buscando armas por categoría ID: {}", categoriaId);
        return armaRepository.findByCategoriaId(categoriaId);
    }
    
    /**
     * Obtener armas disponibles por categoría
     */
    public List<Arma> findDisponiblesByCategoria(Long categoriaId) {
        log.info("Buscando armas disponibles por categoría ID: {}", categoriaId);
        return armaRepository.findDisponiblesByCategoria(categoriaId);
    }
    
    /**
     * Guardar arma
     */
    public Arma save(Arma arma) {
        log.info("Guardando arma: {}", arma.getNombre());
        return armaRepository.save(arma);
    }
    
    /**
     * Actualizar arma
     */
    public Arma update(Long id, Arma armaDetails) {
        log.info("Actualizando arma con ID: {}", id);
        Arma arma = findById(id);
        
        arma.setCodigo(armaDetails.getCodigo());
        arma.setNombre(armaDetails.getNombre());
        arma.setCalibre(armaDetails.getCalibre());
        arma.setCapacidad(armaDetails.getCapacidad());
        arma.setPrecioReferencia(armaDetails.getPrecioReferencia());
        arma.setCategoria(armaDetails.getCategoria());
        arma.setUrlImagen(armaDetails.getUrlImagen());
        arma.setUrlProducto(armaDetails.getUrlProducto());
        arma.setEstado(armaDetails.getEstado());
        
        return armaRepository.save(arma);
    }
    
    /**
     * Cambiar estado de arma
     */
    public Arma changeEstado(Long id, Boolean estado) {
        log.info("Cambiando estado de arma ID: {} a: {}", id, estado);
        Arma arma = findById(id);
        arma.setEstado(estado);
        return armaRepository.save(arma);
    }
    
    /**
     * Eliminar arma (cambiar estado a false)
     */
    public void delete(Long id) {
        log.info("Eliminando arma con ID: {}", id);
        changeEstado(id, false);
    }
}
