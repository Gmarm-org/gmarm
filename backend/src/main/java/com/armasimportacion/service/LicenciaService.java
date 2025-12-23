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
        
        // Inicializar cupos con valores por defecto desde configuración del sistema
        inicializarCuposPorDefecto(licencia);
        
        licencia.setEstadoOcupacion(EstadoOcupacionLicencia.DISPONIBLE);
        log.info("✅ Licencia creada con cupos por defecto - Civil: {}, Militar: {}, Empresa: {}, Deportista: {}", 
            licencia.getCupoCivil(), licencia.getCupoMilitar(), licencia.getCupoEmpresa(), licencia.getCupoDeportista());
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
        licenciaExistente.setCupoCivil(licencia.getCupoCivil());
        licenciaExistente.setCupoMilitar(licencia.getCupoMilitar());
        licenciaExistente.setCupoEmpresa(licencia.getCupoEmpresa());
        licenciaExistente.setCupoDeportista(licencia.getCupoDeportista());
        licenciaExistente.setFechaVencimiento(licencia.getFechaVencimiento());
        
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
     * - Tiene estado de ocupación DISPONIBLE
     */
    public List<Licencia> obtenerLicenciasDisponibles() {
        log.info("🔍 Buscando licencias disponibles (activas y no ocupadas)");
        List<Licencia> licencias = licenciaRepository.findByEstadoAndEstadoOcupacion(true, EstadoOcupacionLicencia.DISPONIBLE);
        log.info("✅ Encontradas {} licencias disponibles", licencias.size());
        if (licencias.isEmpty()) {
            log.warn("⚠️ No se encontraron licencias disponibles. Verificar que existan licencias activas con estado DISPONIBLE");
        }
        return licencias;
    }

    public List<Licencia> obtenerLicenciasConCupoCivilDisponible() {
        return licenciaRepository.findLicenciasConCupoCivilDisponible();
    }

    public boolean tieneCupoDisponible(Long licenciaId, String tipoCliente) {
        Licencia licencia = obtenerLicencia(licenciaId);
        return licencia.tieneCupoDisponible(tipoCliente);
    }

    public void decrementarCupo(Long licenciaId, String tipoCliente) {
        Licencia licencia = obtenerLicencia(licenciaId);
        licencia.decrementarCupo(tipoCliente);
        licenciaRepository.save(licencia);
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
     * Busca licencias disponibles para un tipo de cliente específico
     */
    public List<Licencia> findLicenciasDisponibles(String tipoCliente) {
        return licenciaRepository.findByEstadoOcupacionAndTipoClienteDisponible(
            EstadoOcupacionLicencia.DISPONIBLE, tipoCliente);
    }

    /**
     * Asigna cupos de una licencia a un grupo de importación
     */
    @Transactional
    public boolean asignarCuposAGrupo(GrupoImportacion grupo, String tipoCliente, Integer cupoSolicitado) {
        // Buscar licencia disponible para este tipo de cliente
        List<Licencia> licenciasDisponibles = findLicenciasDisponibles(tipoCliente);
        
        if (licenciasDisponibles.isEmpty()) {
            log.warn("No hay licencias disponibles para el tipo de cliente: {}", tipoCliente);
            return false;
        }

        // Buscar la licencia con más cupos disponibles
        Licencia licenciaSeleccionada = licenciasDisponibles.stream()
            .filter(l -> l.getCupoDisponible(tipoCliente) >= cupoSolicitado)
            .findFirst()
            .orElse(null);

        if (licenciaSeleccionada == null) {
            log.warn("No hay licencia con suficientes cupos para {}: solicitado {}, disponible {}", 
                tipoCliente, cupoSolicitado, licenciasDisponibles.get(0).getCupoDisponible(tipoCliente));
            return false;
        }

        // Crear el registro de consumo de cupos
        GrupoImportacionCupo cupoConsumo = new GrupoImportacionCupo();
        cupoConsumo.setGrupoImportacion(grupo);
        cupoConsumo.setLicencia(licenciaSeleccionada);
        cupoConsumo.setTipoCliente(tipoCliente);
        cupoConsumo.setCupoConsumido(cupoSolicitado);
        cupoConsumo.setCupoDisponibleLicencia(
            licenciaSeleccionada.getCupoDisponible(tipoCliente) - cupoSolicitado);

        // Guardar el consumo
        grupoImportacionCupoRepository.save(cupoConsumo);

        // Si es la primera vez que se usa esta licencia en este grupo, bloquearla
        if (grupo.getLicencia() == null) {
            grupo.setLicencia(licenciaSeleccionada);
            licenciaSeleccionada.bloquear();
            licenciaRepository.save(licenciaSeleccionada);
        }

        log.info("Cupos asignados exitosamente: {} {} a grupo {} usando licencia {}", 
            cupoSolicitado, tipoCliente, grupo.getId(), licenciaSeleccionada.getNumero());
        
        return true;
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
     * Obtiene el resumen de cupos de una licencia
     */
    public String getResumenCupos(Long licenciaId) {
        Optional<Licencia> licenciaOpt = licenciaRepository.findById(licenciaId);
        if (licenciaOpt.isPresent()) {
            Licencia licencia = licenciaOpt.get();
            return String.format("Licencia %s: Civiles=%d, Militares=%d, Empresas=%d, Deportistas=%d, Estado=%s", 
                licencia.getNumero(),
                licencia.getCupoCivil() != null ? licencia.getCupoCivil() : 0,
                licencia.getCupoMilitar() != null ? licencia.getCupoMilitar() : 0,
                licencia.getCupoEmpresa() != null ? licencia.getCupoEmpresa() : 0,
                licencia.getCupoDeportista() != null ? licencia.getCupoDeportista() : 0,
                licencia.getEstadoOcupacion());
        }
        return "Licencia no encontrada";
    }

    /**
     * Inicializa los cupos de una licencia con los valores por defecto del sistema.
     * Los valores se obtienen de configuracion_sistema.
     * - CUPO_DEFAULT_CIVIL: 25
     * - CUPO_DEFAULT_MILITAR: 1000
     * - CUPO_DEFAULT_EMPRESA: 1000
     * - CUPO_DEFAULT_DEPORTISTA: 1000
     */
    private void inicializarCuposPorDefecto(Licencia licencia) {
        try {
            int cupoCivil = Integer.parseInt(configuracionSistemaService.getValorConfiguracion("CUPO_DEFAULT_CIVIL"));
            int cupoMilitar = Integer.parseInt(configuracionSistemaService.getValorConfiguracion("CUPO_DEFAULT_MILITAR"));
            int cupoEmpresa = Integer.parseInt(configuracionSistemaService.getValorConfiguracion("CUPO_DEFAULT_EMPRESA"));
            int cupoDeportista = Integer.parseInt(configuracionSistemaService.getValorConfiguracion("CUPO_DEFAULT_DEPORTISTA"));
            
            licencia.setCupoCivil(cupoCivil);
            licencia.setCupoMilitar(cupoMilitar);
            licencia.setCupoEmpresa(cupoEmpresa);
            licencia.setCupoDeportista(cupoDeportista);
            
            // Calcular cupo total
            int cupoTotal = cupoCivil + cupoMilitar + cupoEmpresa + cupoDeportista;
            licencia.setCupoTotal(cupoTotal);
            licencia.setCupoDisponible(cupoTotal);
            
            log.info("✅ Cupos inicializados: Civil={}, Militar={}, Empresa={}, Deportista={}, Total={}", 
                cupoCivil, cupoMilitar, cupoEmpresa, cupoDeportista, cupoTotal);
        } catch (Exception e) {
            log.error("❌ Error al inicializar cupos por defecto. Usando valores fallback.", e);
            // Valores fallback en caso de error
            licencia.setCupoCivil(25);
            licencia.setCupoMilitar(1000);
            licencia.setCupoEmpresa(1000);
            licencia.setCupoDeportista(1000);
            licencia.setCupoTotal(3025);
            licencia.setCupoDisponible(3025);
        }
    }

    /**
     * Resetea los cupos de una licencia a los valores por defecto del sistema.
     * Este método se debe llamar cuando una licencia se libera de un grupo de importación
     * (cuando el grupo está completo y ya no necesita la licencia).
     * 
     * @param licenciaId ID de la licencia a resetear
     * @return La licencia con los cupos reseteados
     */
    @Transactional
    public Licencia resetearCuposLicencia(Long licenciaId) {
        log.info("🔄 Reseteando cupos de licencia ID: {}", licenciaId);
        
        Licencia licencia = licenciaRepository.findById(licenciaId)
            .orElseThrow(() -> new RuntimeException("Licencia no encontrada con ID: " + licenciaId));
        
        // Reinicializar con valores por defecto
        inicializarCuposPorDefecto(licencia);
        
        // Cambiar estado a DISPONIBLE
        licencia.setEstadoOcupacion(EstadoOcupacionLicencia.DISPONIBLE);
        
        Licencia licenciaActualizada = licenciaRepository.save(licencia);
        
        log.info("✅ Cupos reseteados exitosamente para licencia: {}. Ahora está DISPONIBLE", licencia.getNumero());
        return licenciaActualizada;
    }
} 
