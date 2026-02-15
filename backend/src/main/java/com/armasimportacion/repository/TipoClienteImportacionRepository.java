package com.armasimportacion.repository;

import com.armasimportacion.model.TipoClienteImportacion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoClienteImportacionRepository extends JpaRepository<TipoClienteImportacion, Long> {

    @EntityGraph(attributePaths = {"tipoCliente", "tipoImportacion"})
    List<TipoClienteImportacion> findByTipoClienteId(Long tipoClienteId);

    @EntityGraph(attributePaths = {"tipoCliente", "tipoImportacion"})
    List<TipoClienteImportacion> findByTipoImportacionId(Long tipoImportacionId);
}

