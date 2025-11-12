# 🔐 Integración de Keycloak - Plan de Migración GMARM

## 🎯 Objetivo

Migrar el sistema de autenticación actual (JWT + BCrypt) a **Keycloak** sin romper la estructura existente, mejorando la seguridad y eliminando el manejo manual de contraseñas.

---

## 📊 Situación Actual vs Keycloak

### ❌ **Problemas Actuales:**
- Contraseñas almacenadas en BD (incluso con hash, es un riesgo)
- Gestión manual de tokens JWT
- Sin SSO (Single Sign-On)
- Sin integración con proveedores externos (Google, Microsoft, etc.)
- Sin MFA (Multi-Factor Authentication) fácil
- Renovación de tokens manual
- Gestión de sesiones compleja

### ✅ **Con Keycloak:**
- ✅ **Contraseñas NO en tu BD** (Keycloak las maneja)
- ✅ **SSO** entre múltiples aplicaciones
- ✅ **Protocolos estándar**: OAuth 2.0, OpenID Connect
- ✅ **MFA integrado** (Google Authenticator, SMS, etc.)
- ✅ **Social Login** (Google, Facebook, Microsoft) con 2 clicks
- ✅ **Roles y permisos** manejados por Keycloak
- ✅ **Auditoría completa** de inicio de sesión
- ✅ **Admin Console** poderosa para gestión de usuarios
- ✅ **Alta disponibilidad** y clustering

---

## 🏗️ Arquitectura de Integración

### **Flujo Actual (JWT):**
```
Usuario → Login Form → Backend → Valida en BD → Genera JWT → Frontend
         ↓
    Password Hash en BD (riesgo si se filtra)
```

### **Flujo Con Keycloak (OpenID Connect):**
```
Usuario → Login (Keycloak) → Keycloak Valida → Token ID + Access Token → Backend/Frontend
         ↓
    Password en Keycloak (aislado, seguro, nunca en tu BD)
         ↓
    Backend solo VALIDA tokens (no gestiona passwords)
```

### **Diagrama de Componentes:**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  - Login redirect a Keycloak                                 │
│  - Recibe token y lo guarda en localStorage                  │
│  - Envía token en Authorization header                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  KEYCLOAK SERVER                             │
│  - Realm: gmarm                                              │
│  - Client: gmarm-frontend (Public)                           │
│  - Client: gmarm-backend (Bearer-only)                       │
│  - Usuarios y roles sincronizados                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Spring Boot)                       │
│  - Spring Security + Keycloak Adapter                        │
│  - Valida tokens contra Keycloak                             │
│  - Extrae roles del token (no consulta BD)                   │
│  - Tabla usuario MANTIENE datos (email, nombre, roles)       │
│  - NO almacena passwords                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Plan de Migración (Sin Romper Nada)

### **Estrategia: Migración Dual (Ambos Sistemas Coexisten)**

Durante la migración, **ambos sistemas** funcionarán en paralelo:
1. **Sistema Antiguo (JWT)** sigue funcionando
2. **Sistema Nuevo (Keycloak)** se integra progresivamente
3. **Feature flag** para activar/desactivar Keycloak
4. **Migración gradual** de usuarios

---

## 🚀 FASE 1: Setup de Keycloak (1-2 días)

### **1.1 Levantar Keycloak con Docker**

**Archivo: `docker-compose.keycloak.yml`**

```yaml
version: '3.8'

services:
  # ========================================
  # KEYCLOAK - Identity & Access Management
  # ========================================
  keycloak:
    image: quay.io/keycloak/keycloak:26.0.5
    container_name: gmarm-keycloak
    environment:
      # Admin inicial
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:-admin123}
      
      # Base de datos (PostgreSQL)
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres_keycloak:5432/keycloak
      KC_DB_USERNAME: ${POSTGRES_USER:-postgres}
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      
      # Hostname (producción)
      KC_HOSTNAME: ${KEYCLOAK_HOSTNAME:-auth.gmarm.com}
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      
      # Proxy (si usas Nginx)
      KC_PROXY: edge
      KC_HTTP_ENABLED: true
      
    command: start-dev  # Producción: start
    ports:
      - "${KEYCLOAK_PORT:-8180}:8080"
    depends_on:
      postgres_keycloak:
        condition: service_healthy
    networks:
      - gmarm_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1g
          cpus: '1.0'
        reservations:
          memory: 512m
          cpus: '0.5'

  # ========================================
  # POSTGRESQL - Base de Datos de Keycloak
  # ========================================
  postgres_keycloak:
    image: postgres:15-alpine
    container_name: gmarm-postgres-keycloak
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - keycloak_db_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"  # Puerto diferente para no conflicto
    networks:
      - gmarm_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: '0.5'
        reservations:
          memory: 256m
          cpus: '0.25'

volumes:
  keycloak_db_data:

networks:
  gmarm_network:
    driver: bridge
```

