package com.armasimportacion.service;

import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoUsuario;
import com.armasimportacion.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario testUsuario;

    @BeforeEach
    void setUp() {
        testUsuario = new Usuario();
        testUsuario.setId(1L);
        testUsuario.setUsername("testuser");
        testUsuario.setEmail("test@example.com");
        testUsuario.setPasswordHash("password123");
        testUsuario.setNombres("Test");
        testUsuario.setApellidos("User");
        testUsuario.setTelefonoPrincipal("0987654321");
        testUsuario.setDireccion("Test Address");
        testUsuario.setEstado(EstadoUsuario.ACTIVO);
        testUsuario.setFechaCreacion(LocalDateTime.now());
    }

    @Test
    void testFindAll() {
        // Arrange
        List<Usuario> usuarios = Arrays.asList(testUsuario);
        when(usuarioRepository.findAll()).thenReturn(usuarios);

        // Act
        List<Usuario> result = usuarioService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testUsuario.getUsername(), result.get(0).getUsername());
        verify(usuarioRepository, times(1)).findAll();
    }

    @Test
    void testFindById() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(testUsuario));

        // Act
        Usuario result = usuarioService.findById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testUsuario.getUsername(), result.getUsername());
        verify(usuarioRepository, times(1)).findById(1L);
    }

    @Test
    void testFindByIdNotFound() {
        // Arrange
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> usuarioService.findById(999L));
        verify(usuarioRepository, times(1)).findById(999L);
    }

    @Test
    void testCreate() {
        // Arrange
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(testUsuario);
        when(usuarioRepository.existsByUsername(any())).thenReturn(false);
        when(usuarioRepository.existsByEmail(any())).thenReturn(false);

        // Act
        Usuario result = usuarioService.create(testUsuario);

        // Assert
        assertNotNull(result);
        assertEquals(testUsuario.getUsername(), result.getUsername());
        verify(passwordEncoder, times(1)).encode(any());
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    void testUpdate() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(testUsuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(testUsuario);
        when(usuarioRepository.existsByEmailAndIdNot(any(), any())).thenReturn(false);

        // Act
        Usuario result = usuarioService.update(1L, testUsuario);

        // Assert
        assertNotNull(result);
        assertEquals(testUsuario.getUsername(), result.getUsername());
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    void testDelete() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(testUsuario));

        // Act
        usuarioService.delete(1L);

        // Assert
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).delete(any(Usuario.class));
    }

    @Test
    void testDeleteNotFound() {
        // Arrange
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> usuarioService.delete(999L));
        verify(usuarioRepository, times(1)).findById(999L);
        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    void testFindByUsername() {
        // Arrange
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(testUsuario));

        // Act
        Usuario result = usuarioService.findByUsername("testuser");

        // Assert
        assertNotNull(result);
        assertEquals(testUsuario.getUsername(), result.getUsername());
        verify(usuarioRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void testFindByEmail() {
        // Arrange
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUsuario));

        // Act
        Usuario result = usuarioService.findByEmail("test@example.com");

        // Assert
        assertNotNull(result);
        assertEquals(testUsuario.getEmail(), result.getEmail());
        verify(usuarioRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    void testChangeStatus() {
        // Arrange
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(testUsuario));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(testUsuario);

        // Act
        Usuario result = usuarioService.changeStatus(1L, EstadoUsuario.BLOQUEADO);

        // Assert
        assertNotNull(result);
        assertEquals(EstadoUsuario.BLOQUEADO, result.getEstado());
        verify(usuarioRepository, times(1)).findById(1L);
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }
} 