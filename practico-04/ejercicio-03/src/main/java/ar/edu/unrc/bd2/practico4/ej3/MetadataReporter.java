package ar.edu.unrc.bd2.practico4.ej3;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;

public class MetadataReporter {

    public void printMetadata(DatabaseMetaData metaData, DbConfig config) throws SQLException {
        List<TableRef> tables = loadTables(metaData, config);

        if (tables.isEmpty()) {
            System.out.println("No se encontraron tablas para el filtro configurado.");
            return;
        }

        for (TableRef table : tables) {
            System.out.println();
            System.out.println("============================================================");
            System.out.println("Tabla: " + table.fullName());
            System.out.println("============================================================");

            printColumns(metaData, table);
            printPrimaryKey(metaData, table);
            printUniqueKeys(metaData, table);
            printForeignKeys(metaData, table);
        }
    }

    private List<TableRef> loadTables(DatabaseMetaData metaData, DbConfig config) throws SQLException {
        List<TableRef> tables = new ArrayList<>();

        try (ResultSet rs = metaData.getTables(
            config.getCatalog(),
            config.getSchemaPattern(),
            config.getTableNamePattern(),
            config.getTableTypes()
        )) {
            while (rs.next()) {
                tables.add(new TableRef(
                    rs.getString("TABLE_CAT"),
                    rs.getString("TABLE_SCHEM"),
                    rs.getString("TABLE_NAME")
                ));
            }
        }

        tables.sort(Comparator
            .comparing((TableRef t) -> nullSafe(t.schema))
            .thenComparing(t -> nullSafe(t.name)));

        return tables;
    }

    private void printColumns(DatabaseMetaData metaData, TableRef table) throws SQLException {
        System.out.println("Columnas:");

        int count = 0;
        try (ResultSet rs = metaData.getColumns(table.catalog, table.schema, table.name, "%")) {
            while (rs.next()) {
                String columnName = rs.getString("COLUMN_NAME");
                String typeName = rs.getString("TYPE_NAME");
                int dataType = rs.getInt("DATA_TYPE");
                int size = rs.getInt("COLUMN_SIZE");
                int decimalDigits = rs.getInt("DECIMAL_DIGITS");
                String nullable = rs.getString("IS_NULLABLE");

                String typeDescription = buildTypeDescription(typeName, dataType, size, decimalDigits);
                String nullDescription = "YES".equalsIgnoreCase(nullable) ? "NULL" : "NOT NULL";

                System.out.println("- " + columnName + " : " + typeDescription + " (" + nullDescription + ")");
                count++;
            }
        }

        if (count == 0) {
            System.out.println("- (sin columnas)");
        }
    }

    private void printPrimaryKey(DatabaseMetaData metaData, TableRef table) throws SQLException {
        Map<Short, String> pkColumns = new TreeMap<>();
        String pkName = null;

        try (ResultSet rs = metaData.getPrimaryKeys(table.catalog, table.schema, table.name)) {
            while (rs.next()) {
                pkName = rs.getString("PK_NAME");
                short keySeq = rs.getShort("KEY_SEQ");
                String column = rs.getString("COLUMN_NAME");
                pkColumns.put(keySeq, column);
            }
        }

        System.out.println("PK:");
        if (pkColumns.isEmpty()) {
            System.out.println("- (sin clave primaria)");
            return;
        }

        List<String> orderedColumns = new ArrayList<>(pkColumns.values());
        String name = (pkName == null || pkName.isBlank()) ? "(sin nombre)" : pkName;
        System.out.println("- " + name + " " + orderedColumns);
    }

    private void printUniqueKeys(DatabaseMetaData metaData, TableRef table) throws SQLException {
        Set<String> pkColumnsSet = getPrimaryKeyColumnsSet(metaData, table);

        Map<String, TreeMap<Short, String>> uniqueIndexes = new LinkedHashMap<>();

        try (ResultSet rs = metaData.getIndexInfo(table.catalog, table.schema, table.name, true, false)) {
            while (rs.next()) {
                short type = rs.getShort("TYPE");
                if (type == DatabaseMetaData.tableIndexStatistic) {
                    continue;
                }

                String indexName = rs.getString("INDEX_NAME");
                String columnName = rs.getString("COLUMN_NAME");
                short ordinalPosition = rs.getShort("ORDINAL_POSITION");

                if (indexName == null || indexName.isBlank() || columnName == null || columnName.isBlank()) {
                    continue;
                }

                uniqueIndexes
                    .computeIfAbsent(indexName, k -> new TreeMap<>())
                    .put(ordinalPosition, columnName);
            }
        }

        // Descarta indices unicos que sean exactamente la PK.
        uniqueIndexes.entrySet().removeIf(e -> {
            Set<String> indexColumns = new LinkedHashSet<>(e.getValue().values());
            return !pkColumnsSet.isEmpty() && pkColumnsSet.equals(indexColumns);
        });

        System.out.println("Claves unicas:");
        if (uniqueIndexes.isEmpty()) {
            System.out.println("- (sin claves unicas adicionales)");
            return;
        }

        List<String> names = new ArrayList<>(uniqueIndexes.keySet());
        Collections.sort(names);
        for (String name : names) {
            List<String> columns = new ArrayList<>(uniqueIndexes.get(name).values());
            System.out.println("- " + name + " " + columns);
        }
    }

