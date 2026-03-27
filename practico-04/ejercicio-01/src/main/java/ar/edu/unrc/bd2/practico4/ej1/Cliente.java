package ar.edu.unrc.bd2.practico4.ej1;

public class Cliente {
    private final int nroCliente;
    private final String apellido;
    private final String nombre;
    private final String direccion;
    private final String telefono;

    public Cliente(int nroCliente, String apellido, String nombre, String direccion, String telefono) {
        this.nroCliente = nroCliente;
        this.apellido = apellido;
        this.nombre = nombre;
        this.direccion = direccion;
        this.telefono = telefono;
    }

    public int getNroCliente() {
        return nroCliente;
    }

    public String getApellido() {
        return apellido;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public String getTelefono() {
        return telefono;
    }

    @Override
    public String toString() {
        return String.format("nro_cliente=%d | apellido=%s | nombre=%s | direccion=%s | telefono=%s",
            nroCliente, apellido, nombre, direccion, telefono);
    }
}
