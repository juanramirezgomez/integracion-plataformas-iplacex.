package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, String> {
    List<Consulta> findByLeadId(Long leadId);
    void deleteByLeadId(Long leadId);
}