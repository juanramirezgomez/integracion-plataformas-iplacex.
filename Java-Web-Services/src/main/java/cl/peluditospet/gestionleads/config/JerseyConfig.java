package cl.peluditospet.gestionleads.config;

import cl.peluditospet.gestionleads.controller.LeadController;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.springframework.stereotype.Component;

@Component
public class JerseyConfig extends ResourceConfig {
    public JerseyConfig(CorsFilter corsFilter) {
        register(LeadController.class);
        register(JacksonFeature.class);
        register(ApiErrorMapper.class);
        register(corsFilter);
    }
}
