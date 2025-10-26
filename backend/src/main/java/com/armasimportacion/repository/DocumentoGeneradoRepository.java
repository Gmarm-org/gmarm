package com.armasimportacion.repository;

import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentoGeneradoRepository extends JpaRepository<DocumentoGenerado, Long> {
    
    // Búsquedas básicas
    List<DocumentoGenerado> findByCliente(Cliente cliente);
    List<DocumentoGenerado> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    List<DocumentoGenerado> findByTipoDocumento(TipoDocumentoGenerado tipoDocumento);
    List<DocumentoGenerado> findByEstado(EstadoDocumentoGenerado estado);
    
    // Documentos por cliente
    @Query("SELECT dg FROM DocumentoGenerado dg WHERE dg.cliente.id = :clienteId")
    List<DocumentoGenerado> findByClienteId(@Param("clienteId") Long clienteId);
    
    // Documentos por grupo
    @Query("SELECT dg FROM DocumentoGenerado dg WHERE dg.grupoImportacion.id = :grupoId")
    List<DocumentoGenerado> findByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Documentos por tipo y cliente
    @Query("SELECT dg FROM DocumentoGenerado dg WHERE dg.cliente.id = :clienteId AND dg.tipoDocumento = :tipoDocumento")
    List<DocumentoGenerado> findByClienteIdAndTipo(@Param("clienteId") Long clienteId, @Param("tipoDocumento") TipoDocumentoGenerado tipoDocumento);
    
    // Documentos firmados
    @Query("SELECT dg FROM DocumentoGenerado dg WHERE dg.fechaFirma IS NOT NULL")
    List<DocumentoGenerado> findDocumentosFirmados();
    
    // Documentos por fecha de generación
    List<DocumentoGenerado> findByFechaGeneracionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Verificar existencia
    boolean existsByClienteAndTipoDocumento(Cliente cliente, TipoDocumentoGenerado tipoDocumento);
    
    // Contar documentos por tipo
    @Query("SELECT dg.tipoDocumento, COUNT(dg) FROM DocumentoGenerado dg GROUP BY dg.tipoDocumento")
    List<Object[]> countByTipo();
    
    // Contar documentos por estado
    @Query("SELECT dg.estado, COUNT(dg) FROM DocumentoGenerado dg GROUP BY dg.estado")
    List<Object[]> countByEstado();
    
    // Documentos recientes
    @Query("SELECT dg FROM DocumentoGenerado dg ORDER BY dg.fechaGeneracion DESC")
    List<DocumentoGenerado> findDocumentosRecientes();
} 
