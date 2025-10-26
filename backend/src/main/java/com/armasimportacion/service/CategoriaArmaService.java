package com.armasimportacion.service;

import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.repository.CategoriaArmaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoriaArmaService {

    private final CategoriaArmaRepository categoriaArmaRepository;

    /**
     * Obtener todas las categorías de armas
     */
    public List<CategoriaArma> getAllCategorias() {
        log.info("Obteniendo todas las categorías de armas");
        List<CategoriaArma> categorias = categoriaArmaRepository.findAll();
        log.info("Categorías obtenidas: {}", categorias.size());
        return categorias;
    }

    /**
     * Obtener categoría por ID
     */
    public CategoriaArma getCategoriaById(Long id) {
        log.info("Obteniendo categoría de arma con ID: {}", id);
        return categoriaArmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría de arma no encontrada con ID: " + id));
    }

    /**
     * Crear nueva categoría
     */
    public CategoriaArma createCategoria(CategoriaArma categoria) {
        log.info("Creando nueva categoría: {}", categoria.getNombre());
        
        // Validar que no exista una categoría con el mismo código
        if (categoriaArmaRepository.findByCodigo(categoria.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una categoría con el código: " + categoria.getCodigo());
        }
        
        // Validar que no exista una categoría con el mismo nombre
        if (categoriaArmaRepository.findByNombre(categoria.getNombre()).isPresent()) {
            throw new IllegalArgumentException("Ya existe una categoría con el nombre: " + categoria.getNombre());
        }
        
        CategoriaArma categoriaCreada = categoriaArmaRepository.save(categoria);
        log.info("Categoría creada exitosamente con ID: {}", categoriaCreada.getId());
        return categoriaCreada;
    }

    /**
     * Actualizar categoría existente
     */
    public CategoriaArma updateCategoria(Long id, CategoriaArma categoriaActualizada) {
        log.info("Actualizando categoría con ID: {}", id);
        
        CategoriaArma categoriaExistente = getCategoriaById(id);
        
        // Validar que el nuevo código no esté en uso por otra categoría
        if (!categoriaExistente.getCodigo().equals(categoriaActualizada.getCodigo())) {
            if (categoriaArmaRepository.findByCodigo(categoriaActualizada.getCodigo()).isPresent()) {
                throw new IllegalArgumentException("Ya existe una categoría con el código: " + categoriaActualizada.getCodigo());
            }
        }
        
        // Validar que el nuevo nombre no esté en uso por otra categoría
        if (!categoriaExistente.getNombre().equals(categoriaActualizada.getNombre())) {
            if (categoriaArmaRepository.findByNombre(categoriaActualizada.getNombre()).isPresent()) {
                throw new IllegalArgumentException("Ya existe una categoría con el nombre: " + categoriaActualizada.getNombre());
            }
        }
        
        // Actualizar campos
        categoriaExistente.setNombre(categoriaActualizada.getNombre());
        categoriaExistente.setCodigo(categoriaActualizada.getCodigo());
        categoriaExistente.setDescripcion(categoriaActualizada.getDescripcion());
        categoriaExistente.setEstado(categoriaActualizada.getEstado());
        
        CategoriaArma categoriaGuardada = categoriaArmaRepository.save(categoriaExistente);
        log.info("Categoría actualizada exitosamente: {}", categoriaGuardada.getNombre());
        return categoriaGuardada;
    }

    /**
     * Eliminar categoría
     */
    public void deleteCategoria(Long id) {
        log.info("Eliminando categoría con ID: {}", id);
        
        CategoriaArma categoria = getCategoriaById(id);
        
        // Verificar si hay armas asociadas a esta categoría
        // TODO: Implementar verificación de armas asociadas
        
        categoriaArmaRepository.delete(categoria);
        log.info("Categoría eliminada exitosamente: {}", categoria.getNombre());
    }

    /**
     * Obtener categorías activas
     */
    public List<CategoriaArma> getCategoriasActivas() {
        log.info("Obteniendo categorías activas");
        List<CategoriaArma> categorias = categoriaArmaRepository.findByEstadoTrue();
        log.info("Categorías activas obtenidas: {}", categorias.size());
        return categorias;
    }

    /**
     * Cambiar estado de categoría
     */
    public CategoriaArma cambiarEstado(Long id, Boolean nuevoEstado) {
        log.info("Cambiando estado de categoría con ID: {} a: {}", id, nuevoEstado);
        
        CategoriaArma categoria = getCategoriaById(id);
        categoria.setEstado(nuevoEstado);
        
        CategoriaArma categoriaGuardada = categoriaArmaRepository.save(categoria);
        log.info("Estado de categoría cambiado exitosamente: {} -> {}", categoria.getNombre(), nuevoEstado);
        return categoriaGuardada;
    }
}
