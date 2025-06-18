package com.armasimportacion.config;

import com.armasimportacion.model.auth.Rol;
import com.armasimportacion.repository.RolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoadDatabase {
    @Bean
    CommandLineRunner initDatabase(RolRepository rolRepository) {
        return args -> {
            if (rolRepository.findByNombre("ROLE_ADMIN").isEmpty()) {
                rolRepository.save(new Rol("ROLE_ADMIN"));
            }
            if (rolRepository.findByNombre("ROLE_USER").isEmpty()) {
                rolRepository.save(new Rol("ROLE_USER"));
            }
            // Agrega más roles según necesites
        };
    }
}