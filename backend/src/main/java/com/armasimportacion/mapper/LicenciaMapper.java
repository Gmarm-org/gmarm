package com.armasimportacion.mapper;

import com.armasimportacion.dto.LicenciaDTO;
import com.armasimportacion.enums.TipoCuentaBancaria;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.repository.CantonRepository;
import com.armasimportacion.repository.ProvinciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class LicenciaMapper {

    private final ProvinciaRepository provinciaRepository;
    private final CantonRepository cantonRepository;

    public LicenciaDTO toDTO(Licencia licencia) {
        if (licencia == null) {
            return null;
        }

        return LicenciaDTO.builder()
                .id(licencia.getId())
                .numero(licencia.getNumero())
                .nombre(licencia.getNombre())
                .titulo(licencia.getTitulo())
                .ruc(licencia.getRuc())
                .cuentaBancaria(licencia.getCuentaBancaria())
                .nombreBanco(licencia.getNombreBanco())
                .tipoCuenta(licencia.getTipoCuenta() != null ? licencia.getTipoCuenta().name() : null)
                .cedulaCuenta(licencia.getCedulaCuenta())
                .email(licencia.getEmail())
                .telefono(licencia.getTelefono())
                .provincia(licencia.getProvincia() != null ? licencia.getProvincia().getNombre() : null)
                .canton(licencia.getCanton() != null ? licencia.getCanton().getNombre() : null)
                .descripcion(licencia.getDescripcion())
                .tipoLicencia("IMPORTACION_ARMAS")
                .estado(licencia.getEstado())
                .estadoOcupacion(licencia.getEstadoOcupacion())
                .observaciones(licencia.getObservaciones())
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
        licencia.setTitulo(dto.getTitulo());
        licencia.setRuc(dto.getRuc());
        licencia.setCuentaBancaria(dto.getCuentaBancaria());
        licencia.setNombreBanco(dto.getNombreBanco());
        licencia.setTipoCuenta(dto.getTipoCuenta() != null && !dto.getTipoCuenta().isEmpty() ? TipoCuentaBancaria.valueOf(dto.getTipoCuenta()) : null);
        licencia.setCedulaCuenta(dto.getCedulaCuenta());
        licencia.setEmail(dto.getEmail());
        licencia.setTelefono(dto.getTelefono());
        
        // Mapear provincia y canton (buscar por nombre, igual que Cliente)
        if (dto.getProvincia() != null && !dto.getProvincia().isEmpty()) {
            provinciaRepository.findByNombre(dto.getProvincia())
                    .ifPresent(licencia::setProvincia);
        }
        if (dto.getCanton() != null && !dto.getCanton().isEmpty()) {
            cantonRepository.findByNombreIgnoreCase(dto.getCanton())
                    .ifPresent(licencia::setCanton);
        }
        
        licencia.setDescripcion(dto.getDescripcion());
        licencia.setObservaciones(dto.getObservaciones());
        // tipoLicencia siempre es IMPORTACION_ARMAS
        if (dto.getEstado() != null) {
            licencia.setEstado(dto.getEstado());
        }
        if (dto.getEstadoOcupacion() != null) {
            licencia.setEstadoOcupacion(dto.getEstadoOcupacion());
        }
        // NOTA: Los cupos se manejan a nivel de Grupo de Importación
        licencia.setFechaVencimiento(dto.getFechaVencimiento());
        licencia.setFechaEmision(dto.getFechaEmision());
        return licencia;
    }
}
