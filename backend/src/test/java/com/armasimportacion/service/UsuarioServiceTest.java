package com.armasimportacion.service;

import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.EstadoUsuario;
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
        assertThrows(RuntimeException.class, () -> usuarioService.findById(999L));
        verify(usuarioRepository, times(1)).findById(999L);
    }

    @Test
    void testSave() {
        // Arrange
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(testUsuario);

        // Act
        Usuario result = usuarioService.save(testUsuario);

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
        when(usuarioRepository.existsById(1L)).thenReturn(true);

        // Act
        usuarioService.delete(1L);

        // Assert
        verify(usuarioRepository, times(1)).existsById(1L);
        verify(usuarioRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteNotFound() {
        // Arrange
        when(usuarioRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> usuarioService.delete(999L));
        verify(usuarioRepository, times(1)).existsById(999L);
        verify(usuarioRepository, never()).deleteById(any());
    }

    @Test
    void testFindByUsername() {
        // Arrange
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(testUsuario));

        // Act
        Optional<Usuario> result = usuarioService.findByUsername("testuser");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUsuario.getUsername(), result.get().getUsername());
        verify(usuarioRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void testFindByEmail() {
        // Arrange
        when(usuarioRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUsuario));

        // Act
        Optional<Usuario> result = usuarioService.findByEmail("test@example.com");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUsuario.getEmail(), result.get().getEmail());
        verify(usuarioRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    void testExistsByUsername() {
        // Arrange
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(true);

        // Act
        boolean result = usuarioService.existsByUsername("testuser");

        // Assert
        assertTrue(result);
        verify(usuarioRepository, times(1)).existsByUsername("testuser");
    }

    @Test
    void testExistsByEmail() {
        // Arrange
        when(usuarioRepository.existsByEmail("test@example.com")).thenReturn(true);

        // Act
        boolean result = usuarioService.existsByEmail("test@example.com");

        // Assert
        assertTrue(result);
        verify(usuarioRepository, times(1)).existsByEmail("test@example.com");
    }
} 