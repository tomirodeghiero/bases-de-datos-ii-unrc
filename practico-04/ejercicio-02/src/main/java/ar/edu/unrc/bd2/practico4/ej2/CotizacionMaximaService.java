package ar.edu.unrc.bd2.practico4.ej2;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

public class CotizacionMaximaService {
    private final DbConfig dbConfig;

    public CotizacionMaximaService(DbConfig dbConfig) {
        this.dbConfig = dbConfig;
    }

    public BigDecimal invocarFuncion(int codBanco, Connection connection) throws SQLException {
        try {
            return invocarConCallableStatement(codBanco, connection);
        } catch (SQLException e) {
            // Algunos entornos PostgreSQL/JDBC tienen restricciones con el escape call.
            // Se aplica fallback para mantener compatibilidad.
            return invocarConSelect(codBanco, connection);
        }
    }

    private BigDecimal invocarConCallableStatement(int codBanco, Connection connection) throws SQLException {
        try (CallableStatement callableStatement = connection.prepareCall(dbConfig.getFunctionCall())) {
            callableStatement.registerOutParameter(1, Types.NUMERIC);
            callableStatement.setInt(2, codBanco);
            callableStatement.execute();
            return callableStatement.getBigDecimal(1);
        }
    }

    private BigDecimal invocarConSelect(int codBanco, Connection connection) throws SQLException {
        try (PreparedStatement preparedStatement = connection.prepareStatement(dbConfig.getFunctionSelect())) {
            preparedStatement.setInt(1, codBanco);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new SQLException("La funcion no retorno filas de salida.");
                }
                return resultSet.getBigDecimal(1);
            }
        }
    }

    public BancoCotizacion consultarBanco(int codBanco, Connection connection) throws SQLException {
        try (PreparedStatement preparedStatement = connection.prepareStatement(dbConfig.getBancoQuery())) {
            preparedStatement.setInt(1, codBanco);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (!resultSet.next()) {
                    return null;
                }
                return new BancoCotizacion(
                    resultSet.getInt("cod_banco"),
                    resultSet.getString("nombre"),
                    resultSet.getBigDecimal("cotizacion_maxima")
                );
            }
        }
    }

    public static class BancoCotizacion {
        private final int codBanco;
        private final String nombre;
        private final BigDecimal cotizacionMaxima;

        public BancoCotizacion(int codBanco, String nombre, BigDecimal cotizacionMaxima) {
            this.codBanco = codBanco;
            this.nombre = nombre;
            this.cotizacionMaxima = cotizacionMaxima;
        }

        public int getCodBanco() {
            return codBanco;
        }

        public String getNombre() {
            return nombre;
        }

        public BigDecimal getCotizacionMaxima() {
            return cotizacionMaxima;
        }
    }
}
