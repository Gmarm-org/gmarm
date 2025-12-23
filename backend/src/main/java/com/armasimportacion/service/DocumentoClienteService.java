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
import com.armasimportacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
        
        // Siempre crear un nuevo documento (permitir múltiples documentos del mismo tipo)
        DocumentoCliente documento = new DocumentoCliente();
        documento.setCliente(cliente);
        documento.setTipoDocumento(tipoDocumento);
        documento.setUsuarioCarga(usuario);
        documento.setFechaCarga(LocalDateTime.now());
        log.info("📄 Creando nuevo documento del tipo: {} (ID: {})", tipoDocumento.getNombre(), tipoDocumentoId);
        
        // Guardar archivo físico usando numeroIdentificacion
        String rutaArchivo = fileStorageService.storeClientDocument(cliente.getNumeroIdentificacion(), tipoDocumentoId, archivo);
        
        // Extraer el nombre del archivo de la ruta (que ya incluye el nombre único generado)
        String nombreArchivoGenerado = Paths.get(rutaArchivo).getFileName().toString();
        
        // Actualizar entidad
        documento.setRutaArchivo(rutaArchivo);
        documento.setNombreArchivo(nombreArchivoGenerado);
        documento.setTipoArchivo(archivo.getContentType());
        documento.setTamanioArchivo(archivo.getSize());
        documento.setDescripcion(descripcion);
        documento.setEstado(DocumentoCliente.EstadoDocumento.PENDIENTE);
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
        
        // Guardar nuevo archivo usando numeroIdentificacion
        String rutaArchivo = fileStorageService.storeClientDocument(
            documento.getCliente().getNumeroIdentificacion(), 
            documento.getTipoDocumento().getId(), 
            archivo
        );
        
        // Extraer el nombre del archivo de la ruta (que ya incluye el nombre único generado)
        String nombreArchivoGenerado = Paths.get(rutaArchivo).getFileName().toString();
        
        // Actualizar entidad
        documento.setRutaArchivo(rutaArchivo);
        documento.setNombreArchivo(nombreArchivoGenerado);
        documento.setTipoArchivo(archivo.getContentType());
        documento.setTamanioArchivo(archivo.getSize());
        documento.setDescripcion(descripcion);
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
        
        // Verificar que todos los tipos obligatorios tengan documentos aprobados
        for (TipoDocumento tipoObligatorio : tiposObligatorios) {
            boolean tieneDocumentoAprobado = documentosCargados.stream()
                .anyMatch(doc -> doc.getTipoDocumento().getId().equals(tipoObligatorio.getId()) &&
                                doc.getEstado() == DocumentoCliente.EstadoDocumento.APROBADO);
            
            if (!tieneDocumentoAprobado) {
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
