package cl.peluditospet.gestionleads.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "actividades")
public class Actividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long leadId;

    private String procesoId;

    @Column(nullable = false, length = 150)
    private String accion;

    @Column(length = 2000)
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fecha;

    public Actividad() {
    }

    public Actividad(Long leadId, String procesoId, String accion, String detalle, LocalDateTime fecha) {
        this.leadId = leadId;
        this.procesoId = procesoId;
        this.accion = accion;
        this.detalle = detalle;
        this.fecha = fecha != null ? fecha : LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getProcesoId() {
        return procesoId;
    }

    public void setProcesoId(String procesoId) {
        this.procesoId = procesoId;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }
}