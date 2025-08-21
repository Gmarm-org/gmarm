package com.armasimportacion.repository;

import com.armasimportacion.enums.EstadoUsuario;
import com.armasimportacion.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Búsquedas por credenciales
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByUsernameOrEmail(String username, String email);

    // Búsquedas por estado
    List<Usuario> findByEstado(EstadoUsuario estado);
    List<Usuario> findByEstadoAndBloqueado(EstadoUsuario estado, Boolean bloqueado);

    // Búsquedas por roles
    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre = :rolNombre")
    List<Usuario> findByRolNombre(@Param("rolNombre") String rolNombre);

    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre = :rolNombre AND u.estado = :estado")
    List<Usuario> findByRolNombreAndEstado(@Param("rolNombre") String rolNombre, @Param("estado") EstadoUsuario estado);

    // Búsquedas por vendedor
    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre = 'Vendedor' AND u.estado = 'ACTIVO'")
    List<Usuario> findVendedoresActivos();

    // Búsquedas con filtros
    @Query("SELECT u FROM Usuario u WHERE " +
           "(:username IS NULL OR u.username LIKE %:username%) AND " +
           "(:email IS NULL OR u.email LIKE %:email%) AND " +
           "(:nombres IS NULL OR u.nombres LIKE %:nombres%) AND " +
           "(:estado IS NULL OR u.estado = :estado)")
    List<Usuario> findByFiltros(@Param("username") String username,
                                @Param("email") String email,
                                @Param("nombres") String nombres,
                                @Param("estado") EstadoUsuario estado);

    // Verificaciones de existencia
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);

    // Búsquedas por intentos de login
    List<Usuario> findByIntentosLoginGreaterThanAndBloqueado(Integer intentos, Boolean bloqueado);

    // Búsquedas por último login
    @Query("SELECT u FROM Usuario u WHERE u.ultimoLogin IS NOT NULL ORDER BY u.ultimoLogin DESC")
    List<Usuario> findOrderByUltimoLoginDesc();

    // Estadísticas
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.estado = :estado")
    Long countByEstado(@Param("estado") EstadoUsuario estado);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.bloqueado = :bloqueado")
    Long countByBloqueado(@Param("bloqueado") Boolean bloqueado);

    // Búsquedas por rol específico
    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre = :nombreRol")
    List<Usuario> findByRolesNombre(@Param("nombreRol") String nombreRol);
    
    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre IN :nombresRoles")
    List<Usuario> findByRolesNombreIn(@Param("nombresRoles") List<String> nombresRoles);
} 
