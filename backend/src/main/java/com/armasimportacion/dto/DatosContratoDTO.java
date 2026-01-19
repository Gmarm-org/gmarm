package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatosContratoDTO {
    private ClienteDTO cliente;
    private PagoDTO pago;
    private List<ArmaDTO> armas;
    private Boolean documentosCompletos;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClienteDTO {
        private Long id;
        private String nombres;
        private String apellidos;
        private String numeroIdentificacion;
        private String email;
        private String telefonoPrincipal;
        private String direccion;
        private String provincia;
        private String canton;
        private Boolean emailVerificado;
        private Boolean tipoClienteEsCivil;
        private Boolean tipoClienteEsMilitar;
        private Boolean tipoClienteEsPolicia;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PagoDTO {
        private Long id;
        private BigDecimal montoTotal;
        private String tipoPago;
        private Integer numeroCuotas;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArmaDTO {
        private Long id;
        private String nombre;
        private BigDecimal precioUnitario;
        private Integer cantidad;
    }
}

