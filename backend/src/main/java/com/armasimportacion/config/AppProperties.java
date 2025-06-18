package com.armasimportacion.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private final Auth auth;
    private final OAuth2 oauth2;
    private final FileStorage fileStorage;

    @ConstructorBinding
    public AppProperties(Auth auth, OAuth2 oauth2, FileStorage fileStorage) {
        this.auth = auth;
        this.oauth2 = oauth2;
        this.fileStorage = fileStorage;
    }
}