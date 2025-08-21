package com.armasimportacion.mapper;

import com.armasimportacion.dto.CategoriaArmaDTO;
import com.armasimportacion.model.CategoriaArma;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoriaArmaMapper {

    public CategoriaArmaDTO toDTO(CategoriaArma categoriaArma) {
        if (categoriaArma == null) {
            return null;
        }

        return CategoriaArmaDTO.builder()
                .id(categoriaArma.getId())
                .nombre(categoriaArma.getNombre())
                .codigo(categoriaArma.getCodigo())
                .descripcion(categoriaArma.getDescripcion())
                .estado(categoriaArma.getEstado())
                .build();
    }

    public List<CategoriaArmaDTO> toDTOList(List<CategoriaArma> categoriasArma) {
        if (categoriasArma == null) {
            return null;
        }

        return categoriasArma.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CategoriaArma toEntity(CategoriaArmaDTO dto) {
        if (dto == null) {
            return null;
        }

        CategoriaArma categoriaArma = new CategoriaArma();
        categoriaArma.setId(dto.getId());
        categoriaArma.setNombre(dto.getNombre());
        categoriaArma.setCodigo(dto.getCodigo());
        categoriaArma.setDescripcion(dto.getDescripcion());
        categoriaArma.setEstado(dto.getEstado());
        return categoriaArma;
    }
}
