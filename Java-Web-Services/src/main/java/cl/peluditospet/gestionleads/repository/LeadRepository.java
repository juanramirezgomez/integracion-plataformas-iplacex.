package cl.peluditospet.gestionleads.repository;

import cl.peluditospet.gestionleads.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Lead l where l.id = :id")
    Optional<Lead> bloquearPorId(@Param("id") Long id);

    // Spring Data JPA nos provee automáticamente métodos como save(), findAll(), findById(), deleteById()
}