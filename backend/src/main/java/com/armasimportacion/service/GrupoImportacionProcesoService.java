package com.armasimportacion.service;

import com.armasimportacion.dto.AlertaProcesoImportacionDTO;
import com.armasimportacion.dto.GrupoImportacionProcesoDTO;
import com.armasimportacion.dto.GrupoImportacionProcesoUpdateDTO;
import com.armasimportacion.enums.EtapaProcesoImportacion;
import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionProceso;
import com.armasimportacion.model.Notificacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.GrupoImportacionProcesoRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.enums.TipoNotificacion;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GrupoImportacionProcesoService {

    private static final int DIAS_ALERTA_DEFAULT = 7;

    private final GrupoImportacionProcesoRepository procesoRepository;
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final EmailService emailService;
    private final ConfiguracionSistemaService configuracionSistemaService;

    public List<GrupoImportacionProcesoDTO> obtenerProcesosPorGrupo(Long grupoId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        Map<EtapaProcesoImportacion, GrupoImportacionProceso> procesos = obtenerOMCrearProcesos(grupo);
        int diasAlerta = obtenerDiasAlerta();

        return procesos.values().stream()
            .map(proceso -> mapearProceso(proceso, diasAlerta))
            .collect(Collectors.toList());
    }

    public List<GrupoImportacionProcesoDTO> actualizarProcesos(Long grupoId, List<GrupoImportacionProcesoUpdateDTO> updates) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));

        Map<EtapaProcesoImportacion, GrupoImportacionProceso> procesos = obtenerOMCrearProcesos(grupo);

        for (GrupoImportacionProcesoUpdateDTO update : updates) {
            if (update.getEtapa() == null) {
                continue;
            }
            GrupoImportacionProceso proceso = procesos.get(update.getEtapa());
            if (proceso == null) {
                proceso = crearProceso(grupo, update.getEtapa());
                procesos.put(update.getEtapa(), proceso);
            }
            proceso.setFechaPlanificada(update.getFechaPlanificada());
            if (update.getCompletado() != null) {
                proceso.setCompletado(update.getCompletado());
                proceso.setFechaCompletado(update.getCompletado() ? LocalDateTime.now() : null);
            }
            procesoRepository.save(proceso);
        }

        int diasAlerta = obtenerDiasAlerta();
        return procesos.values().stream()
            .map(proceso -> mapearProceso(proceso, diasAlerta))
            .collect(Collectors.toList());
    }

    public List<AlertaProcesoImportacionDTO> evaluarAlertasProcesos() {
        int diasAlerta = obtenerDiasAlerta();
        LocalDate fechaLimite = LocalDate.now().plusDays(diasAlerta);
        List<GrupoImportacionProceso> procesosPendientes = procesoRepository.findProcesosPendientesHasta(fechaLimite);

        List<AlertaProcesoImportacionDTO> alertas = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioDia = ahora.toLocalDate().atStartOfDay();

        for (GrupoImportacionProceso proceso : procesosPendientes) {
            if (Boolean.TRUE.equals(proceso.getCompletado())) {
                continue;
            }
            if (proceso.getFechaUltimaAlerta() != null && proceso.getFechaUltimaAlerta().isAfter(inicioDia)) {
                continue; // Ya se alertó hoy
            }
            GrupoImportacion grupo = proceso.getGrupoImportacion();
            LocalDate fechaPlanificada = proceso.getFechaPlanificada();
            Integer diasRestantes = fechaPlanificada != null
                ? (int) ChronoUnit.DAYS.between(LocalDate.now(), fechaPlanificada)
                : null;

            AlertaProcesoImportacionDTO alerta = AlertaProcesoImportacionDTO.builder()
                .grupoImportacionId(grupo.getId())
                .grupoNombre(grupo.getNombre())
                .etapa(proceso.getEtapa())
                .etapaLabel(formatearEtapa(proceso.getEtapa()))
                .fechaPlanificada(fechaPlanificada)
                .diasRestantes(diasRestantes)
                .build();

            alertas.add(alerta);
            proceso.setFechaUltimaAlerta(ahora);
            procesoRepository.save(proceso);
        }

        if (!alertas.isEmpty()) {
            notificarUsuarios(alertas);
        }

        return alertas;
    }

    private void notificarUsuarios(List<AlertaProcesoImportacionDTO> alertas) {
        List<Usuario> destinatarios = usuarioRepository.findByRolesNombreIn(List.of("FINANZAS", "JEFE_VENTAS"));
        if (destinatarios.isEmpty()) {
            return;
        }

        for (Usuario usuario : destinatarios) {
            String mensaje = construirMensaje(alertas);
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Alertas de procesos de importación");
            notificacion.setMensaje(mensaje);
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(usuario);
            notificacionService.crearNotificacion(notificacion);
        }

        try {
            for (Usuario usuario : destinatarios) {
                if (usuario.getEmail() != null && !usuario.getEmail().trim().isEmpty()) {
                    emailService.enviarAlertasProcesoImportacion(
                        usuario.getEmail(),
                        usuario.getNombreCompleto(),
                        alertas
                    );
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ No se pudo enviar alertas por correo: {}", e.getMessage(), e);
        }
    }

    private String construirMensaje(List<AlertaProcesoImportacionDTO> alertas) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hay procesos de importación con fechas próximas o vencidas:\n");
        for (AlertaProcesoImportacionDTO alerta : alertas) {
            sb.append("- Grupo ")
                .append(alerta.getGrupoNombre())
                .append(" / ")
                .append(formatearEtapa(alerta.getEtapa()))
                .append(" / Fecha: ")
                .append(alerta.getFechaPlanificada() != null ? alerta.getFechaPlanificada() : "N/A")
                .append("\n");
        }
        return sb.toString();
    }

    private Map<EtapaProcesoImportacion, GrupoImportacionProceso> obtenerOMCrearProcesos(GrupoImportacion grupo) {
        List<GrupoImportacionProceso> existentes = procesoRepository.findByGrupoImportacionId(grupo.getId());
        Map<EtapaProcesoImportacion, GrupoImportacionProceso> map = new EnumMap<>(EtapaProcesoImportacion.class);
        for (GrupoImportacionProceso proceso : existentes) {
            map.put(proceso.getEtapa(), proceso);
        }
        for (EtapaProcesoImportacion etapa : EtapaProcesoImportacion.values()) {
            if (!map.containsKey(etapa)) {
                GrupoImportacionProceso nuevo = crearProceso(grupo, etapa);
                map.put(etapa, procesoRepository.save(nuevo));
            }
        }
        return map;
    }

    private GrupoImportacionProceso crearProceso(GrupoImportacion grupo, EtapaProcesoImportacion etapa) {
        GrupoImportacionProceso proceso = new GrupoImportacionProceso();
        proceso.setGrupoImportacion(grupo);
        proceso.setEtapa(etapa);
        proceso.setCompletado(false);
        return proceso;
    }

    private GrupoImportacionProcesoDTO mapearProceso(GrupoImportacionProceso proceso, int diasAlerta) {
        LocalDate fechaPlanificada = proceso.getFechaPlanificada();
        Integer diasRestantes = fechaPlanificada != null
            ? (int) ChronoUnit.DAYS.between(LocalDate.now(), fechaPlanificada)
            : null;
        boolean enAlerta = fechaPlanificada != null
            && !Boolean.TRUE.equals(proceso.getCompletado())
            && (diasRestantes == null || diasRestantes <= diasAlerta);

        return GrupoImportacionProcesoDTO.builder()
            .id(proceso.getId())
            .grupoImportacionId(proceso.getGrupoImportacion().getId())
            .etapa(proceso.getEtapa())
            .etapaLabel(formatearEtapa(proceso.getEtapa()))
            .fechaPlanificada(proceso.getFechaPlanificada())
            .completado(proceso.getCompletado())
            .fechaCompletado(proceso.getFechaCompletado())
            .enAlerta(enAlerta)
            .diasRestantes(diasRestantes)
            .build();
    }

    private int obtenerDiasAlerta() {
        try {
            String valor = configuracionSistemaService.getValorConfiguracion("DIAS_ALERTA_PROCESO_IMPORTACION");
            return Integer.parseInt(valor);
        } catch (Exception e) {
            return DIAS_ALERTA_DEFAULT;
        }
    }

    private String formatearEtapa(EtapaProcesoImportacion etapa) {
        return switch (etapa) {
            case INGRESO_DOCUMENTACION -> "Ingreso Documentación";
            case INSPECCION -> "Inspección";
            case RESOLUCION -> "Resolución";
            case PREVIA_IMPORTACION_INICIO -> "Previa Importación Inicio";
            case PREVIA_IMPORTACION_FINALIZADA -> "Previa Importación Finalizada";
            case PAGO_FABRICA -> "Pago a Fábrica";
            case AWB -> "AWB";
            case GUIA_AVIANCA -> "Guía Avianca";
            case AFORO -> "Aforo";
            case GUIA_LIBRE_TRANSITO -> "Guía Libre Tránsito";
            case SALIDA_AEROPUERTO -> "Salida Aeropuerto";
            case LIBERACION_CUPO -> "Liberación Cupo";
            case LIQUIDACION -> "Liquidación";
        };
    }
}
