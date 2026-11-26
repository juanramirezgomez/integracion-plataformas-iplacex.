package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Lead;
import cl.peluditospet.gestionleads.repository.ActividadRepository;
import cl.peluditospet.gestionleads.repository.LeadRepository;
import cl.peluditospet.gestionleads.repository.ConsultaRepository;
import jakarta.transaction.Transactional;
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

    private final ConsultaRepository consultas;
    private final ActividadRepository actividades;
    private final FlowableController flowable;

    public LeadController(
            LeadRepository leadRepository,
            ConsultaRepository consultas,
            ActividadRepository actividades,
            FlowableController flowable) {
        this.leadRepository = leadRepository;
        this.consultas = consultas;
        this.actividades = actividades;
        this.flowable = flowable;
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
        if (!vacio(lead.getCorreo()) && (lead.getCorreo().length() > 254
                || !lead.getCorreo().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))) {
            throw new BadRequestException("El correo electrónico no es válido.");
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

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Lead actualizarLead(@PathParam("id") Long id, Lead detalles) {
        Lead lead = leadRepository.bloquearPorId(id)
                .orElseThrow(() -> new NotFoundException("No existe un cliente con ese ID."));

        if (detalles == null || vacio(detalles.getNombreCliente())
                || vacio(detalles.getTelefono()) || vacio(detalles.getConsulta())) {
            throw new BadRequestException("Nombre, teléfono y consulta son obligatorios.");
        }
        if (!vacio(detalles.getCorreo()) && (detalles.getCorreo().length() > 254
                || !detalles.getCorreo().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))) {
            throw new BadRequestException("El correo electrónico no es válido.");
        }

        lead.setNombreCliente(detalles.getNombreCliente().trim());
        lead.setTelefono(detalles.getTelefono().trim());
        lead.setCorreo(detalles.getCorreo() != null ? detalles.getCorreo().trim() : null);

        if (!vacio(detalles.getCanalOrigen())) {
            lead.setCanalOrigen(detalles.getCanalOrigen().trim());
        }
        lead.setConsulta(detalles.getConsulta().trim());

        if (!vacio(detalles.getEstado())) {
            validarEstado(detalles.getEstado().trim());
            lead.setEstado(detalles.getEstado().trim());
        }

        return leadRepository.save(lead);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminarLead(@PathParam("id") Long id) {
        Lead lead = leadRepository.bloquearPorId(id)
                .orElseThrow(() -> new NotFoundException("No existe un cliente con ese ID."));

        List<String> procesosIds = consultas.findByLeadId(id).stream()
                .map(c -> c.getProcesoId())
                .filter(pid -> pid != null && !pid.isBlank())
                .toList();

        flowable.cancelarProcesosDelCliente(id, procesosIds);

        if (!procesosIds.isEmpty()) {
            actividades.deleteByProcesoIdIn(procesosIds);
        }
        actividades.deleteByLeadId(id);
        consultas.deleteByLeadId(id);
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
