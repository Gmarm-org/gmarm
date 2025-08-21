package com.armasimportacion.repository;

import com.armasimportacion.model.ClienteArma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteArmaRepository extends JpaRepository<ClienteArma, Long> {
    
    // Buscar por cliente
    List<ClienteArma> findByClienteId(Long clienteId);
    
    // Buscar por arma
    List<ClienteArma> findByArmaId(Long armaId);
    
    // Buscar por cliente y arma
    Optional<ClienteArma> findByClienteIdAndArmaId(Long clienteId, Long armaId);
    
    // Buscar por estado
    List<ClienteArma> findByEstado(String estado);
    
    // Buscar por cliente y estado
    List<ClienteArma> findByClienteIdAndEstado(Long clienteId, String estado);
    
    // Contar armas por cliente
    @Query("SELECT COUNT(ca) FROM ClienteArma ca WHERE ca.cliente.id = :clienteId")
    Long countByClienteId(@Param("clienteId") Long clienteId);
}
