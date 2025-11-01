package com.armasimportacion.repository;

import com.armasimportacion.model.TipoClienteImportacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoClienteImportacionRepository extends JpaRepository<TipoClienteImportacion, Long> {
    
    List<TipoClienteImportacion> findByTipoClienteId(Long tipoClienteId);
    
    List<TipoClienteImportacion> findByTipoImportacionId(Long tipoImportacionId);
}

