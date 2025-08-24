package com.armasimportacion.mapper;

import com.armasimportacion.dto.PagoDTO;
import com.armasimportacion.model.Pago;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PagoMapper {

    public PagoDTO toDTO(Pago pago) {
        if (pago == null) {
            return null;
        }

        PagoDTO dto = new PagoDTO();
        dto.setId(pago.getId());
        dto.setClienteId(pago.getCliente() != null ? pago.getCliente().getId() : null);
        dto.setClienteNombre(pago.getCliente() != null ? 
            pago.getCliente().getNombres() + " " + pago.getCliente().getApellidos() : null);
        dto.setClienteIdentificacion(pago.getCliente() != null ? 
            pago.getCliente().getNumeroIdentificacion() : null);
        dto.setMontoTotal(pago.getMontoTotal());
        dto.setTipoPago(pago.getTipoPago());
        dto.setNumeroCuotas(pago.getNumeroCuotas());
        dto.setMontoCuota(pago.getMontoCuota());
        dto.setEstado(pago.getEstado());
        dto.setMontoPagado(pago.getMontoPagado());
        dto.setMontoPendiente(pago.getMontoPendiente());
        dto.setCuotaActual(pago.getCuotaActual());
        dto.setFechaCreacion(pago.getFechaCreacion());
        dto.setFechaActualizacion(pago.getFechaActualizacion());
        
        return dto;
    }

    public List<PagoDTO> toDTOList(List<Pago> pagos) {
        if (pagos == null) {
            return null;
        }

        return pagos.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Pago toEntity(PagoDTO dto) {
        if (dto == null) {
            return null;
        }

        Pago pago = new Pago();
        pago.setId(dto.getId());
        pago.setMontoTotal(dto.getMontoTotal());
        pago.setTipoPago(dto.getTipoPago());
        pago.setNumeroCuotas(dto.getNumeroCuotas());
        pago.setMontoCuota(dto.getMontoCuota());
        pago.setEstado(dto.getEstado());
        pago.setMontoPagado(dto.getMontoPagado());
        pago.setMontoPendiente(dto.getMontoPendiente());
        pago.setCuotaActual(dto.getCuotaActual());
        pago.setFechaCreacion(dto.getFechaCreacion());
        pago.setFechaActualizacion(dto.getFechaActualizacion());
        
        return pago;
    }
}
