
package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Lead;
import cl.peluditospet.gestionleads.repository.LeadRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Component
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class FlowableController {

    private final ObjectMapper mapper;
    private final LeadRepository leads;
    private final HttpClient client;

    @Value("${app.flowable.base-url}")
    private String flowableBase;

    @Value("${app.flowable.auth-file}")
    private String authFile;

    public FlowableController(ObjectMapper mapper, LeadRepository leads) {
        this.mapper = mapper;
        this.leads = leads;
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    private Response solicitar(String metodo, String ruta, Object datos) {
        try {
            String credencial = Files.readString(
                    java.nio.file.Path.of(authFile).toAbsolutePath()
            ).trim();

            HttpRequest.Builder builder = HttpRequest
                    .newBuilder(URI.create(flowableBase + "/service" + ruta))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Basic " + credencial)
                    .header("Accept", "application/json");

            if ("POST".equals(metodo)) {
                builder.header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(
                                mapper.writeValueAsString(datos)));
            } else {
                builder.GET();
            }

            HttpResponse<String> respuesta = client.send(
                    builder.build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            return Response.status(respuesta.statusCode())
                    .type(MediaType.APPLICATION_JSON)
                    .entity(respuesta.body())
                    .build();

        } catch (Exception e) {
            return Response.status(502)
                    .entity(Map.of(
                            "error", "No se pudo comunicar con Flowable."
                    ))
                    .build();
        }
    }

    @POST
    @Path("/procesos")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response iniciarProceso(JsonNode datos) {
        return solicitar("POST", "/runtime/process-instances", datos);
    }

    public record NuevaOportunidad(Long clienteId, String motivo, String fechaOportunidad) {}

    @POST
    @Path("/oportunidades")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response iniciarOportunidad(NuevaOportunidad datos) {
        if (datos == null || datos.clienteId() == null || datos.motivo() == null
                || datos.motivo().isBlank() || datos.motivo().trim().length() > 150
                || datos.fechaOportunidad() == null
                || !datos.fechaOportunidad().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) {
            throw new BadRequestException("Indica un cliente, un motivo de hasta 150 caracteres y una fecha válida.");
        }
        try {
            LocalDate.parse(datos.fechaOportunidad());
        } catch (java.time.format.DateTimeParseException e) {
            throw new BadRequestException("La fecha de la oportunidad no es válida.");
        }
        Lead cliente = leads.findById(datos.clienteId())
                .orElseThrow(() -> new NotFoundException("El cliente ya no está disponible."));
        if (!"CONVERTIDO".equals(cliente.getEstado())) {
            throw new BadRequestException("El cliente debe tener una compra registrada.");
        }

        return solicitar("POST", "/runtime/process-instances", Map.of(
                "message", "OportunidadComercialDetectada",
                "variables", List.of(
                        Map.of("name", "initiator", "value", "peluditos-local"),
                        Map.of("name", "clienteId", "type", "long", "value", cliente.getId()),
                        Map.of("name", "nombreCliente", "value", cliente.getNombreCliente()),
                        Map.of("name", "motivo", "value", datos.motivo().trim()),
                        Map.of("name", "fechaOportunidad", "value", datos.fechaOportunidad())
                )
        ));
    }

    @GET
    @Path("/tareas")
    public Response obtenerTareas(@QueryParam("start") @DefaultValue("0") int inicio) {
        if (inicio < 0) {
            throw new BadRequestException("La posición inicial no es válida.");
        }
        return solicitar("GET", "/runtime/tasks?start=" + inicio + "&size=50&sort=id&order=asc", null);
    }

    @GET
    @Path("/tareas/{id}/variables")
    public Response obtenerVariables(@PathParam("id") String id) {
        if (!id.matches("[a-zA-Z0-9-]+")) {
            throw new BadRequestException("ID de tarea no válido.");
        }
        return solicitar("GET", "/runtime/tasks/" + id + "/variables", null);
    }

    @POST
    @Path("/tareas/{id}/completar")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response completarTarea(
            @PathParam("id") String id, JsonNode datos) {

        if (!id.matches("[a-zA-Z0-9-]+")) {
            throw new BadRequestException("ID de tarea no válido.");
        }

        String ruta = "/runtime/tasks/" + id;
        if (datos == null || !"complete".equals(datos.path("action").asText())) {
            return solicitar("POST", ruta, datos);
        }

        Response tarea = solicitar("GET", ruta, null);
        if (tarea.getStatus() != 200) {
            return tarea;
        }

        try {
            JsonNode detalle = mapper.readTree((String) tarea.getEntity());
            if ("ExpandedSubProcess_30".equals(detalle.path("taskDefinitionKey").asText())) {
                datos = programarSeguimiento((ObjectNode) datos);
            }
        } catch (JsonProcessingException e) {
            throw new WebApplicationException("No se pudo leer la tarea de Flowable.", 502);
        }
        return solicitar("POST", ruta, datos);
    }

    private ObjectNode programarSeguimiento(ObjectNode datos) {
        JsonNode variables = datos.path("variables");
        if (!variables.isArray()) {
            throw new BadRequestException("Ingresa la fecha y hora del seguimiento.");
        }

        ObjectNode solicitud = datos.deepCopy();
        ArrayNode variablesNormalizadas = solicitud.putArray("variables");
        String fecha = null;
        for (JsonNode variable : variables) {
            String nombre = variable.path("name").asText();
            if ("fechaSeguimiento".equals(nombre)) {
                if (fecha != null) {
                    throw new BadRequestException("Ingresa una sola fecha de seguimiento.");
                }
                fecha = variable.path("value").asText();
            } else if (!"fechaSeguimientoProgramada".equals(nombre)) {
                variablesNormalizadas.add(variable);
            }
        }
        if (fecha == null || fecha.isBlank()) {
            throw new BadRequestException("Ingresa la fecha y hora del seguimiento.");
        }

        LocalDateTime fechaLocal;
        try {
            fechaLocal = fecha.length() == 10
                    ? LocalDate.parse(fecha).atTime(9, 0)
                    : LocalDateTime.parse(fecha);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("La fecha y hora del seguimiento no son válidas.");
        }

        ZoneId zona = ZoneId.systemDefault();
        var offsets = zona.getRules().getValidOffsets(fechaLocal);
        if (offsets.isEmpty()) {
            throw new BadRequestException("Esa hora no existe en la zona horaria del equipo.");
        }
        Instant programada = fechaLocal.toInstant(offsets.getFirst());
        if (!programada.isAfter(Instant.now())) {
            throw new BadRequestException("El seguimiento debe quedar programado para una fecha y hora futuras.");
        }

        variablesNormalizadas.addObject().put("name", "fechaSeguimiento")
                .put("type", "string").put("value", fechaLocal.toString());
        variablesNormalizadas.addObject().put("name", "fechaSeguimientoProgramada")
                .put("type", "string").put("value", programada.toString());
        return solicitud;
    }
}
