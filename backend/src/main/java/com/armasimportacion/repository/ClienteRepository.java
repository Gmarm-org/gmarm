package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    List<Cliente> findByUsuarioCreadorId(Long usuarioId);
    
    @EntityGraph(attributePaths = {"usuarioCreador", "tipoCliente", "tipoIdentificacion"})
    @Query("SELECT c FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId")
    Page<Cliente> findByUsuarioCreadorId(@Param("usuarioId") Long usuarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"usuarioCreador", "tipoCliente", "tipoIdentificacion"})
    @Query("SELECT c FROM Cliente c")
    Page<Cliente> findAllWithUsuarioCreador(Pageable pageable);

    // Búsquedas por estado
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    List<Cliente> findByEstado(EstadoCliente estado);
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    Page<Cliente> findByEstado(EstadoCliente estado, Pageable pageable);

    // Búsquedas por tipo de cliente
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    List<Cliente> findByTipoClienteId(Long tipoClienteId);
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
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
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
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
    boolean existsByNumeroIdentificacion(String numeroIdentificacion);
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    Optional<Cliente> findByNumeroIdentificacion(String numeroIdentificacion);

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
    
    // Métodos para Jefe de Ventas
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion", "usuarioCreador"})
    @Query("SELECT c FROM Cliente c WHERE c.estado = :estado AND c.usuarioCreador.nombres LIKE %:vendedor%")
    Page<Cliente> findByEstadoAndUsuarioCreadorNombreContainingIgnoreCase(@Param("estado") EstadoCliente estado,
                                                                         @Param("vendedor") String vendedor,
                                                                         Pageable pageable);

    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion", "usuarioCreador"})
    @Query("SELECT c FROM Cliente c WHERE c.usuarioCreador.nombres LIKE %:vendedor%")
    Page<Cliente> findByUsuarioCreadorNombreContainingIgnoreCase(@Param("vendedor") String vendedor, Pageable pageable);
    
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    List<Cliente> findByEstadoAndProcesoCompletadoTrue(EstadoCliente estado);
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    List<Cliente> findByEstadoAndProcesoCompletadoFalse(EstadoCliente estado);
    
    // Métodos de conteo para estadísticas
    Long countByAprobadoPorJefeVentasTrue();
    Long countByAprobadoPorJefeVentasFalseAndEstado(EstadoCliente estado);
    Long countByAprobadoPorJefeVentasFalseAndMotivoRechazoIsNotNull();
    
    @Query("SELECT c.estado, COUNT(c) FROM Cliente c GROUP BY c.estado")
    List<Object[]> getEstadisticasPorEstado();
    
    @Query("SELECT c.usuarioCreador.nombres, COUNT(c) FROM Cliente c GROUP BY c.usuarioCreador.nombres")
    List<Object[]> getEstadisticasPorVendedor();
    
    // Métodos adicionales para estadísticas de vendedor
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId AND c.estado = :estado")
    Long countByUsuarioCreadorAndEstado(@Param("usuarioId") Long usuarioId, @Param("estado") EstadoCliente estado);
    
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId AND c.procesoCompletado = true")
    Long countByUsuarioCreadorAndProcesoCompletadoTrue(@Param("usuarioId") Long usuarioId);
    
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId AND c.procesoCompletado = false")
    Long countByUsuarioCreadorAndProcesoCompletadoFalse(@Param("usuarioId") Long usuarioId);
    
    // Buscar cliente fantasma del vendedor (para armas sin cliente)
    @EntityGraph(attributePaths = {"tipoCliente", "tipoIdentificacion"})
    @Query("SELECT c FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId AND c.estado = :estado ORDER BY c.fechaCreacion ASC")
    List<Cliente> findByUsuarioCreadorIdAndEstado(@Param("usuarioId") Long usuarioId, @Param("estado") EstadoCliente estado);
    
    // Buscar el primer cliente fantasma del vendedor (el más antiguo)
    @Query("SELECT c FROM Cliente c WHERE c.usuarioCreador.id = :usuarioId AND c.estado = :estado ORDER BY c.fechaCreacion ASC")
    Optional<Cliente> findFirstByUsuarioCreadorIdAndEstadoOrderByFechaCreacionAsc(@Param("usuarioId") Long usuarioId, @Param("estado") EstadoCliente estado);

    // ==================== QUERIES OPTIMIZADAS (N+1 FIX) ====================

    @EntityGraph(attributePaths = {"tipoIdentificacion", "tipoCliente"})
    @Query("SELECT c FROM Cliente c WHERE c.id = :id")
    Optional<Cliente> findByIdWithRelations(@Param("id") Long id);

    @EntityGraph(attributePaths = {"documentos", "respuestas", "armas", "usuarioCreador", "tipoCliente", "tipoIdentificacion"})
    @Query("SELECT c FROM Cliente c WHERE c.id = :id")
    Optional<Cliente> findByIdWithCollections(@Param("id") Long id);

    @EntityGraph(attributePaths = {"usuarioCreador", "tipoCliente", "tipoIdentificacion"})
    @Query("SELECT c FROM Cliente c WHERE c.estado = :estado")
    List<Cliente> findByEstadoWithRelations(@Param("estado") EstadoCliente estado);

    @EntityGraph(attributePaths = {"usuarioCreador", "tipoCliente", "tipoIdentificacion"})
    List<Cliente> findWithRelationsByUsuarioCreadorId(Long usuarioCreadorId);

    @Query("SELECT c FROM Cliente c LEFT JOIN FETCH c.tipoCliente LEFT JOIN FETCH c.tipoIdentificacion " +
           "WHERE c.id NOT IN (SELECT cgi.cliente.id FROM ClienteGrupoImportacion cgi WHERE cgi.estado NOT IN ('COMPLETADO','CANCELADO')) " +
           "AND c.id NOT IN (SELECT ca.cliente.id FROM ClienteArma ca WHERE ca.estado = 'ASIGNADA')")
    List<Cliente> findClientesDisponiblesParaGrupo();

    // ==================== MÉTODOS PARA DASHBOARD JEFE DE VENTAS ====================
    // TODO: Oculto temporalmente - revisar criterios de filtrado antes de habilitar

    /*
    // Contar clientes creados hoy (native query para usar DATE())
    @Query(value = "SELECT COUNT(*) FROM cliente WHERE DATE(fecha_creacion) = CURRENT_DATE", nativeQuery = true)
    Long countClientesDeHoy();

    // Contar clientes con email verificado que NO tienen contrato generado
    @Query(value = "SELECT COUNT(*) FROM cliente c " +
                   "WHERE c.email_verificado = true " +
                   "AND NOT EXISTS (SELECT 1 FROM documento_generado dg WHERE dg.cliente_id = c.id AND dg.tipo_documento = 'CONTRATO')",
           nativeQuery = true)
    Long countClientesPendientesContrato();

    // Obtener clientes creados hoy (native query para usar DATE())
    @Query(value = "SELECT * FROM cliente WHERE DATE(fecha_creacion) = CURRENT_DATE ORDER BY fecha_creacion DESC", nativeQuery = true)
    List<Cliente> findClientesDeHoy();

    // Obtener clientes con email verificado que NO tienen contrato generado
    @Query(value = "SELECT * FROM cliente c " +
                   "WHERE c.email_verificado = true " +
                   "AND NOT EXISTS (SELECT 1 FROM documento_generado dg WHERE dg.cliente_id = c.id AND dg.tipo_documento = 'CONTRATO') " +
                   "ORDER BY c.fecha_creacion DESC",
           nativeQuery = true)
    List<Cliente> findClientesPendientesContrato();
    */
} 
