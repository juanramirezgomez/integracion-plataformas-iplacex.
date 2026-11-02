package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Lead;
import cl.peluditospet.gestionleads.repository.LeadRepository;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@Path("/api/leads")
@Produces(MediaType.APPLICATION_JSON)
public class LeadController {
    private static final Set<String> ESTADOS = Set.of("NUEVO", "EN_SEGUIMIENTO", "COTIZADO", "CONVERTIDO", "DESCARTADO");
    private final LeadRepository leadRepository;

    public LeadController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GET
    public List<Lead> obtenerTodosLosLeads() {
        return leadRepository.findAll();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Lead crearLead(Lead lead) {
        if (lead == null || vacio(lead.getNombreCliente()) || vacio(lead.getTelefono()) || vacio(lead.getConsulta())) {
            throw new BadRequestException("Nombre, teléfono y consulta son obligatorios.");
        }
        // Un POST crea un registro nuevo; no puede sobrescribir otro mediante su ID.
        lead.setId(null);
        if (vacio(lead.getEstado())) lead.setEstado("NUEVO");
        validarEstado(lead.getEstado());
        return leadRepository.save(lead);
    }

    @PUT
    @Path("/{id}/estado")
    @Consumes(MediaType.APPLICATION_JSON)
    public Lead actualizarEstadoLead(@PathParam("id") Long id, Lead detalles) {
        Lead lead = buscar(id);
        if (detalles == null || vacio(detalles.getEstado())) throw new BadRequestException("Indica el estado del cliente.");
        validarEstado(detalles.getEstado());
        lead.setEstado(detalles.getEstado());
        return leadRepository.save(lead);
    }

    @DELETE
    @Path("/{id}")
    public Response eliminarLead(@PathParam("id") Long id) {
        Lead lead = buscar(id);
        leadRepository.delete(lead);
        return Response.noContent().build();
    }

    private Lead buscar(Long id) {
        return leadRepository.findById(id).orElseThrow(() -> new NotFoundException("No existe un cliente con ese ID."));
    }
    private static boolean vacio(String valor) { return valor == null || valor.isBlank(); }
    private static void validarEstado(String estado) {
        if (!ESTADOS.contains(estado)) throw new BadRequestException("Estado no válido.");
    }
}
