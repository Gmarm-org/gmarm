package com.armasimportacion.service;

import com.armasimportacion.exception.BadRequestException;
import com.armasimportacion.model.Licencia;
import com.armasimportacion.service.helper.documentos.SignatureAppearanceBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAppearanceDictionary;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAppearanceStream;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.ExternalSigningSupport;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureOptions;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDSignatureField;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.CMSTypedData;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
@Slf4j
public class PDFSignatureService {

    private final CertificateEncryptionService encryptionService;
    private final SignatureAppearanceBuilder appearanceBuilder;

    private static final float SIG_X = 55f;
    private static final float SIG_Y = 95f;
    private static final float SIG_WIDTH = 200f;
    private static final float SIG_HEIGHT = 80f;
    private static final int APPEARANCE_IMG_WIDTH = 380;
    private static final int APPEARANCE_IMG_HEIGHT = 100;

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
            log.info("BouncyCastle security provider registered");
        }
    }

    public byte[] firmarPdf(byte[] pdfBytes, Licencia licencia, String pin) {
        if (licencia.getCertificadoP12() == null) {
            throw new BadRequestException("La licencia " + licencia.getNumero() + " no tiene certificado configurado");
        }

        byte[] p12Bytes = encryptionService.decryptBytes(licencia.getCertificadoP12());
        char[] certPassword = encryptionService.decryptText(licencia.getCertificadoPasswordCifrado()).toCharArray();

        try {
            return signWithCertificate(pdfBytes, p12Bytes, certPassword, licencia);
        } finally {
            Arrays.fill(certPassword, '\0');
            Arrays.fill(p12Bytes, (byte) 0);
        }
    }

    public byte[] firmarPdfAutomatico(byte[] pdfBytes, Licencia licencia) {
        if (licencia.getCertificadoP12() == null || !Boolean.TRUE.equals(licencia.getFirmaHabilitada())) {
            return pdfBytes;
        }

        byte[] p12Bytes = encryptionService.decryptBytes(licencia.getCertificadoP12());
        char[] certPassword = encryptionService.decryptText(licencia.getCertificadoPasswordCifrado()).toCharArray();

        try {
            return signWithCertificate(pdfBytes, p12Bytes, certPassword, licencia);
        } catch (Exception e) {
            log.warn("Firma automática falló, retornando PDF sin firmar: {}", e.getMessage());
            return pdfBytes;
        } finally {
            Arrays.fill(certPassword, '\0');
            Arrays.fill(p12Bytes, (byte) 0);
        }
    }

    private byte[] signWithCertificate(byte[] pdfBytes, byte[] p12Bytes, char[] password, Licencia licencia) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {

            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(p12Bytes), password);
            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, password);
            Certificate[] chain = keyStore.getCertificateChain(alias);
            X509Certificate signerCert = (X509Certificate) chain[0];

            String serialNumber = signerCert.getSerialNumber().toString(16).toUpperCase();
            LocalDateTime signDate = LocalDateTime.now(ZoneId.of("America/Guayaquil"));
            String signerName = licencia.getNombre() != null ? licencia.getNombre() : "Importador";
            String signerTitle = licencia.getTitulo() != null ? licencia.getTitulo() : "Distribuidor Autorizado";

            String qrContent = String.format("Firmado por: %s | Fecha: %s | Cert: %s",
                    signerName, signDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), serialNumber);

            byte[] appearanceImage = appearanceBuilder.buildAppearanceImage(
                    signerName, signerTitle, signDate, serialNumber, qrContent,
                    APPEARANCE_IMG_WIDTH, APPEARANCE_IMG_HEIGHT);

            PDSignature signature = new PDSignature();
            signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            signature.setSubFilter(PDSignature.SUBFILTER_ADBE_PKCS7_DETACHED);
            signature.setName(signerName);
            signature.setReason("Firma electr\u00f3nica de documento");
            signature.setLocation("Ecuador");

            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("America/Guayaquil"));
            signature.setSignDate(cal);

            int lastPageIndex = document.getNumberOfPages() - 1;
            PDRectangle sigRect = new PDRectangle(SIG_X, SIG_Y, SIG_WIDTH, SIG_HEIGHT);

            SignatureOptions sigOptions = new SignatureOptions();
            sigOptions.setPreferredSignatureSize(16384);
            sigOptions.setPage(lastPageIndex);
            sigOptions.setVisualSignature(
                    buildVisualSignatureTemplate(document, lastPageIndex, sigRect, appearanceImage));

            document.addSignature(signature, sigOptions);

            ByteArrayOutputStream signedOutput = new ByteArrayOutputStream();
            ExternalSigningSupport externalSigning = document.saveIncrementalForExternalSigning(signedOutput);

            InputStream dataToSign = externalSigning.getContent();
            byte[] cmsSignature = createCMSSignature(dataToSign, privateKey, signerCert, chain);
            externalSigning.setSignature(cmsSignature);

            byte[] signedPdf = signedOutput.toByteArray();
            log.info("PDF firmado exitosamente. Tamaño original: {} bytes, firmado: {} bytes",
                    pdfBytes.length, signedPdf.length);

            return signedPdf;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error firmando PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error al firmar el documento PDF: " + e.getMessage(), e);
        }
    }

    private InputStream buildVisualSignatureTemplate(PDDocument srcDoc, int pageIndex,
                                                      PDRectangle sigRect, byte[] imageBytes) throws Exception {
        try (PDDocument template = new PDDocument()) {
            PDPage srcPage = srcDoc.getPage(pageIndex);
            PDPage page = new PDPage(srcPage.getMediaBox());
            template.addPage(page);

            PDAcroForm acroForm = new PDAcroForm(template);
            template.getDocumentCatalog().setAcroForm(acroForm);

            PDSignatureField sigField = new PDSignatureField(acroForm);
            sigField.setPartialName("Signature");
            acroForm.getFields().add(sigField);

            var widget = sigField.getWidgets().get(0);
            widget.setRectangle(sigRect);
            widget.setPage(page);

            // Build appearance stream
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(template, imageBytes, "sig.png");

            PDAppearanceStream appearanceStream = new PDAppearanceStream(template);
            appearanceStream.setBBox(new PDRectangle(sigRect.getWidth(), sigRect.getHeight()));
            appearanceStream.setResources(new PDResources());
            appearanceStream.getResources().add(pdImage);

            try (PDPageContentStream cs = new PDPageContentStream(template, appearanceStream)) {
                cs.drawImage(pdImage, 0, 0, sigRect.getWidth(), sigRect.getHeight());
            }

            PDAppearanceDictionary appearanceDict = new PDAppearanceDictionary();
            appearanceDict.setNormalAppearance(appearanceStream);
            widget.setAppearance(appearanceDict);

            page.getAnnotations().add(widget);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            template.save(baos);
            return new ByteArrayInputStream(baos.toByteArray());
        }
    }

    private byte[] createCMSSignature(InputStream content, PrivateKey privateKey,
                                       X509Certificate signerCert, Certificate[] chain) throws Exception {
        CMSSignedDataGenerator gen = new CMSSignedDataGenerator();

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(privateKey);

        gen.addSignerInfoGenerator(
                new JcaSignerInfoGeneratorBuilder(
                        new JcaDigestCalculatorProviderBuilder()
                                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                                .build())
                        .build(signer, signerCert));

        gen.addCertificates(new JcaCertStore(List.of(chain)));

        CMSTypedData cmsData = new CMSProcessableByteArray(content.readAllBytes());
        CMSSignedData signedData = gen.generate(cmsData, false);

        return signedData.getEncoded();
    }
}
