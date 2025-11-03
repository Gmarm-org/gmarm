package com.armasimportacion.service;

import com.armasimportacion.model.ArmaStock;
import com.armasimportacion.repository.ArmaStockRepository;
import com.armasimportacion.repository.ConfiguracionSistemaRepository;
import com.armasimportacion.dto.ArmaStockDTO;
import com.armasimportacion.mapper.ArmaStockMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión del inventario de armas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventarioService {

    private final ArmaStockRepository armaStockRepository;
    private final ConfiguracionSistemaRepository configuracionSistemaRepository;
    private final ArmaStockMapper armaStockMapper;

    /**
     * Verificar si la expoferia está activa
     */
    @Transactional(readOnly = true)
    public boolean isExpoferiaActiva() {
        return configuracionSistemaRepository.findByClave("EXPOFERIA_ACTIVA")
                .map(config -> "true".equalsIgnoreCase(config.getValor()))
                .orElse(false);
    }

    /**
     * Obtener el nombre de la expoferia actual
     */
    @Transactional(readOnly = true)
    public String getExpoferiaNombre() {
        return configuracionSistemaRepository.findByClave("EXPOFERIA_NOMBRE")
                .map(config -> config.getValor())
                .orElse("EXPOFERIA_2025");
    }

    /**
     * Obtener todas las armas con stock disponible
     */
    @Transactional(readOnly = true)
    public List<ArmaStock> getArmasConStockDisponible() {
        try {
            if (isExpoferiaActiva()) {
                log.info("🎯 Expoferia activa - Mostrando solo armas de expoferia (expoferia=true)");
                List<ArmaStock> armas = armaStockRepository.findArmasExpoferiaConStock(true);
                return armas != null ? armas : new ArrayList<>();
            } else {
                log.info("🎯 Expoferia inactiva - Mostrando todas las armas con stock");
                List<ArmaStock> armas = armaStockRepository.findArmasConStockDisponible();
                return armas != null ? armas : new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("❌ Error obteniendo armas con stock: {}", e.getMessage(), e);
            return new ArrayList<>(); // Retornar lista vacía en caso de error
        }
    }

    /**
     * Verificar si una arma tiene stock suficiente
     */
    @Transactional(readOnly = true)
    public boolean tieneStockSuficiente(Long armaId, Integer cantidad) {
        Boolean tieneStock = armaStockRepository.tieneStockSuficiente(armaId, cantidad);
        return tieneStock != null ? tieneStock : false;
    }

    /**
     * Obtener stock disponible de una arma
     */
    @Transactional(readOnly = true)
    public Integer getStockDisponible(Long armaId) {
        return armaStockRepository.getStockDisponible(armaId).orElse(0);
    }

    /**
     * Obtener información de stock de una arma
     */
    @Transactional(readOnly = true)
    public Optional<ArmaStock> getArmaStock(Long armaId) {
        return armaStockRepository.findByArmaIdAndActivoTrue(armaId);
    }

    /**
     * Reducir stock de una arma (usado cuando se hace una reserva)
     */
    @Transactional
    public void reducirStock(Long armaId, Integer cantidad) {
        ArmaStock armaStock = armaStockRepository.findByArmaIdAndActivoTrue(armaId)
                .orElseThrow(() -> new RuntimeException("Stock no encontrado para arma ID: " + armaId));

        if (!armaStock.tieneStockSuficiente(cantidad)) {
            throw new RuntimeException("Stock insuficiente para arma: " + armaStock.getArma().getNombre() + 
                                     ". Disponible: " + armaStock.getCantidadDisponible() + 
                                     ", Solicitado: " + cantidad);
        }

        armaStock.reducirStock(cantidad);
        armaStockRepository.save(armaStock);
        
        log.info("✅ Stock reducido - Arma: {}, Cantidad: {}, Disponible: {}", 
                armaStock.getArma().getNombre(), cantidad, armaStock.getCantidadDisponible());
    }

    /**
     * Aumentar stock de una arma (usado cuando se cancela una reserva)
     */
    @Transactional
    public void aumentarStock(Long armaId, Integer cantidad) {
        ArmaStock armaStock = armaStockRepository.findByArmaIdAndActivoTrue(armaId)
                .orElseThrow(() -> new RuntimeException("Stock no encontrado para arma ID: " + armaId));

        armaStock.aumentarStock(cantidad);
        armaStockRepository.save(armaStock);
        
        log.info("✅ Stock aumentado - Arma: {}, Cantidad: {}, Disponible: {}", 
                armaStock.getArma().getNombre(), cantidad, armaStock.getCantidadDisponible());
    }

    /**
     * Activar/desactivar expoferia
     */
    @Transactional
    public void setExpoferiaActiva(boolean activa) {
        configuracionSistemaRepository.findByClave("EXPOFERIA_ACTIVA")
                .ifPresentOrElse(
                    config -> {
                        config.setValor(activa ? "true" : "false");
                        configuracionSistemaRepository.save(config);
                        log.info("✅ Expoferia {} - Configuración actualizada", activa ? "activada" : "desactivada");
                    },
                    () -> log.warn("⚠️ Configuración EXPOFERIA_ACTIVA no encontrada")
                );
    }

    /**
     * Obtener stock de todas las armas (para panel de jefe de ventas)
     */
    @Transactional(readOnly = true)
    public List<ArmaStockDTO> getStockTodasArmas() {
        log.info("Obteniendo stock de todas las armas");
        List<ArmaStock> stockList = armaStockRepository.findByActivoTrue();
        return armaStockMapper.toDTOList(stockList);
    }
}
