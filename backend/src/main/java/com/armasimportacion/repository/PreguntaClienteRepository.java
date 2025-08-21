package com.armasimportacion.repository;

import com.armasimportacion.model.PreguntaCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PreguntaClienteRepository extends JpaRepository<PreguntaCliente, Long> {
    
    List<PreguntaCliente> findByTipoProcesoIdAndEstado(Long tipoProcesoId, Boolean estado);
    
    List<PreguntaCliente> findByEstado(Boolean estado);
}
