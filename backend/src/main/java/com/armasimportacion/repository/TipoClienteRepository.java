package com.armasimportacion.repository;

import com.armasimportacion.model.TipoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoClienteRepository extends JpaRepository<TipoCliente, Long> {

    // Búsquedas básicas
    Optional<TipoCliente> findByCodigo(String codigo);
    Optional<TipoCliente> findByNombre(String nombre);
    List<TipoCliente> findByEstado(Boolean estado);

    // Búsquedas específicas
    @Query("SELECT tc FROM TipoCliente tc WHERE tc.nombre = 'Empresa Seguridad'")
    Optional<TipoCliente> findEmpresaSeguridad();

    @Query("SELECT tc FROM TipoCliente tc WHERE tc.nombre LIKE '%Militar%' OR tc.nombre LIKE '%Uniformado%'")
    List<TipoCliente> findUniformados();

    @Query("SELECT tc FROM TipoCliente tc WHERE tc.nombre = 'Civil'")
    Optional<TipoCliente> findCivil();

    @Query("SELECT tc FROM TipoCliente tc WHERE tc.nombre = 'Deportista'")
    Optional<TipoCliente> findDeportista();

    // Búsquedas con filtros
    @Query("SELECT tc FROM TipoCliente tc WHERE " +
           "(:nombre IS NULL OR tc.nombre LIKE %:nombre%) AND " +
           "(:codigo IS NULL OR tc.codigo LIKE %:codigo%) AND " +
           "(:estado IS NULL OR tc.estado = :estado)")
    List<TipoCliente> findByFiltros(@Param("nombre") String nombre,
                                    @Param("codigo") String codigo,
                                    @Param("estado") Boolean estado);

    // Verificaciones
    boolean existsByCodigo(String codigo);
    boolean existsByNombre(String nombre);
    boolean existsByCodigoAndIdNot(String codigo, Long id);
    boolean existsByNombreAndIdNot(String nombre, Long id);

    // Estadísticas
    // @Query("SELECT COUNT(tc) FROM TipoCliente tc WHERE tc.estado = :estado")
    // Long countByEstado(@Param("estado") Boolean estado);
}
