package com.armasimportacion.repository;

import com.armasimportacion.model.TipoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoDocumentoRepository extends JpaRepository<TipoDocumento, Long> {
    
    List<TipoDocumento> findByTipoProcesoIdAndEstado(Long tipoProcesoId, Boolean estado);
    
    List<TipoDocumento> findByEstado(Boolean estado);
    
    Optional<TipoDocumento> findByNombre(String nombre);
    
    List<TipoDocumento> findByNombreAndTipoProcesoId(String nombre, Long tipoProcesoId);
    
    List<TipoDocumento> findByTipoProcesoIdAndObligatorioTrue(Long tipoProcesoId);
}