    private void printForeignKeys(DatabaseMetaData metaData, TableRef table) throws SQLException {
        Map<String, TreeMap<Short, FkPart>> groupedFks = new LinkedHashMap<>();

        try (ResultSet rs = metaData.getImportedKeys(table.catalog, table.schema, table.name)) {
            while (rs.next()) {
                String fkName = rs.getString("FK_NAME");
                if (fkName == null || fkName.isBlank()) {
                    fkName = "(sin_nombre_fk)";
                }

                short keySeq = rs.getShort("KEY_SEQ");
                FkPart part = new FkPart(
                    rs.getString("FKCOLUMN_NAME"),
                    rs.getString("PKTABLE_SCHEM"),
                    rs.getString("PKTABLE_NAME"),
                    rs.getString("PKCOLUMN_NAME")
                );

                groupedFks.computeIfAbsent(fkName, k -> new TreeMap<>()).put(keySeq, part);
            }
        }

        System.out.println("Claves foraneas:");
        if (groupedFks.isEmpty()) {
            System.out.println("- (sin claves foraneas)");
            return;
        }

        List<String> names = new ArrayList<>(groupedFks.keySet());
        Collections.sort(names);

        for (String name : names) {
            List<String> fkColumns = new ArrayList<>();
            List<String> pkColumns = new ArrayList<>();
            String refSchema = null;
            String refTable = null;

            for (FkPart part : groupedFks.get(name).values()) {
                fkColumns.add(part.fkColumn);
                pkColumns.add(part.pkColumn);
                refSchema = part.pkSchema;
                refTable = part.pkTable;
            }

            String ref = (refSchema == null || refSchema.isBlank())
                ? refTable
                : refSchema + "." + refTable;

            System.out.println("- " + name + " " + fkColumns + " -> " + ref + " " + pkColumns);
        }
    }

    private Set<String> getPrimaryKeyColumnsSet(DatabaseMetaData metaData, TableRef table) throws SQLException {
        Set<String> pkColumns = new LinkedHashSet<>();
        try (ResultSet rs = metaData.getPrimaryKeys(table.catalog, table.schema, table.name)) {
            while (rs.next()) {
                String column = rs.getString("COLUMN_NAME");
                if (column != null) {
                    pkColumns.add(column);
                }
            }
        }
        return pkColumns;
    }

    private String buildTypeDescription(String typeName, int dataType, int size, int decimalDigits) {
        if (typeName == null) {
            typeName = "DESCONOCIDO";
        }

        if (supportsLength(dataType) && size > 0) {
            return typeName + "(" + size + ")";
        }

        if (supportsPrecisionScale(dataType) && size > 0) {
            return decimalDigits > 0
                ? typeName + "(" + size + "," + decimalDigits + ")"
                : typeName + "(" + size + ")";
        }

        return typeName;
    }

    private boolean supportsLength(int dataType) {
        return dataType == Types.CHAR
            || dataType == Types.VARCHAR
            || dataType == Types.NCHAR
            || dataType == Types.NVARCHAR
            || dataType == Types.LONGVARCHAR
            || dataType == Types.LONGNVARCHAR;
    }

    private boolean supportsPrecisionScale(int dataType) {
        return dataType == Types.NUMERIC || dataType == Types.DECIMAL;
    }

    private String nullSafe(String value) {
        return Objects.toString(value, "");
    }

    private static final class TableRef {
        private final String catalog;
        private final String schema;
        private final String name;

        private TableRef(String catalog, String schema, String name) {
            this.catalog = catalog;
            this.schema = schema;
            this.name = name;
        }

        private String fullName() {
            if (schema == null || schema.isBlank()) {
                return name;
            }
            return schema + "." + name;
        }
    }

    private static final class FkPart {
        private final String fkColumn;
        private final String pkSchema;
        private final String pkTable;
        private final String pkColumn;

        private FkPart(String fkColumn, String pkSchema, String pkTable, String pkColumn) {
            this.fkColumn = fkColumn;
            this.pkSchema = pkSchema;
            this.pkTable = pkTable;
            this.pkColumn = pkColumn;
        }
    }
}
