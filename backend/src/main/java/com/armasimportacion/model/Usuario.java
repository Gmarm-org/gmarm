package com.armasimportacion.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "foto", length = 255)
    private String foto;

    @Column(name = "telefono_principal", nullable = false, length = 10)
    private String telefonoPrincipal;

    @Column(name = "telefono_secundario", length = 10)
    private String telefonoSecundario;

    @Column(name = "direccion", nullable = false, length = 255)
    private String direccion;

    @CreatedDate
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoUsuario estado = EstadoUsuario.ACTIVO;

    @Column(name = "intentos_login", nullable = false)
    private Integer intentosLogin = 0;

    @Column(name = "ultimo_intento")
    private LocalDateTime ultimoIntento;

    @Column(name = "bloqueado", nullable = false)
    private Boolean bloqueado = false;

    @LastModifiedDate
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Relaciones
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "usuario_rol",
        joinColumns = @JoinColumn(name = "usuario_id"),
        inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles = new HashSet<>();

    // Métodos de utilidad
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }

    public boolean tieneRol(String nombreRol) {
        return roles.stream()
                .anyMatch(rol -> rol.getNombre().equals(nombreRol));
    }

    public boolean esVendedor() {
        return tieneRol("Vendedor");
    }

    public boolean esAdmin() {
        return tieneRol("Administrador");
    }

    public void incrementarIntentosLogin() {
        this.intentosLogin++;
        this.ultimoIntento = LocalDateTime.now();
    }

    public void resetearIntentosLogin() {
        this.intentosLogin = 0;
        this.ultimoIntento = null;
        this.bloqueado = false;
    }
} 