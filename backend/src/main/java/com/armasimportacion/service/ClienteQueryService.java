package com.armasimportacion.service;

import com.armasimportacion.dto.ClienteDTO;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.mapper.ClienteMapper;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Pago;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio de consultas de clientes.
 * Centraliza todas las búsquedas, filtros, estadísticas y conversiones a DTO.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class ClienteQueryService {

    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;
    private final PagoRepository pagoRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoImportacionRepository;
    private final DocumentoClienteService documentoClienteService;
    private final ClienteArmaService clienteArmaService;

    // ===== BÚSQUEDAS POR ENTIDAD =====

    public List<Cliente> findByUsuarioCreador(Long usuarioId) {
        return clienteRepository.findByUsuarioCreadorId(usuarioId);
    }

    public Page<Cliente> findByUsuarioCreador(Long usuarioId, Pageable pageable) {
        return clienteRepository.findByUsuarioCreadorId(usuarioId, pageable);
    }

    public List<Cliente> findByEstado(EstadoCliente estado) {
        return clienteRepository.findByEstado(estado);
    }

    public List<Cliente> findByTipoCliente(Long tipoClienteId) {
        return clienteRepository.findByTipoClienteId(tipoClienteId);
    }

    public List<Cliente> findByProvincia(String provincia) {
        return clienteRepository.findByProvincia(provincia);
    }

    public List<Cliente> findByProvinciaAndCanton(String provincia, String canton) {
        return clienteRepository.findByProvinciaAndCanton(provincia, canton);
    }

    public List<Cliente> findByEstadoMilitar(EstadoMilitar estadoMilitar) {
        return clienteRepository.findByEstadoMilitar(estadoMilitar);
    }

    public Page<Cliente> findByFiltros(Long tipoClienteId, EstadoCliente estado,
                                       Long usuarioCreadorId, String provincia,
                                       String email, String nombres, Pageable pageable) {
        return clienteRepository.findByFiltros(tipoClienteId, estado, usuarioCreadorId,
                                               provincia, email, nombres, pageable);
    }

    // ===== MÉTODOS PARA JEFE DE VENTAS =====

    public Page<Cliente> findAllForJefeVentas(EstadoCliente estado, String vendedor, Pageable pageable) {
        if (estado != null && vendedor != null && !vendedor.trim().isEmpty()) {
            return clienteRepository.findByEstadoAndUsuarioCreadorNombreContainingIgnoreCase(estado, vendedor, pageable);
        } else if (estado != null) {
            return clienteRepository.findByEstado(estado, pageable);
        } else if (vendedor != null && !vendedor.trim().isEmpty()) {
            return clienteRepository.findByUsuarioCreadorNombreContainingIgnoreCase(vendedor, pageable);
        } else {
            return clienteRepository.findAll(pageable);
        }
    }

    public List<Cliente> findClientesAprobados() {
        return clienteRepository.findByEstadoAndProcesoCompletadoTrue(EstadoCliente.ACTIVO);
    }

    public List<Cliente> findClientesPendientesAprobacion() {
        return clienteRepository.findByEstadoAndProcesoCompletadoFalse(EstadoCliente.ACTIVO);
    }

    public Map<String, Object> getDetalleCompleto(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + clienteId));
        Map<String, Object> detalle = new HashMap<>();

        detalle.put("cliente", cliente);
        detalle.put("documentos", cliente.getDocumentos());
        detalle.put("respuestas", cliente.getRespuestas());
        detalle.put("asignacionesArma", cliente.getAsignacionesArma());
        detalle.put("asignacionesAccesorio", cliente.getAsignacionesAccesorio());

        return detalle;
    }

    // ===== ESTADÍSTICAS =====

    public Long countByEstado(EstadoCliente estado) {
        return clienteRepository.countByEstado(estado);
    }

    public Long countByTipoCliente(Long tipoClienteId) {
        return clienteRepository.countByTipoCliente(tipoClienteId);
    }

    public Long countByUsuarioCreador(Long usuarioId) {
        return clienteRepository.countByUsuarioCreador(usuarioId);
    }

    public List<Object[]> getEstadisticasPorProvincia() {
        return clienteRepository.countByProvincia();
    }

    public Map<String, Object> getEstadisticasJefeVentas() {
        Map<String, Object> estadisticas = new HashMap<>();

        estadisticas.put("totalClientes", clienteRepository.count());
        estadisticas.put("clientesAprobados", clienteRepository.countByAprobadoPorJefeVentasTrue());
        estadisticas.put("clientesPendientes", clienteRepository.countByAprobadoPorJefeVentasFalseAndEstado(EstadoCliente.ACTIVO));
        estadisticas.put("clientesRechazados", clienteRepository.countByAprobadoPorJefeVentasFalseAndMotivoRechazoIsNotNull());
        estadisticas.put("clientesPorEstado", clienteRepository.getEstadisticasPorEstado());
        estadisticas.put("clientesPorVendedor", clienteRepository.getEstadisticasPorVendedor());

        return estadisticas;
    }

    public Map<String, Object> getEstadisticasVendedor(Long usuarioId) {
        Map<String, Object> estadisticas = new HashMap<>();

        estadisticas.put("totalClientes", clienteRepository.countByUsuarioCreador(usuarioId));
        estadisticas.put("clientesActivos", clienteRepository.countByUsuarioCreadorAndEstado(usuarioId, EstadoCliente.ACTIVO));
        estadisticas.put("clientesBloqueados", clienteRepository.countByUsuarioCreadorAndEstado(usuarioId, EstadoCliente.BLOQUEADO));
        estadisticas.put("clientesCompletados", clienteRepository.countByUsuarioCreadorAndProcesoCompletadoTrue(usuarioId));
        estadisticas.put("clientesPendientes", clienteRepository.countByUsuarioCreadorAndProcesoCompletadoFalse(usuarioId));

        return estadisticas;
    }

    // ===== DTO QUERIES =====

    public List<ClienteDTO> findAllAsDTO() {
        List<Cliente> clientes = clienteRepository.findAll();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        enrichDTOs(dtos, clientes);
        return dtos;
    }

    public Page<ClienteDTO> findAllAsDTO(Pageable pageable) {
        Page<Cliente> clientes = clienteRepository.findAllWithUsuarioCreador(pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        enrichDTOs(dtos.getContent(), clientes.getContent());
        return dtos;
    }

    public ClienteDTO findByIdAsDTO(Long id) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
        ClienteDTO dto = clienteMapper.toDTO(cliente);
        enrichDTO(dto, cliente);
        return dto;
    }

    public List<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId) {
        List<Cliente> clientes = findByUsuarioCreador(usuarioId);
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        enrichDTOs(dtos, clientes);
        return dtos;
    }

    public Page<ClienteDTO> findByUsuarioCreadorAsDTO(Long usuarioId, Pageable pageable) {
        Page<Cliente> clientes = clienteRepository.findByUsuarioCreadorId(usuarioId, pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        enrichDTOs(dtos.getContent(), clientes.getContent());
        return dtos;
    }

    public List<ClienteDTO> findByEstadoAsDTO(EstadoCliente estado) {
        List<Cliente> clientes = findByEstado(estado);
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        enrichDTOs(dtos, clientes);
        return dtos;
    }

    public List<ClienteDTO> findClientesAprobadosAsDTO() {
        List<Cliente> clientes = findClientesAprobados();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        enrichDTOs(dtos, clientes);
        return dtos;
    }

    public List<ClienteDTO> findClientesPendientesAprobacionAsDTO() {
        List<Cliente> clientes = findClientesPendientesAprobacion();
        List<ClienteDTO> dtos = clienteMapper.toDTOList(clientes);
        enrichDTOs(dtos, clientes);
        return dtos;
    }

    public ClienteDTO findByNumeroIdentificacionAsDTO(String numeroIdentificacion) {
        List<Cliente> clientes = clienteRepository.findByRuc(numeroIdentificacion);
        if (clientes.isEmpty()) {
            throw new ResourceNotFoundException("Cliente no encontrado con identificación: " + numeroIdentificacion);
        }
        ClienteDTO resultado = clienteMapper.toDTO(clientes.get(0));
        enrichDTO(resultado, clientes.get(0));
        return resultado;
    }

    public boolean existsByNumeroIdentificacion(String numeroIdentificacion) {
        List<Cliente> clientesRuc = clienteRepository.findByRuc(numeroIdentificacion);
        if (!clientesRuc.isEmpty()) {
            return true;
        }

        List<Cliente> clientes = clienteRepository.findAll();
        return clientes.stream().anyMatch(c -> numeroIdentificacion.equals(c.getNumeroIdentificacion()));
    }

    public Page<ClienteDTO> findByFiltrosAsDTO(String nombres, EstadoCliente estado, Long vendedorId,
                                                String numeroIdentificacion, String email, String apellidos, Pageable pageable) {
        Page<Cliente> clientes = clienteRepository.findByFiltros(null, estado, vendedorId, null, email, nombres, pageable);
        Page<ClienteDTO> dtos = clientes.map(clienteMapper::toDTO);
        enrichDTOs(dtos.getContent(), clientes.getContent());
        return dtos;
    }

    // ===== GRUPO DE IMPORTACIÓN =====

    public String obtenerGrupoImportacionActivo(Long clienteId) {
        List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(clienteId);

        if (gruposCliente == null || gruposCliente.isEmpty()) {
            return null;
        }

        for (ClienteGrupoImportacion cgi : gruposCliente) {
            EstadoClienteGrupo estado = cgi.getEstado();
            if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                return cgi.getGrupoImportacion().getNombre();
            }
        }

        return null;
    }

    public Map<String, String> obtenerLicenciaGrupoImportacionActivo(Long clienteId) {
        List<ClienteGrupoImportacion> gruposCliente = clienteGrupoImportacionRepository.findByClienteId(clienteId);

        if (gruposCliente == null || gruposCliente.isEmpty()) {
            return null;
        }

        for (ClienteGrupoImportacion cgi : gruposCliente) {
            EstadoClienteGrupo estado = cgi.getEstado();
            if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                GrupoImportacion grupo = cgi.getGrupoImportacion();
                if (grupo != null && grupo.getLicencia() != null) {
                    Map<String, String> licenciaInfo = new HashMap<>();
                    licenciaInfo.put("nombre", grupo.getLicencia().getNombre());
                    licenciaInfo.put("numero", grupo.getLicencia().getNumero());
                    return licenciaInfo;
                }
            }
        }

        return null;
    }

    // ===== ENRICHMENT DE DTOs =====

    public void enrichDTO(ClienteDTO dto, Cliente cliente) {
        dto.setEstadoPago(calcularEstadoPago(dto.getId()));

        List<ClienteGrupoImportacion> grupos = clienteGrupoImportacionRepository.findByClienteId(dto.getId());
        if (grupos != null && !grupos.isEmpty()) {
            for (ClienteGrupoImportacion cgi : grupos) {
                EstadoClienteGrupo estado = cgi.getEstado();
                if (estado != EstadoClienteGrupo.COMPLETADO && estado != EstadoClienteGrupo.CANCELADO) {
                    dto.setGrupoImportacionNombre(cgi.getGrupoImportacion().getNombre());
                    GrupoImportacion grupo = cgi.getGrupoImportacion();
                    if (grupo.getLicencia() != null) {
                        dto.setLicenciaNombre(grupo.getLicencia().getNombre());
                        dto.setLicenciaNumero(grupo.getLicencia().getNumero());
                    }
                    break;
                }
            }
        }

        if (cliente != null) {
            dto.setEstado(calcularEstadoCliente(cliente));
        }
    }

    public void enrichDTOs(List<ClienteDTO> dtos, List<Cliente> clientes) {
        Map<Long, Cliente> clienteMap = clientes.stream()
            .collect(Collectors.toMap(Cliente::getId, c -> c, (a, b) -> a));
        for (ClienteDTO dto : dtos) {
            enrichDTO(dto, clienteMap.get(dto.getId()));
        }
    }

    // ===== CÁLCULOS DE ESTADO =====

    public EstadoCliente calcularEstadoCliente(Cliente cliente) {
        if (cliente.getEstado() == EstadoCliente.BLOQUEADO) {
            return EstadoCliente.BLOQUEADO;
        }

        if (cliente.getEstado() == EstadoCliente.INHABILITADO_COMPRA) {
            return EstadoCliente.INHABILITADO_COMPRA;
        }

        if (cliente.getEstado() == EstadoCliente.RECHAZADO) {
            return EstadoCliente.RECHAZADO;
        }

        if (cliente.getEstado() == EstadoCliente.CANCELADO) {
            return EstadoCliente.CANCELADO;
        }

        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            return EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE;
        }

        boolean documentosCompletos = documentoClienteService.verificarDocumentosCompletos(cliente.getId());

        if (!documentosCompletos) {
            return EstadoCliente.PENDIENTE_DOCUMENTOS;
        }

        boolean tieneArmasAsignadas = clienteArmaService.tieneArmasAsignadas(cliente.getId());

        if (documentosCompletos && tieneArmasAsignadas) {
            return EstadoCliente.LISTO_IMPORTACION;
        }

        if (documentosCompletos && !tieneArmasAsignadas) {
            return EstadoCliente.EN_PROCESO;
        }

        return cliente.getEstado() != null ? cliente.getEstado() : EstadoCliente.EN_PROCESO;
    }

    public String calcularEstadoPago(Long clienteId) {
        List<Pago> pagos = pagoRepository.findByClienteId(clienteId);

        if (pagos == null || pagos.isEmpty()) {
            return "IMPAGO";
        }

        BigDecimal totalPagado = BigDecimal.ZERO;
        BigDecimal totalPendiente = BigDecimal.ZERO;

        for (Pago pago : pagos) {
            if (pago.getMontoPagado() != null) {
                totalPagado = totalPagado.add(pago.getMontoPagado());
            }
            if (pago.getMontoPendiente() != null) {
                totalPendiente = totalPendiente.add(pago.getMontoPendiente());
            }
        }

        if (totalPagado.compareTo(BigDecimal.ZERO) == 0) {
            return "IMPAGO";
        }

        if (totalPendiente.compareTo(BigDecimal.ZERO) > 0) {
            return "ABONADO";
        }

        return "PAGO_COMPLETO";
    }
}
