package cl.peluditospet.gestionleads.config;

import cl.peluditospet.gestionleads.controller.*;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.springframework.stereotype.Component;

@Component
public class JerseyConfig extends ResourceConfig {
    public JerseyConfig(CorsFilter corsFilter) {
        register(LeadController.class);
        register(ConsultaController.class);
        register(JacksonFeature.class);
        register(ApiErrorMapper.class);
        register(corsFilter);
        register(FlowableController.class);
        register(ActividadController.class);
        register(CorreoController.class);
    }
}
