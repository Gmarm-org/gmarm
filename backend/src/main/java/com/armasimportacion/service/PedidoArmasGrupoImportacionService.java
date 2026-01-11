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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

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
     * Genera el documento Excel "lista_importacion_AAAA_MM_DD_importador.xlsx"
     * con lista de armas y licencias en cabecera
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
            
            // Generar Excel
            byte[] excelBytes = generarExcelPedido(grupo, resumen);
            
            // Obtener información del importador (nombre de la licencia)
            String nombreImportador = "";
            if (grupo.getLicencia() != null && grupo.getLicencia().getNombre() != null) {
                nombreImportador = grupo.getLicencia().getNombre()
                    .trim()
                    .replaceAll("[^a-zA-Z0-9\\s]", "") // Remover caracteres especiales
                    .replaceAll("\\s+", "_"); // Reemplazar espacios con guiones bajos
            }
            
            // Generar nombre del archivo: lista_importacion_fecha_importador.xlsx
            LocalDate fechaActual = LocalDate.now();
            String fechaFormato = fechaActual.format(DateTimeFormatter.ofPattern("yyyy_MM_dd"));
            String nombreArchivo;
            if (!nombreImportador.isEmpty()) {
                nombreArchivo = String.format("lista_importacion_%s_%s.xlsx", fechaFormato, nombreImportador);
            } else {
                nombreArchivo = String.format("lista_importacion_%s.xlsx", fechaFormato);
            }
            
            // Guardar archivo en documentos_generados/grupos_importacion/{grupoId}/{año}/{mes}/
            String rutaArchivo = fileStorageService.guardarDocumentoGeneradoGrupoImportacion(
                grupoId, excelBytes, nombreArchivo);
            
            // Crear registro en documento_generado
            DocumentoGenerado documento = new DocumentoGenerado();
            documento.setTipoDocumento(TipoDocumentoGenerado.PEDIDO_ARMAS_GRUPO_IMPORTACION);
            documento.setNombreArchivo(nombreArchivo);
            documento.setRutaArchivo(rutaArchivo);
            documento.setTamanioBytes((long) excelBytes.length);
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
     * Genera el Excel del pedido con lista de armas y licencias en cabecera
     */
    private byte[] generarExcelPedido(GrupoImportacion grupo, GrupoImportacionResumenDTO resumen) throws IOException {
        log.info("🔧 Generando Excel del pedido para grupo: {}", grupo.getCodigo());
        
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
            String clave = clienteArma.getArma().getModelo() + "|" + 
                          (clienteArma.getArma().getCalibre() != null ? clienteArma.getArma().getCalibre() : "");
            
            if (!armasAgrupadas.containsKey(clave)) {
                Map<String, Object> armaData = new HashMap<>();
                armaData.put("nombre", clienteArma.getArma().getModelo()); // Cambiado de nombre a modelo
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
        
        // Convertir a lista para el Excel
        List<Map<String, Object>> armasLista = new java.util.ArrayList<>(armasAgrupadas.values());
        
        log.info("📋 Total de tipos de armas diferentes: {}", armasLista.size());
        
        // Crear workbook de Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Pedido de Armas");
            
            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            
            CellStyle infoStyle = workbook.createCellStyle();
            infoStyle.setBorderBottom(BorderStyle.THIN);
            infoStyle.setBorderTop(BorderStyle.THIN);
            infoStyle.setBorderLeft(BorderStyle.THIN);
            infoStyle.setBorderRight(BorderStyle.THIN);
            
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setAlignment(HorizontalAlignment.LEFT);
            
            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setBorderBottom(BorderStyle.THIN);
            numberStyle.setBorderTop(BorderStyle.THIN);
            numberStyle.setBorderLeft(BorderStyle.THIN);
            numberStyle.setBorderRight(BorderStyle.THIN);
            numberStyle.setAlignment(HorizontalAlignment.CENTER);
            
            int rowNum = 0;
            
            // Título
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PEDIDO DE ARMAS - GRUPO DE IMPORTACIÓN");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowNum - 1, rowNum - 1, 0, 3));
            
            rowNum++; // Espacio
            
            // Información de la licencia en cabecera
            if (grupo.getLicencia() != null) {
                Row licenciaRow1 = sheet.createRow(rowNum++);
                Cell licenciaLabel1 = licenciaRow1.createCell(0);
                licenciaLabel1.setCellValue("LICENCIA:");
                licenciaLabel1.setCellStyle(headerStyle);
                Cell licenciaValue1 = licenciaRow1.createCell(1);
                licenciaValue1.setCellValue(grupo.getLicencia().getNombre() != null ? grupo.getLicencia().getNombre() : "");
                licenciaValue1.setCellStyle(infoStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 3));
                
                Row licenciaRow2 = sheet.createRow(rowNum++);
                Cell licenciaLabel2 = licenciaRow2.createCell(0);
                licenciaLabel2.setCellValue("NÚMERO DE LICENCIA:");
                licenciaLabel2.setCellStyle(headerStyle);
                Cell licenciaValue2 = licenciaRow2.createCell(1);
                licenciaValue2.setCellValue(grupo.getLicencia().getNumero() != null ? grupo.getLicencia().getNumero() : "");
                licenciaValue2.setCellStyle(infoStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 3));
            }
            
            rowNum++; // Espacio
            
            // Información del grupo
            Row grupoRow1 = sheet.createRow(rowNum++);
            Cell grupoLabel1 = grupoRow1.createCell(0);
            grupoLabel1.setCellValue("GRUPO DE IMPORTACIÓN:");
            grupoLabel1.setCellStyle(headerStyle);
            Cell grupoValue1 = grupoRow1.createCell(1);
            grupoValue1.setCellValue(grupo.getNombre() != null ? grupo.getNombre() : "");
            grupoValue1.setCellStyle(infoStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 3));
            
            Row grupoRow2 = sheet.createRow(rowNum++);
            Cell grupoLabel2 = grupoRow2.createCell(0);
            grupoLabel2.setCellValue("CÓDIGO DEL GRUPO:");
            grupoLabel2.setCellStyle(headerStyle);
            Cell grupoValue2 = grupoRow2.createCell(1);
            grupoValue2.setCellValue(grupo.getCodigo() != null ? grupo.getCodigo() : "");
            grupoValue2.setCellStyle(infoStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 3));
            
            Row fechaRow = sheet.createRow(rowNum++);
            Cell fechaLabel = fechaRow.createCell(0);
            fechaLabel.setCellValue("FECHA:");
            fechaLabel.setCellStyle(headerStyle);
            Cell fechaValue = fechaRow.createCell(1);
            fechaValue.setCellValue(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            fechaValue.setCellStyle(infoStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 3));
            
            rowNum++; // Espacio
            
            // Encabezados de tabla
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"ORD.", "ARMAS PARA IMPORTAR", "CANT."};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Datos de armas
            int orden = 1;
            int totalCantidad = 0;
            for (Map<String, Object> arma : armasLista) {
                Row dataRow = sheet.createRow(rowNum++);
                
                // Orden
                Cell ordenCell = dataRow.createCell(0);
                ordenCell.setCellValue(orden++);
                ordenCell.setCellStyle(numberStyle);
                
                // Descripción del arma
                Cell armaCell = dataRow.createCell(1);
                StringBuilder descripcion = new StringBuilder();
                descripcion.append("Pistola Modelo, ");
                if (arma.get("nombre") != null) {
                    descripcion.append(arma.get("nombre").toString());
                }
                if (arma.get("calibre") != null) {
                    descripcion.append(", Calibre ").append(arma.get("calibre").toString());
                }
                if (arma.get("capacidad") != null) {
                    descripcion.append(", con 2 alimentadoras de ").append(arma.get("capacidad").toString()).append(" municiones");
                }
                armaCell.setCellValue(descripcion.toString());
                armaCell.setCellStyle(dataStyle);
                
                // Cantidad
                int cantidad = (Integer) arma.get("cantidad");
                totalCantidad += cantidad;
                Cell cantidadCell = dataRow.createCell(2);
                cantidadCell.setCellValue(cantidad);
                cantidadCell.setCellStyle(numberStyle);
            }
            
            // Fila de total
            if (armasLista.size() > 0) {
                Row totalRow = sheet.createRow(rowNum++);
                Cell totalLabel = totalRow.createCell(0);
                totalLabel.setCellValue("TOTAL");
                totalLabel.setCellStyle(headerStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 0, 1));
                
                Cell totalValue = totalRow.createCell(2);
                totalValue.setCellValue(totalCantidad);
                totalValue.setCellStyle(headerStyle);
            }
            
            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 2000);  // ORD.
            sheet.setColumnWidth(1, 15000); // ARMAS PARA IMPORTAR
            sheet.setColumnWidth(2, 4000);  // CANT.
            
            // Convertir a bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            byte[] excelBytes = outputStream.toByteArray();
            
            log.info("✅ Excel del pedido generado exitosamente, tamaño: {} bytes", excelBytes.length);
            return excelBytes;
        }
    }
}

