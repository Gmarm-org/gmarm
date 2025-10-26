package com.armasimportacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteCompletoCreateDTO {
    
    // Datos del cliente
    private ClienteCreateDTO cliente;
    
    // Datos del pago
    private PagoCreateDTO pago;
    
    // Datos de la arma
    private ClienteArmaCreateDTO arma;
    
    // Respuestas del cliente
    private List<RespuestaClienteCreateDTO> respuestas;
    
    // Cuotas de pago (si es crédito)
    private List<CuotaPagoCreateDTO> cuotas;
    
    // Datos del documento
    private DocumentoClienteCreateDTO documento;
}
