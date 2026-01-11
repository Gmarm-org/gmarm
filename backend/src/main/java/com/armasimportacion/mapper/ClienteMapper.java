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
        
        ClienteDTO dto = ClienteDTO.builder()
                .id(cliente.getId())
                .numeroIdentificacion(cliente.getNumeroIdentificacion())
                .nombres(cliente.getNombres())
                .apellidos(cliente.getApellidos())
                .fechaNacimiento(cliente.getFechaNacimiento())
                .direccion(cliente.getDireccion())
                .provincia(cliente.getProvincia())
                .canton(cliente.getCanton())
                .email(cliente.getEmail())
                .emailVerificado(cliente.getEmailVerificado())
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
                .vendedorNombre(cliente.getUsuarioCreador() != null ? cliente.getUsuarioCreador().getNombres() : null)
                .vendedorApellidos(cliente.getUsuarioCreador() != null ? cliente.getUsuarioCreador().getApellidos() : null)
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
                .tipoClienteCodigo(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getCodigo() : null)
                .tipoProcesoNombre(determinarTipoProcesoNombre(cliente))
                // Banderas dinámicas del tipo de cliente
                .tipoClienteEsMilitar(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getEsMilitar() : false)
                .tipoClienteEsPolicia(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getEsPolicia() : false)
                .tipoClienteEsEmpresa(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getEsEmpresa() : false)
                .tipoClienteEsDeportista(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getEsDeportista() : false)
                .tipoClienteEsCivil(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getEsCivil() : false)
                .tipoClienteRequiereIssfa(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getRequiereIssfa() : false)
                .tipoClienteTipoProcesoId(cliente.getTipoCliente() != null ? cliente.getTipoCliente().getTipoProcesoId() : null)
                // OPTIMIZACIÓN CRÍTICA: NO incluir respuestas en el DTO por defecto
                // Las respuestas se cargan por endpoint separado (/api/respuesta-cliente/cliente/{id})
                // Esto evita cargar cientos de miles de respuestas innecesariamente
                .respuestas(null)
                .build();
        
        // Establecer el código ISSFA (para militares) usando el setter
        dto.setCodigoIssfa(cliente.getCodigoIssfa());
        
        // Establecer el código ISSPOL (para policías) usando el setter
        dto.setCodigoIsspol(cliente.getCodigoIsspol());
        
        // Establecer el rango usando el setter
        dto.setRango(cliente.getRango());
        
        return dto;
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
    
    /**
     * Determina el nombre del tipo de proceso basado en banderas dinámicas del tipo de cliente
     */
    private String determinarTipoProcesoNombre(Cliente cliente) {
        if (cliente.getTipoCliente() == null) {
            return "Sin tipo";
        }
        
        // Usar banderas dinámicas en lugar de comparar nombres
        if (cliente.getTipoCliente().esCivil()) {
            return "Cupo Civil";
        } else if (cliente.getTipoCliente().esUniformado()) {
            return "Extracupo Uniformado";
        } else if (cliente.getTipoCliente().esEmpresa()) {
            return "Extracupo Empresa";
        } else if (cliente.getTipoCliente().esDeportista()) {
            return "Cupo Deportista";
        }
        
        return "Sin tipo";
    }
}
