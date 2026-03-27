package ar.edu.unrc.bd2.practico4.ej2;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DbConfig {
    private final String driverClass;
    private final String url;
    private final String user;
    private final String password;
    private final String functionCall;
    private final String functionSelect;
    private final String bancoQuery;

    private DbConfig(
        String driverClass,
        String url,
        String user,
        String password,
        String functionCall,
        String functionSelect,
        String bancoQuery
    ) {
        this.driverClass = driverClass;
        this.url = url;
        this.user = user;
        this.password = password;
        this.functionCall = functionCall;
        this.functionSelect = functionSelect;
        this.bancoQuery = bancoQuery;
    }

    public static DbConfig fromFile(String path) throws IOException {
        Properties properties = new Properties();
        try (InputStream is = Files.newInputStream(Path.of(path))) {
            properties.load(is);
        }

        return new DbConfig(
            required(properties, "db.driver"),
            required(properties, "db.url"),
            required(properties, "db.user"),
            optional(properties, "db.password"),
            required(properties, "db.function.call"),
            required(properties, "db.function.select"),
            required(properties, "db.query.banco")
        );
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

    public String getFunctionCall() {
        return functionCall;
    }

    public String getFunctionSelect() {
        return functionSelect;
    }

    public String getBancoQuery() {
        return bancoQuery;
    }
}
