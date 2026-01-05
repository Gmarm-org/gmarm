package com.armasimportacion.repository;

import com.armasimportacion.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    
    /**
     * Busca un token por su valor
     */
    Optional<EmailVerificationToken> findByToken(String token);
    
    /**
     * Busca tokens por cliente
     */
    Optional<EmailVerificationToken> findByClienteId(Long clienteId);
    
    /**
     * Verifica si existe un token válido (no usado y no expirado) para un cliente
     */
    boolean existsByClienteIdAndUsedFalse(Long clienteId);
}

