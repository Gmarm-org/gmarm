package com.armasimportacion.repository;

import com.armasimportacion.model.ConfiguracionSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionSistemaRepository extends JpaRepository<ConfiguracionSistema, Long> {
    
    Optional<ConfiguracionSistema> findByClave(String clave);
    
    List<ConfiguracionSistema> findByEditableTrue();
    
    boolean existsByClave(String clave);
}
