package com.armasimportacion.mapper;

import com.armasimportacion.dto.ConfiguracionSistemaDTO;
import com.armasimportacion.model.ConfiguracionSistema;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ConfiguracionSistemaMapper {
    
    public ConfiguracionSistemaDTO toDTO(ConfiguracionSistema entity) {
        if (entity == null) return null;
        
        ConfiguracionSistemaDTO dto = new ConfiguracionSistemaDTO();
        dto.setId(entity.getId());
        dto.setClave(entity.getClave());
        dto.setValor(entity.getValor());
        dto.setDescripcion(entity.getDescripcion());
        dto.setEditable(entity.getEditable());
        dto.setFechaCreacion(entity.getFechaCreacion());
        dto.setFechaActualizacion(entity.getFechaActualizacion());
        
        return dto;
    }
    
    public ConfiguracionSistema toEntity(ConfiguracionSistemaDTO dto) {
        if (dto == null) return null;
        
        ConfiguracionSistema entity = new ConfiguracionSistema();
        entity.setId(dto.getId());
        entity.setClave(dto.getClave());
        entity.setValor(dto.getValor());
        entity.setDescripcion(dto.getDescripcion());
        entity.setEditable(dto.getEditable());
        entity.setFechaCreacion(dto.getFechaCreacion());
        entity.setFechaActualizacion(dto.getFechaActualizacion());
        
        return entity;
    }
    
    public List<ConfiguracionSistemaDTO> toDTOList(List<ConfiguracionSistema> entities) {
        if (entities == null) return null;
        
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<ConfiguracionSistema> toEntityList(List<ConfiguracionSistemaDTO> dtos) {
        if (dtos == null) return null;
        
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
