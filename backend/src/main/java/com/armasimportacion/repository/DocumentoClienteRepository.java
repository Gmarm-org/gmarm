package com.armasimportacion.repository;

import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.DocumentoCliente.EstadoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentoClienteRepository extends JpaRepository<DocumentoCliente, Long> {

    List<DocumentoCliente> findByCliente(Cliente cliente);
    
    List<DocumentoCliente> findByEstado(EstadoDocumento estado);
    
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId")
    List<DocumentoCliente> findByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = :estado")
    List<DocumentoCliente> findByClienteIdAndEstado(@Param("clienteId") Long clienteId, @Param("estado") EstadoDocumento estado);
    
    List<DocumentoCliente> findByFechaCargaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'APROBADO'")
    List<DocumentoCliente> findAprobadosByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT dc FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'PENDIENTE'")
    List<DocumentoCliente> findPendientesByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId")
    long countByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'APROBADO'")
    long countAprobadosByClienteId(@Param("clienteId") Long clienteId);
    
    @Query("SELECT COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id = :clienteId AND dc.estado = 'PENDIENTE'")
    long countPendientesByClienteId(@Param("clienteId") Long clienteId);

    // Batch: contar documentos por cliente para múltiples clientes
    @Query("SELECT dc.cliente.id, COUNT(dc) FROM DocumentoCliente dc WHERE dc.cliente.id IN :clienteIds GROUP BY dc.cliente.id")
    List<Object[]> countByClienteIdIn(@Param("clienteIds") List<Long> clienteIds);
}
