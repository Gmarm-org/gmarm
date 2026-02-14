package com.armasimportacion.service;

import com.armasimportacion.enums.EstadoOcupacionLicencia;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.GrupoImportacionCupo;
import com.armasimportacion.repository.LicenciaRepository;
import com.armasimportacion.repository.GrupoImportacionCupoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Servicio para gestión de Licencias.
 * NOTA: Los cupos se manejan a nivel de Grupo de Importación (tipo CUPO o JUSTIFICATIVO),
 * no a nivel de licencia.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LicenciaService {

    private final LicenciaRepository licenciaRepository;
    private final GrupoImportacionCupoRepository grupoImportacionCupoRepository;
    private final ConfiguracionSistemaService configuracionSistemaService;

    // Métodos CRUD básicos
    public Licencia crearLicencia(Licencia licencia, Long usuarioId) {
        // Validar que el número de licencia sea único
        if (licenciaRepository.existsByNumero(licencia.getNumero())) {
            throw new RuntimeException("Ya existe una licencia con el número: " + licencia.getNumero());
        }

        // NOTA: Los cupos se manejan a nivel de Grupo de Importación, no de Licencia
        licencia.setEstadoOcupacion(EstadoOcupacionLicencia.DISPONIBLE);
        log.info("Licencia creada: {}", licencia.getNumero());
        return licenciaRepository.save(licencia);
    }

    public Licencia actualizarLicencia(Long id, Licencia licencia, Long usuarioId) {
        Licencia licenciaExistente = licenciaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Licencia no encontrada con ID: " + id));

        // Actualizar campos permitidos
        licenciaExistente.setNombre(licencia.getNombre());
        licenciaExistente.setRuc(licencia.getRuc());
        licenciaExistente.setCuentaBancaria(licencia.getCuentaBancaria());
        licenciaExistente.setNombreBanco(licencia.getNombreBanco());
        licenciaExistente.setTipoCuenta(licencia.getTipoCuenta());
        licenciaExistente.setCedulaCuenta(licencia.getCedulaCuenta());
        licenciaExistente.setEmail(licencia.getEmail());
        licenciaExistente.setTelefono(licencia.getTelefono());
        licenciaExistente.setFechaVencimiento(licencia.getFechaVencimiento());
        // NOTA: Los cupos se manejan a nivel de Grupo de Importación

        return licenciaRepository.save(licenciaExistente);
    }

    public Licencia obtenerLicencia(Long id) {
        return licenciaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Licencia no encontrada con ID: " + id));
    }

    public Page<Licencia> obtenerLicencias(Pageable pageable) {
        return licenciaRepository.findAll(pageable);
    }

    public void eliminarLicencia(Long id) {
        if (!licenciaRepository.existsById(id)) {
            throw new RuntimeException("Licencia no encontrada con ID: " + id);
        }
        licenciaRepository.deleteById(id);
    }

    public List<Licencia> obtenerLicenciasActivas() {
        return licenciaRepository.findByEstado(true); // true = ACTIVA
    }

    /**
     * Obtiene las licencias disponibles para asignar a grupos de importación
     * Una licencia está disponible si:
     * - Está activa (estado = true)
     * - No está vencida
     *
     * NOTA: Una licencia puede estar en múltiples grupos (tanto CUPO como JUSTIFICATIVO),
     * por lo que NO se filtra por estado de ocupación. La licencia puede estar DISPONIBLE
     * o BLOQUEADA y aún así puede ser asignada a nuevos grupos.
     */
    public List<Licencia> obtenerLicenciasDisponibles() {
        log.info("Buscando licencias disponibles (activas y no vencidas)");
        List<Licencia> todasLasLicencias = licenciaRepository.findByEstado(true);
        List<Licencia> licenciasDisponibles = todasLasLicencias.stream()
            .filter(licencia -> !licencia.isVencida())
            .collect(java.util.stream.Collectors.toList());
        log.info("Encontradas {} licencias disponibles de {} totales activas",
            licenciasDisponibles.size(), todasLasLicencias.size());
        if (licenciasDisponibles.isEmpty()) {
            log.warn("No se encontraron licencias disponibles. Verificar que existan licencias activas y no vencidas");
        }
        return licenciasDisponibles;
    }

    public List<Licencia> obtenerLicenciasProximasAVencer(int dias) {
        java.time.LocalDate fechaInicio = java.time.LocalDate.now();
        java.time.LocalDate fechaFin = fechaInicio.plusDays(dias);
        return licenciaRepository.findLicenciasProximasAVencer(fechaInicio, fechaFin);
    }

    public Page<Licencia> buscarLicencias(String numero, String nombre, String ruc,
                                        Boolean estado,
                                        String tipoCliente, org.springframework.data.domain.Pageable pageable) {
        return licenciaRepository.findWithFilters(numero, nombre, estado, ruc, pageable);
    }

    public List<Object[]> obtenerEstadisticasPorEstado() {
        return licenciaRepository.countByEstado();
    }

    public void cambiarEstado(Long id, Boolean nuevoEstado) {
        Licencia licencia = obtenerLicencia(id);
        licencia.setEstado(nuevoEstado);
        licenciaRepository.save(licencia);
    }

    /**
     * Obtiene iniciales del importador desde el nombre de la licencia.
     * Ejemplo: "Juan Gomez" -> "JG"
     */
    public String obtenerInicialesImportador(Long licenciaId) {
        Licencia licencia = obtenerLicencia(licenciaId);
        return obtenerInicialesImportadorDesdeLicencia(licencia);
    }

    public String obtenerInicialesImportadorDesdeLicencia(Licencia licencia) {
        if (licencia == null) {
            return obtenerInicialesFallback();
        }
        String iniciales = obtenerInicialesDesdeNombre(licencia.getNombre());
        return iniciales.isEmpty() ? obtenerInicialesFallback() : iniciales;
    }

    public String obtenerInicialesDesdeNombre(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            return "";
        }
        String limpio = nombre.replaceAll("[^\\p{L}\\p{N} ]", " ").trim();
        String[] partes = limpio.split("\\s+");
        if (partes.length == 0) {
            return "";
        }
        if (partes.length == 1) {
            String palabra = partes[0];
            return palabra.length() >= 2
                ? palabra.substring(0, 2).toUpperCase()
                : palabra.substring(0, 1).toUpperCase();
        }
        String primera = partes[0];
        String ultima = partes[partes.length - 1];
        return (primera.substring(0, 1) + ultima.substring(0, 1)).toUpperCase();
    }

    public String obtenerInicialesFallback() {
        try {
            String valor = configuracionSistemaService.getValorConfiguracion("RECIBO_INICIALES_IMPORTADOR");
            if (valor != null && !valor.trim().isEmpty()) {
                return valor.trim().toUpperCase();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener RECIBO_INICIALES_IMPORTADOR, usando fallback: {}", e.getMessage());
        }
        return "JG";
    }

    /**
     * Busca licencias disponibles para asignar a grupos
     */
    public List<Licencia> findLicenciasDisponibles(String tipoCliente) {
        // Ahora los cupos se manejan a nivel de GrupoImportacion, no de Licencia
        // Retornar todas las licencias activas y no vencidas
        return obtenerLicenciasDisponibles();
    }

    /**
     * Libera una licencia cuando se completa un grupo de importación
     */
    @Transactional
    public void liberarLicencia(Long grupoImportacionId) {
        List<GrupoImportacionCupo> cupos = grupoImportacionCupoRepository.findByGrupoImportacionId(grupoImportacionId);

        if (!cupos.isEmpty()) {
            Licencia licencia = cupos.get(0).getLicencia();

            // Eliminar todos los registros de consumo
            grupoImportacionCupoRepository.deleteByGrupoImportacionId(grupoImportacionId);

            // Liberar la licencia
            licencia.liberar();
            licenciaRepository.save(licencia);

            log.info("Licencia {} liberada exitosamente del grupo {}",
                licencia.getNumero(), grupoImportacionId);
        }
    }

    /**
     * Verifica si una licencia puede ser asignada a un nuevo grupo
     */
    public boolean puedeSerAsignada(Long licenciaId) {
        Optional<Licencia> licenciaOpt = licenciaRepository.findById(licenciaId);
        return licenciaOpt.map(Licencia::puedeSerAsignada).orElse(false);
    }

    /**
     * Obtiene el resumen de una licencia
     * NOTA: Los cupos se manejan a nivel de Grupo de Importación, no de Licencia
     */
    public String getResumenLicencia(Long licenciaId) {
        Optional<Licencia> licenciaOpt = licenciaRepository.findById(licenciaId);
        if (licenciaOpt.isPresent()) {
            Licencia licencia = licenciaOpt.get();
            return String.format("Licencia %s: Nombre=%s, Estado=%s, Ocupación=%s",
                licencia.getNumero(),
                licencia.getNombre(),
                licencia.getEstado() ? "Activa" : "Inactiva",
                licencia.getEstadoOcupacion());
        }
        return "Licencia no encontrada";
    }

    /**
     * Resetea el estado de ocupación de una licencia cuando se completa un grupo
     */
    @Transactional
    public Licencia resetearEstadoLicencia(Long licenciaId) {
        log.info("Reseteando estado de licencia ID: {}", licenciaId);

        Licencia licencia = licenciaRepository.findById(licenciaId)
            .orElseThrow(() -> new RuntimeException("Licencia no encontrada con ID: " + licenciaId));

        // Cambiar estado a DISPONIBLE
        licencia.setEstadoOcupacion(EstadoOcupacionLicencia.DISPONIBLE);

        Licencia licenciaActualizada = licenciaRepository.save(licencia);

        log.info("Licencia {} ahora está DISPONIBLE", licencia.getNumero());
        return licenciaActualizada;
    }
}
