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
import org.springframework.http.HttpMethod;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
                // Permitir OPTIONS para todos los endpoints (preflight CORS)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Endpoints públicos
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/logout").permitAll() // Logout puede ser público (solo confirma)
                .requestMatchers("/api/auth/me").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/verification/**").permitAll() // Verificación de correo (público)
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
                .requestMatchers("/api/clientes/**").permitAll() // TEMPORAL: Clientes (para evitar bloqueos en edición)
                .requestMatchers("/api/cliente-formulario/**").permitAll() // TEMPORAL: Formularios cliente
                // Endpoints de asignación de series - REQUIEREN AUTENTICACIÓN
                .requestMatchers("/api/asignacion-series/**").authenticated() // ✅ Asignación de series requiere autenticación
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
                // Endpoints de administración - TEMPORAL: permitAll para desarrollo
                // TODO: Cambiar a hasAuthority("ADMIN") en producción cuando JWT esté corregido
                .requestMatchers("/api/usuarios/**").permitAll()
                .requestMatchers("/api/roles/**").permitAll()
                .requestMatchers("/api/licencia/**").permitAll()
                .requestMatchers("/api/categoria-arma/**").permitAll()
                .requestMatchers("/api/tipo-importacion/**").permitAll()
                .requestMatchers("/api/configuracion-sistema/**").permitAll()
                .requestMatchers("/api/pregunta-cliente/**").permitAll()
                .requestMatchers("/api/tipo-cliente-importacion/**").permitAll()
                .requestMatchers("/api/tipo-documento/**").permitAll()
                .requestMatchers("/api/arma-imagen/**").permitAll()
                .requestMatchers("/api/autorizaciones/**").permitAll()
                .requestMatchers("/api/contratos/**").permitAll()
                .requestMatchers("/api/operaciones/**").permitAll() // TEMPORAL: Para desarrollo
                // Endpoints de grupos de importación - algunos requieren autenticación
                .requestMatchers("/api/grupos-importacion/activos").authenticated() // Requiere autenticación (necesita token JWT)
                .requestMatchers(HttpMethod.PATCH, "/api/grupos-importacion/**").permitAll() // Asegurar PATCH en actualización
                .requestMatchers("/api/grupos-importacion/**").permitAll() // TEMPORAL: Para desarrollo (otros endpoints)
                .requestMatchers("/api/licencia/**").permitAll() // TEMPORAL: Para desarrollo
                .requestMatchers("/api/tipo-proceso/**").permitAll() // TEMPORAL: Para desarrollo
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
            // Limpiar espacios y dividir por comas
            String[] origins = allowedOrigins.split(",");
            List<String> originList = new ArrayList<>();
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    originList.add(trimmed);
                }
            }
            // Permitir cualquier origen para evitar bloqueos CORS en entornos con múltiples hosts
            originList.add("*");
            configuration.setAllowedOriginPatterns(originList);
        } else {
            // Valores por defecto para desarrollo local
            configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:5173", 
                "http://localhost:3000", 
                "http://127.0.0.1:5173", 
                "http://127.0.0.1:3000",
                "*"
            ));
        }
        
        // Obtener métodos permitidos desde variables de entorno
        String allowedMethods = System.getenv("SPRING_CORS_ALLOWED_METHODS");
        if (allowedMethods != null && !allowedMethods.trim().isEmpty()) {
            // Limpiar espacios y dividir por comas
            String[] methods = allowedMethods.split(",");
            List<String> methodList = new ArrayList<>();
            boolean allowAllMethods = false;
            for (String method : methods) {
                String trimmed = method.trim();
                if (!trimmed.isEmpty()) {
                    if ("*".equals(trimmed)) {
                        allowAllMethods = true;
                        break;
                    }
                    methodList.add(trimmed.toUpperCase());
                }
            }
            if (allowAllMethods) {
                configuration.setAllowedMethods(Arrays.asList("*"));
            } else {
                // Asegurar PATCH para evitar errores de preflight en actualización parcial
                if (!methodList.contains("PATCH")) {
                    methodList.add("PATCH");
                }
                configuration.setAllowedMethods(methodList);
            }
        } else {
            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"));
        }
        
        // Obtener headers permitidos desde variables de entorno
        String allowedHeaders = System.getenv("SPRING_CORS_ALLOWED_HEADERS");
        if (allowedHeaders != null && !allowedHeaders.trim().isEmpty()) {
            if (allowedHeaders.trim().equals("*")) {
                configuration.setAllowedHeaders(Arrays.asList("*"));
            } else {
                // Limpiar espacios y dividir por comas
                String[] headers = allowedHeaders.split(",");
                List<String> headerList = new ArrayList<>();
                for (String header : headers) {
                    String trimmed = header.trim();
                    if (!trimmed.isEmpty()) {
                        headerList.add(trimmed);
                    }
                }
                // Asegurar headers críticos para APIs protegidas
                if (!headerList.contains("Authorization")) {
                    headerList.add("Authorization");
                }
                if (!headerList.contains("X-Active-Role")) {
                    headerList.add("X-Active-Role");
                }
                if (!headerList.contains("Content-Type")) {
                    headerList.add("Content-Type");
                }
                configuration.setAllowedHeaders(headerList);
            }
        } else {
            configuration.setAllowedHeaders(Arrays.asList("*"));
        }
        
        // Headers que el frontend puede leer
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        
        // IMPORTANTE: Para que CORS funcione con orígenes específicos, allowCredentials debe ser false
        // o usar allowedOrigins (no patterns) si necesitas credentials
        configuration.setAllowCredentials(false);
        
        // Cache del preflight request: 1 hora
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
