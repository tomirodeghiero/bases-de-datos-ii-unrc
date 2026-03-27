package ar.edu.unrc.bd2.practico4.ej3;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Properties;

public class DbConfig {
    private final String driverClass;
    private final String url;
    private final String user;
    private final String password;
    private final String catalog;
    private final String schemaPattern;
    private final String tableNamePattern;
    private final String[] tableTypes;

    private DbConfig(
        String driverClass,
        String url,
        String user,
        String password,
        String catalog,
        String schemaPattern,
        String tableNamePattern,
        String[] tableTypes
    ) {
        this.driverClass = driverClass;
        this.url = url;
        this.user = user;
        this.password = password;
        this.catalog = catalog;
        this.schemaPattern = schemaPattern;
        this.tableNamePattern = tableNamePattern;
        this.tableTypes = tableTypes;
    }

    public static DbConfig fromFile(String configPath) throws IOException {
        Properties properties = new Properties();
        try (InputStream is = Files.newInputStream(Path.of(configPath))) {
            properties.load(is);
        }

        String[] tableTypes = Arrays.stream(optional(properties, "db.table.types", "TABLE").split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);

        return new DbConfig(
            required(properties, "db.driver"),
            required(properties, "db.url"),
            required(properties, "db.user"),
            optional(properties, "db.password", ""),
            emptyToNull(optional(properties, "db.catalog", "")),
            emptyToNull(optional(properties, "db.schemaPattern", "")),
            optional(properties, "db.tableNamePattern", "%"),
            tableTypes.length == 0 ? new String[]{"TABLE"} : tableTypes
        );
    }

    private static String required(Properties properties, String key) {
        String value = properties.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Falta propiedad obligatoria: " + key);
        }
        return value.trim();
    }

    private static String optional(Properties properties, String key, String defaultValue) {
        String value = properties.getProperty(key);
        if (value == null) {
            return defaultValue;
        }
        return value.trim();
    }

    private static String emptyToNull(String value) {
        return (value == null || value.isEmpty()) ? null : value;
    }

    public Connection openConnection() throws SQLException, ClassNotFoundException {
        Class.forName(driverClass);
        return DriverManager.getConnection(url, user, password);
    }

    public String getCatalog() {
        return catalog;
    }

    public String getSchemaPattern() {
        return schemaPattern;
    }

    public String getTableNamePattern() {
        return tableNamePattern;
    }

    public String[] getTableTypes() {
        return tableTypes;
    }
}
