package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActividadRepository extends JpaRepository<Actividad, Long> {

    List<Actividad> findByProcesoIdOrderByFechaDesc(String procesoId);

    List<Actividad> findByLeadIdOrderByFechaDesc(Long leadId);

    List<Actividad> findByProcesoIdOrLeadIdOrderByFechaDesc(String procesoId, Long leadId);

    List<Actividad> findAllByOrderByFechaDesc();

    void deleteByLeadId(Long leadId);

    void deleteByProcesoIdIn(List<String> procesoIds);
}