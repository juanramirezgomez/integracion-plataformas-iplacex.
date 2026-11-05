
package cl.peluditospet.gestionleads.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Map;

@Component
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
public class FlowableController {

    private final ObjectMapper mapper;
    private final HttpClient client;

    @Value("${app.flowable.base-url}")
    private String flowableBase;

    @Value("${app.flowable.auth-file}")
    private String authFile;

    public FlowableController(ObjectMapper mapper) {
        this.mapper = mapper;
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

    @GET
    @Path("/tareas")
    public Response obtenerTareas() {
        return solicitar("GET", "/runtime/tasks", null);
    }

    @POST
    @Path("/tareas/{id}/completar")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response completarTarea(
            @PathParam("id") String id, JsonNode datos) {

        if (!id.matches("[a-zA-Z0-9-]+")) {
            throw new BadRequestException("ID de tarea no válido.");
        }

        return solicitar("POST", "/runtime/tasks/" + id, datos);
    }
}
