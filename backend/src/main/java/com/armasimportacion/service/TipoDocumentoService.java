package com.armasimportacion.service;

import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.repository.TipoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TipoDocumentoService {

    private final TipoDocumentoRepository repository;

    public List<TipoDocumento> findByTipoProcesoId(Long tipoProcesoId) {
        // Filtrar solo documentos para clientes (excluir documentos de grupos de importación)
        return repository.findByTipoProcesoIdAndEstadoAndGruposImportacionFalse(tipoProcesoId, true);
    }

    public List<TipoDocumento> findAllActive() {
        return repository.findByEstado(true);
    }

    public List<TipoDocumento> findAll() {
        return repository.findAll();
    }

    public TipoDocumento findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado con ID: " + id));
    }

    public TipoDocumento save(TipoDocumento tipoDocumento) {
        log.info("Guardando tipo de documento: {}", tipoDocumento.getNombre());
        
        // Validación: si grupos_importacion = true, tipo_proceso_id debe ser NULL
        if (Boolean.TRUE.equals(tipoDocumento.getGruposImportacion()) && tipoDocumento.getTipoProceso() != null) {
            log.warn("Intento de guardar documento de grupos_importacion con tipo_proceso_id. Se establece como NULL.");
            tipoDocumento.setTipoProceso(null);
        }
        
        // Validación: si grupos_importacion = false, tipo_proceso_id es requerido
        if (Boolean.FALSE.equals(tipoDocumento.getGruposImportacion()) && tipoDocumento.getTipoProceso() == null) {
            throw new IllegalArgumentException("Los documentos para clientes (grupos_importacion = false) requieren un tipo_proceso_id");
        }
        
        return repository.save(tipoDocumento);
    }

    public void delete(Long id) {
        log.info("Eliminando tipo de documento con ID: {}", id);
        repository.deleteById(id);
    }

    public List<TipoDocumento> findByGruposImportacion(Boolean gruposImportacion) {
        return repository.findByGruposImportacion(gruposImportacion);
    }

    public List<TipoDocumento> findByGruposImportacionAndEstado(Boolean gruposImportacion, Boolean estado) {
        return repository.findByGruposImportacionAndEstado(gruposImportacion, estado);
    }
}