**Levantar Keycloak:**

```bash
# Crear archivo .env con contraseñas
cat > .env.keycloak << EOF
KEYCLOAK_ADMIN_PASSWORD=admin_seguro_123
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_seguro_456
KEYCLOAK_HOSTNAME=localhost
KEYCLOAK_PORT=8180
EOF

# Levantar servicios
docker-compose -f docker-compose.keycloak.yml up -d

# Verificar que Keycloak esté corriendo
curl http://localhost:8180/health/ready
# Respuesta esperada: {"status":"UP"}
```

**Acceder a Admin Console:**
- URL: `http://localhost:8180`
- Usuario: `admin`
- Password: `admin_seguro_123`

---

### **1.2 Configurar Realm y Clients en Keycloak**

#### **Paso 1: Crear Realm "gmarm"**

1. Login en Keycloak Admin Console
2. Hover sobre "Keycloak" (arriba izquierda) → Click "Create Realm"
3. **Realm name**: `gmarm`
4. Click "Create"

#### **Paso 2: Crear Client "gmarm-frontend" (Public)**

1. En el realm `gmarm`, ir a **Clients** → **Create client**
2. **Client ID**: `gmarm-frontend`
3. **Client type**: `OpenID Connect`
4. **Client authentication**: `OFF` (public client)
5. Click "Next"

**Configuración:**
- **Valid redirect URIs**:
  ```
  http://localhost:5173/*
  http://localhost:3000/*
  https://gmarm.com/*
  ```
- **Valid post logout redirect URIs**: (mismo)
- **Web origins**: 
  ```
  http://localhost:5173
  http://localhost:3000
  https://gmarm.com
  ```
- **Root URL**: `http://localhost:5173`
- **Home URL**: `http://localhost:5173`

#### **Paso 3: Crear Client "gmarm-backend" (Bearer-only)**

1. **Clients** → **Create client**
2. **Client ID**: `gmarm-backend`
3. **Client type**: `OpenID Connect`
4. **Client authentication**: `ON`
5. Click "Next"

**Configuración:**
- **Access Type**: `bearer-only`
- Este client SOLO valida tokens, no genera login

#### **Paso 4: Crear Roles**

En **Realm roles** → **Create role**:

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Administrador del sistema |
| `VENDEDOR` | Vendedor (FIJO o LIBRE) |
| `JEFE_VENTAS` | Jefe de ventas |
| `FINANZAS` | Área de finanzas |
| `OPERACIONES` | Área de operaciones |

#### **Paso 5: Crear Usuarios de Prueba**

En **Users** → **Add user**:

**Usuario 1: Admin**
- **Username**: `admin`
- **Email**: `admin@gmarm.com`
- **First name**: `Administrador`
- **Last name**: `Sistema`
- **Email verified**: `ON`

Luego ir a pestaña **Credentials**:
- **Password**: `admin123`
- **Temporary**: `OFF`

Luego ir a pestaña **Role mappings**:
- Asignar rol `ADMIN`

**Repetir para otros usuarios (vendedor, jefe, finanzas)**

---

## 🔧 FASE 2: Integración Backend (2-3 días)

### **2.1 Agregar Dependencias Maven**

**Archivo: `backend/pom.xml`**

```xml
<!-- Keycloak Spring Boot Adapter -->
<dependency>
    <groupId>org.keycloak</groupId>
    <artifactId>keycloak-spring-boot-starter</artifactId>
    <version>26.0.5</version>
</dependency>

<!-- Keycloak Admin Client (para sincronización) -->
<dependency>
    <groupId>org.keycloak</groupId>
    <artifactId>keycloak-admin-client</artifactId>
    <version>26.0.5</version>
</dependency>
```

### **2.2 Configurar application.properties**

