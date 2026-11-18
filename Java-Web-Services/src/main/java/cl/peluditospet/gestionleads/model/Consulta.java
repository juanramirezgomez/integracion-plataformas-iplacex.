package cl.peluditospet.gestionleads.model;

import jakarta.persistence.*;

@Entity
@Table(name = "consultas")
public class Consulta {
    @Id
    private String procesoId;

    private Long leadId;

    private String nombreCliente;

    private String telefono;

    private String correo;

    private String canalOrigen;

    @Column(length = 4000)
    private String consulta;

    private String resultado;

    public String getProcesoId() {
        return procesoId;
    }

    public void setProcesoId(String procesoId) {
        this.procesoId = procesoId;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getCanalOrigen() {
        return canalOrigen;
    }

    public void setCanalOrigen(String canalOrigen) {
        this.canalOrigen = canalOrigen;
    }

    public String getConsulta() {
        return consulta;
    }

    public void setConsulta(String consulta) {
        this.consulta = consulta;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

}
