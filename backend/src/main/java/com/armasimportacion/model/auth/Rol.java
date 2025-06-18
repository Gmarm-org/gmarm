package com.armasimportacion.model.auth;

import lombok.Data;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "rol", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"nombre"})
})
public class Rol {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    // Si usas PostgreSQL con tipo JSONB
    @Column(columnDefinition = "jsonb")
    private String permisos;

    private Boolean estado = true;

    @ManyToMany(mappedBy = "roles")
    private Set<Usuario> usuarios = new HashSet<>();

    public Rol(String nombre) {
        this.nombre = nombre;
    }
}