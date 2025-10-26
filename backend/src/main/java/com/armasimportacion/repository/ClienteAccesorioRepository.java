package com.armasimportacion.repository;

import com.armasimportacion.model.ClienteAccesorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la relación cliente-accesorio
 * Reemplaza a AsignacionAccesorioRepository para mantener consistencia
 */
@Repository
public interface ClienteAccesorioRepository extends JpaRepository<ClienteAccesorio, Long> {

    // Buscar por cliente
    List<ClienteAccesorio> findByClienteId(Long clienteId);
    
    // Buscar por accesorio
    List<ClienteAccesorio> findByAccesorioId(Long accesorioId);
    
    // Buscar por estado
    List<ClienteAccesorio> findByEstado(ClienteAccesorio.EstadoClienteAccesorio estado);
    
    // Buscar por cliente y estado
    List<ClienteAccesorio> findByClienteIdAndEstado(Long clienteId, ClienteAccesorio.EstadoClienteAccesorio estado);
    
    // Buscar por accesorio y estado
    List<ClienteAccesorio> findByAccesorioIdAndEstado(Long accesorioId, ClienteAccesorio.EstadoClienteAccesorio estado);
    
    // Buscar por cliente y accesorio
    Optional<ClienteAccesorio> findByClienteIdAndAccesorioId(Long clienteId, Long accesorioId);
    
    // Verificar si existe una relación cliente-accesorio
    boolean existsByClienteIdAndAccesorioId(Long clienteId, Long accesorioId);
    
    // Contar por cliente
    long countByClienteId(Long clienteId);
    
    // Contar por accesorio
    long countByAccesorioId(Long accesorioId);
    
    // Contar por estado
    long countByEstado(ClienteAccesorio.EstadoClienteAccesorio estado);
    
    // Buscar reservas activas por cliente
    @Query("SELECT ca FROM ClienteAccesorio ca WHERE ca.cliente.id = :clienteId AND ca.estado IN ('RESERVADO', 'CONFIRMADO')")
    List<ClienteAccesorio> findReservasActivasByClienteId(@Param("clienteId") Long clienteId);
    
    // Buscar reservas activas por accesorio
    @Query("SELECT ca FROM ClienteAccesorio ca WHERE ca.accesorio.id = :accesorioId AND ca.estado IN ('RESERVADO', 'CONFIRMADO')")
    List<ClienteAccesorio> findReservasActivasByAccesorioId(@Param("accesorioId") Long accesorioId);
    
    // Buscar por rango de fechas
    @Query("SELECT ca FROM ClienteAccesorio ca WHERE ca.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
    List<ClienteAccesorio> findByFechaCreacionBetween(@Param("fechaInicio") java.time.LocalDateTime fechaInicio, 
                                                     @Param("fechaFin") java.time.LocalDateTime fechaFin);
}
