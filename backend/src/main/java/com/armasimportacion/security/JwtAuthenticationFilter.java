package com.armasimportacion.security;

import com.armasimportacion.service.UsuarioService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UsuarioService usuarioService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        // SOLUCIÓN DIRECTA: Verificar si este filtro debe ejecutarse para esta request
        if (shouldNotFilter(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                
                // Verificar que el usuario existe
                if (usuarioService.existsByEmail(username)) {
                    String authorities = tokenProvider.getAuthoritiesFromToken(jwt);
                    
                    List<SimpleGrantedAuthority> grantedAuthorities = Arrays.stream(
                            authorities != null ? authorities.split(",") : new String[0])
                            .filter(StringUtils::hasText)
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(username, null, grantedAuthorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    log.warn("Token válido pero usuario no existe: {}", username);
                }
            }
        } catch (Exception ex) {
            log.error("Error al configurar la autenticación del usuario: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrae el token JWT del header Authorization
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * SOLUCIÓN DIRECTA: Determina si este filtro debe ejecutarse para la request dada
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // ENDPOINTS PÚBLICOS EXACTOS - NO REQUIEREN JWT
        return path.equals("/api/auth/login") ||
               path.startsWith("/api/health") ||
               path.startsWith("/api/tipo-cliente") ||
               path.startsWith("/api/tipos-cliente") ||
               path.startsWith("/api/tipo-identificacion") ||
               path.startsWith("/api/localizacion") ||
               path.startsWith("/api/configuracion-sistema") ||
               path.startsWith("/api/asignacion-series") ||
               path.startsWith("/api/pagos") ||
               path.startsWith("/swagger-ui/") ||
               path.equals("/favicon.ico") ||
               path.startsWith("/api/actuator/") ||
               path.startsWith("/webjars/") ||
               path.startsWith("/images/") ||
               path.startsWith("/api/documentos/serve") ||
               path.startsWith("/api/documentos-cliente/cargar");
    }
}
