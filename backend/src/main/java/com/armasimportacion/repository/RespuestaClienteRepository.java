package com.armasimportacion.repository;

import com.armasimportacion.model.RespuestaCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RespuestaClienteRepository extends JpaRepository<RespuestaCliente, Long> {
    
    @Query("SELECT r FROM RespuestaCliente r JOIN FETCH r.pregunta WHERE r.cliente.id = :clienteId")
    List<RespuestaCliente> findByClienteIdWithPregunta(@Param("clienteId") Long clienteId);
    
    List<RespuestaCliente> findByClienteId(Long clienteId);
    
    List<RespuestaCliente> findByPreguntaId(Long preguntaId);
    
    List<RespuestaCliente> findByClienteIdAndPreguntaId(Long clienteId, Long preguntaId);
}
