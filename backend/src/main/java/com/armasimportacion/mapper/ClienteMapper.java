package com.armasimportacion.mapper;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.dto.RespuestaClienteDTO;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.RespuestaCliente;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ClienteMapper {
    
    public ClienteDTO toDTO(Cliente cliente) {
        if (cliente == null) {
            return null;
        }
        
        return ClienteDTO.builder()
                .id(cliente.getId())
                .numeroIdentificacion(cliente.getNumeroIdentificacion())
                .nombres(cliente.getNombres())
                .apellidos(cliente.getApellidos())
                .fechaNacimiento(cliente.getFechaNacimiento())
                .direccion(cliente.getDireccion())
                .provincia(cliente.getProvincia())
                .canton(cliente.getCanton())
                .email(cliente.getEmail())
                .telefonoPrincipal(cliente.getTelefonoPrincipal())
                .telefonoSecundario(cliente.getTelefonoSecundario())
                .representanteLegal(cliente.getRepresentanteLegal())
                .ruc(cliente.getRuc())
                .nombreEmpresa(cliente.getNombreEmpresa())
                .direccionFiscal(cliente.getDireccionFiscal())
                .telefonoReferencia(cliente.getTelefonoReferencia())
                .correoEmpresa(cliente.getCorreoEmpresa())
                .provinciaEmpresa(cliente.getProvinciaEmpresa())
                .cantonEmpresa(cliente.getCantonEmpresa())
                .estadoMilitar(cliente.getEstadoMilitar())
                .usuarioCreadorId(cliente.getUsuarioCreador() != null ? cliente.getUsuarioCreador().getId() : null)
                .fechaCreacion(cliente.getFechaCreacion())
                .fechaActualizacion(cliente.getFechaActualizacion())
                .estado(cliente.getEstado())
                .procesoCompletado(cliente.getProcesoCompletado())
                .aprobadoPorJefeVentas(cliente.getAprobadoPorJefeVentas())
                .fechaAprobacion(cliente.getFechaAprobacion())
                .motivoRechazo(cliente.getMotivoRechazo())
                .fechaRechazo(cliente.getFechaRechazo())
                .tipoIdentificacionId(cliente.getTipoIdentificacion() != null ? cliente.getTipoIdentificacion().getId() : null)
                .tipoIdentificacionNombre(cliente.getTipoIdentificacion() != null ? cliente.getTipoIdentificacion().getNombre() : null)
                .tipoClienteId(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getId() : null)
                .tipoClienteNombre(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getNombre() : null)
                .respuestas(mapRespuestasToDTO(cliente.getRespuestas()))
                .build();
    }
    
    public List<ClienteDTO> toDTOList(List<Cliente> clientes) {
        if (clientes == null) {
            return null;
        }
        
        return clientes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    private List<RespuestaClienteDTO> mapRespuestasToDTO(List<RespuestaCliente> respuestas) {
        if (respuestas == null) {
            return null;
        }
        
        return respuestas.stream()
                .map(this::mapRespuestaToDTO)
                .collect(Collectors.toList());
    }
    
    private RespuestaClienteDTO mapRespuestaToDTO(RespuestaCliente respuesta) {
        if (respuesta == null) {
            return null;
        }
        
        return RespuestaClienteDTO.builder()
                .id(respuesta.getId())
                .preguntaId(respuesta.getPregunta() != null ? respuesta.getPregunta().getId() : null)
                .preguntaTexto(respuesta.getPregunta() != null ? respuesta.getPregunta().getPregunta() : null)
                .respuesta(respuesta.getRespuesta())
                .fechaRespuesta(respuesta.getFechaRespuesta())
                .obligatoria(respuesta.getPregunta() != null ? respuesta.getPregunta().getObligatoria() : null)
                .orden(respuesta.getPregunta() != null ? respuesta.getPregunta().getOrden() : null)
                .build();
    }
}