**Archivo: `backend/src/main/resources/application.properties`**

```properties
# ========================================
# KEYCLOAK CONFIGURATION
# ========================================

# Habilitar/Deshabilitar Keycloak (Feature Flag)
keycloak.enabled=${KEYCLOAK_ENABLED:false}

# Keycloak Server
keycloak.auth-server-url=${KEYCLOAK_AUTH_SERVER_URL:http://localhost:8180}
keycloak.realm=gmarm
keycloak.resource=gmarm-backend
keycloak.ssl-required=external
keycloak.public-client=false
keycloak.confidential-port=0

# Bearer-only (backend no redirige a login)
keycloak.bearer-only=true

# Roles
keycloak.use-resource-role-mappings=false

# Security constraints (opcional, se puede hacer con @PreAuthorize)
keycloak.security-constraints[0].authRoles[0]=ADMIN
keycloak.security-constraints[0].authRoles[1]=VENDEDOR
keycloak.security-constraints[0].securityCollections[0].patterns[0]=/api/*

# Admin Client (para sincronización)
keycloak.admin.server-url=${KEYCLOAK_AUTH_SERVER_URL:http://localhost:8180}
keycloak.admin.realm=master
keycloak.admin.client-id=admin-cli
keycloak.admin.username=${KEYCLOAK_ADMIN_USER:admin}
keycloak.admin.password=${KEYCLOAK_ADMIN_PASSWORD:admin123}
```

### **2.3 Configurar Spring Security con Keycloak**

**Archivo: `backend/src/main/java/com/armasimportacion/config/KeycloakSecurityConfig.java`** (NUEVO)

```java
package com.armasimportacion.config;

import org.keycloak.adapters.springboot.KeycloakSpringBootConfigResolver;
import org.keycloak.adapters.springsecurity.KeycloakConfiguration;
import org.keycloak.adapters.springsecurity.authentication.KeycloakAuthenticationProvider;
import org.keycloak.adapters.springsecurity.config.KeycloakWebSecurityConfigurerAdapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;

@KeycloakConfiguration
@EnableMethodSecurity(prePostEnabled = true)
@ConditionalOnProperty(name = "keycloak.enabled", havingValue = "true")
public class KeycloakSecurityConfig extends KeycloakWebSecurityConfigurerAdapter {

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) {
        KeycloakAuthenticationProvider keycloakAuthenticationProvider = keycloakAuthenticationProvider();
        
        // Mapear roles de Keycloak a Spring Security
        SimpleAuthorityMapper grantedAuthorityMapper = new SimpleAuthorityMapper();
        grantedAuthorityMapper.setPrefix("ROLE_");
        grantedAuthorityMapper.setConvertToUpperCase(true);
        
        keycloakAuthenticationProvider.setGrantedAuthoritiesMapper(grantedAuthorityMapper);
        auth.authenticationProvider(keycloakAuthenticationProvider);
    }

    @Bean
    @Override
    protected SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new RegisterSessionAuthenticationStrategy(new SessionRegistryImpl());
    }

    @Bean
    public KeycloakSpringBootConfigResolver keycloakConfigResolver() {
        return new KeycloakSpringBootConfigResolver();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        super.configure(http);
        http
            .csrf().disable()
            .cors()
            .and()
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos
                .requestMatchers("/api/health", "/actuator/**").permitAll()
                .requestMatchers("/api/auth/legacy/**").permitAll() // Sistema antiguo
                
                // Endpoints protegidos por Keycloak
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/vendedor/**").hasAnyRole("VENDEDOR", "JEFE_VENTAS")
                .requestMatchers("/api/finanzas/**").hasRole("FINANZAS")
                
                // Cualquier otra solicitud requiere autenticación
                .anyRequest().authenticated()
            );
    }
}
```

### **2.4 Servicio de Sincronización (Dual System)**

**Archivo: `backend/src/main/java/com/armasimportacion/service/KeycloakSyncService.java`** (NUEVO)

