package com.armasimportacion.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "licencia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Licencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false, unique = true)
    private String numero;

    @Column(length = 255, nullable = false)
    private String nombre;

    @Column(length = 13, nullable = false)
    private String ruc;

    @Column(name = "cuenta_bancaria", length = 30, nullable = false)
    private String cuentaBancaria;

    @Column(name = "nombre_banco", length = 255, nullable = false)
    private String nombreBanco;

    @Column(name = "tipo_cuenta", length = 255, nullable = false)
    private String tipoCuenta;

    @Column(name = "cedula_cuenta", length = 255, nullable = false)
    private String cedulaCuenta;

    @Column(length = 255, nullable = false)
    private String email;

    @Column(length = 10, nullable = false)
    private String telefono;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(length = 20, nullable = false)
    private String estado = "ACTIVA";
}
