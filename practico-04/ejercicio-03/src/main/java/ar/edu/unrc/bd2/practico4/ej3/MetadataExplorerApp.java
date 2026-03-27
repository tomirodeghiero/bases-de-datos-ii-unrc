package ar.edu.unrc.bd2.practico4.ej3;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

public class MetadataExplorerApp {

    public static void main(String[] args) {
        String configPath = args.length > 0 ? args[0] : "config/db.postgres.properties";

        DbConfig config;
        try {
            config = DbConfig.fromFile(configPath);
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("Error cargando config: " + e.getMessage());
            System.err.println("Uso: java ... MetadataExplorerApp <ruta-properties>");
            System.exit(1);
            return;
        }

        try (Connection connection = config.openConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("Conexion OK -> " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());
            System.out.println("Filtro de tablas -> schemaPattern=" + config.getSchemaPattern()
                + ", tablePattern=" + config.getTableNamePattern());

            MetadataReporter reporter = new MetadataReporter();
            reporter.printMetadata(metaData, config);

        } catch (ClassNotFoundException e) {
            System.err.println("No se encontro el driver JDBC: " + e.getMessage());
            System.exit(2);
        } catch (SQLException e) {
            System.err.println("Error SQL: " + e.getMessage());
            System.exit(3);
        }
    }
}
