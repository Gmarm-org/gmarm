package com.armasimportacion.repository;

import com.armasimportacion.model.Notificacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoNotificacion;
import com.armasimportacion.enums.TipoNotificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    
    // Búsquedas básicas
    List<Notificacion> findByUsuarioDestinatario(Usuario usuarioDestinatario);
    List<Notificacion> findByEstado(EstadoNotificacion estado);
    List<Notificacion> findByTipo(TipoNotificacion tipo);
    
    // Notificaciones por usuario
    List<Notificacion> findByUsuarioDestinatarioId(Long usuarioId);
    
    // Notificaciones por usuario y estado
    List<Notificacion> findByUsuarioDestinatarioIdAndEstado(Long usuarioId, EstadoNotificacion estado);
    
    // Notificaciones por usuario y tipo
    List<Notificacion> findByUsuarioDestinatarioIdAndTipo(Long usuarioId, TipoNotificacion tipo);
    
    // Notificaciones no leídas
    @Query("SELECT n FROM Notificacion n WHERE n.usuarioDestinatario.id = :usuarioId AND n.estado = 'NO_LEIDA'")
    List<Notificacion> findNoLeidasByUsuarioId(@Param("usuarioId") Long usuarioId);
    
    // Notificaciones por fecha
    List<Notificacion> findByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Contar notificaciones no leídas
    int countByUsuarioDestinatarioIdAndEstado(Long usuarioId, EstadoNotificacion estado);
    
    // Búsquedas con filtros
    @Query("SELECT n FROM Notificacion n WHERE " +
           "(:usuarioId IS NULL OR n.usuarioDestinatario.id = :usuarioId) AND " +
           "(:estado IS NULL OR n.estado = :estado) AND " +
           "(:tipo IS NULL OR n.tipo = :tipo) AND " +
           "(:fechaInicio IS NULL OR n.fechaCreacion >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR n.fechaCreacion <= :fechaFin)")
    Page<Notificacion> findWithFilters(
            @Param("usuarioId") Long usuarioId,
            @Param("estado") EstadoNotificacion estado,
            @Param("tipo") TipoNotificacion tipo,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable);
    
    // Notificaciones recientes
    @Query("SELECT n FROM Notificacion n WHERE n.usuarioDestinatario.id = :usuarioId ORDER BY n.fechaCreacion DESC")
    List<Notificacion> findRecientesByUsuarioId(@Param("usuarioId") Long usuarioId, Pageable pageable);
    
    // Estadísticas
    @Query("SELECT n.estado, COUNT(n) FROM Notificacion n GROUP BY n.estado")
    List<Object[]> countByEstado();
    
    @Query("SELECT n.tipo, COUNT(n) FROM Notificacion n GROUP BY n.tipo")
    List<Object[]> countByTipo();
} 
