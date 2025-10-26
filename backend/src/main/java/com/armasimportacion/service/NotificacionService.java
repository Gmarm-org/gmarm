package com.armasimportacion.service;

import com.armasimportacion.exception.ResourceNotFoundException;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.Notificacion;
import com.armasimportacion.model.Usuario;
import com.armasimportacion.repository.ClienteRepository;
import com.armasimportacion.repository.GrupoImportacionRepository;
import com.armasimportacion.repository.NotificacionRepository;
import com.armasimportacion.repository.UsuarioRepository;
import com.armasimportacion.enums.TipoNotificacion;
import com.armasimportacion.enums.EstadoNotificacion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificacionService {
    
    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final GrupoImportacionRepository grupoImportacionRepository;
    
    // CRUD Operations
    public Notificacion crearNotificacion(Notificacion notificacion) {
        log.info("Creando notificación: {}", notificacion.getTitulo());
        
        notificacion.setEstado(EstadoNotificacion.NO_LEIDA);
        notificacion.setFechaCreacion(LocalDateTime.now());
        
        return notificacionRepository.save(notificacion);
    }
    
    public Notificacion obtenerNotificacion(Long id) {
        return notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada con ID: " + id));
    }
    
    public List<Notificacion> obtenerNotificacionesPorUsuario(Long usuarioId) {
        return notificacionRepository.findByUsuarioDestinatarioId(usuarioId);
    }
    
    public List<Notificacion> obtenerNotificacionesNoLeidas(Long usuarioId) {
        return notificacionRepository.findByUsuarioDestinatarioIdAndEstado(usuarioId, EstadoNotificacion.NO_LEIDA);
    }
    
    public void marcarComoLeida(Long notificacionId) {
        Notificacion notificacion = obtenerNotificacion(notificacionId);
        notificacion.setEstado(EstadoNotificacion.LEIDA);
        notificacion.setFechaLectura(LocalDateTime.now());
        notificacion.setFechaActualizacion(LocalDateTime.now());
        notificacionRepository.save(notificacion);
    }
    
    public void marcarComoEnviada(Long notificacionId) {
        Notificacion notificacion = obtenerNotificacion(notificacionId);
        notificacion.setEstado(EstadoNotificacion.NO_LEIDA);
        notificacion.setFechaActualizacion(LocalDateTime.now());
        notificacionRepository.save(notificacion);
    }
    
    public void eliminarNotificacion(Long id) {
        if (!notificacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notificación no encontrada con ID: " + id);
        }
        notificacionRepository.deleteById(id);
    }
    
    // Business Logic - Notificaciones específicas del sistema
    
    // Notificación de nuevo cliente
    public void notificarNuevoCliente(Long clienteId, Long vendedorId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        // Notificar al jefe de ventas
        List<Usuario> jefesVentas = usuarioRepository.findByRolesNombre("JEFE_VENTAS");
        for (Usuario jefe : jefesVentas) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Nuevo Cliente Registrado");
            notificacion.setMensaje("El vendedor ha registrado un nuevo cliente: " + cliente.getNombreCompleto());
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(jefe);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de solicitud de aprobación
    public void notificarSolicitudAprobacion(Long clienteId, Long grupoImportacionId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoImportacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        
        // Notificar al jefe de ventas
        List<Usuario> jefesVentas = usuarioRepository.findByRolesNombre("JEFE_VENTAS");
        for (Usuario jefe : jefesVentas) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Solicitud de Aprobación");
            notificacion.setMensaje("Cliente " + cliente.getNombreCompleto() + " solicita aprobación para grupo " + grupo.getNombre());
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(jefe);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de contrato firmado
    public void notificarContratoFirmado(Long clienteId, Long documentoId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        // Notificar a finanzas
        List<Usuario> finanzas = usuarioRepository.findByRolesNombre("FINANZAS");
        for (Usuario usuario : finanzas) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Contrato Firmado");
            notificacion.setMensaje("El cliente " + cliente.getNombreCompleto() + " ha firmado el contrato");
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(usuario);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de pago registrado
    public void notificarPagoRegistrado(Long clienteId, Long pagoId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        // Notificar a operaciones
        List<Usuario> operaciones = usuarioRepository.findByRolesNombre("OPERACIONES");
        for (Usuario usuario : operaciones) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Pago Registrado");
            notificacion.setMensaje("Se ha registrado un pago para el cliente " + cliente.getNombreCompleto());
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(usuario);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de documento cargado
    public void notificarDocumentoCargado(Long grupoImportacionId, String tipoDocumento) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoImportacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        
        // Notificar a operaciones
        List<Usuario> operaciones = usuarioRepository.findByRolesNombre("OPERACIONES");
        for (Usuario usuario : operaciones) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Documento Cargado");
            notificacion.setMensaje("Se ha cargado el documento " + tipoDocumento + " para el grupo " + grupo.getNombre());
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(usuario);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de llegada de importación
    public void notificarLlegadaImportacion(Long grupoImportacionId) {
        GrupoImportacion grupo = grupoImportacionRepository.findById(grupoImportacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo de importación no encontrado"));
        
        // Notificar a operaciones y jefe de ventas
        List<Usuario> usuarios = usuarioRepository.findByRolesNombreIn(List.of("OPERACIONES", "JEFE_VENTAS"));
        for (Usuario usuario : usuarios) {
            Notificacion notificacion = new Notificacion();
            notificacion.setTitulo("Importación Llegada");
            notificacion.setMensaje("La importación " + grupo.getNombre() + " ha llegado y está lista para procesar");
            notificacion.setTipo(TipoNotificacion.SISTEMA);
            notificacion.setUsuarioDestinatario(usuario);
            
            crearNotificacion(notificacion);
        }
    }
    
    // Notificación de asignación de serie
    public void notificarAsignacionSerie(Long clienteId, String numeroSerie) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        
        // Notificar al cliente (email)
        Notificacion notificacion = new Notificacion();
        notificacion.setTitulo("Serie Asignada");
        notificacion.setMensaje("Se ha asignado la serie " + numeroSerie + " a su arma");
        notificacion.setTipo(TipoNotificacion.SISTEMA);
        notificacion.setUsuarioDestinatario(cliente.getUsuarioCreador());
        
        crearNotificacion(notificacion);
    }
    
    // Utilidades
    public int contarNotificacionesNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioDestinatarioIdAndEstado(usuarioId, EstadoNotificacion.NO_LEIDA);
    }
    
    public void marcarTodasComoLeidas(Long usuarioId) {
        List<Notificacion> notificaciones = obtenerNotificacionesNoLeidas(usuarioId);
        for (Notificacion notificacion : notificaciones) {
            marcarComoLeida(notificacion.getId());
        }
    }
    
    public List<Notificacion> obtenerNotificacionesPorTipo(Long usuarioId, TipoNotificacion tipo) {
        return notificacionRepository.findByUsuarioDestinatarioIdAndTipo(usuarioId, tipo);
    }
} 
