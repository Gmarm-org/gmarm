package com.armasimportacion.service;

import com.armasimportacion.model.Canton;
import com.armasimportacion.model.Provincia;
import com.armasimportacion.repository.CantonRepository;
import com.armasimportacion.repository.ProvinciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public List<Provincia> getProvinciasCompletas() {
        return provinciaRepository.findByEstadoTrue();
    }

    public Provincia getProvinciaPorNombre(String nombre) {
        return provinciaRepository.findByNombre(nombre)
            .orElseThrow(() -> new RuntimeException("Provincia no encontrada: " + nombre));
    }
}
