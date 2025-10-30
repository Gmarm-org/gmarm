package com.armasimportacion.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.StreamWriteConstraints;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Registrar JavaTimeModule pero sin conversiones de timezone automáticas
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        mapper.registerModule(javaTimeModule);
        
        // Deshabilitar conversiones de timezone automáticas
        mapper.disable(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Configurar para evitar referencias circulares
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false);
        
        // Configurar para evitar anidación excesiva
        mapper.configure(SerializationFeature.FAIL_ON_SELF_REFERENCES, false);
        
        // Incluir solo valores no nulos
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        
        // Configurar límites de anidación - aumentar el límite
        mapper.configure(SerializationFeature.WRITE_SELF_REFERENCES_AS_NULL, true);
        
        // Configurar límites de profundidad de anidación
        mapper.getFactory().setStreamWriteConstraints(
            StreamWriteConstraints.builder()
                .maxNestingDepth(2000) // Aumentar el límite de 1000 a 2000
                .build()
        );
        
        return mapper;
    }
}
