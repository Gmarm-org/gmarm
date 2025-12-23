package com.armasimportacion.repository;

import com.armasimportacion.model.DocumentoGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.enums.EstadoDocumentoGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentoGrupoImportacionRepository extends JpaRepository<DocumentoGrupoImportacion, Long> {
    
    // Búsquedas básicas
    List<DocumentoGrupoImportacion> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    List<DocumentoGrupoImportacion> findByTipoDocumento(TipoDocumento tipoDocumento);
    List<DocumentoGrupoImportacion> findByEstado(EstadoDocumentoGrupo estado);
    
    // Documentos por grupo
    @Query("SELECT dgi FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId")
    List<DocumentoGrupoImportacion> findByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Documentos por grupo y tipo (por ID)
    @Query("SELECT dgi FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId AND dgi.tipoDocumento.id = :tipoDocumentoId")
    List<DocumentoGrupoImportacion> findByGrupoImportacionIdAndTipoDocumentoId(
            @Param("grupoId") Long grupoId, 
            @Param("tipoDocumentoId") Long tipoDocumentoId);
    
    // Documentos por grupo y tipo (por objeto)
    List<DocumentoGrupoImportacion> findByGrupoImportacionAndTipoDocumento(
            GrupoImportacion grupoImportacion, 
            TipoDocumento tipoDocumento);
    
    // Documentos completos por grupo
    @Query("SELECT dgi FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId AND dgi.estado = 'COMPLETO'")
    List<DocumentoGrupoImportacion> findCompletosByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Documentos pendientes por grupo
    @Query("SELECT dgi FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId AND dgi.estado = 'PENDIENTE'")
    List<DocumentoGrupoImportacion> findPendientesByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Verificar existencia
    boolean existsByGrupoImportacionAndTipoDocumento(GrupoImportacion grupoImportacion, TipoDocumento tipoDocumento);
    
    // Contar documentos por grupo
    @Query("SELECT COUNT(dgi) FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId")
    Long countByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Contar documentos completos por grupo
    @Query("SELECT COUNT(dgi) FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId AND dgi.estado = 'COMPLETO'")
    Long countCompletosByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Contar documentos pendientes por grupo
    @Query("SELECT COUNT(dgi) FROM DocumentoGrupoImportacion dgi WHERE dgi.grupoImportacion.id = :grupoId AND dgi.estado = 'PENDIENTE'")
    Long countPendientesByGrupoImportacionId(@Param("grupoId") Long grupoId);
} 
