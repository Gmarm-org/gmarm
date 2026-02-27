package com.armasimportacion.service.helper.documentos;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
@Slf4j
public class SignatureAppearanceBuilder {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int QR_SIZE = 140;
    private static final int PADDING = 8;

    public byte[] buildAppearanceImage(String signerName,
                                       LocalDateTime signDate, String certificateSerial,
                                       String qrContent, int width, int height) {
        try {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = image.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // White background (no border)
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, width, height);

            // QR code on the left, vertically centered
            int qrX = PADDING;
            int qrY = (height - QR_SIZE) / 2;
            BufferedImage qrImage = generateQrCode(qrContent, QR_SIZE);
            g2d.drawImage(qrImage, qrX, qrY, null);

            // Text on the right of QR
            int textX = qrX + QR_SIZE + PADDING;
            int textY = PADDING + 12;

            Font fontSmall = new Font("SansSerif", Font.PLAIN, 9);
            Font fontBold = new Font("SansSerif", Font.BOLD, 10);
            Font fontTiny = new Font("SansSerif", Font.PLAIN, 8);

            g2d.setColor(Color.BLACK);

            // Line 1: "Firmado electrónicamente por:"
            g2d.setFont(fontSmall);
            g2d.drawString("Firmado electr\u00f3nicamente por:", textX, textY);
            textY += 14;

            // Line 2: Signer name (bold)
            g2d.setFont(fontBold);
            String displayName = signerName != null ? signerName.toUpperCase() : "";
            if (displayName.length() > 35) {
                displayName = displayName.substring(0, 35) + "...";
            }
            g2d.drawString(displayName, textX, textY);
            textY += 13;

            // Line 3: Date
            g2d.setFont(fontSmall);
            String dateStr = signDate != null ? signDate.format(DATE_FMT) : "";
            g2d.drawString("Fecha: " + dateStr, textX, textY);
            textY += 13;

            // Line 5: Certificate serial (truncated)
            if (certificateSerial != null && !certificateSerial.isBlank()) {
                g2d.setFont(fontTiny);
                String truncated = certificateSerial.length() > 20
                        ? certificateSerial.substring(0, 20) + "..."
                        : certificateSerial;
                g2d.drawString("Cert: " + truncated, textX, textY);
            }

            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error building signature appearance image: {}", e.getMessage(), e);
            throw new RuntimeException("Error generando imagen de firma", e);
        }
    }

    private BufferedImage generateQrCode(String content, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = Map.of(
                EncodeHintType.MARGIN, 1,
                EncodeHintType.CHARACTER_SET, "UTF-8"
        );
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

        BufferedImage qrImage = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                qrImage.setRGB(x, y, matrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
            }
        }
        return qrImage;
    }
}
