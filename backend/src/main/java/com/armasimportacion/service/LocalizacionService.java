package com.armasimportacion.service;

import com.armasimportacion.model.Canton;
import com.armasimportacion.model.Provincia;
import com.armasimportacion.repository.CantonRepository;
import com.armasimportacion.repository.ProvinciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalizacionService {

    private final ProvinciaRepository provinciaRepository;
    private final CantonRepository cantonRepository;

    public List<String> getProvincias() {
        log.info("Obteniendo lista de provincias activas");
        return provinciaRepository.findByEstadoTrue()
            .stream()
            .map(Provincia::getNombre)
            .collect(Collectors.toList());
    }

    public List<String> getCantones(String provinciaNombre) {
        log.info("Obteniendo cantones para la provincia: {}", provinciaNombre);
        return cantonRepository.findByProvinciaNombreAndEstadoTrue(provinciaNombre)
            .stream()
            .map(Canton::getNombre)
            .collect(Collectors.toList());
    }

    public List<Map<String, String>> getProvinciasCompletas() {
        log.info("Obteniendo lista de provincias completas con códigos");
        return provinciaRepository.findByEstadoTrue()
            .stream()
            .map(provincia -> {
                Map<String, String> provinciaMap = new HashMap<>();
                provinciaMap.put("codigo", provincia.getCodigo());
                provinciaMap.put("nombre", provincia.getNombre());
                return provinciaMap;
            })
            .collect(Collectors.toList());
    }

    public Provincia getProvinciaPorNombre(String nombre) {
        return provinciaRepository.findByNombre(nombre)
            .orElseThrow(() -> new RuntimeException("Provincia no encontrada: " + nombre));
    }
    
    public Provincia getProvinciaPorCodigo(String codigo) {
        return provinciaRepository.findByCodigo(codigo)
            .orElseThrow(() -> new RuntimeException("Provincia no encontrada con código: " + codigo));
    }
    
    public String getNombreProvinciaPorCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return "No especificado";
        }
        try {
            Provincia provincia = getProvinciaPorCodigo(codigo);
            return provincia.getNombre();
        } catch (Exception e) {
            log.warn("No se pudo obtener el nombre de la provincia para el código: {}", codigo);
            return codigo; // Fallback al código si no se encuentra
        }
    }
}
