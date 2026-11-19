package cl.peluditospet.gestionleads.controller;

import cl.peluditospet.gestionleads.model.Actividad;
import cl.peluditospet.gestionleads.repository.ActividadRepository;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
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
        boolean smtpConfigurado = mailSender != null
                && mailHost != null && !mailHost.isBlank()
                && mailFrom != null && !mailFrom.isBlank();

        String modoEntrega;
        if (smtpConfigurado) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(
                        mimeMessage,
                        request.imagenBase64() != null && !request.imagenBase64().isBlank(),
                        "UTF-8"
                );
                helper.setFrom(mailFrom.trim());
                helper.setTo(para);
                helper.setSubject(asunto);
                helper.setText(cuerpo, false);

                if (request.imagenBase64() != null && !request.imagenBase64().isBlank()) {
                    byte[] bytesImagen = Base64.getDecoder().decode(request.imagenBase64().trim());
                    String nombreLimpio = (request.nombreArchivo() != null && !request.nombreArchivo().isBlank())
                            ? request.nombreArchivo().trim()
                            : "adjunto.png";
                    String tipoMime = (request.tipoArchivo() != null && !request.tipoArchivo().isBlank())
                            ? request.tipoArchivo().trim()
                            : "application/octet-stream";

                    helper.addAttachment(nombreLimpio, new ByteArrayResource(bytesImagen), tipoMime);
                }

                mailSender.send(mimeMessage);
                modoEntrega = "SMTP";
            } catch (MessagingException | IllegalArgumentException ex) {
                throw new BadRequestException("No se pudo preparar o adjuntar la imagen del correo.");
            }
        } else {
            modoEntrega = "REGISTRO_LOCAL_SIN_SMTP";
        }

        String procesoIdLimpio = (request.processInstanceId() != null && !request.processInstanceId().isBlank())
                ? request.processInstanceId().trim()
                : null;

        Actividad evento = new Actividad(
                request.leadId(),
                procesoIdLimpio,
                "Correo enviado",
                "Para: " + para + " · Asunto: \"" + asunto + "\" (" + modoEntrega + ")",
                LocalDateTime.now()
        );
        actividadRepository.save(evento);

        return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                        "enviado", true,
                        "modo", modoEntrega,
                        "para", para,
                        "asunto", asunto
                ))
                .build();
    }

    private static boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}