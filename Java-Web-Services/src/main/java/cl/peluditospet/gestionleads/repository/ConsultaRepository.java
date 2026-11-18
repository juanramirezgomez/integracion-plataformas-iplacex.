package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultaRepository extends JpaRepository<Consulta, String> {
    void deleteByLeadId(Long leadId);
}
