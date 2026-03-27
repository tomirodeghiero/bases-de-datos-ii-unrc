package ar.edu.unrc.bd2.practico4.ej2;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Scanner;

public class CotizacionMaximaApp {
    public static void main(String[] args) {
        String configPath = args.length > 0 ? args[0] : "config/db.postgres.properties";

        DbConfig dbConfig;
        try {
            dbConfig = DbConfig.fromFile(configPath);
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("Error cargando configuracion: " + e.getMessage());
            System.err.println("Uso esperado: java ... CotizacionMaximaApp <ruta-props> [cod_banco]");
            System.exit(1);
            return;
        }

        try (Connection connection = dbConfig.createConnection();
             Scanner scanner = new Scanner(System.in)) {

            int codBanco = leerCodBanco(args, scanner);

            CotizacionMaximaService service = new CotizacionMaximaService(dbConfig);
            BigDecimal cotizacionMaxima = service.invocarFuncion(codBanco, connection);

            System.out.println();
            System.out.println("Funcion invocada: practico3_ej2.fn_actualizar_cotizacion_maxima");
            System.out.println("Parametro IN  p_cod_banco         = " + codBanco);
            System.out.println("Parametro OUT p_cotizacion_maxima = " + cotizacionMaxima);

            CotizacionMaximaService.BancoCotizacion banco = service.consultarBanco(codBanco, connection);
            if (banco != null) {
                System.out.println("Banco actualizado -> cod_banco=" + banco.getCodBanco()
                    + ", nombre=" + banco.getNombre()
                    + ", cotizacion_maxima=" + banco.getCotizacionMaxima());
            }

        } catch (ClassNotFoundException e) {
            System.err.println("No se encontro el driver JDBC: " + e.getMessage());
            System.exit(2);
        } catch (SQLException e) {
            System.err.println("Error SQL al invocar la funcion: " + e.getMessage());
            System.exit(3);
        }
    }

    private static int leerCodBanco(String[] args, Scanner scanner) {
        if (args.length > 1) {
            return Integer.parseInt(args[1]);
        }

        while (true) {
            System.out.print("Ingrese cod_banco a procesar: ");
            String value = scanner.nextLine().trim();
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                System.out.println("Valor invalido. Debe ser entero.");
            }
        }
    }
}
