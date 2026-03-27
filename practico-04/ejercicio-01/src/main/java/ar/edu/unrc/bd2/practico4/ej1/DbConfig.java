package ar.edu.unrc.bd2.practico4.ej1;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Objects;
import java.util.Properties;

public class DbConfig {
    private final String driverClass;
    private final String url;
    private final String user;
    private final String password;
    private final String clienteTable;

    private DbConfig(String driverClass, String url, String user, String password, String clienteTable) {
        this.driverClass = driverClass;
        this.url = url;
        this.user = user;
        this.password = password;
        this.clienteTable = clienteTable;
    }

    public static DbConfig fromFile(String path) throws IOException {
        Path file = Path.of(path);
        Properties properties = new Properties();
        try (InputStream is = Files.newInputStream(file)) {
            properties.load(is);
        }

        String driverClass = required(properties, "db.driver");
        String url = required(properties, "db.url");
        String user = required(properties, "db.user");
        String password = optional(properties, "db.password");
        String clienteTable = required(properties, "db.table.cliente");

        return new DbConfig(driverClass, url, user, password, clienteTable);
    }

    private static String required(Properties properties, String key) {
        String value = properties.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Falta la propiedad obligatoria: " + key);
        }
        return value.trim();
    }

    private static String optional(Properties properties, String key) {
        String value = properties.getProperty(key);
        return value == null ? "" : value.trim();
    }

    public Connection createConnection() throws SQLException, ClassNotFoundException {
        Class.forName(driverClass);
        return DriverManager.getConnection(url, user, password);
    }

    public String getClienteTable() {
        return clienteTable;
    }

    @Override
    public String toString() {
        return "DbConfig{" +
            "driverClass='" + driverClass + '\'' +
            ", url='" + url + '\'' +
            ", user='" + user + '\'' +
            ", clienteTable='" + clienteTable + '\'' +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DbConfig)) {
            return false;
        }
        DbConfig dbConfig = (DbConfig) o;
        return Objects.equals(driverClass, dbConfig.driverClass)
            && Objects.equals(url, dbConfig.url)
            && Objects.equals(user, dbConfig.user)
            && Objects.equals(password, dbConfig.password)
            && Objects.equals(clienteTable, dbConfig.clienteTable);
    }

    @Override
    public int hashCode() {
        return Objects.hash(driverClass, url, user, password, clienteTable);
    }
}
