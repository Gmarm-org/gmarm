package com.armasimportacion.repository;

import com.armasimportacion.enums.TipoRolVendedor;
import com.armasimportacion.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {

    // Búsquedas básicas
    Optional<Rol> findByNombre(String nombre);
    List<Rol> findByEstado(Boolean estado);
    List<Rol> findByTipoRolVendedor(TipoRolVendedor tipoRolVendedor);

    // Búsquedas específicas
    @Query("SELECT r FROM Rol r WHERE r.nombre = 'Vendedor'")
    Optional<Rol> findVendedorRol();

    @Query("SELECT r FROM Rol r WHERE r.nombre = 'Administrador'")
    Optional<Rol> findAdminRol();

    // Búsquedas con filtros
    @Query("SELECT r FROM Rol r WHERE " +
           "(:nombre IS NULL OR r.nombre LIKE %:nombre%) AND " +
           "(:estado IS NULL OR r.estado = :estado) AND " +
           "(:tipoRolVendedor IS NULL OR r.tipoRolVendedor = :tipoRolVendedor)")
    List<Rol> findByFiltros(@Param("nombre") String nombre,
                            @Param("estado") Boolean estado,
                            @Param("tipoRolVendedor") TipoRolVendedor tipoRolVendedor);

    // Verificaciones
    boolean existsByNombre(String nombre);
    boolean existsByNombreAndIdNot(String nombre, Long id);

    // Estadísticas
    // @Query("SELECT COUNT(r) FROM Rol r WHERE r.estado = :estado")
    // Long countByEstado(@Param("estado") Boolean estado);

    @Query("SELECT COUNT(r) FROM Rol r WHERE r.tipoRolVendedor IS NOT NULL")
    Long countVendedorRoles();
} 