```java
package com.armasimportacion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "keycloak.enabled", havingValue = "true")
public class KeycloakSyncService {

    @Value("${keycloak.admin.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin.realm}")
    private String adminRealm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    @Value("${keycloak.admin.username}")
    private String username;

    @Value("${keycloak.admin.password}")
    private String password;

    @Value("${keycloak.realm}")
    private String realm;

    private Keycloak keycloak;
    private RealmResource realmResource;

    @PostConstruct
    public void init() {
        this.keycloak = KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm(adminRealm)
                .clientId(clientId)
                .username(username)
                .password(password)
                .build();

        this.realmResource = keycloak.realm(realm);
        log.info("✅ Keycloak Admin Client inicializado para realm: {}", realm);
    }

    /**
     * Sincronizar usuario de BD a Keycloak
     */
    public void syncUserToKeycloak(Usuario usuario) {
        try {
            UsersResource usersResource = realmResource.users();
            
            // Verificar si el usuario ya existe en Keycloak
            List<UserRepresentation> existingUsers = usersResource.search(usuario.getUsername());
            
            if (existingUsers.isEmpty()) {
                // Crear nuevo usuario en Keycloak
                UserRepresentation user = new UserRepresentation();
                user.setUsername(usuario.getUsername());
                user.setEmail(usuario.getEmail());
                user.setFirstName(usuario.getNombres());
                user.setLastName(usuario.getApellidos());
                user.setEnabled(usuario.getEstado());
                user.setEmailVerified(true);
                
                // Crear usuario
                Response response = usersResource.create(user);
                String userId = extractUserId(response);
                
                // Asignar password temporal (usuario debe cambiarla)
                resetPassword(userId, "ChangeMe123!", true);
                
                // Asignar roles
                assignRolesToUser(userId, usuario.getRoles());
                
                log.info("✅ Usuario {} sincronizado a Keycloak", usuario.getUsername());
            } else {
                log.info("ℹ️ Usuario {} ya existe en Keycloak", usuario.getUsername());
            }
            
        } catch (Exception e) {
            log.error("❌ Error sincronizando usuario {} a Keycloak: {}", usuario.getUsername(), e.getMessage());
        }
    }

    /**
     * Actualizar usuario en Keycloak
     */
    public void updateUserInKeycloak(Usuario usuario) {
        try {
            UsersResource usersResource = realmResource.users();
            List<UserRepresentation> users = usersResource.search(usuario.getUsername());
            
            if (!users.isEmpty()) {
                UserRepresentation user = users.get(0);
                user.setEmail(usuario.getEmail());
                user.setFirstName(usuario.getNombres());
                user.setLastName(usuario.getApellidos());
                user.setEnabled(usuario.getEstado());
                
                usersResource.get(user.getId()).update(user);
                
                // Actualizar roles
                assignRolesToUser(user.getId(), usuario.getRoles());
                
                log.info("✅ Usuario {} actualizado en Keycloak", usuario.getUsername());
            }
        } catch (Exception e) {
            log.error("❌ Error actualizando usuario {} en Keycloak: {}", usuario.getUsername(), e.getMessage());
        }
    }

    /**
     * Resetear password de usuario en Keycloak
     */
    public void resetPassword(String userId, String newPassword, boolean temporary) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(newPassword);
        credential.setTemporary(temporary);
        
        realmResource.users().get(userId).resetPassword(credential);
    }

    /**
     * Asignar roles a usuario en Keycloak
     */
    private void assignRolesToUser(String userId, Set<Rol> roles) {
        List<RoleRepresentation> keycloakRoles = roles.stream()
                .map(rol -> realmResource.roles().get(rol.getCodigo()).toRepresentation())
                .collect(Collectors.toList());
        
        realmResource.users().get(userId).roles().realmLevel().add(keycloakRoles);
    }

    /**
     * Extraer userId de la respuesta de creación
     */
    private String extractUserId(Response response) {
        String location = response.getHeaderString("Location");
        return location.substring(location.lastIndexOf('/') + 1);
    }

    /**
     * Sincronizar TODOS los usuarios de BD a Keycloak (una sola vez)
     */
    public void syncAllUsersToKeycloak(List<Usuario> usuarios) {
        log.info("🔄 Iniciando sincronización masiva de {} usuarios a Keycloak", usuarios.size());
        
        int success = 0;
        int failed = 0;
        
        for (Usuario usuario : usuarios) {
            try {
                syncUserToKeycloak(usuario);
                success++;
            } catch (Exception e) {
                failed++;
                log.error("❌ Error sincronizando usuario {}: {}", usuario.getUsername(), e.getMessage());
            }
        }
        
        log.info("✅ Sincronización completa: {} exitosos, {} fallidos", success, failed);
    }
}
```

