package com.armasimportacion.repository;

import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.enums.EstadoClienteGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteGrupoImportacionRepository extends JpaRepository<ClienteGrupoImportacion, Long> {
    
    // Búsquedas básicas
    List<ClienteGrupoImportacion> findByCliente(Cliente cliente);
    List<ClienteGrupoImportacion> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    List<ClienteGrupoImportacion> findByEstado(EstadoClienteGrupo estado);
    
    // Búsquedas específicas
    Optional<ClienteGrupoImportacion> findByClienteAndGrupoImportacion(Cliente cliente, GrupoImportacion grupoImportacion);
    
    // Clientes por grupo
    @Query("SELECT cgi FROM ClienteGrupoImportacion cgi WHERE cgi.grupoImportacion.id = :grupoId")
    List<ClienteGrupoImportacion> findByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Grupos por cliente
    @Query("SELECT cgi FROM ClienteGrupoImportacion cgi WHERE cgi.cliente.id = :clienteId")
    List<ClienteGrupoImportacion> findByClienteId(@Param("clienteId") Long clienteId);
    
    // Verificar existencia
    boolean existsByClienteAndGrupoImportacion(Cliente cliente, GrupoImportacion grupoImportacion);
    
    // Contar clientes por grupo
    @Query("SELECT COUNT(cgi) FROM ClienteGrupoImportacion cgi WHERE cgi.grupoImportacion.id = :grupoId")
    Long countByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Contar grupos por cliente
    @Query("SELECT COUNT(cgi) FROM ClienteGrupoImportacion cgi WHERE cgi.cliente.id = :clienteId")
    Long countByClienteId(@Param("clienteId") Long clienteId);
    
    // Clientes aprobados por grupo
    @Query("SELECT cgi FROM ClienteGrupoImportacion cgi WHERE cgi.grupoImportacion.id = :grupoId AND cgi.estado = 'APROBADO'")
    List<ClienteGrupoImportacion> findAprobadosByGrupoImportacionId(@Param("grupoId") Long grupoId);
    
    // Clientes pendientes por grupo
    @Query("SELECT cgi FROM ClienteGrupoImportacion cgi WHERE cgi.grupoImportacion.id = :grupoId AND cgi.estado = 'PENDIENTE'")
    List<ClienteGrupoImportacion> findPendientesByGrupoImportacionId(@Param("grupoId") Long grupoId);
} 
