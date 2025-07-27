package com.armasimportacion.repository;

import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.enums.EstadoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentoClienteRepository extends JpaRepository<DocumentoCliente, Long> {
    
    // Búsquedas básicas
    List<DocumentoCliente> findByCliente(Cliente cliente);
    List<DocumentoCliente> findByEstado(EstadoDocumento estado);
    
    // Documentos por cliente
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId")
    List<DocumentoCliente> findByClienteId(@Param("clienteId") Long clienteId);
    
    // Documentos por cliente y estado
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = :estado")
    List<DocumentoCliente> findByClienteIdAndEstado(@Param("clienteId") Long clienteId, @Param("estado") EstadoDocumento estado);
    
    // Documentos por fecha de carga
    List<DocumentoCliente> findByFechaCargaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Documentos aprobados por cliente
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'APROBADO'")
    List<DocumentoCliente> findAprobadosByClienteId(@Param("clienteId") Long clienteId);
    
    // Documentos pendientes por cliente
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'PENDIENTE'")
    List<DocumentoCliente> findPendientesByClienteId(@Param("clienteId") Long clienteId);
    
    // Contar documentos por cliente
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId")
    Long countByClienteId(@Param("clienteId") Long clienteId);
    
    // Contar documentos aprobados por cliente
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'APROBADO'")
    Long countAprobadosByClienteId(@Param("clienteId") Long clienteId);
    
    // Contar documentos pendientes por cliente
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'PENDIENTE'")
    Long countPendientesByClienteId(@Param("clienteId") Long clienteId);
} 