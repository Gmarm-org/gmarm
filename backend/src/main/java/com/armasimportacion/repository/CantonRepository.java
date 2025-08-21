package com.armasimportacion.repository;

import com.armasimportacion.model.Canton;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CantonRepository extends JpaRepository<Canton, Long> {
    
    List<Canton> findByProvinciaIdAndEstadoTrue(Long provinciaId);
    
    List<Canton> findByProvinciaCodigoAndEstadoTrue(String provinciaCodigo);
    
    List<Canton> findByProvinciaNombreAndEstadoTrue(String provinciaNombre);
}
