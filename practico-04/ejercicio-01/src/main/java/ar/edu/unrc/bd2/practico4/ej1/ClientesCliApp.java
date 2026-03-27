package ar.edu.unrc.bd2.practico4.ej1;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Scanner;

public class ClientesCliApp {

    public static void main(String[] args) {
        String configPath = args.length > 0 ? args[0] : "config/db.postgres.properties";

        DbConfig dbConfig;
        try {
            dbConfig = DbConfig.fromFile(configPath);
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("Error cargando configuracion: " + e.getMessage());
            System.err.println("Uso esperado: java ... ClientesCliApp <ruta-props>");
            System.exit(1);
            return;
        }

        ClienteDao clienteDao = new ClienteDao(dbConfig.getClienteTable());

        try (Connection connection = dbConfig.createConnection();
             Scanner scanner = new Scanner(System.in)) {

            System.out.println("Conexion OK. Tabla objetivo: " + dbConfig.getClienteTable());
            ejecutarMenu(scanner, connection, clienteDao);
        } catch (ClassNotFoundException e) {
            System.err.println("No se encontro el driver JDBC: " + e.getMessage());
            System.exit(2);
        } catch (SQLException e) {
            System.err.println("Error de conexion/SQL: " + e.getMessage());
            System.exit(3);
        }
    }

    private static void ejecutarMenu(Scanner scanner, Connection connection, ClienteDao clienteDao) {
        boolean salir = false;

        while (!salir) {
            mostrarMenu();
            String opcion = scanner.nextLine().trim();

            switch (opcion) {
                case "1":
                    altaCliente(scanner, connection, clienteDao);
                    break;
                case "2":
                    listarClientes(connection, clienteDao);
                    break;
                case "0":
                    salir = true;
                    System.out.println("Fin del programa.");
                    break;
                default:
                    System.out.println("Opcion invalida.");
            }
        }
    }

    private static void mostrarMenu() {
        System.out.println();
        System.out.println("=== Practico 4 - JDBC - Ejercicio 1 ===");
        System.out.println("1) Alta de cliente");
        System.out.println("2) Listado de clientes");
        System.out.println("0) Salir");
        System.out.print("Seleccione una opcion: ");
    }

    private static void altaCliente(Scanner scanner, Connection connection, ClienteDao clienteDao) {
        try {
            System.out.print("nro_cliente (int): ");
            int nroCliente = Integer.parseInt(scanner.nextLine().trim());

            System.out.print("apellido: ");
            String apellido = leerNoVacio(scanner);

            System.out.print("nombre: ");
            String nombre = leerNoVacio(scanner);

            System.out.print("direccion: ");
            String direccion = leerNoVacio(scanner);

            System.out.print("telefono: ");
            String telefono = leerNoVacio(scanner);

            Cliente cliente = new Cliente(nroCliente, apellido, nombre, direccion, telefono);
            int filas = clienteDao.insertar(connection, cliente);

            if (filas == 1) {
                System.out.println("Cliente insertado correctamente.");
            } else {
                System.out.println("No se inserto el cliente (filas afectadas=" + filas + ").");
            }
        } catch (NumberFormatException e) {
            System.out.println("Error: nro_cliente debe ser entero.");
        } catch (SQLException e) {
            System.out.println("Error SQL al insertar cliente: " + e.getMessage());
        }
    }

    private static void listarClientes(Connection connection, ClienteDao clienteDao) {
        try {
            List<Cliente> clientes = clienteDao.listar(connection);
            if (clientes.isEmpty()) {
                System.out.println("No hay clientes cargados.");
                return;
            }

            System.out.println();
            System.out.println("Listado de clientes:");
            for (Cliente cliente : clientes) {
                System.out.println("- " + cliente);
            }
        } catch (SQLException e) {
            System.out.println("Error SQL al listar clientes: " + e.getMessage());
        }
    }

    private static String leerNoVacio(Scanner scanner) {
        while (true) {
            String valor = scanner.nextLine().trim();
            if (!valor.isEmpty()) {
                return valor;
            }
            System.out.print("Valor obligatorio. Ingrese nuevamente: ");
        }
    }
}
