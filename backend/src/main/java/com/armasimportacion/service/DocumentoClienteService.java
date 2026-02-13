package com.armasimportacion.service;

import com.armasimportacion.dto.DocumentoClienteDTO;
import com.armasimportacion.mapper.DocumentoClienteMapper;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.DocumentoCliente;
import com.armasimportacion.model.TipoDocumento;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.DocumentoClienteRepository;
import com.armasimportacion.repository.TipoDocumentoRepository;
import com.armasimportacion.enums.EstadoCliente;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentoClienteService {

    private final DocumentoClienteRepository repository;
    private final ClienteRepository clienteRepository;
    private final TipoDocumentoRepository tipoDocumentoRepository;
    private final TipoDocumentoService tipoDocumentoService;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;
    private final DocumentoClienteMapper mapper;

    public DocumentoClienteDTO cargarDocumento(Long clienteId, Long tipoDocumentoId, 
                                             MultipartFile archivo, String descripcion, Long usuarioId) throws IOException {
        
        // Validar que el cliente existe
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        // Validar que el tipo de documento existe
        TipoDocumento tipoDocumento = tipoDocumentoRepository.findById(tipoDocumentoId)
            .orElseThrow(() -> new RuntimeException("Tipo de documento no encontrado"));
        
        // Validar que el usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // TRAZABILIDAD: Marcar documentos anteriores del mismo tipo como REEMPLAZADOS
        // Esto mantiene el historial completo en la BD sin perder información
        // IMPORTANTE: Buscar TODOS los documentos del mismo tipo, incluso los que ya están REEMPLAZADOS
        // para asegurar que solo quede UN documento activo del mismo tipo
        List<DocumentoCliente> documentosAnteriores = repository.findByClienteId(clienteId).stream()
            .filter(doc -> doc.getTipoDocumento().getId().equals(tipoDocumentoId))
            .filter(doc -> doc.getEstado() != DocumentoCliente.EstadoDocumento.REEMPLAZADO) // No reemplazar los ya reemplazados
            .collect(java.util.stream.Collectors.toList());
        
        if (!documentosAnteriores.isEmpty()) {
            log.info("📋 Encontrados {} documento(s) anterior(es) del tipo '{}' que serán marcados como REEMPLAZADO y sus archivos físicos eliminados", 
                    documentosAnteriores.size(), tipoDocumento.getNombre());
            
            int eliminadosExitosos = 0;
            int eliminadosFallidos = 0;
            
            for (DocumentoCliente docAnterior : documentosAnteriores) {
                // Eliminar archivo físico para liberar espacio en disco
                if (docAnterior.getRutaArchivo() != null && !docAnterior.getRutaArchivo().trim().isEmpty()) {
                    try {
                        // La ruta en BD es relativa (ej: "documentos_clientes/{cedula}/documentos_cargados/archivo.pdf")
                        // FileStorageService.deleteFile ya maneja la construcción de la ruta completa
                        fileStorageService.deleteFile(docAnterior.getRutaArchivo());
                        log.info("🗑️ Archivo físico eliminado exitosamente: {}", docAnterior.getRutaArchivo());
                        eliminadosExitosos++;
                    } catch (Exception e) {
                        log.error("❌ ERROR CRÍTICO: No se pudo eliminar el archivo físico {}: {}", 
                                docAnterior.getRutaArchivo(), e.getMessage(), e);
                        eliminadosFallidos++;
                        // Continuar aunque falle la eliminación del archivo (puede que ya no exista)
                    }
                } else {
                    log.warn("⚠️ Documento ID {} no tiene ruta de archivo, solo se marcará como REEMPLAZADO en BD", docAnterior.getId());
                }
                
                // Marcar como REEMPLAZADO en BD (mantener registro para trazabilidad)
                docAnterior.setEstado(DocumentoCliente.EstadoDocumento.REEMPLAZADO);
                docAnterior.setFechaActualizacion(LocalDateTime.now());
                docAnterior.setUsuarioRevision(usuario);
                // Limpiar ruta del archivo ya que fue eliminado (o no tenía)
                docAnterior.setRutaArchivo(null);
                docAnterior.setNombreArchivo(null);
                repository.save(docAnterior);
                log.info("✅ Documento ID {} marcado como REEMPLAZADO en BD", docAnterior.getId());
            }
            
            log.info("✅ Proceso de reemplazo completado: {} archivo(s) eliminado(s) exitosamente, {} fallido(s). {} documento(s) marcado(s) como REEMPLAZADO en BD.", 
                    eliminadosExitosos, eliminadosFallidos, documentosAnteriores.size());
        } else {
            log.info("ℹ️ No hay documentos anteriores del tipo '{}' para reemplazar. Se creará un nuevo documento.", tipoDocumento.getNombre());
        }
        
        // Crear nuevo documento (siempre crear uno nuevo para mantener historial)
        DocumentoCliente documento = new DocumentoCliente();
        documento.setCliente(cliente);
        documento.setTipoDocumento(tipoDocumento);
        documento.setUsuarioCarga(usuario);
        documento.setFechaCarga(LocalDateTime.now());
        log.info("📄 Creando nuevo documento del tipo: {} (ID: {})", tipoDocumento.getNombre(), tipoDocumentoId);
        
        // Guardar archivo físico usando numeroIdentificacion y nombre del tipo de documento
        String rutaArchivo = fileStorageService.storeClientDocument(
            cliente.getNumeroIdentificacion(), 
            tipoDocumentoId, 
            archivo, 
            tipoDocumento.getNombre()
        );
        
        // Extraer el nombre del archivo de la ruta (que ya incluye el nombre único generado)
        String nombreArchivoGenerado = Paths.get(rutaArchivo).getFileName().toString();
        
        // Actualizar entidad
        documento.setRutaArchivo(rutaArchivo);
        documento.setNombreArchivo(nombreArchivoGenerado);
        documento.setTipoArchivo(archivo.getContentType());
        documento.setTamanioArchivo(archivo.getSize());
        documento.setDescripcion(descripcion);
        documento.setEstado(DocumentoCliente.EstadoDocumento.CARGADO); // Documento cargado por el vendedor
        documento.setFechaActualizacion(LocalDateTime.now());
        
        DocumentoCliente saved = repository.save(documento);
        return mapper.toDTO(saved);
    }

    public DocumentoClienteDTO actualizarDocumento(Long documentoId, MultipartFile archivo, 
                                                 String descripcion, Long usuarioId) throws IOException {
        
        DocumentoCliente documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        
        // Validar que el usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Eliminar archivo anterior
        if (documento.getRutaArchivo() != null) {
            fileStorageService.deleteFile(documento.getRutaArchivo());
        }
        
        // Guardar nuevo archivo usando numeroIdentificacion y nombre del tipo de documento
        String rutaArchivo = fileStorageService.storeClientDocument(
            documento.getCliente().getNumeroIdentificacion(), 
            documento.getTipoDocumento().getId(), 
            archivo,
            documento.getTipoDocumento().getNombre()
        );
        
        // Extraer el nombre del archivo de la ruta (que ya incluye el nombre único generado)
        String nombreArchivoGenerado = Paths.get(rutaArchivo).getFileName().toString();
        
        // Actualizar entidad
        documento.setRutaArchivo(rutaArchivo);
        documento.setNombreArchivo(nombreArchivoGenerado);
        documento.setTipoArchivo(archivo.getContentType());
        documento.setTamanioArchivo(archivo.getSize());
        documento.setDescripcion(descripcion);
        documento.setEstado(DocumentoCliente.EstadoDocumento.CARGADO); // Documento cargado por el vendedor
        documento.setUsuarioRevision(usuario);
        documento.setFechaActualizacion(LocalDateTime.now());
        
        DocumentoCliente updated = repository.save(documento);
        return mapper.toDTO(updated);
    }

    public List<DocumentoClienteDTO> getDocumentosByCliente(Long clienteId) {
        List<DocumentoCliente> documentos = repository.findByClienteId(clienteId);
        return mapper.toDTOList(documentos);
    }

    public DocumentoClienteDTO getDocumentoById(Long documentoId) {
        DocumentoCliente documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        return mapper.toDTO(documento);
    }

    public void deleteDocumento(Long documentoId) {
        DocumentoCliente documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        
        // Eliminar archivo físico
        if (documento.getRutaArchivo() != null) {
            fileStorageService.deleteFile(documento.getRutaArchivo());
        }
        
        repository.delete(documento);
    }

    public DocumentoClienteDTO cambiarEstado(Long documentoId, DocumentoCliente.EstadoDocumento nuevoEstado) {
        DocumentoCliente documento = repository.findById(documentoId)
            .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        
        documento.setEstado(nuevoEstado);
        documento.setFechaActualizacion(LocalDateTime.now());
        
        DocumentoCliente updated = repository.save(documento);
        return mapper.toDTO(updated);
    }

    public boolean verificarDocumentosCompletos(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        // Si el cliente es fantasma, no requiere documentos obligatorios (es temporal)
        // Los clientes fantasma son para almacenar armas del vendedor sin cliente específico
        if (cliente.getEstado() == EstadoCliente.PENDIENTE_ASIGNACION_CLIENTE) {
            log.debug("⚠️ Cliente fantasma detectado - no requiere documentos obligatorios");
            return true;
        }
        
        // Si no tiene tipoProcesoId, no hay documentos obligatorios
        if (cliente.getTipoProcesoId() == null) {
            log.debug("⚠️ Cliente sin tipoProcesoId - no hay documentos obligatorios");
            return true;
        }
        
        // Obtener todos los tipos de documento obligatorios para el tipo de proceso del cliente
        // Usar el servicio que excluye documentos de grupos de importación
        List<TipoDocumento> tiposObligatorios = tipoDocumentoService.findByTipoProcesoId(
            cliente.getTipoProcesoId()
        ).stream()
        .filter(TipoDocumento::getObligatorio)
        .collect(java.util.stream.Collectors.toList());
        
        if (tiposObligatorios.isEmpty()) {
            return true; // No hay documentos obligatorios
        }
        
        // Obtener documentos cargados del cliente
        List<DocumentoCliente> documentosCargados = repository.findByClienteId(clienteId);
        
        // Verificar que todos los tipos obligatorios tengan documentos CARGADOS o APROBADOS (excluyendo los reemplazados)
        // CARGADO = documento subido por el vendedor, listo para verificar completitud
        // APROBADO = documento validado y aprobado
        // PENDIENTE = documento NO cargado (falta subirlo)
        for (TipoDocumento tipoObligatorio : tiposObligatorios) {
            boolean tieneDocumentoCargado = documentosCargados.stream()
                .filter(doc -> doc.getEstado() != DocumentoCliente.EstadoDocumento.REEMPLAZADO) // Excluir reemplazados
                .anyMatch(doc -> {
                    boolean mismoTipo = doc.getTipoDocumento().getId().equals(tipoObligatorio.getId());
                    // Aceptar tanto CARGADO como APROBADO. PENDIENTE significa que no está cargado.
                    boolean estadoValido = doc.getEstado() == DocumentoCliente.EstadoDocumento.CARGADO ||
                                          doc.getEstado() == DocumentoCliente.EstadoDocumento.APROBADO;
                    return mismoTipo && estadoValido;
                });
            
            if (!tieneDocumentoCargado) {
                log.debug("❌ Falta documento obligatorio cargado o aprobado: {} (ID: {})", tipoObligatorio.getNombre(), tipoObligatorio.getId());
                return false;
            }
        }
        
        return true;
    }

    public DocumentoResumenDTO getResumenDocumentos(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        
        // Obtener tipos de documento para el tipo de proceso del cliente (excluye documentos de grupos de importación)
        List<TipoDocumento> tiposDocumento = tipoDocumentoService.findByTipoProcesoId(
            cliente.getTipoProcesoId()
        );
        
        // Obtener documentos cargados del cliente
        List<DocumentoCliente> documentosCargados = repository.findByClienteId(clienteId);
        
        // Crear resumen
        DocumentoResumenDTO resumen = new DocumentoResumenDTO();
        resumen.setClienteId(clienteId);
        resumen.setTotalTiposDocumento(tiposDocumento.size());
        resumen.setTotalDocumentosCargados(documentosCargados.size());
        
        // Contar por estado
        long pendientes = documentosCargados.stream()
            .filter(doc -> doc.getEstado() == DocumentoCliente.EstadoDocumento.PENDIENTE)
            .count();
        long aprobados = documentosCargados.stream()
            .filter(doc -> doc.getEstado() == DocumentoCliente.EstadoDocumento.APROBADO)
            .count();
        long rechazados = documentosCargados.stream()
            .filter(doc -> doc.getEstado() == DocumentoCliente.EstadoDocumento.RECHAZADO)
            .count();
        long observados = documentosCargados.stream()
            .filter(doc -> doc.getEstado() == DocumentoCliente.EstadoDocumento.OBSERVADO)
            .count();
        
        resumen.setPendientes((int) pendientes);
        resumen.setAprobados((int) aprobados);
        resumen.setRechazados((int) rechazados);
        resumen.setObservados((int) observados);
        
        // Verificar completitud
        resumen.setCompleto(verificarDocumentosCompletos(clienteId));
        
        return resumen;
    }

    // DTO interno para resumen
    public static class DocumentoResumenDTO {
        private Long clienteId;
        private int totalTiposDocumento;
        private int totalDocumentosCargados;
        private int pendientes;
        private int aprobados;
        private int rechazados;
        private int observados;
        private boolean completo;
        
        // Getters y setters
        public Long getClienteId() { return clienteId; }
        public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
        
        public int getTotalTiposDocumento() { return totalTiposDocumento; }
        public void setTotalTiposDocumento(int totalTiposDocumento) { this.totalTiposDocumento = totalTiposDocumento; }
        
        public int getTotalDocumentosCargados() { return totalDocumentosCargados; }
        public void setTotalDocumentosCargados(int totalDocumentosCargados) { this.totalDocumentosCargados = totalDocumentosCargados; }
        
        public int getPendientes() { return pendientes; }
        public void setPendientes(int pendientes) { this.pendientes = pendientes; }
        
        public int getAprobados() { return aprobados; }
        public void setAprobados(int aprobados) { this.aprobados = aprobados; }
        
        public int getRechazados() { return rechazados; }
        public void setRechazados(int rechazados) { this.rechazados = rechazados; }
        
        public int getObservados() { return observados; }
        public void setObservados(int observados) { this.observados = observados; }
        
        public boolean isCompleto() { return completo; }
        public void setCompleto(boolean completo) { this.completo = completo; }
    }
}
