package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Actividad;
import cl.peluditospet.gestionleads.repository.ActividadRepository;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Path("/api/actividad")
@Produces(MediaType.APPLICATION_JSON)
public class ActividadController {

    private final ActividadRepository actividadRepository;

    public ActividadController(ActividadRepository actividadRepository) {
        this.actividadRepository = actividadRepository;
    }

    @GET
    public List<Actividad> listar(
            @QueryParam("procesoId") String procesoId,
            @QueryParam("leadId") Long leadId) {

        boolean tieneProceso = procesoId != null && !procesoId.isBlank();
        boolean tieneLead = leadId != null;

        if (tieneProceso && tieneLead) {
            return actividadRepository.findByProcesoIdOrLeadIdOrderByFechaDesc(procesoId.trim(), leadId);
        }
        if (tieneProceso) {
            return actividadRepository.findByProcesoIdOrderByFechaDesc(procesoId.trim());
        }
        if (tieneLead) {
            return actividadRepository.findByLeadIdOrderByFechaDesc(leadId);
        }
        return actividadRepository.findAllByOrderByFechaDesc();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response registrar(Actividad actividad) {
        if (actividad == null || actividad.getAccion() == null || actividad.getAccion().isBlank()) {
            throw new BadRequestException("La acción de actividad es obligatoria.");
        }
        if (actividad.getAccion().length() > 150) {
            throw new BadRequestException("La acción no puede superar los 150 caracteres.");
        }
        if (actividad.getDetalle() != null && actividad.getDetalle().length() > 2000) {
            throw new BadRequestException("El detalle no puede superar los 2000 caracteres.");
        }

        actividad.setId(null);
        actividad.setAccion(actividad.getAccion().trim());
        if (actividad.getDetalle() != null) {
            actividad.setDetalle(actividad.getDetalle().trim());
        }
        if (actividad.getProcesoId() != null && actividad.getProcesoId().isBlank()) {
            actividad.setProcesoId(null);
        }
        if (actividad.getFecha() == null) {
            actividad.setFecha(LocalDateTime.now());
        }

        Actividad guardada = actividadRepository.save(actividad);
        return Response.status(Response.Status.CREATED).entity(guardada).build();
    }
}