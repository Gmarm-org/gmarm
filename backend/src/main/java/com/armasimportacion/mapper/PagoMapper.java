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

        return PagoDTO.builder()
                .id(pago.getId())
                .monto(pago.getMontoTotal())
                .fechaPago(pago.getFechaPago())
                .fechaCreacion(pago.getFechaCreacion())
                .fechaActualizacion(pago.getFechaActualizacion())
                .clienteId(pago.getCliente() != null ? pago.getCliente().getId() : null)
                .clienteNombreCompleto(pago.getCliente() != null ? 
                    pago.getCliente().getNombres() + " " + pago.getCliente().getApellidos() : null)
                .estado(pago.getEstado())
                .build();
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
        pago.setMontoTotal(dto.getMonto());
        pago.setFechaPago(dto.getFechaPago());
        pago.setEstado(dto.getEstado());
        return pago;
    }
}
