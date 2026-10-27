package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Lead;
import cl.peluditospet.gestionleads.repository.LeadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "*") // Permite peticiones desde cualquier frontend (Dashboard o Flowable)
public class LeadController {

    @Autowired
    private LeadRepository leadRepository;

    // 1. GET: Listar todos los leads registrados
    @GetMapping
    public List<Lead> obtenerTodosLosLeads() {
        return leadRepository.findAll();
    }

    // 2. POST: Registrar un nuevo lead (Llegado desde RRSS)
    @PostMapping
    public Lead crearLead(@RequestBody Lead lead) {
        // Por defecto, al crearlo desde redes sociales, su estado inicial será "NUEVO"
        if (lead.getEstado() == null || lead.getEstado().isEmpty()) {
            lead.setEstado("NUEVO");
        }
        return leadRepository.save(lead);
    }

    // 3. PUT: Actualizar el estado o datos de seguimiento de un lead
    @PutMapping("/{id}/estado")
    public Lead actualizarEstadoLead(@PathVariable Long id, @RequestBody Lead leadDetalles) {
        Optional<Lead> leadOptional = leadRepository.findById(id);

        if (leadOptional.isPresent()) {
            Lead lead = leadOptional.get();
            lead.setEstado(leadDetalles.getEstado());
            return leadRepository.save(lead);
        } else {
            throw new RuntimeException("Lead no encontrado con el id: " + id);
        }
    }

    // 4. DELETE: Eliminar un lead por su ID
    @DeleteMapping("/{id}")
    public void eliminarLead(@PathVariable Long id) {
        if (leadRepository.existsById(id)) {
            leadRepository.deleteById(id);
        } else {
            throw new RuntimeException("Lead no encontrado con el id: " + id);
        }
    }
}