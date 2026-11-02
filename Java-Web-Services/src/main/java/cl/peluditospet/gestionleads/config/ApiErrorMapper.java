package cl.peluditospet.gestionleads.config;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;

@Provider
public class ApiErrorMapper implements ExceptionMapper<WebApplicationException> {
    @Override
    public Response toResponse(WebApplicationException error) {
        int status = error.getResponse().getStatus();
        return Response.status(status).type(MediaType.APPLICATION_JSON)
                .entity(Map.of("estado", status, "mensaje", error.getMessage())).build();
    }
}
