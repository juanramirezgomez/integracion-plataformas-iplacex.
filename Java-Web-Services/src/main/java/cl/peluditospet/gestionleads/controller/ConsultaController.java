package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Consulta;
import cl.peluditospet.gestionleads.model.Lead;
import cl.peluditospet.gestionleads.repository.ConsultaRepository;
import cl.peluditospet.gestionleads.repository.LeadRepository;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
@Path("/api/consultas")
@Produces(MediaType.APPLICATION_JSON)
public class ConsultaController {
    private static final Set<String> RESULTADOS = Set.of("PENDIENTE", "COMPRO", "NO_COMPRO");
    private final ConsultaRepository consultas;
    private final LeadRepository leads;

    public ConsultaController(ConsultaRepository consultas, LeadRepository leads) {
        this.consultas = consultas;
        this.leads = leads;
    }

    @GET
    public List<Consulta> listar() {
        return consultas.findAll();
    }

    @PUT
    @Path("/{procesoId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Consulta guardar(@PathParam("procesoId") String procesoId, Consulta datos) {
        if (!procesoId.matches("[a-zA-Z0-9-]{1,100}") || datos == null
                || datos.getLeadId() == null || vacio(datos.getNombreCliente())
                || vacio(datos.getTelefono()) || vacio(datos.getConsulta())
                || vacio(datos.getCorreo()) || datos.getCorreo().length() > 254
                || !datos.getCorreo().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || datos.getConsulta().length() > 4000
                || !RESULTADOS.contains(Objects.toString(datos.getResultado(), ""))) {
            throw new BadRequestException("Indica nombre, teléfono, correo válido, consulta y resultado.");
        }
        // Serializa los reintentos del worker sobre el mismo contacto.
        Lead lead = leads.bloquearPorId(datos.getLeadId())
                .orElseThrow(() -> new NotFoundException("No existe el contacto."));
        Consulta anterior = consultas.findById(procesoId).orElse(null);
        if (anterior != null && (!Objects.equals(anterior.getLeadId(), datos.getLeadId())
                || (!"PENDIENTE".equals(anterior.getResultado())
                && !anterior.getResultado().equals(datos.getResultado())
                && !"PENDIENTE".equals(datos.getResultado())))) {
            throw new ClientErrorException("La consulta ya tiene otro resultado registrado.", 409);
        }
        // Una repetición del alta no borra un resultado que ya quedó confirmado.
        if (anterior != null && !"PENDIENTE".equals(anterior.getResultado())
                && "PENDIENTE".equals(datos.getResultado())) {
            return anterior;
        }
        datos.setProcesoId(procesoId);
        lead.setNombreCliente(datos.getNombreCliente());
        lead.setTelefono(datos.getTelefono());
        lead.setCorreo(datos.getCorreo());
        leads.save(lead);
        return consultas.save(datos);
    }

    private static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
