package com.armasimportacion.service;

import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionLimiteCategoria;
import com.armasimportacion.model.GrupoImportacionVendedor;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.enums.EstadoClienteGrupo;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.EstadoMilitar;
import com.armasimportacion.enums.TipoGrupo;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.GrupoImportacionLimiteCategoriaRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.GrupoImportacionVendedorRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Servicio responsable de la lógica de matching y disponibilidad de grupos de importación.
 * Incluye: búsqueda de grupos disponibles, compatibilidad cliente-grupo, cálculo de cupos por categoría.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionMatchingService {

    private final GrupoImportacionRepository grupoImportacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    private final GrupoImportacionVendedorRepository grupoImportacionVendedorRepository;
    private final GrupoImportacionLimiteCategoriaRepository grupoImportacionLimiteCategoriaRepository;

    /**
     * Encuentra un grupo de importación disponible para una arma específica.
     * Prioriza grupos que estén cerca del límite (ej: 24/25 armas) para completar el grupo.
     */
    @Transactional(readOnly = true)
    public GrupoImportacion encontrarGrupoDisponibleParaArma(Long vendedorId, Cliente cliente, Long categoriaArmaId, boolean esSegundaArma) {
        log.info("Buscando grupo disponible para arma de categoría {} (segunda arma: {})", categoriaArmaId, esSegundaArma);

        Usuario vendedor = usuarioRepository.findById(vendedorId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado"));

        List<GrupoImportacionVendedor> asignacionesVendedor = grupoImportacionVendedorRepository.findByVendedor(vendedor);
        if (asignacionesVendedor.isEmpty()) {
            return null;
        }

        Set<Long> gruposYaAsignados = obtenerGruposYaAsignadosDelCliente(cliente, esSegundaArma);
        List<GrupoImportacionConPrioridad> gruposCandidatos = evaluarGruposCandidatos(
            asignacionesVendedor, cliente, categoriaArmaId, esSegundaArma, gruposYaAsignados);

        return seleccionarMejorGrupo(gruposCandidatos, vendedorId, categoriaArmaId);
    }

    /**
     * Encuentra el primer grupo de importación disponible para un vendedor.
     */
    @Transactional(readOnly = true)
    public GrupoImportacion encontrarGrupoDisponibleParaVendedor(Long vendedorId, Cliente cliente) {
        log.info("Buscando grupo disponible para vendedor ID: {} y cliente ID: {}", vendedorId, cliente.getId());

        Usuario vendedor = usuarioRepository.findById(vendedorId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado"));

        List<GrupoImportacionVendedor> asignacionesVendedor = grupoImportacionVendedorRepository.findByVendedor(vendedor);

        if (asignacionesVendedor.isEmpty()) {
            log.info("No hay grupos asignados para el vendedor ID: {}", vendedorId);
            return null;
        }

        for (GrupoImportacionVendedor asignacion : asignacionesVendedor) {
            GrupoImportacion grupo = asignacion.getGrupoImportacion();

            if (grupo.getEstado() != EstadoGrupoImportacion.EN_PREPARACION &&
                grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES) {
                continue;
            }

            if (!esClienteCompatibleConGrupo(cliente, grupo)) {
                log.debug("Cliente ID {} no es compatible con grupo ID {} (tipo: {})",
                    cliente.getId(), grupo.getId(), grupo.getTipoGrupo());
                continue;
            }

            if (grupo.getTipoGrupo() == TipoGrupo.CUPO &&
                cliente.getEstado() != EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
                List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteId(cliente.getId());

                if (!armasCliente.isEmpty()) {
                    List<GrupoImportacionLimiteCategoria> limites = grupoImportacionLimiteCategoriaRepository
                        .findByGrupoImportacion(grupo);

                    boolean tieneCupoDisponible = true;
                    for (ClienteArma clienteArma : armasCliente) {
                        Long categoriaId = clienteArma.getArma().getCategoria().getId();

                        Optional<GrupoImportacionLimiteCategoria> limiteOpt = limites.stream()
                            .filter(l -> l.getCategoriaArma().getId().equals(categoriaId))
                            .findFirst();

                        if (limiteOpt.isPresent()) {
                            GrupoImportacionLimiteCategoria limite = limiteOpt.get();
                            Integer limiteMaximo = limite.getLimiteMaximo();
                            long clientesConfirmadosConCategoria = contarArmasPorCategoriaEnGrupo(grupo.getId(), categoriaId);

                            if (clientesConfirmadosConCategoria >= limiteMaximo) {
                                log.debug("Grupo ID {} no tiene cupo disponible para categoría {} (ocupados: {}, límite: {})",
                                    grupo.getId(), categoriaId, clientesConfirmadosConCategoria, limiteMaximo);
                                tieneCupoDisponible = false;
                                break;
                            }
                        }
                    }

                    if (!tieneCupoDisponible) {
                        continue;
                    }
                }
            }

            log.info("Grupo disponible encontrado: ID={}, nombre={}", grupo.getId(), grupo.getNombre());
            return grupo;
        }

        log.info("No se encontró grupo disponible para vendedor ID: {}", vendedorId);
        return null;
    }

    @Transactional(readOnly = true)
    public boolean existeGrupoDisponibleParaVendedorPorTipo(Long vendedorId, TipoCliente tipoCliente, EstadoMilitar estadoMilitar) {
        Usuario vendedor = usuarioRepository.findById(vendedorId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendedor no encontrado"));

        List<GrupoImportacionVendedor> asignacionesVendedor = grupoImportacionVendedorRepository.findByVendedor(vendedor);
        if (asignacionesVendedor.isEmpty()) {
            return false;
        }

        return asignacionesVendedor.stream()
            .filter(GrupoImportacionVendedor::getActivo)
            .map(GrupoImportacionVendedor::getGrupoImportacion)
            .filter(grupo -> grupo.getEstado() == EstadoGrupoImportacion.EN_PREPARACION
                || grupo.getEstado() == EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES)
            .anyMatch(grupo -> esTipoCompatibleConGrupo(tipoCliente, estadoMilitar, grupo));
    }

    public TipoGrupo obtenerTipoGrupoRequerido(TipoCliente tipoCliente, EstadoMilitar estadoMilitar) {
        if (tipoCliente == null) {
            return null;
        }

        if (tipoCliente.esEmpresa()) {
            return TipoGrupo.JUSTIFICATIVO;
        }

        if (tipoCliente.esUniformado()) {
            if (estadoMilitar == null) {
                return null;
            }
            return estadoMilitar == EstadoMilitar.ACTIVO ? TipoGrupo.JUSTIFICATIVO : TipoGrupo.CUPO;
        }

        if (tipoCliente.esCivil() || tipoCliente.esDeportista()) {
            return TipoGrupo.CUPO;
        }

        return null;
    }

    /**
     * Calcula los cupos disponibles por categoría para un grupo CUPO.
     */
    @Transactional(readOnly = true)
    public Map<Long, Integer> calcularCuposDisponiblesPorCategoria(Long grupoId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        if (grupo.getTipoGrupo() != TipoGrupo.CUPO) {
            return new HashMap<>();
        }

        List<GrupoImportacionLimiteCategoria> limites = grupoImportacionLimiteCategoriaRepository
            .findByGrupoImportacion(grupo);

        Map<Long, Integer> cuposDisponibles = new HashMap<>();

        for (GrupoImportacionLimiteCategoria limite : limites) {
            Long categoriaId = limite.getCategoriaArma().getId();
            Integer limiteMaximo = limite.getLimiteMaximo();
            long clientesConfirmadosConCategoria = contarArmasPorCategoriaEnGrupo(grupoId, categoriaId);
            int disponibles = Math.max(0, limiteMaximo - (int) clientesConfirmadosConCategoria);
            cuposDisponibles.put(categoriaId, disponibles);
        }

        return cuposDisponibles;
    }

    /**
     * Calcula el cupo total disponible para un grupo CUPO.
     */
    @Transactional(readOnly = true)
    public Integer calcularCupoTotalDisponible(Long grupoId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        if (grupo.getTipoGrupo() != TipoGrupo.CUPO) {
            return null;
        }

        Map<Long, Integer> cuposPorCategoria = calcularCuposDisponiblesPorCategoria(grupoId);
        return cuposPorCategoria.values().stream()
            .mapToInt(Integer::intValue)
            .sum();
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private boolean esClienteCompatibleConGrupo(Cliente cliente, GrupoImportacion grupo) {
        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            return false;
        }

        TipoGrupo tipoGrupo = grupo.getTipoGrupo() != null ? grupo.getTipoGrupo() : TipoGrupo.CUPO;

        if (tipoGrupo == TipoGrupo.CUPO) {
            return tipoCliente.esCivil() ||
                   tipoCliente.esDeportista() ||
                   (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                    cliente.getEstadoMilitar() == EstadoMilitar.PASIVO);
        } else if (tipoGrupo == TipoGrupo.JUSTIFICATIVO) {
            return (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                    cliente.getEstadoMilitar() == EstadoMilitar.ACTIVO) ||
                   tipoCliente.esEmpresa() ||
                   tipoCliente.esDeportista();
        }

        return false;
    }

    private boolean esTipoCompatibleConGrupo(TipoCliente tipoCliente, EstadoMilitar estadoMilitar, GrupoImportacion grupo) {
        if (tipoCliente == null) {
            return false;
        }

        TipoGrupo tipoGrupo = grupo.getTipoGrupo() != null ? grupo.getTipoGrupo() : TipoGrupo.CUPO;

        if (tipoGrupo == TipoGrupo.CUPO) {
            if (tipoCliente.esCivil() || tipoCliente.esDeportista()) {
                return true;
            }
            if (tipoCliente.esUniformado()) {
                return estadoMilitar == null || estadoMilitar == EstadoMilitar.PASIVO;
            }
            return false;
        }

        if (tipoGrupo == TipoGrupo.JUSTIFICATIVO) {
            if (tipoCliente.esEmpresa() || tipoCliente.esDeportista()) {
                return true;
            }
            if (tipoCliente.esUniformado()) {
                return estadoMilitar == null || estadoMilitar == EstadoMilitar.ACTIVO;
            }
            return false;
        }

        return false;
    }

    private boolean esClienteCivilParaCupo(Cliente cliente) {
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            return true;
        }
        TipoCliente tipoCliente = cliente.getTipoCliente();
        if (tipoCliente == null) {
            return false;
        }
        return tipoCliente.esCivil() ||
               tipoCliente.esDeportista() ||
               (tipoCliente.esUniformado() && cliente.getEstadoMilitar() != null &&
                cliente.getEstadoMilitar() == EstadoMilitar.PASIVO);
    }

    private boolean esClienteGrupoContable(ClienteGrupoImportacion cgi) {
        return cgi.getEstado() == EstadoClienteGrupo.PENDIENTE ||
               cgi.getEstado() == EstadoClienteGrupo.CONFIRMADO ||
               cgi.getEstado() == EstadoClienteGrupo.APROBADO ||
               cgi.getEstado() == EstadoClienteGrupo.EN_PROCESO;
    }

    private long contarArmasPorCategoriaEnGrupo(Long grupoId, Long categoriaId) {
        List<Long> clienteIdsCupo = clienteGrupoRepository.findByGrupoImportacionId(grupoId).stream()
            .filter(this::esClienteGrupoContable)
            .filter(cgi -> esClienteCivilParaCupo(cgi.getCliente()))
            .map(cgi -> cgi.getCliente().getId())
            .toList();

        if (clienteIdsCupo.isEmpty()) {
            return 0;
        }

        return clienteArmaRepository.findByClienteIdInWithArmaAndCategoria(clienteIdsCupo).stream()
            .filter(ca -> ca.getArma().getCategoria().getId().equals(categoriaId))
            .mapToInt(ca -> ca.getCantidad() != null ? ca.getCantidad() : 1)
            .sum();
    }

    private Set<Long> obtenerGruposYaAsignadosDelCliente(Cliente cliente, boolean esSegundaArma) {
        if (!esSegundaArma) return Collections.emptySet();

        List<ClienteGrupoImportacion> asignacionesCliente = clienteGrupoRepository.findByClienteId(cliente.getId());
        return asignacionesCliente.stream()
            .filter(cgi -> cgi.getEstado() != EstadoClienteGrupo.CANCELADO &&
                          cgi.getEstado() != EstadoClienteGrupo.COMPLETADO)
            .map(cgi -> cgi.getGrupoImportacion().getId())
            .collect(Collectors.toSet());
    }

    private List<GrupoImportacionConPrioridad> evaluarGruposCandidatos(
            List<GrupoImportacionVendedor> asignacionesVendedor, Cliente cliente,
            Long categoriaArmaId, boolean esSegundaArma, Set<Long> gruposYaAsignados) {

        List<GrupoImportacionConPrioridad> candidatos = new ArrayList<>();

        for (GrupoImportacionVendedor asignacion : asignacionesVendedor) {
            GrupoImportacion grupo = asignacion.getGrupoImportacion();

            if (esSegundaArma && gruposYaAsignados.contains(grupo.getId())) continue;
            if (grupo.getEstado() != EstadoGrupoImportacion.EN_PREPARACION &&
                grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES) continue;
            if (!esClienteCompatibleConGrupo(cliente, grupo)) continue;

            if (grupo.getTipoGrupo() == TipoGrupo.CUPO) {
                evaluarGrupoCupo(grupo, categoriaArmaId, candidatos);
            } else {
                candidatos.add(new GrupoImportacionConPrioridad(grupo, 0, Integer.MAX_VALUE));
            }
        }
        return candidatos;
    }

    private void evaluarGrupoCupo(GrupoImportacion grupo, Long categoriaArmaId,
            List<GrupoImportacionConPrioridad> candidatos) {
        List<GrupoImportacionLimiteCategoria> limites = grupoImportacionLimiteCategoriaRepository
            .findByGrupoImportacion(grupo);

        Optional<GrupoImportacionLimiteCategoria> limiteOpt = limites.stream()
            .filter(l -> l.getCategoriaArma().getId().equals(categoriaArmaId))
            .findFirst();

        if (limiteOpt.isEmpty()) return;

        GrupoImportacionLimiteCategoria limite = limiteOpt.get();
        Integer limiteMaximo = limite.getLimiteMaximo();
        long ocupados = contarArmasPorCategoriaEnGrupo(grupo.getId(), categoriaArmaId);

        if (ocupados >= limiteMaximo) return;

        int cupoDisponible = limiteMaximo - (int) ocupados;
        int porcentajeOcupado = (int) ((ocupados * 100) / limiteMaximo);
        candidatos.add(new GrupoImportacionConPrioridad(grupo, porcentajeOcupado, cupoDisponible));
    }

    private GrupoImportacion seleccionarMejorGrupo(List<GrupoImportacionConPrioridad> candidatos,
            Long vendedorId, Long categoriaArmaId) {
        candidatos.sort((a, b) -> {
            if (a.cupoDisponible > 0 && b.cupoDisponible > 0) {
                return Integer.compare(b.porcentajeOcupado, a.porcentajeOcupado);
            }
            if (a.cupoDisponible > 0) return -1;
            if (b.cupoDisponible > 0) return 1;
            return 0;
        });

        if (!candidatos.isEmpty()) {
            GrupoImportacion seleccionado = candidatos.get(0).grupo;
            log.info("Grupo disponible encontrado: ID={}, nombre={}", seleccionado.getId(), seleccionado.getNombre());
            return seleccionado;
        }

        log.info("No se encontró grupo disponible para vendedor ID: {} y categoría {}", vendedorId, categoriaArmaId);
        return null;
    }

    private static class GrupoImportacionConPrioridad {
        GrupoImportacion grupo;
        int porcentajeOcupado;
        int cupoDisponible;

        GrupoImportacionConPrioridad(GrupoImportacion grupo, int porcentajeOcupado, int cupoDisponible) {
            this.grupo = grupo;
            this.porcentajeOcupado = porcentajeOcupado;
            this.cupoDisponible = cupoDisponible;
        }
    }
}
