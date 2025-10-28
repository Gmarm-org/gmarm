package com.armasimportacion.config;

import com.armasimportacion.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import com.armasimportacion.security.JwtTokenProvider;
import com.armasimportacion.security.Sha256PasswordEncoder;
import com.armasimportacion.service.UsuarioService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final UsuarioService usuarioService;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, usuarioService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Sha256PasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Endpoints públicos
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/tipo-cliente/**").permitAll()
                .requestMatchers("/api/tipos-cliente/**").permitAll()
                .requestMatchers("/api/tipo-identificacion/**").permitAll()
                .requestMatchers("/api/estados-cliente/**").permitAll()
                .requestMatchers("/api/localizacion/**").permitAll()
                .requestMatchers("/api/configuracion-sistema/**").permitAll()
                .requestMatchers("/api/inventario/**").permitAll() // Endpoints del inventario
                .requestMatchers("/api/arma/**").permitAll() // Endpoints de armas
                .requestMatchers("/api/arma-serie/**").permitAll() // Endpoints de series de armas
                .requestMatchers("/api/cliente-arma/**").permitAll() // Endpoints de reservas
                .requestMatchers("/api/asignacion-series/**").authenticated() // Endpoints de asignación de series (requiere autenticación)
                .requestMatchers("/api/asignacion-series/pendientes").authenticated() // Solo usuarios autenticados
                .requestMatchers("/api/asignacion-series/series-disponibles/**").authenticated() // Solo usuarios autenticados
                .requestMatchers("/api/asignacion-series/asignar").authenticated() // Solo usuarios autenticados
                .requestMatchers("/api/pagos/**").permitAll() // TEMPORAL: Para debugging
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()
                .requestMatchers("/favicon.ico").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                // Imágenes públicas (sin autenticación)
                .requestMatchers("/images/**").permitAll()
                // Documentos públicos (sin autenticación)
                .requestMatchers("/api/documentos/serve/**").permitAll()
                .requestMatchers("/api/documentos/serve-generated/**").permitAll()
                // TEMPORAL: Para debugging - subida de documentos
                .requestMatchers("/api/documentos-cliente/cargar").permitAll()
                // Todos los demás endpoints requieren autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Obtener orígenes permitidos desde variables de entorno
        String allowedOrigins = System.getenv("SPRING_CORS_ALLOWED_ORIGINS");
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        } else {
            // Valores por defecto para desarrollo local
            configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:5173", 
                "http://localhost:3000", 
                "http://127.0.0.1:5173", 
                "http://127.0.0.1:3000",
                "http://72.167.52.14:5173",  // IP del servidor de desarrollo
                "http://72.167.52.14:80"     // Puerto 80 del servidor
            ));
        }
        
        // Obtener métodos permitidos desde variables de entorno
        String allowedMethods = System.getenv("SPRING_CORS_ALLOWED_METHODS");
        if (allowedMethods != null && !allowedMethods.trim().isEmpty()) {
            configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        } else {
            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"));
        }
        
        // Obtener headers permitidos desde variables de entorno
        String allowedHeaders = System.getenv("SPRING_CORS_ALLOWED_HEADERS");
        if (allowedHeaders != null && !allowedHeaders.trim().isEmpty()) {
            configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        } else {
            configuration.setAllowedHeaders(Arrays.asList("*"));
        }
        
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
