package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConsultaRepository extends JpaRepository<Consulta, String> {
    @Query("select c.leadId from Consulta c where c.procesoId = :procesoId")
    Optional<Long> buscarLeadId(@Param("procesoId") String procesoId);

    List<Consulta> findByLeadId(Long leadId);
    void deleteByLeadId(Long leadId);
}