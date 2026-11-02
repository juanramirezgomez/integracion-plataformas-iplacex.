package cl.peluditospet.gestionleads.config;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Provider
@PreMatching
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {
    private final Set<String> origenes;
    public CorsFilter(@Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000}") String valor) {
        origenes = Arrays.stream(valor.split(",")).map(String::trim).collect(Collectors.toSet());
    }
    @Override
    public void filter(ContainerRequestContext request) {
        if ("OPTIONS".equals(request.getMethod()) && request.getHeaderString("Origin") != null) {
            request.abortWith(Response.status(origenes.contains(request.getHeaderString("Origin")) ? 204 : 403).build());
        }
    }
    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        String origin = request.getHeaderString("Origin");
        if (origin != null && origenes.contains(origin)) {
            response.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
            response.getHeaders().putSingle("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.getHeaders().putSingle("Access-Control-Allow-Headers", "Content-Type, Accept");
            response.getHeaders().add("Vary", "Origin");
        }
    }
}
