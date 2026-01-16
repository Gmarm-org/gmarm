package com.armasimportacion.service;

import com.armasimportacion.model.Arma;
import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.repository.ArmaRepository;
import com.armasimportacion.repository.ArmaStockRepository;
import com.armasimportacion.repository.CategoriaArmaRepository;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.dto.ArmaUpdateDTO;
import com.armasimportacion.dto.ArmaCreateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ArmaService {
    
    private final ArmaRepository armaRepository;
    private final ArmaStockRepository armaStockRepository;
    private final ArmaImageService armaImageService;
    private final CategoriaArmaRepository categoriaArmaRepository;
    
    /**
     * Obtener TODAS las armas (activas e inactivas)
     */
    public List<Arma> findAll() {
        log.info("Obteniendo TODAS las armas (activas e inactivas)");
        return armaRepository.findAll();
    }
    
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
        log.info("Guardando arma: {}", arma.getModelo());
        return armaRepository.save(arma);
    }
    
    /**
     * Actualizar arma
     */
    public Arma update(Long id, Arma armaDetails) {
        log.info("Actualizando arma con ID: {}", id);
        Arma arma = findById(id);
        
        // Generar código automáticamente desde el modelo si cambió
        if (armaDetails.getModelo() != null && !armaDetails.getModelo().equals(arma.getModelo())) {
            String nuevoCodigo = generarCodigoDesdeModelo(armaDetails.getModelo());
            arma.setCodigo(nuevoCodigo);
            log.info("Código actualizado automáticamente desde modelo: '{}' -> '{}'", armaDetails.getModelo(), nuevoCodigo);
        }
        
        arma.setModelo(armaDetails.getModelo()); // Cambiado de nombre a modelo
        arma.setMarca(armaDetails.getMarca()); // Nuevo campo
        arma.setAlimentadora(armaDetails.getAlimentadora()); // Nuevo campo
        arma.setCalibre(armaDetails.getCalibre());
        arma.setCapacidad(armaDetails.getCapacidad());
        arma.setPrecioReferencia(armaDetails.getPrecioReferencia());
        arma.setCategoria(armaDetails.getCategoria());
        arma.setUrlImagen(armaDetails.getUrlImagen());
        arma.setUrlProducto(armaDetails.getUrlProducto());
        arma.setEstado(armaDetails.getEstado());
        
        Arma armaGuardada = armaRepository.save(arma);
        
        // Sincronizar campos denormalizados en arma_stock si existe
        sincronizarArmaStock(armaGuardada);
        
        return armaGuardada;
    }

    /**
     * Actualizar arma con imagen
     */
    public Arma updateWithImage(Long id, ArmaUpdateDTO updateDTO) throws IOException {
        log.info("Actualizando arma con ID: {} e imagen", id);
        Arma arma = findById(id);
        
        // Guardar imagen si se proporciona una nueva
        String newImageUrl = null;
        if (updateDTO.getImagen() != null && !updateDTO.getImagen().isEmpty()) {
            log.info("Procesando nueva imagen para arma ID: {}", id);
            
            // Eliminar imagen anterior si existe
            if (arma.getUrlImagen() != null && !arma.getUrlImagen().trim().isEmpty()) {
                armaImageService.deleteWeaponImage(arma.getUrlImagen());
                log.info("Imagen anterior eliminada para arma ID: {}", id);
            }
            
            // Guardar nueva imagen
            newImageUrl = armaImageService.saveWeaponImage(id, updateDTO.getImagen());
            log.info("Nueva imagen guardada: {}", newImageUrl);
        }
        
        // Actualizar campos de la arma
        if (updateDTO.getModelo() != null) {
            arma.setModelo(updateDTO.getModelo()); // Cambiado de nombre a modelo
            // Generar código automáticamente desde el modelo si cambió
            String nuevoCodigo = generarCodigoDesdeModelo(updateDTO.getModelo());
            arma.setCodigo(nuevoCodigo);
            log.info("Código actualizado automáticamente desde modelo: '{}' -> '{}'", updateDTO.getModelo(), nuevoCodigo);
        }
        if (updateDTO.getMarca() != null) {
            arma.setMarca(updateDTO.getMarca()); // Nuevo campo
        }
        if (updateDTO.getAlimentadora() != null) {
            arma.setAlimentadora(updateDTO.getAlimentadora()); // Nuevo campo
        }
        if (updateDTO.getCalibre() != null) {
            arma.setCalibre(updateDTO.getCalibre());
        }
        if (updateDTO.getCapacidad() != null) {
            arma.setCapacidad(updateDTO.getCapacidad());
        }
        if (updateDTO.getPrecioReferencia() != null) {
            log.info("🔍 DEBUG - Precio recibido en servicio: {}", updateDTO.getPrecioReferencia());
            log.info("🔍 DEBUG - Precio anterior en BD: {}", arma.getPrecioReferencia());
            arma.setPrecioReferencia(updateDTO.getPrecioReferencia());
            log.info("🔍 DEBUG - Precio actualizado en entidad: {}", arma.getPrecioReferencia());
        }
        if (updateDTO.getCategoriaId() != null) {
            CategoriaArma categoria = categoriaArmaRepository.findById(updateDTO.getCategoriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + updateDTO.getCategoriaId()));
            arma.setCategoria(categoria);
            log.info("Categoría actualizada: {} (ID {})", categoria.getNombre(), categoria.getId());
        }
        if (updateDTO.getEstado() != null) {
            arma.setEstado(updateDTO.getEstado());
        }
        if (updateDTO.getUrlImagen() != null && !updateDTO.getUrlImagen().trim().isEmpty()) {
            arma.setUrlImagen(updateDTO.getUrlImagen());
        }
        
        // Si se guardó una nueva imagen, actualizar la URL
        if (newImageUrl != null) {
            arma.setUrlImagen(newImageUrl);
        }
        
        // Actualizar fecha de modificación
        arma.setFechaActualizacion(LocalDateTime.now());
        
        Arma armaGuardada = armaRepository.save(arma);
        
        // Sincronizar campos denormalizados en arma_stock si existe
        sincronizarArmaStock(armaGuardada);
        
        return armaGuardada;
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

    /**
     * Crear nueva arma con imagen
     */
    public Arma createWithImage(ArmaCreateDTO createDTO) throws IOException {
        log.info("Creando nueva arma con imagen");
        
        // Crear nueva entidad Arma
        Arma arma = new Arma();
        arma.setModelo(createDTO.getModelo()); // Cambiado de nombre a modelo
        arma.setMarca(createDTO.getMarca()); // Nuevo campo
        arma.setAlimentadora(createDTO.getAlimentadora()); // Nuevo campo
        arma.setCalibre(createDTO.getCalibre());
        arma.setCapacidad(createDTO.getCapacidad());
        arma.setPrecioReferencia(createDTO.getPrecioReferencia());
        arma.setEstado(createDTO.getEstado() != null ? createDTO.getEstado() : true);
        // Generar código automáticamente desde el modelo
        String codigoGenerado = generarCodigoDesdeModelo(createDTO.getModelo());
        arma.setCodigo(codigoGenerado);
        log.info("Código generado automáticamente desde modelo: '{}' -> '{}'", createDTO.getModelo(), codigoGenerado);
        arma.setUrlProducto(createDTO.getUrlProducto());
        arma.setFechaCreacion(LocalDateTime.now());
        arma.setFechaActualizacion(LocalDateTime.now());
        
        // Asignar categoría
        if (createDTO.getCategoriaId() != null) {
            CategoriaArma categoria = categoriaArmaRepository.findById(createDTO.getCategoriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + createDTO.getCategoriaId()));
            arma.setCategoria(categoria);
            log.info("Categoría asignada: {} (ID {})", categoria.getNombre(), categoria.getId());
        }
        
        // Guardar la arma primero para obtener el ID
        Arma armaGuardada = armaRepository.save(arma);
        
        // Sincronizar campos denormalizados en arma_stock si existe
        sincronizarArmaStock(armaGuardada);
        
        // Guardar imagen si se proporciona
        if (createDTO.getImagen() != null && !createDTO.getImagen().isEmpty()) {
            log.info("Procesando imagen para nueva arma ID: {}", armaGuardada.getId());
            
            String imageUrl = armaImageService.saveWeaponImage(armaGuardada.getId(), createDTO.getImagen());
            armaGuardada.setUrlImagen(imageUrl);
            
            // Actualizar la arma con la URL de la imagen
            armaGuardada = armaRepository.save(armaGuardada);
            log.info("Imagen guardada: {}", imageUrl);
        }
        
        // Sincronizar campos denormalizados en arma_stock si existe
        sincronizarArmaStock(armaGuardada);
        
        return armaGuardada;
    }
    
    /**
     * Genera el código del arma automáticamente desde el modelo
     * Convierte el modelo a mayúsculas y reemplaza espacios con guiones
     * Ejemplo: "CZ P09 C NOCTURNE" -> "CZ-P09-C-NOCTURNE"
     */
    private String generarCodigoDesdeModelo(String modelo) {
        if (modelo == null || modelo.trim().isEmpty()) {
            return "";
        }
        // Convertir a mayúsculas y reemplazar espacios con guiones
        String codigo = modelo.trim()
                .toUpperCase()
                .replaceAll("\\s+", "-")  // Reemplazar uno o más espacios con un guión
                .replaceAll("-+", "-")    // Reemplazar múltiples guiones consecutivos con uno solo
                .replaceAll("^-|-$", ""); // Eliminar guiones al inicio o final
        
        log.debug("Código generado desde modelo '{}': '{}'", modelo, codigo);
        return codigo;
    }
    
    /**
     * Sincroniza los campos denormalizados (modelo, marca, alimentadora) en arma_stock cuando se actualiza un arma
     */
    private void sincronizarArmaStock(Arma arma) {
        try {
            Optional<ArmaStock> stockOpt = armaStockRepository.findByArmaId(arma.getId());
            if (stockOpt.isPresent()) {
                ArmaStock stock = stockOpt.get();
                stock.setModelo(arma.getModelo());
                stock.setMarca(arma.getMarca());
                stock.setAlimentadora(arma.getAlimentadora());
                armaStockRepository.save(stock);
                log.debug("✅ Campos denormalizados sincronizados en arma_stock para arma ID: {}", arma.getId());
            }
        } catch (Exception e) {
            log.warn("⚠️ Error sincronizando campos denormalizados en arma_stock para arma ID {}: {}", arma.getId(), e.getMessage());
            // No lanzar excepción, solo loggear el warning para no afectar la operación principal
        }
    }
}
