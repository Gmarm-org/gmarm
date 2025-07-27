package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Búsquedas por identificación
    Optional<Cliente> findByTipoIdentificacionIdAndNumeroIdentificacion(
        Long tipoIdentificacionId, String numeroIdentificacion);

    // Búsquedas por usuario creador
    List<Cliente> findByUsuarioCreadorId(Long usuarioId);
    Page<Cliente> findByUsuarioCreadorId(Long usuarioId, Pageable pageable);

    // Búsquedas por estado
    List<Cliente> findByEstado(EstadoCliente estado);
    Page<Cliente> findByEstado(EstadoCliente estado, Pageable pageable);

    // Búsquedas por tipo de cliente
    List<Cliente> findByTipoClienteId(Long tipoClienteId);
    List<Cliente> findByTipoClienteIdAndEstado(Long tipoClienteId, EstadoCliente estado);

    // Búsquedas por ubicación
    List<Cliente> findByProvincia(String provincia);
    List<Cliente> findByProvinciaAndCanton(String provincia, String canton);

    // Búsquedas por email
    Optional<Cliente> findByEmail(String email);
    boolean existsByEmail(String email);

    // Búsquedas por estado militar
    List<Cliente> findByEstadoMilitar(EstadoMilitar estadoMilitar);

    // Búsquedas por empresa
    List<Cliente> findByRuc(String ruc);
    Optional<Cliente> findByRucAndIdNot(String ruc, Long id);

    // Búsquedas con filtros complejos
    @Query("SELECT c FROM Cliente c WHERE " +
           "(:tipoClienteId IS NULL OR c.tipoCliente.id = :tipoClienteId) AND " +
           "(:estado IS NULL OR c.estado = :estado) AND " +
           "(:usuarioCreadorId IS NULL OR c.usuarioCreador.id = :usuarioCreadorId) AND " +
           "(:provincia IS NULL OR c.provincia = :provincia) AND " +
           "(:email IS NULL OR c.email LIKE %:email%) AND " +
           "(:nombres IS NULL OR c.nombres LIKE %:nombres%)")
    Page<Cliente> findByFiltros(@Param("tipoClienteId") Long tipoClienteId,
                                @Param("estado") EstadoCliente estado,
                                @Param("usuarioCreadorId") Long usuarioCreadorId,
                                @Param("provincia") String provincia,
                                @Param("email") String email,
                                @Param("nombres") String nombres,
                                Pageable pageable);

    // Búsquedas por edad
    @Query("SELECT c FROM Cliente c WHERE c.fechaNacimiento <= :fechaMinima")
    List<Cliente> findByEdadMinima(@Param("fechaMinima") LocalDate fechaMinima);

    // Búsquedas por fecha de creación
    List<Cliente> findByFechaCreacionBetween(LocalDate fechaInicio, LocalDate fechaFin);

    // Verificaciones de existencia
    boolean existsByTipoIdentificacionIdAndNumeroIdentificacion(Long tipoIdentificacionId, String numeroIdentificacion);
    boolean existsByTipoIdentificacionIdAndNumeroIdentificacionAndIdNot(Long tipoIdentificacionId, String numeroIdentificacion, Long id);

    // Estadísticas
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.estado = :estado")
    Long countByEstado(@Param("estado") EstadoCliente estado);

    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.tipoCliente.id = :tipoClienteId")
    Long countByTipoCliente(@Param("tipoClienteId") Long tipoClienteId);

    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId")
    Long countByUsuarioCreador(@Param("usuarioId") Long usuarioId);

    @Query("SELECT c.provincia, COUNT(c) FROM Cliente c GROUP BY c.provincia")
    List<Object[]> countByProvincia();

    // Búsquedas para reportes
    @Query("SELECT c FROM Cliente c WHERE c.fechaCreacion >= :fechaInicio AND c.fechaCreacion <= :fechaFin")
    List<Cliente> findForReport(@Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);
} 