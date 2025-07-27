package com.armasimportacion.repository;

import com.armasimportacion.model.ArmaFisica;
import com.armasimportacion.model.Cliente;
import com.armasimportacion.model.GrupoImportacion;
import com.armasimportacion.model.ModeloArma;
import com.armasimportacion.enums.EstadoArmaFisica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArmaFisicaRepository extends JpaRepository<ArmaFisica, Long> {
    
    // Búsquedas básicas
    Optional<ArmaFisica> findByNumeroSerie(String numeroSerie);
    List<ArmaFisica> findByEstado(EstadoArmaFisica estado);
    List<ArmaFisica> findByModeloArma(ModeloArma modeloArma);
    List<ArmaFisica> findByCliente(Cliente cliente);
    List<ArmaFisica> findByGrupoImportacion(GrupoImportacion grupoImportacion);
    
    // Armas disponibles
    List<ArmaFisica> findByClienteIsNullAndEstado(EstadoArmaFisica estado);
    
    // Armas asignadas a cliente
    List<ArmaFisica> findByClienteAndEstado(Cliente cliente, EstadoArmaFisica estado);
    
    // Verificar existencia
    boolean existsByNumeroSerie(String numeroSerie);
    
    // Búsquedas con filtros
    @Query("SELECT af FROM ArmaFisica af WHERE " +
           "(:numeroSerie IS NULL OR af.numeroSerie LIKE %:numeroSerie%) AND " +
           "(:estado IS NULL OR af.estado = :estado) AND " +
           "(:modeloArmaId IS NULL OR af.modeloArma.id = :modeloArmaId) AND " +
           "(:clienteId IS NULL OR af.cliente.id = :clienteId)")
    List<ArmaFisica> findWithFilters(
            @Param("numeroSerie") String numeroSerie,
            @Param("estado") EstadoArmaFisica estado,
            @Param("modeloArmaId") Long modeloArmaId,
            @Param("clienteId") Long clienteId);
    
    // Contar armas por estado
    @Query("SELECT af.estado, COUNT(af) FROM ArmaFisica af GROUP BY af.estado")
    List<Object[]> countByEstado();
    
    // Armas por grupo de importación
    @Query("SELECT af FROM ArmaFisica af WHERE af.grupoImportacion.id = :grupoImportacionId")
    List<ArmaFisica> findByGrupoImportacionId(@Param("grupoImportacionId") Long grupoImportacionId);
} 