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

import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class PDFSignatureService {

    private final CertificateEncryptionService encryptionService;
    private final SignatureAppearanceBuilder appearanceBuilder;

    private static final float SIG_X = 55f;
    private static final float SIG_Y = 155f;
    private static final float SIG_WIDTH = 200f;
    private static final float SIG_HEIGHT = 80f;
    private static final int APPEARANCE_IMG_WIDTH = 400;
    private static final int APPEARANCE_IMG_HEIGHT = 160;

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

            String subjectDN = signerCert.getSubjectX500Principal().getName();
            String issuerDN = signerCert.getIssuerX500Principal().getName();

            String signerName = extractDNField(subjectDN, "CN");
            if (signerName == null) {
                signerName = licencia.getNombre() != null ? licencia.getNombre() : "Importador";
            }
            String cedula = extractCedulaFromDN(subjectDN);
            String issuerName = extractDNField(issuerDN, "CN");
            String qrContent = resolveIssuerUrl(issuerDN);

            byte[] appearanceImage = appearanceBuilder.buildAppearanceImage(
                    signerName, signDate, serialNumber, qrContent,
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
            float dynamicSigY = calculateSignatureY(document, lastPageIndex);
            PDRectangle sigRect = new PDRectangle(SIG_X, dynamicSigY, SIG_WIDTH, SIG_HEIGHT);

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

    private float calculateSignatureY(PDDocument document, int pageIndex) {
        try {
            PDPage page = document.getPage(pageIndex);
            float pageHeight = page.getMediaBox().getHeight();
            float[] lowestY = {pageHeight};

            PDFTextStripper stripper = new PDFTextStripper() {
                @Override
                protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                    for (TextPosition tp : textPositions) {
                        float pdfY = pageHeight - tp.getY();
                        if (pdfY < lowestY[0]) {
                            lowestY[0] = pdfY;
                        }
                    }
                }
            };
            stripper.setStartPage(pageIndex + 1);
            stripper.setEndPage(pageIndex + 1);
            stripper.writeText(document, Writer.nullWriter());

            if (lowestY[0] < pageHeight) {
                float targetY = lowestY[0] + 80f;
                log.info("Firma dinámica: texto más bajo Y={}, stamp Y={}", lowestY[0], targetY);
                return targetY;
            }

            return SIG_Y;
        } catch (Exception e) {
            log.warn("Error calculando posición dinámica de firma: {}", e.getMessage());
            return SIG_Y;
        }
    }

    private String extractDNField(String dn, String field) {
        Matcher m = Pattern.compile(field + "=([^,]+)").matcher(dn);
        return m.find() ? m.group(1).trim() : null;
    }

    private String extractCedulaFromDN(String dn) {
        Matcher m = Pattern.compile("2\\.5\\.4\\.5=#([0-9a-fA-F]+)").matcher(dn);
        if (m.find()) {
            String hex = m.group(1);
            if (hex.length() > 4) {
                String hexValue = hex.substring(4);
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i + 1 < hexValue.length(); i += 2) {
                    sb.append((char) Integer.parseInt(hexValue.substring(i, i + 2), 16));
                }
                return sb.toString();
            }
        }
        Matcher m2 = Pattern.compile("SERIALNUMBER=([^,]+)").matcher(dn);
        return m2.find() ? m2.group(1).trim() : "";
    }

    private String resolveIssuerUrl(String issuerDN) {
        String issuerUpper = issuerDN.toUpperCase();
        if (issuerUpper.contains("BANCO CENTRAL")) return "https://www.firmadigital.gob.ec";
        if (issuerUpper.contains("SECURITY DATA")) return "https://www.securitydata.net.ec";
        if (issuerUpper.contains("ANF")) return "https://www.anf.es";
        if (issuerUpper.contains("CONSEJO DE LA JUDICATURA") || issuerUpper.contains("FUNCION JUDICIAL"))
            return "https://www.funcionjudicial.gob.ec";
        if (issuerUpper.contains("UANATACA")) return "https://www.uanataca.com";
        if (issuerUpper.contains("REGISTRO CIVIL")) return "https://www.registrocivil.gob.ec";
        if (issuerUpper.contains("ECLIPSOFT")) return "https://www.eclipsoft.com";
        if (issuerUpper.contains("DATILMEDIA")) return "https://www.datilmedia.com";
        if (issuerUpper.contains("LAZZATE")) return "https://www.lazzate.com";
        if (issuerUpper.contains("ALPHA TECHNOLOGIES")) return "https://www.alphatechnologies.ec";
        if (issuerUpper.contains("CORPNEWBEST")) return "https://www.corpnewbest.com";
        if (issuerUpper.contains("FIRMASEGURA")) return "https://www.firmasegura.ec";
        return "https://www.firmadigital.gob.ec";
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
