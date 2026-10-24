package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    // Spring Data JPA nos provee automáticamente métodos como save(), findAll(), findById(), deleteById()
}