package com.armasimportacion.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class Sha256PasswordEncoder implements PasswordEncoder {
    
    private static final String ALGORITHM = "SHA-256";
    private static final int SALT_LENGTH = 16;
    
    @Override
    public String encode(CharSequence rawPassword) {
        try {
            byte[] salt = generateSalt();
            String hashedPassword = hashPassword(rawPassword.toString(), salt);
            return Base64.getEncoder().encodeToString(salt) + ":" + hashedPassword;
        } catch (Exception e) {
            throw new RuntimeException("Error encoding password", e);
        }
    }
    
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        try {
            // Si la contraseña almacenada no tiene formato salt:hash, comparar directamente
            if (!encodedPassword.contains(":")) {
                return rawPassword.toString().equals(encodedPassword);
            }
            
            String[] parts = encodedPassword.split(":");
            if (parts.length != 2) {
                return false;
            }
            
            byte[] salt = Base64.getDecoder().decode(parts[0]);
            String storedHash = parts[1];
            String inputHash = hashPassword(rawPassword.toString(), salt);
            
            return storedHash.equals(inputHash);
        } catch (Exception e) {
            return false;
        }
    }
    
    private byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        return salt;
    }
    
    private String hashPassword(String password, byte[] salt) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance(ALGORITHM);
        md.update(salt);
        md.update(password.getBytes());
        byte[] hashedBytes = md.digest();
        return Base64.getEncoder().encodeToString(hashedBytes);
    }
}
