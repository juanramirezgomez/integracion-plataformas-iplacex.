package cl.peluditospet.gestionleads.model;

import jakarta.persistence.*;

@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreCliente;
    private String correo;
    private String telefono;

    // Canal de origen: Instagram, Facebook, TikTok, WhatsApp, etc.
    private String canalOrigen;

    // Consulta o interés del cliente (ej: "Pastel para perro de 2 años")
    private String consulta;

    // Estado del lead: NUEVO, EN_SEGUIMIENTO, COTIZADO, CONVERTIDO, DESCARTADO
    private String estado;

    // Constructor vacío exigido por JPA
    public Lead() {
    }

    // Constructor con parámetros
    public Lead(String nombreCliente, String correo, String telefono, String canalOrigen, String consulta, String estado) {
        this.nombreCliente = nombreCliente;
        this.correo = correo;
        this.telefono = telefono;
        this.canalOrigen = canalOrigen;
        this.consulta = consulta;
        this.estado = estado;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}