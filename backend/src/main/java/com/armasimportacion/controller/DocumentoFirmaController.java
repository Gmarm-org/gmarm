package com.armasimportacion.controller;

import com.armasimportacion.dto.FirmaRequestDTO;
import com.armasimportacion.dto.FirmaResponseDTO;
import com.armasimportacion.enums.EstadoDocumentoGenerado;
import com.armasimportacion.model.DocumentoGenerado;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.repository.DocumentoGeneradoRepository;
import com.armasimportacion.service.FileStorageService;
import com.armasimportacion.service.PDFSignatureService;
import com.armasimportacion.service.helper.documentos.DocumentoPDFUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Firma Digital", description = "Firma electr\u00f3nica de documentos")
public class DocumentoFirmaController {

    private final DocumentoGeneradoRepository documentoRepo;
    private final FileStorageService fileStorageService;
    private final PDFSignatureService signatureService;
    private final DocumentoPDFUtils documentoPDFUtils;

    @PostMapping("/{id}/firmar")
    @Operation(summary = "Firmar documento digitalmente",
            description = "Firma un documento PDF existente con el certificado de la licencia del importador")
    public ResponseEntity<?> firmarDocumento(
            @PathVariable Long id,
            @RequestBody FirmaRequestDTO request) {
        log.info("POST /api/documentos/{}/firmar - Firmando documento", id);

        DocumentoGenerado documento = documentoRepo.findById(id).orElse(null);
        if (documento == null) {
            return ResponseEntity.notFound().build();
        }

        if (documento.getEstado() == EstadoDocumentoGenerado.FIRMADO) {
            return ResponseEntity.badRequest().body(Map.of("error", "El documento ya est\u00e1 firmado"));
        }

        if (documento.getCliente() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El documento no tiene cliente asociado"));
        }

        Licencia licencia = documentoPDFUtils.obtenerLicenciaActiva(documento.getCliente());
        if (licencia == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se encontr\u00f3 licencia activa para el cliente"));
        }
        if (licencia.getCertificadoP12() == null || !Boolean.TRUE.equals(licencia.getFirmaHabilitada())) {
            return ResponseEntity.badRequest().body(Map.of("error", "La licencia no tiene certificado configurado o la firma no est\u00e1 habilitada"));
        }

        try {
            String rutaCompleta = documentoPDFUtils.construirRutaCompletaDocumentoGenerado(
                    documento.getRutaArchivo(), documento.getNombreArchivo());
            File archivo = new File(rutaCompleta);
            if (!archivo.exists()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo PDF no encontrado en disco"));
            }

            byte[] pdfBytes = Files.readAllBytes(archivo.toPath());
            byte[] signedPdf = signatureService.firmarPdf(pdfBytes, licencia, request.getPin());

            Files.write(archivo.toPath(), signedPdf);

            documento.setEstado(EstadoDocumentoGenerado.FIRMADO);
            documento.setFechaFirma(LocalDateTime.now());
            documento.setTamanioBytes((long) signedPdf.length);
            documentoRepo.save(documento);

            FirmaResponseDTO response = FirmaResponseDTO.builder()
                    .documentoId(documento.getId())
                    .firmadoPor(licencia.getNombre())
                    .fechaFirma(documento.getFechaFirma())
                    .certificadoHuella(licencia.getCertificadoHuella())
                    .estado(documento.getEstado().name())
                    .build();

            log.info("Documento {} firmado exitosamente por licencia {}", id, licencia.getNumero());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error firmando documento {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Error al firmar: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/verificar-firma")
    @Operation(summary = "Verificar firma digital de un documento")
    public ResponseEntity<?> verificarFirma(@PathVariable Long id) {
        log.info("GET /api/documentos/{}/verificar-firma", id);

        DocumentoGenerado documento = documentoRepo.findById(id).orElse(null);
        if (documento == null) {
            return ResponseEntity.notFound().build();
        }

        boolean firmado = documento.getEstado() == EstadoDocumentoGenerado.FIRMADO
                && documento.getFechaFirma() != null;

        return ResponseEntity.ok(Map.of(
                "documentoId", documento.getId(),
                "firmado", firmado,
                "estado", documento.getEstado().name(),
                "fechaFirma", firmado ? documento.getFechaFirma().toString() : ""));
    }
}
