package com.armasimportacion.service;

import com.armasimportacion.dto.DocumentoGrupoImportacionDTO;
import com.armasimportacion.enums.EstadoDocumentoGrupo;
import com.armasimportacion.mapper.DocumentoGrupoImportacionMapper;
import com.armasimportacion.model.DocumentoGrupoImportacion;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.DocumentoGrupoImportacionRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.TipoDocumentoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentoGrupoImportacionService {

    private final DocumentoGrupoImportacionRepository repository;
    private final GrupoImportacionRepository grupoImportacionRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;
    private final DocumentoGrupoImportacionMapper mapper;

    /**
     * Carga un documento para un grupo de importación
     */
    public DocumentoGrupoImportacionDTO cargarDocumento(
            Long grupoId, 
            Long tipoDocumentoId, 
            MultipartFile archivo, 
            String descripcion, 
            Long usuarioId) throws IOException {
        
        // Validar que el grupo existe
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new RuntimeException("Grupo de importación no encontrado"));
        
        // Validar que el tipo de documento existe y es para grupos de importación
        TipoDocumento tipoDocumento = tipoDocumentoRepository.findById(tipoDocumentoId)
            .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado"));
        
        if (!tipoDocumento.getGruposImportacion()) {
            throw new RuntimeException("El tipo de documento no es válido para grupos de importación");
        }
        
        // Validar que el usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Crear nuevo documento
        DocumentoGrupoImportacion documento = new DocumentoGrupoImportacion();
        documento.setGrupoImportacion(grupo);
        documento.setTipoDocumento(tipoDocumento);
        documento.setUsuarioCarga(usuario);
        documento.setFechaCarga(LocalDateTime.now());
        documento.setEstado(EstadoDocumentoGrupo.CARGADO);
        log.info("📄 Creando nuevo documento del tipo: {} (ID: {}) para grupo: {}", 
            tipoDocumento.getNombre(), tipoDocumentoId, grupoId);
        
        // Guardar archivo físico
        String rutaArchivo = fileStorageService.storeGrupoImportacionDocument(grupoId, tipoDocumentoId, archivo);
        
        // Extraer el nombre del archivo de la ruta
        String nombreArchivoGenerado = Paths.get(rutaArchivo).getFileName().toString();
        
        // Actualizar entidad
        documento.setRutaArchivo(rutaArchivo);
        documento.setNombreArchivo(nombreArchivoGenerado);
        documento.setTamanioBytes(archivo.getSize());
        documento.setDescripcion(descripcion);
        documento.setNombre(tipoDocumento.getNombre());
        
        DocumentoGrupoImportacion saved = repository.save(documento);
        log.info("✅ Documento guardado con ID: {}", saved.getId());
        
        return mapper.toDTO(saved);
    }

    /**
     * Obtiene todos los documentos de un grupo de importación
     */
    @Transactional(readOnly = true)
    public List<DocumentoGrupoImportacionDTO> obtenerDocumentosPorGrupo(Long grupoId) {
        List<DocumentoGrupoImportacion> documentos = repository.findByGrupoImportacionId(grupoId);
        return mapper.toDTOList(documentos);
    }

    /**
     * Obtiene documentos de un grupo por tipo de documento
     */
    @Transactional(readOnly = true)
    public List<DocumentoGrupoImportacionDTO> obtenerDocumentosPorTipo(Long grupoId, Long tipoDocumentoId) {
        List<DocumentoGrupoImportacion> documentos = repository.findByGrupoImportacionIdAndTipoDocumentoId(grupoId, tipoDocumentoId);
        return mapper.toDTOList(documentos);
    }

    /**
     * Obtiene un documento por ID
     */
    @Transactional(readOnly = true)
    public DocumentoGrupoImportacionDTO obtenerDocumentoPorId(Long documentoId) {
        DocumentoGrupoImportacion documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        return mapper.toDTO(documento);
    }

    /**
     * Elimina un documento
     */
    public void eliminarDocumento(Long documentoId) {
        DocumentoGrupoImportacion documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        
        // Eliminar archivo físico
        if (documento.getRutaArchivo() != null) {
            fileStorageService.deleteFile(documento.getRutaArchivo());
        }
        
        repository.delete(documento);
        log.info("✅ Documento eliminado con ID: {}", documentoId);
    }

    /**
     * Verifica si los documentos requeridos (1, 2, 3) están cargados
     * 1. Proforma a fabrica para importacion
     * 2. Solicitar carta inspeccion de rastrillo
     * 3. Documento de resolucion de importacion
     */
    @Transactional(readOnly = true)
    public boolean verificarDocumentosRequeridos(Long grupoId) {
        // Obtener los tipos de documento requeridos (1, 2, 3)
        List<TipoDocumento> tiposRequeridos = tipoDocumentoRepository.findByGruposImportacionAndEstado(true, true);
        
        // Filtrar solo los primeros 3 documentos requeridos
        List<String> nombresRequeridos = List.of(
            "Proforma a fabrica para importacion",
            "Solicitar carta inspeccion de rastrillo",
            "Documento de resolucion de importacion"
        );
        
        tiposRequeridos = tiposRequeridos.stream()
            .filter(td -> nombresRequeridos.contains(td.getNombre()))
            .toList();
        
        if (tiposRequeridos.size() != 3) {
            log.warn("⚠️ No se encontraron los 3 tipos de documento requeridos");
            return false;
        }
        
        // Verificar que cada tipo tenga al menos un documento cargado
        for (TipoDocumento tipoRequerido : tiposRequeridos) {
            List<DocumentoGrupoImportacion> documentos = repository
                .findByGrupoImportacionIdAndTipoDocumentoId(grupoId, tipoRequerido.getId());
            
            boolean tieneDocumentoCargado = documentos.stream()
                .anyMatch(doc -> doc.getEstado() == EstadoDocumentoGrupo.CARGADO || 
                               doc.getEstado() == EstadoDocumentoGrupo.APROBADO);
            
            if (!tieneDocumentoCargado) {
                log.info("⚠️ Falta documento: {}", tipoRequerido.getNombre());
                return false;
            }
        }
        
        log.info("✅ Todos los documentos requeridos están cargados para el grupo: {}", grupoId);
        return true;
    }

    /**
     * Cambia el estado de un documento
     */
    public DocumentoGrupoImportacionDTO cambiarEstado(Long documentoId, EstadoDocumentoGrupo nuevoEstado) {
        DocumentoGrupoImportacion documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        
        documento.setEstado(nuevoEstado);
        documento.setFechaActualizacion(LocalDateTime.now());
        
        DocumentoGrupoImportacion updated = repository.save(documento);
        log.info("✅ Estado del documento {} cambiado a: {}", documentoId, nuevoEstado);
        
        return mapper.toDTO(updated);
    }

    /**
     * Obtiene información sobre documentos faltantes para un grupo
     * Retorna un mapa con información sobre qué documentos están cargados y cuáles faltan
     */
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadoDocumentos(Long grupoId) {
        Map<String, Object> estado = new HashMap<>();
        
        // Obtener todos los tipos de documento para grupos de importación
        List<TipoDocumento> todosLosTipos = tipoDocumentoRepository.findByGruposImportacionAndEstado(true, true);
        
        // Obtener documentos cargados del grupo
        List<DocumentoGrupoImportacion> documentosCargados = repository.findByGrupoImportacionId(grupoId);
        
        // Crear un set de IDs de tipos de documento que ya tienen documentos cargados
        Set<Long> tiposConDocumento = documentosCargados.stream()
            .filter(doc -> doc.getEstado() == EstadoDocumentoGrupo.CARGADO || 
                          doc.getEstado() == EstadoDocumentoGrupo.APROBADO)
            .map(doc -> doc.getTipoDocumento().getId())
            .collect(Collectors.toSet());
        
        // Contar documentos cargados y faltantes
        int totalDocumentos = todosLosTipos.size();
        int documentosCargadosCount = tiposConDocumento.size();
        int documentosFaltantes = totalDocumentos - documentosCargadosCount;
        
        // Identificar los primeros 3 documentos requeridos
        List<String> nombresRequeridos = List.of(
            "Proforma a fabrica para importacion",
            "Solicitar carta inspeccion de rastrillo",
            "Documento de resolucion de importacion"
        );
        
        List<TipoDocumento> documentosRequeridos = todosLosTipos.stream()
            .filter(td -> nombresRequeridos.contains(td.getNombre()))
            .toList();
        
        int documentosRequeridosCargados = (int) documentosRequeridos.stream()
            .filter(td -> tiposConDocumento.contains(td.getId()))
            .count();
        
        boolean puedeNotificarPago = documentosRequeridosCargados == 3;
        
        estado.put("totalDocumentos", totalDocumentos);
        estado.put("documentosCargados", documentosCargadosCount);
        estado.put("documentosFaltantes", documentosFaltantes);
        estado.put("documentosRequeridosCargados", documentosRequeridosCargados);
        estado.put("documentosRequeridosTotal", 3);
        estado.put("puedeNotificarPago", puedeNotificarPago);
        estado.put("porcentajeCompletado", totalDocumentos > 0 ? 
            (documentosCargadosCount * 100 / totalDocumentos) : 0);
        
        return estado;
    }
}

