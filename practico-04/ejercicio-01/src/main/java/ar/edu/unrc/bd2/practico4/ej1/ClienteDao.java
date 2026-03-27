package ar.edu.unrc.bd2.practico4.ej1;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClienteDao {
    private final String clienteTable;

    public ClienteDao(String clienteTable) {
        this.clienteTable = clienteTable;
    }

    public int insertar(Connection connection, Cliente cliente) throws SQLException {
        String sql = "INSERT INTO " + clienteTable
            + " (nro_cliente, apellido, nombre, direccion, telefono) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            preparedStatement.setInt(1, cliente.getNroCliente());
            preparedStatement.setString(2, cliente.getApellido());
            preparedStatement.setString(3, cliente.getNombre());
            preparedStatement.setString(4, cliente.getDireccion());
            preparedStatement.setString(5, cliente.getTelefono());
            return preparedStatement.executeUpdate();
        }
    }

    public List<Cliente> listar(Connection connection) throws SQLException {
        String sql = "SELECT nro_cliente, apellido, nombre, direccion, telefono FROM " + clienteTable
            + " ORDER BY nro_cliente";

        List<Cliente> clientes = new ArrayList<>();

        try (PreparedStatement preparedStatement = connection.prepareStatement(sql);
             ResultSet resultSet = preparedStatement.executeQuery()) {

            while (resultSet.next()) {
                Cliente cliente = new Cliente(
                    resultSet.getInt("nro_cliente"),
                    resultSet.getString("apellido"),
                    resultSet.getString("nombre"),
                    resultSet.getString("direccion"),
                    resultSet.getString("telefono")
                );
                clientes.add(cliente);
            }
        }

        return clientes;
    }
}
