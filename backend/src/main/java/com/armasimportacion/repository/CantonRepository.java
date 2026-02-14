package com.armasimportacion.repository;

import com.armasimportacion.model.Canton;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CantonRepository extends JpaRepository<Canton, Long> {

    List<Canton> findByProvinciaIdAndEstadoTrue(Long provinciaId);

    List<Canton> findByProvinciaCodigoAndEstadoTrue(String provinciaCodigo);

    List<Canton> findByProvinciaNombreAndEstadoTrue(String provinciaNombre);

    // Buscar cantón por nombre (case-insensitive) - evita findAll().stream().filter()
    @Query("SELECT c FROM Canton c WHERE LOWER(c.nombre) = LOWER(:nombre)")
    Optional<Canton> findByNombreIgnoreCase(@Param("nombre") String nombre);
}
