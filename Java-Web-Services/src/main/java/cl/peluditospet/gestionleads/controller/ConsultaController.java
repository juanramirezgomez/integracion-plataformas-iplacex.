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
    private static final Set<String> RESULTADOS = Set.of("PENDIENTE", "COMPRO", "NO_COMPRO", "CONVERTIDO");
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
        if (anterior != null) {
            if (!Objects.equals(anterior.getLeadId(), datos.getLeadId())
                    || (!"PENDIENTE".equals(anterior.getResultado())
                    && !anterior.getResultado().equals(datos.getResultado())
                    && !"PENDIENTE".equals(datos.getResultado()))) {
                throw new ClientErrorException("La consulta ya tiene otro resultado registrado.", 409);
            }
            // El worker trae los datos originales del proceso. Solo avanza el resultado
            // para conservar las ediciones que se hayan guardado desde la ficha.
            if ("PENDIENTE".equals(anterior.getResultado())) {
                anterior.setResultado(datos.getResultado());
            }
            return anterior;
        }

        datos.setProcesoId(procesoId);
        actualizarContacto(lead, datos);
        return consultas.save(datos);
    }

    @PUT
    @Path("/{procesoId}/datos")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    public Consulta actualizarDatos(@PathParam("procesoId") String procesoId, Consulta datos) {
        if (datos == null || !valido(datos.getNombreCliente(), 255)
                || !valido(datos.getTelefono(), 255) || !valido(datos.getCorreo(), 254)
                || !datos.getCorreo().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || !valido(datos.getCanalOrigen(), 255) || !valido(datos.getConsulta(), 4000)) {
            throw new BadRequestException("Indica nombre, teléfono, correo válido, canal y consulta.");
        }

        Long leadId = consultas.buscarLeadId(procesoId)
                .orElseThrow(() -> new NotFoundException("No existe la consulta."));
        Lead lead = leads.bloquearPorId(leadId)
                .orElseThrow(() -> new NotFoundException("No existe el contacto."));
        Consulta guardada = consultas.findById(procesoId)
                .orElseThrow(() -> new NotFoundException("No existe la consulta."));

        guardada.setNombreCliente(datos.getNombreCliente().trim());
        guardada.setTelefono(datos.getTelefono().trim());
        guardada.setCorreo(datos.getCorreo().trim());
        guardada.setCanalOrigen(datos.getCanalOrigen().trim());
        guardada.setConsulta(datos.getConsulta().trim());
        actualizarContacto(lead, guardada);
        return guardada;
    }

    private static void actualizarContacto(Lead lead, Consulta consulta) {
        lead.setNombreCliente(consulta.getNombreCliente());
        lead.setTelefono(consulta.getTelefono());
        lead.setCorreo(consulta.getCorreo());
    }

    private static boolean valido(String valor, int maximo) {
        return !vacio(valor) && valor.trim().length() <= maximo;
    }

    private static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
