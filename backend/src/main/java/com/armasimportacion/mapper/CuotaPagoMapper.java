package com.armasimportacion.mapper;

import com.armasimportacion.dto.CuotaPagoDTO;
import com.armasimportacion.dto.CuotaPagoCreateDTO;
import com.armasimportacion.model.CuotaPago;
import com.armasimportacion.model.Pago;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoCuotaPago;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CuotaPagoMapper {

    public CuotaPagoDTO toDTO(CuotaPago cuotaPago) {
        if (cuotaPago == null) {
            return null;
        }

        CuotaPagoDTO dto = new CuotaPagoDTO();
        dto.setId(cuotaPago.getId());
        dto.setPagoId(cuotaPago.getPago() != null ? cuotaPago.getPago().getId() : null);
        dto.setNumeroCuota(cuotaPago.getNumeroCuota());
        dto.setMonto(cuotaPago.getMonto());
        dto.setFechaVencimiento(cuotaPago.getFechaVencimiento());
        dto.setEstado(cuotaPago.getEstado());
        dto.setFechaPago(cuotaPago.getFechaPago());
        dto.setReferenciaPago(cuotaPago.getReferenciaPago());
        dto.setUsuarioConfirmadorId(cuotaPago.getUsuarioConfirmador() != null ? 
            cuotaPago.getUsuarioConfirmador().getId() : null);
        dto.setUsuarioConfirmadorNombre(cuotaPago.getUsuarioConfirmador() != null ? 
            cuotaPago.getUsuarioConfirmador().getNombres() + " " + cuotaPago.getUsuarioConfirmador().getApellidos() : null);
        dto.setFechaCreacion(cuotaPago.getFechaCreacion());
        dto.setFechaActualizacion(cuotaPago.getFechaActualizacion());
        
        return dto;
    }

    public List<CuotaPagoDTO> toDTOList(List<CuotaPago> cuotasPago) {
        if (cuotasPago == null) {
            return null;
        }

        return cuotasPago.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CuotaPago toEntity(CuotaPagoDTO dto) {
        if (dto == null) {
            return null;
        }

        CuotaPago cuotaPago = new CuotaPago();
        cuotaPago.setId(dto.getId());
        cuotaPago.setNumeroCuota(dto.getNumeroCuota());
        cuotaPago.setMonto(dto.getMonto());
        cuotaPago.setFechaVencimiento(dto.getFechaVencimiento());
        cuotaPago.setEstado(dto.getEstado());
        cuotaPago.setFechaPago(dto.getFechaPago());
        cuotaPago.setReferenciaPago(dto.getReferenciaPago());
        cuotaPago.setFechaCreacion(dto.getFechaCreacion());
        cuotaPago.setFechaActualizacion(dto.getFechaActualizacion());
        
        return cuotaPago;
    }

    public CuotaPago toEntity(CuotaPagoCreateDTO dto) {
        if (dto == null) {
            return null;
        }

        CuotaPago cuotaPago = new CuotaPago();
        
        // Crear pago con solo el ID
        Pago pago = new Pago();
        pago.setId(dto.getPagoId());
        cuotaPago.setPago(pago);
        
        cuotaPago.setNumeroCuota(dto.getNumeroCuota());
        cuotaPago.setMonto(dto.getMonto());
        cuotaPago.setFechaVencimiento(dto.getFechaVencimiento());
        cuotaPago.setReferenciaPago(dto.getReferenciaPago());
        cuotaPago.setEstado(EstadoCuotaPago.PENDIENTE);
        
        // Si hay usuario confirmador, crear con solo el ID
        if (dto.getUsuarioConfirmadorId() != null) {
            Usuario usuario = new Usuario();
            usuario.setId(dto.getUsuarioConfirmadorId());
            cuotaPago.setUsuarioConfirmador(usuario);
        }
        
        return cuotaPago;
    }
}