### **2.5 Controller de Migración (Admin Only)**

**Archivo: `backend/src/main/java/com/armasimportacion/controller/KeycloakMigrationController.java`** (NUEVO)

```java
package com.armasimportacion.controller;

import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.service.KeycloakSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/keycloak")
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "keycloak.enabled", havingValue = "true")
public class KeycloakMigrationController {

    private final KeycloakSyncService keycloakSyncService;
    private final UsuarioRepository usuarioRepository;

    /**
     * Sincronizar TODOS los usuarios de BD a Keycloak
     */
    @PostMapping("/sync-all-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> syncAllUsers() {
        log.info("🔄 Admin solicitó sincronización masiva de usuarios");
        
        List<Usuario> usuarios = usuarioRepository.findAll();
        keycloakSyncService.syncAllUsersToKeycloak(usuarios);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Sincronización completada");
        response.put("totalUsers", usuarios.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Sincronizar un usuario específico
     */
    @PostMapping("/sync-user/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> syncUser(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        keycloakSyncService.syncUserToKeycloak(usuario);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Usuario sincronizado exitosamente");
        response.put("username", usuario.getUsername());
        
        return ResponseEntity.ok(response);
    }
}
```

---

## 🎨 FASE 3: Integración Frontend (2-3 días)

### **3.1 Instalar Keycloak JS Adapter**

```bash
cd frontend
npm install keycloak-js
```

### **3.2 Configurar Keycloak en Frontend**

**Archivo: `frontend/src/config/keycloak.ts`** (NUEVO)

```typescript
import Keycloak from 'keycloak-js';

// Configuración de Keycloak
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180',
  realm: 'gmarm',
  clientId: 'gmarm-frontend',
};

// Instancia de Keycloak
const keycloak = new Keycloak(keycloakConfig);

/**
 * Inicializar Keycloak
 */
export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso', // No redirige automáticamente
      checkLoginIframe: false,
      pkceMethod: 'S256', // PKCE para seguridad
    });

    // Si está autenticado, configurar refresh automático
    if (authenticated && keycloak.token) {
      // Renovar token cada 60 segundos
      setInterval(() => {
        keycloak.updateToken(70).then((refreshed) => {
          if (refreshed) {
            console.log('✅ Token renovado');
          }
        }).catch(() => {
          console.error('❌ Error renovando token');
        });
      }, 60000);
    }

    return authenticated;
  } catch (error) {
    console.error('❌ Error inicializando Keycloak:', error);
    return false;
  }
};

/**
 * Login con Keycloak
 */
export const login = () => {
  keycloak.login({
    redirectUri: window.location.origin,
  });
};

/**
 * Logout con Keycloak
 */
export const logout = () => {
  keycloak.logout({
    redirectUri: window.location.origin,
  });
};

/**
 * Obtener token de Keycloak
 */
export const getToken = (): string | undefined => {
  return keycloak.token;
};

/**
 * Verificar si tiene un rol específico
 */
export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role);
};

/**
 * Obtener información del usuario
 */
export const getUserInfo = () => {
  return keycloak.tokenParsed;
};

export default keycloak;
```

### **3.3 Actualizar AuthContext con Keycloak**

**Archivo: `frontend/src/contexts/AuthContext.tsx`** (MODIFICAR)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import keycloak, { initKeycloak, login, logout, getToken, hasRole, getUserInfo } from '../config/keycloak';
import apiService from '../services/apiService';

