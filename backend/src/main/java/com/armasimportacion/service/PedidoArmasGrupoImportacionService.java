package com.armasimportacion.service;

import com.armasimportacion.dto.GrupoImportacionResumenDTO;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import com.armasimportacion.enums.EstadoGrupoImportacion;
import com.armasimportacion.enums.TipoDocumentoGenerado;
import com.armasimportacion.model.ClienteArma;
import com.armasimportacion.model.ClienteGrupoImportacion;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteArmaRepository;
import com.armasimportacion.repository.ClienteGrupoImportacionRepository;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@Transactional
public class PedidoArmasGrupoImportacionService {

    private final GrupoImportacionRepository grupoImportacionRepository;
    private final DocumentoGeneradoRepository documentoGeneradoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;
    private final FlyingSaucerPdfService flyingSaucerPdfService;
    private final ClienteGrupoImportacionRepository clienteGrupoRepository;
    private final ClienteArmaRepository clienteArmaRepository;
    
    // Inyección lazy para romper dependencia circular
    private final GrupoImportacionService grupoImportacionService;
    
    // Constructor con @Lazy en GrupoImportacionService
    public PedidoArmasGrupoImportacionService(
            GrupoImportacionRepository grupoImportacionRepository,
            DocumentoGeneradoRepository documentoGeneradoRepository,
            UsuarioRepository usuarioRepository,
            FileStorageService fileStorageService,
            FlyingSaucerPdfService flyingSaucerPdfService,
            ClienteGrupoImportacionRepository clienteGrupoRepository,
            ClienteArmaRepository clienteArmaRepository,
            @Lazy GrupoImportacionService grupoImportacionService) {
        this.grupoImportacionRepository = grupoImportacionRepository;
        this.documentoGeneradoRepository = documentoGeneradoRepository;
        this.usuarioRepository = usuarioRepository;
        this.fileStorageService = fileStorageService;
        this.flyingSaucerPdfService = flyingSaucerPdfService;
        this.clienteGrupoRepository = clienteGrupoRepository;
        this.clienteArmaRepository = clienteArmaRepository;
        this.grupoImportacionService = grupoImportacionService;
    }

    /**
     * Genera el documento PDF "Pedido_Armas_Grupo_Importacion_AAAA_MM_DD"
     * y lo guarda en documentos_generados/grupos_importacion/{grupoId}/{año}/{mes}/
     */
    public DocumentoGenerado generarPedidoArmas(Long grupoId, Long usuarioId) {
        log.info("📄 Generando pedido de armas para grupo de importación ID: {}", grupoId);
        
        // Validar que el grupo existe
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoId)
            .orElseThrow(() -> new RuntimeException("Grupo de importación no encontrado"));
        
        // Validar que el usuario existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Validar que el grupo puede definir pedido (estado permitido)
        if (grupo.getEstado() != EstadoGrupoImportacion.EN_PROCESO_ASIGNACION_CLIENTES &&
            grupo.getEstado() != EstadoGrupoImportacion.EN_PREPARACION) {
            throw new RuntimeException("El grupo no está en un estado válido para definir pedido. Estado actual: " + grupo.getEstado());
        }
        
