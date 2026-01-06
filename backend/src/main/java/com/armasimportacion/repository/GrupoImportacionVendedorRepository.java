package com.armasimportacion.repository;

import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionVendedor;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrupoImportacionVendedorRepository extends JpaRepository<GrupoImportacionVendedor, Long> {
    
    List<GrupoImportacionVendedor> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    List<GrupoImportacionVendedor> findByVendedor(Usuario vendedor);
    
    void deleteByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    boolean existsByGrupoImportacionAndVendedor(GrupoImportacion grupoImportacion, Usuario vendedor);
    
    /**
     * Obtiene grupos activos disponibles para un vendedor específico usando JOIN directo
     * Equivalente a: SELECT gi.* FROM grupo_importacion gi 
     *                JOIN grupo_importacion_vendedor giv ON gi.id = giv.grupo_importacion_id
     *                WHERE giv.vendedor_id = :vendedorId 
     *                AND gi.estado IN ('EN_PREPARACION', 'EN_PROCESO_ASIGNACION_CLIENTES')
     */
    @Query("SELECT giv FROM GrupoImportacionVendedor giv " +
           "JOIN FETCH giv.grupoImportacion gi " +
           "WHERE giv.vendedor.id = :vendedorId " +
           "AND (gi.estado = :estado1 OR gi.estado = :estado2)")
    List<GrupoImportacionVendedor> findGruposActivosByVendedorId(
            @Param("vendedorId") Long vendedorId,
            @Param("estado1") EstadoGrupoImportacion estado1,
            @Param("estado2") EstadoGrupoImportacion estado2);
}

