package com.armasimportacion.config;

import com.armasimportacion.model.CategoriaArma;
import com.armasimportacion.model.ModeloArma;
import com.armasimportacion.model.Rol;
import com.armasimportacion.model.TipoCliente;
import com.armasimportacion.model.TipoIdentificacion;
import com.armasimportacion.model.TipoProceso;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.CategoriaArmaRepository;
import com.armasimportacion.repository.ModeloArmaRepository;
import com.armasimportacion.repository.RolRepository;
import com.armasimportacion.repository.TipoClienteRepository;
import com.armasimportacion.repository.TipoIdentificacionRepository;
import com.armasimportacion.repository.TipoProcesoRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoUsuario;
import com.armasimportacion.enums.TipoRolVendedor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final TipoClienteRepository tipoClienteRepository;
    private final TipoIdentificacionRepository tipoIdentificacionRepository;
    private final TipoProcesoRepository tipoProcesoRepository;
    private final CategoriaArmaRepository categoriaArmaRepository;
    private final ModeloArmaRepository modeloArmaRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile({"dev", "docker"})
    public CommandLineRunner initializeData() {
        return args -> {
            log.info("Inicializando datos de desarrollo...");
            
            // Crear roles
            createRoles();
            
            // Crear usuario administrador
            createAdminUser();
            
            // Crear usuarios de prueba
            createTestUsers();
            
            // Crear datos básicos
            createBasicData();
            
            log.info("Datos de desarrollo inicializados correctamente");
        };
    }

    private void createRoles() {
        if (rolRepository.count() == 0) {
            log.info("Creando roles...");
            
            Rol admin = new Rol();
            admin.setNombre("ADMIN");
            admin.setDescripcion("Acceso completo al sistema");
            admin.setEstado(true);
            rolRepository.save(admin);

            Rol vendedor = new Rol();
            vendedor.setNombre("VENDEDOR");
            vendedor.setDescripcion("Registro de clientes y selección de armas catálogo");
            vendedor.setTipoRolVendedor(TipoRolVendedor.LIBRE);
            vendedor.setEstado(true);
            rolRepository.save(vendedor);

            Rol jefeVentas = new Rol();
            jefeVentas.setNombre("JEFE_VENTAS");
            jefeVentas.setDescripcion("Aprobación de solicitudes y creación de grupos de importación");
            jefeVentas.setTipoRolVendedor(TipoRolVendedor.FIJO);
            jefeVentas.setEstado(true);
            rolRepository.save(jefeVentas);

            Rol finanzas = new Rol();
            finanzas.setNombre("FINANZAS");
            finanzas.setDescripcion("Gestión de pagos y facturación");
            finanzas.setEstado(true);
            rolRepository.save(finanzas);

            Rol operaciones = new Rol();
            operaciones.setNombre("OPERACIONES");
            operaciones.setDescripcion("Gestión de importación y documentación");
            operaciones.setEstado(true);
            rolRepository.save(operaciones);
        }
    }

    private void createAdminUser() {
        if (!usuarioRepository.existsByUsername("admin")) {
            log.info("Creando usuario administrador...");
            
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setEmail("admin@armasimportacion.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setNombres("Administrador");
            admin.setApellidos("Sistema");
            admin.setTelefonoPrincipal("0999999999");
            admin.setDireccion("Quito, Ecuador");
            admin.setEstado(EstadoUsuario.ACTIVO);
            admin.setFechaCreacion(LocalDateTime.now());
            admin.setBloqueado(false);
            admin.setIntentosLogin(0);
            
            // Asignar rol de administrador
            Rol adminRol = rolRepository.findByNombre("ADMIN").orElseThrow();
            admin.getRoles().add(adminRol);
            
            usuarioRepository.save(admin);
            log.info("Usuario administrador creado: admin/admin123");
        }
    }

    private void createTestUsers() {
        createTestUser("vendedor1", "vendedor1@armasimportacion.com", "Juan", "Pérez", "VENDEDOR");
        createTestUser("jefe_ventas", "jefe@armasimportacion.com", "María", "González", "JEFE_VENTAS");
        createTestUser("finanzas", "finanzas@armasimportacion.com", "Carlos", "López", "FINANZAS");
        createTestUser("operaciones", "operaciones@armasimportacion.com", "Ana", "Martínez", "OPERACIONES");
    }

    private void createTestUser(String username, String email, String nombres, String apellidos, String rolNombre) {
        if (!usuarioRepository.existsByUsername(username)) {
            log.info("Creando usuario de prueba: {}", username);
            
            Usuario usuario = new Usuario();
            usuario.setUsername(username);
            usuario.setEmail(email);
            usuario.setPasswordHash(passwordEncoder.encode("123456"));
            usuario.setNombres(nombres);
            usuario.setApellidos(apellidos);
            usuario.setTelefonoPrincipal("0999999999");
            usuario.setDireccion("Quito, Ecuador");
            usuario.setEstado(EstadoUsuario.ACTIVO);
            usuario.setFechaCreacion(LocalDateTime.now());
            usuario.setBloqueado(false);
            usuario.setIntentosLogin(0);
            
            // Asignar rol
            Rol rol = rolRepository.findByNombre(rolNombre).orElseThrow();
            usuario.getRoles().add(rol);
            
            usuarioRepository.save(usuario);
            log.info("Usuario de prueba creado: {}/123456", username);
        }
    }

    private void createBasicData() {
        // Tipos de cliente
        if (tipoClienteRepository.count() == 0) {
            log.info("Creando tipos de cliente...");
            
            TipoCliente civil = new TipoCliente();
            civil.setNombre("Civil");
            civil.setCodigo("CIVIL");
            civil.setDescripcion("Cliente civil con cédula");
            civil.setEstado(true);
            tipoClienteRepository.save(civil);

            TipoCliente militar = new TipoCliente();
            militar.setNombre("Militar");
            militar.setCodigo("MILITAR");
            militar.setDescripcion("Personal militar activo");
            militar.setEstado(true);
            tipoClienteRepository.save(militar);

            TipoCliente empresa = new TipoCliente();
            empresa.setNombre("Empresa Seguridad");
            empresa.setCodigo("EMPRESA");
            empresa.setDescripcion("Empresa de seguridad privada");
            empresa.setEstado(true);
            tipoClienteRepository.save(empresa);

            TipoCliente deportista = new TipoCliente();
            deportista.setNombre("Deportista");
            deportista.setCodigo("DEPORTISTA");
            deportista.setDescripcion("Deportista federado");
            deportista.setEstado(true);
            tipoClienteRepository.save(deportista);
        }

        // Tipos de identificación
        if (tipoIdentificacionRepository.count() == 0) {
            log.info("Creando tipos de identificación...");
            
            TipoIdentificacion cedula = new TipoIdentificacion();
            cedula.setNombre("Cédula");
            cedula.setCodigo("CEDULA");
            cedula.setDescripcion("Cédula de identidad ecuatoriana");
            cedula.setEstado(true);
            tipoIdentificacionRepository.save(cedula);

            TipoIdentificacion ruc = new TipoIdentificacion();
            ruc.setNombre("RUC");
            ruc.setCodigo("RUC");
            ruc.setDescripcion("Registro Único de Contribuyentes");
            ruc.setEstado(true);
            tipoIdentificacionRepository.save(ruc);

            TipoIdentificacion pasaporte = new TipoIdentificacion();
            pasaporte.setNombre("Pasaporte");
            pasaporte.setCodigo("PASAPORTE");
            pasaporte.setDescripcion("Pasaporte ecuatoriano");
            pasaporte.setEstado(true);
            tipoIdentificacionRepository.save(pasaporte);
        }

        // Tipos de proceso
        if (tipoProcesoRepository.count() == 0) {
            log.info("Creando tipos de proceso...");
            
            TipoProceso estandar = new TipoProceso();
            estandar.setNombre("Importación Estándar");
            estandar.setCodigo("IMPORT_STD");
            estandar.setDescripcion("Proceso de importación estándar");
            estandar.setEstado(true);
            tipoProcesoRepository.save(estandar);

            TipoProceso especial = new TipoProceso();
            especial.setNombre("Importación Especial");
            especial.setCodigo("IMPORT_ESP");
            especial.setDescripcion("Proceso de importación especial");
            especial.setEstado(true);
            tipoProcesoRepository.save(especial);
        }

        // Categorías de armas
        if (categoriaArmaRepository.count() == 0) {
            log.info("Creando categorías de armas...");
            
            CategoriaArma pistolas = new CategoriaArma();
            pistolas.setNombre("Pistolas");
            pistolas.setCodigo("PISTOLA");
            pistolas.setDescripcion("Pistolas semiautomáticas");
            pistolas.setEstado(true);
            categoriaArmaRepository.save(pistolas);

            CategoriaArma rifles = new CategoriaArma();
            rifles.setNombre("Rifles");
            rifles.setCodigo("RIFLE");
            rifles.setDescripcion("Rifles de caza y deporte");
            rifles.setEstado(true);
            categoriaArmaRepository.save(rifles);

            CategoriaArma escopetas = new CategoriaArma();
            escopetas.setNombre("Escopetas");
            escopetas.setCodigo("ESCOPETA");
            escopetas.setDescripcion("Escopetas de caza");
            escopetas.setEstado(true);
            categoriaArmaRepository.save(escopetas);
        }

        // Modelos de armas
        if (modeloArmaRepository.count() == 0) {
            log.info("Creando modelos de armas...");
            
            CategoriaArma pistolas = categoriaArmaRepository.findByNombre("Pistolas").orElseThrow();
            
            ModeloArma glock = new ModeloArma();
            glock.setCodigo("GLOCK-17");
            glock.setNombre("Glock 17");
            glock.setCalibre("9mm");
            glock.setCapacidad(17);
            glock.setPrecioReferencia(new BigDecimal("1200.00"));
            glock.setCategoriaArma(pistolas);
            glock.setEstado(true);
            modeloArmaRepository.save(glock);

            CategoriaArma rifles = categoriaArmaRepository.findByNombre("Rifles").orElseThrow();
            
            ModeloArma ar15 = new ModeloArma();
            ar15.setCodigo("AR-15");
            ar15.setNombre("AR-15 Sport");
            ar15.setCalibre("5.56mm");
            ar15.setCapacidad(30);
            ar15.setPrecioReferencia(new BigDecimal("2500.00"));
            ar15.setCategoriaArma(rifles);
            ar15.setEstado(true);
            modeloArmaRepository.save(ar15);
        }
    }
} 