        try {
            // Obtener resumen del grupo
            GrupoImportacionResumenDTO resumen = grupoImportacionService.obtenerResumenGrupo(grupoId);
            
            // Generar PDF
            byte[] pdfBytes = generarPDFPedido(grupo, resumen);
            
            // Obtener información del importador (nombre de la licencia)
            String nombreImportador = "";
            if (grupo.getLicencia() != null && grupo.getLicencia().getNombre() != null) {
                nombreImportador = grupo.getLicencia().getNombre()
                    .trim()
                    .replaceAll("[^a-zA-Z0-9\\s]", "") // Remover caracteres especiales
                    .replaceAll("\\s+", "_"); // Reemplazar espacios con guiones bajos
            }
            
            // Generar nombre del archivo: lista_importacion_fecha_importador.pdf
            LocalDate fechaActual = LocalDate.now();
            String fechaFormato = fechaActual.format(DateTimeFormatter.ofPattern("yyyy_MM_dd"));
            String nombreArchivo;
            if (!nombreImportador.isEmpty()) {
                nombreArchivo = String.format("lista_importacion_%s_%s.pdf", fechaFormato, nombreImportador);
            } else {
                nombreArchivo = String.format("lista_importacion_%s.pdf", fechaFormato);
            }
            
            // Guardar archivo en documentos_generados/grupos_importacion/{grupoId}/{año}/{mes}/
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoGrupoImportacion(
                grupoId, pdfBytes, nombreArchivo);
            
            // Crear registro en documento_generado
            DocumentoGenerado documento = new DocumentoGenerado();
            documento.setTipoDocumento(TipoDocumentoGenerado.PEDIDO_ARMAS_GRUPO_IMPORTACION);
            documento.setNombreArchivo(nombreArchivo);
            documento.setRutaArchivo(rutaArchivo);
            documento.setTamanioBytes((long) pdfBytes.length);
            documento.setNombre("Pedido de Armas - " + grupo.getNombre());
            documento.setDescripcion("Pedido de armas para grupo de importación " + grupo.getCodigo());
            documento.setGrupoImportacion(grupo);
            documento.setUsuarioGenerador(usuario);
            documento.setFechaGeneracion(LocalDateTime.now());
            documento.setEstado(EstadoDocumentoGenerado.GENERADO);
            
            DocumentoGenerado documentoGuardado = documentoGeneradoRepository.save(documento);
            
            // Cambiar estado del grupo a SOLICITAR_PROFORMA_FABRICA
            grupo.setEstado(EstadoGrupoImportacion.SOLICITAR_PROFORMA_FABRICA);
            grupo.setFechaActualizacion(LocalDateTime.now());
            grupoImportacionRepository.save(grupo);
            
            log.info("✅ Pedido de armas generado y guardado con ID: {}, archivo: {}", 
                documentoGuardado.getId(), nombreArchivo);
            
            return documentoGuardado;
            
        } catch (Exception e) {
            log.error("❌ Error generando pedido de armas para grupo ID: {}: {}", grupoId, e.getMessage(), e);
            throw new RuntimeException("Error generando pedido de armas", e);
        }
    }

    /**
     * Genera el PDF del pedido usando Flying Saucer
     */
    private byte[] generarPDFPedido(GrupoImportacion grupo, GrupoImportacionResumenDTO resumen) throws Exception {
        log.info("🔧 Generando PDF del pedido con Flying Saucer para grupo: {}", grupo.getCodigo());
        
        // Obtener clientes del grupo
        List<ClienteGrupoImportacion> clientesGrupo = clienteGrupoRepository.findByGrupoImportacionId(grupo.getId());
        
        // Obtener armas de todos los clientes del grupo (solo RESERVADAS o ASIGNADAS)
        List<ClienteArma> armasGrupo = new java.util.ArrayList<>();
        for (ClienteGrupoImportacion clienteGrupo : clientesGrupo) {
            List<ClienteArma> armasCliente = clienteArmaRepository.findByClienteIdAndEstado(
                clienteGrupo.getCliente().getId(), 
                ClienteArma.EstadoClienteArma.RESERVADA
            );
            // También incluir armas ASIGNADAS por si acaso
            armasCliente.addAll(clienteArmaRepository.findByClienteIdAndEstado(
                clienteGrupo.getCliente().getId(), 
                ClienteArma.EstadoClienteArma.ASIGNADA
            ));
            armasGrupo.addAll(armasCliente);
        }
        
        log.info("📋 Total de armas encontradas para el grupo: {}", armasGrupo.size());
        
        // Agrupar armas por modelo (nombre + calibre) y sumar cantidades
        Map<String, Map<String, Object>> armasAgrupadas = new HashMap<>();
        for (ClienteArma clienteArma : armasGrupo) {
            String clave = clienteArma.getArma().getNombre() + "|" + 
                          (clienteArma.getArma().getCalibre() != null ? clienteArma.getArma().getCalibre() : "");
            
            if (!armasAgrupadas.containsKey(clave)) {
                Map<String, Object> armaData = new HashMap<>();
                armaData.put("nombre", clienteArma.getArma().getNombre());
                armaData.put("calibre", clienteArma.getArma().getCalibre());
                armaData.put("capacidad", clienteArma.getArma().getCapacidad());
                armaData.put("cantidad", 0);
                armasAgrupadas.put(clave, armaData);
            }
            
            // Sumar cantidad
            Map<String, Object> armaData = armasAgrupadas.get(clave);
            int cantidadActual = (Integer) armaData.get("cantidad");
            int cantidadArma = clienteArma.getCantidad() != null ? clienteArma.getCantidad() : 1;
            armaData.put("cantidad", cantidadActual + cantidadArma);
        }
        
        // Convertir a lista para el template
        List<Map<String, Object>> armasLista = new java.util.ArrayList<>(armasAgrupadas.values());
        
        log.info("📋 Total de tipos de armas diferentes: {}", armasLista.size());
        
        // Preparar variables para el template
        Map<String, Object> variables = new HashMap<>();
        variables.put("grupo", grupo);
        variables.put("resumen", resumen);
        variables.put("armas", armasLista);
        variables.put("fechaActual", LocalDate.now().format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy")));
        variables.put("fechaActualCorta", LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        
        // Información de la licencia
        if (grupo.getLicencia() != null) {
            variables.put("licencia", grupo.getLicencia());
            variables.put("numeroLicencia", grupo.getLicencia().getNumero());
        }
        
        // Generar PDF usando Flying Saucer
        byte[] pdfBytes = flyingSaucerPdfService.generarPdfDesdeTemplate(
            "pedidos/pedido_armas_grupo_importacion", variables);
        
        log.info("✅ PDF del pedido generado exitosamente, tamaño: {} bytes", pdfBytes.length);
        return pdfBytes;
    }
}

