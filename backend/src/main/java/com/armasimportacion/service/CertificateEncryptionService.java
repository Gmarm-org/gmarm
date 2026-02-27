package com.armasimportacion.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@Slf4j
public class CertificateEncryptionService {

    private final BytesEncryptor bytesEncryptor;
    private final TextEncryptor textEncryptor;

    public CertificateEncryptionService(
            @Value("${app.signature.encryption-key}") String encryptionKey) {
        String salt = HexFormat.of().formatHex(encryptionKey.substring(0, 8).getBytes());
        this.bytesEncryptor = Encryptors.stronger(encryptionKey, salt);
        this.textEncryptor = Encryptors.text(encryptionKey, salt);
    }

    public byte[] encryptBytes(byte[] plainBytes) {
        return bytesEncryptor.encrypt(plainBytes);
    }

    public byte[] decryptBytes(byte[] encryptedBytes) {
        return bytesEncryptor.decrypt(encryptedBytes);
    }

    public String encryptText(String plainText) {
        return textEncryptor.encrypt(plainText);
    }

    public String decryptText(String encryptedText) {
        return textEncryptor.decrypt(encryptedText);
    }

    public String calculateFingerprint(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
