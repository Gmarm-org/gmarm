package com.armasimportacion.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utilidad para generar hashes de contraseñas SHA-256
 * Solo para uso en desarrollo/testing - NO usar en producción
 */
public class PasswordHashGenerator {

    private static final String ALGORITHM = "SHA-256";
    private static final int SALT_LENGTH = 16;

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Uso: PasswordHashGenerator <password>");
            System.out.println("Genera un hash SHA-256 para la password proporcionada.");
            return;
        }

        String password = args[0];
        String hash = generateHash(password);
        System.out.println("Hash: " + hash);
        System.out.println("Verification: " + verifyPassword(password, hash));
    }

    public static String generateHash(String password) {
        try {
            byte[] salt = generateSalt();
            String hashedPassword = hashPassword(password, salt);
            return Base64.getEncoder().encodeToString(salt) + ":" + hashedPassword;
        } catch (Exception e) {
            throw new RuntimeException("Error generating hash", e);
        }
    }

    public static boolean verifyPassword(String password, String encodedPassword) {
        try {
            String[] parts = encodedPassword.split(":");
            if (parts.length != 2) {
                return false;
            }

            byte[] salt = Base64.getDecoder().decode(parts[0]);
            String storedHash = parts[1];
            String inputHash = hashPassword(password, salt);

            return storedHash.equals(inputHash);
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        return salt;
    }

    private static String hashPassword(String password, byte[] salt) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance(ALGORITHM);
        md.update(salt);
        md.update(password.getBytes());
        byte[] hashedBytes = md.digest();
        return Base64.getEncoder().encodeToString(hashedBytes);
    }
}
