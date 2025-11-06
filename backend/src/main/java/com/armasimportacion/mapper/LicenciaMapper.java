package com.armasimportacion.mapper;

import com.armasimportacion.dto.LicenciaDTO;
import com.armasimportacion.model.Licencia;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class LicenciaMapper {

    public LicenciaDTO toDTO(Licencia licencia) {
        if (licencia == null) {
            return null;
        }

        return LicenciaDTO.builder()
                .id(licencia.getId())
                .numero(licencia.getNumero())
                .nombre(licencia.getNombre())
                .ruc(licencia.getRuc())
                .cuentaBancaria(licencia.getCuentaBancaria())
                .nombreBanco(licencia.getNombreBanco())
                .tipoCuenta(licencia.getTipoCuenta())
                .cedulaCuenta(licencia.getCedulaCuenta())
                .email(licencia.getEmail())
                .telefono(licencia.getTelefono())
                .descripcion(licencia.getDescripcion())
                .tipoLicencia("IMPORTACION_ARMAS")
                .estado(licencia.getEstado())
                .estadoOcupacion(licencia.getEstadoOcupacion())
                .observaciones(licencia.getObservaciones())
                .cupoTotal(licencia.getCupoTotal())
                .cupoDisponible(licencia.getCupoDisponible())
                .cupoCivil(licencia.getCupoCivil())
                .cupoMilitar(licencia.getCupoMilitar())
                .cupoEmpresa(licencia.getCupoEmpresa())
                .cupoDeportista(licencia.getCupoDeportista())
                .fechaVencimiento(licencia.getFechaVencimiento())
                .fechaEmision(licencia.getFechaEmision())
                .fechaCreacion(licencia.getFechaCreacion())
                .fechaActualizacion(licencia.getFechaActualizacion())
                .build();
    }

    public List<LicenciaDTO> toDTOList(List<Licencia> licencias) {
        if (licencias == null) {
            return null;
        }

        return licencias.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Licencia toEntity(LicenciaDTO dto) {
        if (dto == null) {
            return null;
        }

        Licencia licencia = new Licencia();
        licencia.setId(dto.getId());
        licencia.setNumero(dto.getNumero());
        licencia.setNombre(dto.getNombre());
        licencia.setRuc(dto.getRuc());
        licencia.setCuentaBancaria(dto.getCuentaBancaria());
        licencia.setNombreBanco(dto.getNombreBanco());
        licencia.setTipoCuenta(dto.getTipoCuenta());
        licencia.setCedulaCuenta(dto.getCedulaCuenta());
        licencia.setEmail(dto.getEmail());
        licencia.setTelefono(dto.getTelefono());
        licencia.setDescripcion(dto.getDescripcion());
        licencia.setObservaciones(dto.getObservaciones());
        // tipoLicencia siempre es IMPORTACION_ARMAS
        if (dto.getEstado() != null) {
            licencia.setEstado(dto.getEstado());
        }
        if (dto.getEstadoOcupacion() != null) {
            licencia.setEstadoOcupacion(dto.getEstadoOcupacion());
        }
        licencia.setCupoTotal(dto.getCupoTotal());
        licencia.setCupoDisponible(dto.getCupoDisponible());
        licencia.setCupoCivil(dto.getCupoCivil());
        licencia.setCupoMilitar(dto.getCupoMilitar());
        licencia.setCupoEmpresa(dto.getCupoEmpresa());
        licencia.setCupoDeportista(dto.getCupoDeportista());
        licencia.setFechaVencimiento(dto.getFechaVencimiento());
        licencia.setFechaEmision(dto.getFechaEmision());
        return licencia;
    }
}
