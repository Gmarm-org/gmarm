package com.armasimportacion.repository;

import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionLimiteCategoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoImportacionLimiteCategoriaRepository extends JpaRepository<GrupoImportacionLimiteCategoria, Long> {
    
    List<GrupoImportacionLimiteCategoria> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    void deleteByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    Optional<GrupoImportacionLimiteCategoria> findByGrupoImportacionIdAndCategoriaArmaId(Long grupoImportacionId, Long categoriaArmaId);
}

