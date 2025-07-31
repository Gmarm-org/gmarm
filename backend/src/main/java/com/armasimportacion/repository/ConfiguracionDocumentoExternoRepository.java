package com.armasimportacion.repository;

import com.armasimportacion.model.ConfiguracionDocumentoExterno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConfiguracionDocumentoExternoRepository extends JpaRepository<ConfiguracionDocumentoExterno, Long> {
    
    /**
     * Busca documentos externos activos que aplican para un tipo de cliente específico
     */
    @Query(value = """
        SELECT * FROM configuracion_documento_externo 
        WHERE activo = true 
        AND (
            (aplica_para_tipos_cliente IS NOT NULL AND :tipoCliente = ANY(aplica_para_tipos_cliente))
            OR 
            (excluye_tipos_cliente IS NULL OR NOT (:tipoCliente = ANY(excluye_tipos_cliente)))
        )
        ORDER BY orden_visual, nombre
        """, nativeQuery = true)
    List<ConfiguracionDocumentoExterno> findByTipoCliente(@Param("tipoCliente") String tipoCliente);
    
    /**
     * Busca todos los documentos externos activos
     */
    List<ConfiguracionDocumentoExterno> findByActivoTrueOrderByOrdenVisualAscNombreAsc();
    
    /**
     * Busca documentos externos por nombre
     */
    List<ConfiguracionDocumentoExterno> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);
    
    /**
     * Verifica si existe un documento externo con el mismo nombre
     */
    boolean existsByNombreAndIdNot(String nombre, Long id);
    
    /**
     * Verifica si existe un documento externo con el mismo nombre (para nuevos registros)
     */
    boolean existsByNombre(String nombre);
} 