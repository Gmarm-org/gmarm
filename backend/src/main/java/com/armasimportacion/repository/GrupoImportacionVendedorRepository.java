package com.armasimportacion.repository;

import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionVendedor;
import com.armasimportacion.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrupoImportacionVendedorRepository extends JpaRepository<GrupoImportacionVendedor, Long> {
    
    List<GrupoImportacionVendedor> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    List<GrupoImportacionVendedor> findByVendedor(Usuario vendedor);
    
    void deleteByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    boolean existsByGrupoImportacionAndVendedor(GrupoImportacion grupoImportacion, Usuario vendedor);
}

