package com.armasimportacion.repository;

import com.armasimportacion.model.ClienteArma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la relación cliente-arma
 * Reemplaza a AsignacionArmaRepository para mantener consistencia
 */
@Repository
public interface ClienteArmaRepository extends JpaRepository<ClienteArma, Long> {

    // Buscar por cliente
    List<ClienteArma> findByClienteId(Long clienteId);
    
    // Buscar por arma
    List<ClienteArma> findByArmaId(Long armaId);
    
    // Buscar por estado
    List<ClienteArma> findByEstado(ClienteArma.EstadoClienteArma estado);
    
    // Buscar por estado y sin número de serie
    @Query("SELECT ca FROM ClienteArma ca WHERE ca.estado = :estado AND ca.numeroSerie IS NULL")
    List<ClienteArma> findByEstadoAndNumeroSerieIsNull(@Param("estado") ClienteArma.EstadoClienteArma estado);
    
    // Buscar por cliente y estado
    List<ClienteArma> findByClienteIdAndEstado(Long clienteId, ClienteArma.EstadoClienteArma estado);
    
    // Buscar por arma y estado
    List<ClienteArma> findByArmaIdAndEstado(Long armaId, ClienteArma.EstadoClienteArma estado);
    
    // Buscar por cliente y arma
    Optional<ClienteArma> findByClienteIdAndArmaId(Long clienteId, Long armaId);
    
    // Verificar si existe una relación cliente-arma
    boolean existsByClienteIdAndArmaId(Long clienteId, Long armaId);
    
    // Verificar si existe un número de serie
    boolean existsByNumeroSerie(String numeroSerie);
    
    // Contar por cliente
    long countByClienteId(Long clienteId);
    
    // Contar por arma
    long countByArmaId(Long armaId);
    
    // Contar por estado
    long countByEstado(ClienteArma.EstadoClienteArma estado);
    
    // Buscar reservas activas por cliente
    @Query("SELECT ca FROM ClienteArma ca WHERE ca.cliente.id = :clienteId AND ca.estado IN ('RESERVADA', 'ASIGNADA')")
    List<ClienteArma> findReservasActivasByClienteId(@Param("clienteId") Long clienteId);
    
    // Buscar reservas activas por arma
    @Query("SELECT ca FROM ClienteArma ca WHERE ca.arma.id = :armaId AND ca.estado IN ('RESERVADA', 'ASIGNADA')")
    List<ClienteArma> findReservasActivasByArmaId(@Param("armaId") Long armaId);
    
    // Buscar por rango de fechas
    @Query("SELECT ca FROM ClienteArma ca WHERE ca.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
    List<ClienteArma> findByFechaCreacionBetween(@Param("fechaInicio") java.time.LocalDateTime fechaInicio, 
                                                @Param("fechaFin") java.time.LocalDateTime fechaFin);
}
