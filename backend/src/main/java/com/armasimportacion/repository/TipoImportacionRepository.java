package com.armasimportacion.repository;

import com.armasimportacion.model.TipoImportacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoImportacionRepository extends JpaRepository<TipoImportacion, Long> {
    
    List<TipoImportacion> findByEstado(Boolean estado);
    
    Optional<TipoImportacion> findByNombre(String nombre);
    
    Optional<TipoImportacion> findByCodigo(String codigo);
}

