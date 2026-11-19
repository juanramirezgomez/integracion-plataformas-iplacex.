package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Actividad;
import cl.peluditospet.gestionleads.repository.ActividadRepository;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.MimeMessageHelper;
import java.util.Base64;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@Path("/api/correos")
@Produces(MediaType.APPLICATION_JSON)
public class CorreoController {

    private static final Logger LOG = LoggerFactory.getLogger(CorreoController.class);

    public record CorreoRequest(
            String para,
            String asunto,
            String mensaje,
            Long leadId,
            String processInstanceId,
            String nombreArchivo,
            String tipoArchivo,
            String imagenBase64
    ) {}

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ActividadRepository actividadRepository;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public CorreoController(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            ActividadRepository actividadRepository) {
        this.mailSenderProvider = mailSenderProvider;
        this.actividadRepository = actividadRepository;
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response enviarCorreo(CorreoRequest request) {
        if (request == null
                || vacio(request.para())
                || vacio(request.asunto())
                || vacio(request.mensaje())) {
            throw new BadRequestException("Indica destinatario, asunto y mensaje.");
        }

        String para = request.para().trim();
        String asunto = request.asunto().trim();
        String cuerpo = request.mensaje().trim();

        if (para.length() > 254 || !para.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BadRequestException("El correo electrónico de destino no es válido.");
        }
        if (asunto.length() > 200) {
            throw new BadRequestException("El asunto no puede superar los 200 caracteres.");
        }
        if (cuerpo.length() > 5000) {
            throw new BadRequestException("El mensaje no puede superar los 5000 caracteres.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || vacio(mailHost) || vacio(mailFrom)) {
            registrarActividad(request, "Correo no enviado", "Servidor de correo sin configurar.");
            return errorEnvio(503, "El servidor de correo no está configurado.");
        }

        boolean conAdjunto = !vacio(request.imagenBase64());
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, conAdjunto, "UTF-8");
            helper.setFrom(mailFrom.trim());
            helper.setTo(para);
            helper.setSubject(asunto);
            helper.setText(cuerpo, false);

            if (conAdjunto) {
                byte[] bytesImagen = Base64.getDecoder().decode(request.imagenBase64().trim());
                String nombreArchivo = vacio(request.nombreArchivo())
                        ? "adjunto.png" : request.nombreArchivo().trim();
                String tipoMime = vacio(request.tipoArchivo())
                        ? "application/octet-stream" : request.tipoArchivo().trim();
                helper.addAttachment(nombreArchivo, new ByteArrayResource(bytesImagen), tipoMime);
            }
        } catch (MessagingException | IllegalArgumentException ex) {
            throw new BadRequestException("No se pudo preparar el correo o su adjunto.");
        }

        try {
            mailSender.send(mimeMessage);
        } catch (MailException ex) {
            LOG.warn("Falló el envío por SMTP ({})", ex.getClass().getSimpleName());
            registrarActividad(request, "Correo sin confirmar", "El servidor de correo no confirmó el envío.");
            return errorEnvio(502, "El servidor de correo no confirmó el envío.");
        }

        registrarActividad(request, "Correo enviado", "Para: " + para + " · Asunto: " + asunto);
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("enviado", true, "modo", "SMTP", "para", para, "asunto", asunto))
                .build();
    }

    private static Response errorEnvio(int estado, String mensaje) {
        return Response.status(estado).entity(Map.of("enviado", false, "mensaje", mensaje)).build();
    }

    private void registrarActividad(CorreoRequest request, String accion, String detalle) {
        String procesoIdLimpio = (request.processInstanceId() != null && !request.processInstanceId().isBlank())
                ? request.processInstanceId().trim()
                : null;

        try {
            actividadRepository.save(new Actividad(
                    request.leadId(), procesoIdLimpio, accion, detalle, LocalDateTime.now()));
        } catch (DataAccessException ex) {
            LOG.warn("No se pudo guardar la actividad de correo ({})", ex.getClass().getSimpleName());
        }
    }

    private static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}