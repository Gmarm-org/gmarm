package com.armasimportacion.config;

import lombok.Data;

@Data
public class Auth {
    private String jwtSecret;
    private long jwtExpirationMs;
}
