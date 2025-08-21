package com.armasimportacion.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    // DESHABILITADO: Los datos ahora se insertan desde el script maestro SQL
    // No se requieren beans de inicialización ya que la base de datos se inicializa
    // con el script 00_gmarm_completo.sql
    
    {
        log.info("DataInitializer configurado - los datos se insertan desde el script SQL maestro");
    }
} 
