package com.armasimportacion.repository;

import com.armasimportacion.model.Provincia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProvinciaRepository extends JpaRepository<Provincia, Long> {
    
    List<Provincia> findByEstadoTrue();
    
    Optional<Provincia> findByCodigo(String codigo);
    
    Optional<Provincia> findByNombre(String nombre);
}