// Feature flag: Habilitar/deshabilitar Keycloak
const KEYCLOAK_ENABLED = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (KEYCLOAK_ENABLED) {
        // Sistema NUEVO: Keycloak
        const authenticated = await initKeycloak();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userInfo = getUserInfo();
          setUser(userInfo);

          // Configurar token en API service
          const token = getToken();
          if (token) {
            apiService.setAuthToken(token);
          }
        }
      } else {
        // Sistema ANTIGUO: JWT
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
          apiService.setAuthToken(token);
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleLogin = () => {
    if (KEYCLOAK_ENABLED) {
      login(); // Redirige a Keycloak
    } else {
      // Sistema antiguo: redirigir a /login
      window.location.href = '/login';
    }
  };

  const handleLogout = () => {
    if (KEYCLOAK_ENABLED) {
      logout(); // Logout de Keycloak
    } else {
      // Sistema antiguo
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const checkRole = (role: string): boolean => {
    if (KEYCLOAK_ENABLED) {
      return hasRole(role);
    } else {
      // Sistema antiguo: verificar roles en user object
      return user?.roles?.some((r: any) => r.codigo === role) || false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login: handleLogin,
        logout: handleLogout,
        hasRole: checkRole,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### **3.4 Variables de Entorno**

**Archivo: `frontend/.env.local`**

```bash
# Keycloak
VITE_KEYCLOAK_ENABLED=false  # true para activar Keycloak
VITE_KEYCLOAK_URL=http://localhost:8180
```

**Archivo: `frontend/.env.production`**

```bash
# Keycloak
VITE_KEYCLOAK_ENABLED=true
VITE_KEYCLOAK_URL=https://auth.gmarm.com
```

---

## 🔄 FASE 4: Migración Gradual (1-2 semanas)

### **Estrategia de Migración:**

```
┌────────────────────────────────────────────────────────┐
│ SEMANA 1: Sistema Dual (Ambos Activos)                │
│  - Keycloak enabled=false (desarrollo)                 │
│  - Sincronizar usuarios de prueba                      │
│  - Testing con usuarios Admin                          │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ SEMANA 2: Sincronización Masiva                        │
│  - Ejecutar /api/admin/keycloak/sync-all-users         │
│  - Notificar a usuarios que cambien password           │
│  - Keycloak enabled=true (solo para Admin y Beta)      │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ SEMANA 3-4: Activación Total                           │
│  - Keycloak enabled=true para TODOS                    │
│  - Sistema JWT legacy disponible como fallback         │
│  - Monitorear logs y errores                           │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ MES 2: Deprecación JWT                                 │
│  - Eliminar código de JWT antiguo                      │
│  - Eliminar columna password_hash de BD                │
│  - 100% Keycloak                                        │
└────────────────────────────────────────────────────────┘
```

### **Script de Sincronización Inicial:**

```bash
#!/bin/bash
# Script: scripts/sync-users-to-keycloak.sh

echo "🔄 Sincronizando usuarios a Keycloak..."

# Login como admin
TOKEN=$(curl -s -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Ejecutar sincronización
curl -X POST "http://localhost:8080/api/admin/keycloak/sync-all-users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo "✅ Sincronización completada"
```

---

## 📊 FASE 5: Testing y Validación (1 semana)

### **Checklist de Testing:**

- [ ] **Login con Keycloak funciona**
  - Usuario admin puede loguearse
  - Token se guarda correctamente
  - Roles se mapean correctamente

- [ ] **Logout funciona**
  - Token se invalida en Keycloak
  - Frontend redirige a login

- [ ] **Renovación automática de token**
  - Token se renueva cada 60 segundos
  - No hay interrupciones de sesión

- [ ] **Roles y permisos**
  - Admin puede acceder a /admin
  - Vendedor NO puede acceder a /admin
  - Roles se verifican correctamente

- [ ] **Sistema dual funciona**
  - Con `KEYCLOAK_ENABLED=false` usa JWT
  - Con `KEYCLOAK_ENABLED=true` usa Keycloak

- [ ] **Sincronización BD ↔ Keycloak**
  - Crear usuario en BD lo crea en Keycloak
  - Actualizar usuario en BD lo actualiza en Keycloak
  - Deshabilitar usuario en BD lo deshabilita en Keycloak

- [ ] **MFA (Multi-Factor Authentication)**
  - Usuario puede habilitar Google Authenticator
  - Login requiere código MFA si está habilitado

- [ ] **Password reset**
  - Usuario puede resetear password desde Keycloak
  - Email de reset se envía correctamente

---

## 🚀 FASE 6: Producción (1 día)

### **Checklist Pre-Producción:**

- [ ] **Keycloak en servidor separado**
  - PostgreSQL dedicado para Keycloak
  - Keycloak con SSL/HTTPS
  - Dominio: `auth.gmarm.com`

- [ ] **Backups**
  - Backup de BD actual (con passwords)
  - Backup de configuración de Keycloak

- [ ] **Monitoreo**
  - Logs de Keycloak configurados
  - Alertas de fallos de login
  - Métricas de performance

- [ ] **Documentación**
  - Guía de usuario para login con Keycloak
  - Procedimiento de recuperación de password
  - Procedimiento de rollback

### **Comandos de Deployment Producción:**

```bash
# En servidor de producción

# 1. Levantar Keycloak
docker-compose -f docker-compose.keycloak.yml up -d

# 2. Configurar realm y clients (manual en Admin Console)

# 3. Sincronizar usuarios
bash scripts/sync-users-to-keycloak.sh

# 4. Activar Keycloak en backend
echo "KEYCLOAK_ENABLED=true" >> .env

# 5. Rebuild y restart backend
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build backend

# 6. Rebuild y restart frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend

# 7. Verificar
curl https://auth.gmarm.com/health/ready
curl https://api.gmarm.com/api/health
```

---

## 🔐 Beneficios de la Migración

### **Seguridad:**
- ✅ **Passwords NO en tu BD** (aisladas en Keycloak)
- ✅ **Tokens más seguros** (OpenID Connect estándar)
- ✅ **MFA integrado** (Google Authenticator, SMS)
- ✅ **Password policies** (longitud, complejidad, expiración)
- ✅ **Auditoría completa** de logins y accesos
- ✅ **Protección contra brute force** (rate limiting integrado)

### **Experiencia de Usuario:**
- ✅ **SSO** (login una vez, acceso a todas las apps)
- ✅ **Social login** (Google, Microsoft, Facebook)
- ✅ **Self-service** (cambio de password, perfil)
- ✅ **Sesiones persistentes** (remember me)

### **Administración:**
- ✅ **Admin Console** poderosa (gestión centralizada)
- ✅ **LDAP/Active Directory** integration (si es necesario)
- ✅ **Roles y permisos** granulares
- ✅ **Eventos y logs** detallados
- ✅ **Alta disponibilidad** con clustering

### **Desarrollo:**
- ✅ **Estándares** (OAuth 2.0, OpenID Connect)
- ✅ **Menos código** (Keycloak maneja autenticación)
- ✅ **Adaptadores** para múltiples lenguajes
- ✅ **Testing más fácil** (users de prueba en Keycloak)

---

## ⚠️ Consideraciones y Riesgos

### **Riesgos:**
1. **Complejidad inicial** - Curva de aprendizaje de Keycloak
2. **Dependencia externa** - Keycloak debe estar siempre disponible
3. **Migración de usuarios** - Requiere sincronización cuidadosa
4. **Recursos adicionales** - Keycloak consume ~1GB RAM

### **Mitigaciones:**
1. **Sistema dual** - Ambos sistemas coexisten durante migración
2. **Backup completo** - Rollback disponible si algo falla
3. **Testing exhaustivo** - Validar antes de producción
4. **Documentación** - Guías de usuario y admin

---

## 📚 Recursos Adicionales

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Spring Boot Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_spring_boot_adapter)
- [Keycloak JS Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- [OpenID Connect Flow](https://openid.net/specs/openid-connect-core-1_0.html)

---

## 🎯 Resumen Ejecutivo

| Fase | Tiempo | Esfuerzo | Riesgo |
|------|--------|----------|--------|
| **Setup Keycloak** | 1-2 días | Bajo | Bajo |
| **Backend Integration** | 2-3 días | Medio | Medio |
| **Frontend Integration** | 2-3 días | Medio | Bajo |
| **Migración Gradual** | 1-2 semanas | Alto | Medio |
| **Testing** | 1 semana | Medio | Bajo |
| **Producción** | 1 día | Bajo | Alto |
| **TOTAL** | **~3-4 semanas** | **Medio-Alto** | **Medio** |

---

**¿Vale la pena?** ✅ **SÍ**

- Seguridad **significativamente mejorada**
- Passwords **NUNCA en tu BD**
- Cumplimiento de **estándares de industria**
- **MFA, SSO, Social Login** incluidos
- **Escalabilidad** para el futuro

---

**Next Steps:**

1. ✅ Revisar este documento con el equipo
2. ✅ Aprobar recursos (1GB RAM adicional para Keycloak)
3. ✅ Definir fecha de inicio (Fase 1)
4. ✅ Asignar responsables
5. 🚀 **Comenzar migración**

---

*Última actualización: 2025-11-12*
*Versión: 1.0*
*Autor: AI Assistant + Equipo GMARM*

