package jsonPath;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Pattern;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class Ejercicio2FacturaJson {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("^[A-Za-z_][A-Za-z0-9_$.]*$");

    public static void main(String[] args) {
        String configPath = args.length > 0 ? args[0] : "config/db.mysql.properties";

        try {
            DbConfig config = DbConfig.fromFile(configPath);
            DocumentoFactura documento = generarDocumento(config);
            Path output = escribirJson(documento, config.getOutputFile());

            System.out.println("Documento generado correctamente.");
            System.out.println("Archivo: " + output.toAbsolutePath());
            System.out.println("Facturas exportadas: " + documento.facturas.size());
        } catch (Exception e) {
            System.err.println("Error generando JSON: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static DocumentoFactura generarDocumento(DbConfig config) throws SQLException, ClassNotFoundException {
        Class.forName(config.getDriverClass());

        try (Connection connection = DriverManager.getConnection(config.getUrl(), config.getUser(), config.getPassword())) {
            String facturaTable = safeIdentifier(config.getFacturaTable(), "db.table.factura");
            String itemTable = safeIdentifier(config.getItemFacturaTable(), "db.table.item_factura");

            List<FacturaJson> facturas = leerFacturas(connection, facturaTable);
            Map<Integer, List<ItemFacturaJson>> itemsPorFactura = leerItemsPorFactura(connection, itemTable);

            for (FacturaJson factura : facturas) {
                List<ItemFacturaJson> items = itemsPorFactura.getOrDefault(factura.nro_factura, new ArrayList<>());
                factura.items.addAll(items);
            }

            DocumentoFactura documento = new DocumentoFactura();
            documento.generado_en = OffsetDateTime.now().toString();
            documento.facturas = facturas;
            return documento;
        }
    }

    private static List<FacturaJson> leerFacturas(Connection connection, String facturaTable) throws SQLException {
        String sql = "SELECT nro_factura, nro_cliente, fecha, monto FROM " + facturaTable + " ORDER BY nro_factura";
        List<FacturaJson> facturas = new ArrayList<>();

        try (PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                FacturaJson factura = new FacturaJson();
                factura.nro_factura = rs.getInt("nro_factura");
                factura.nro_cliente = rs.getInt("nro_cliente");

                Date fecha = rs.getDate("fecha");
                factura.fecha = (fecha == null) ? null : fecha.toString();

                factura.monto = rs.getBigDecimal("monto");
                facturas.add(factura);
            }
        }
        return facturas;
    }

    private static Map<Integer, List<ItemFacturaJson>> leerItemsPorFactura(Connection connection, String itemTable)
        throws SQLException {
        String sql = "SELECT nro_factura, cod_producto, cantidad, precio FROM " + itemTable
            + " ORDER BY nro_factura, cod_producto";
        Map<Integer, List<ItemFacturaJson>> resultado = new HashMap<>();

        try (PreparedStatement ps = connection.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int nroFactura = rs.getInt("nro_factura");
                ItemFacturaJson item = new ItemFacturaJson();
                item.cod_producto = rs.getInt("cod_producto");
                item.cantidad = rs.getInt("cantidad");
                item.precio = rs.getBigDecimal("precio");

                resultado.computeIfAbsent(nroFactura, ignored -> new ArrayList<>()).add(item);
            }
        }

        return resultado;
    }

    private static Path escribirJson(DocumentoFactura documento, String outputFile) throws IOException {
        Path output = Path.of(outputFile);
        if (output.getParent() != null) {
            Files.createDirectories(output.getParent());
        }
        Files.writeString(output, GSON.toJson(documento), StandardCharsets.UTF_8);
        return output;
    }

    private static String safeIdentifier(String value, String keyName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Falta configuracion obligatoria: " + keyName);
        }
        String trimmed = value.trim();
        if (!SAFE_IDENTIFIER.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Identificador invalido para " + keyName + ": " + trimmed);
        }
        return trimmed;
    }

    private static class DbConfig {
        private final String driverClass;
        private final String url;
        private final String user;
        private final String password;
        private final String facturaTable;
        private final String itemFacturaTable;
        private final String outputFile;

        private DbConfig(String driverClass, String url, String user, String password, String facturaTable,
                         String itemFacturaTable, String outputFile) {
            this.driverClass = driverClass;
            this.url = url;
            this.user = user;
            this.password = password;
            this.facturaTable = facturaTable;
            this.itemFacturaTable = itemFacturaTable;
            this.outputFile = outputFile;
        }

        static DbConfig fromFile(String path) throws IOException {
            Properties props = new Properties();
            try (InputStream is = Files.newInputStream(Path.of(path))) {
                props.load(is);
            }

            return new DbConfig(
                required(props, "db.driver"),
                required(props, "db.url"),
                required(props, "db.user"),
                optional(props, "db.password"),
                required(props, "db.table.factura"),
                required(props, "db.table.item_factura"),
                optionalWithDefault(props, "output.file", "salida/facturas_items.json")
            );
        }

        private static String required(Properties props, String key) {
            String value = props.getProperty(key);
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("Falta la propiedad obligatoria: " + key);
            }
            return value.trim();
        }

        private static String optional(Properties props, String key) {
            String value = props.getProperty(key);
            return value == null ? "" : value.trim();
        }

        private static String optionalWithDefault(Properties props, String key, String defaultValue) {
            String value = props.getProperty(key);
            if (value == null || value.isBlank()) {
                return defaultValue;
            }
            return value.trim();
        }

        String getDriverClass() {
            return driverClass;
        }

        String getUrl() {
            return url;
        }

        String getUser() {
            return user;
        }

        String getPassword() {
            return password;
        }

        String getFacturaTable() {
            return facturaTable;
        }

        String getItemFacturaTable() {
            return itemFacturaTable;
        }

        String getOutputFile() {
            return outputFile;
        }
    }

    private static class DocumentoFactura {
        String generado_en;
        List<FacturaJson> facturas = new ArrayList<>();
    }

    private static class FacturaJson {
        int nro_factura;
        int nro_cliente;
        String fecha;
        BigDecimal monto;
        List<ItemFacturaJson> items = new ArrayList<>();
    }

    private static class ItemFacturaJson {
        int cod_producto;
        int cantidad;
        BigDecimal precio;
    }
}
