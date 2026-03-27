# Ejercicio 1 - Alta y listado de clientes con JDBC

Programa Java sin interfaz grafica (CLI) que resuelve el enunciado:

- alta de cliente en la tabla `cliente` del ejercicio 1.a del Practico 1;
- listado de clientes cargados.

La implementacion esta hecha con JDBC y `PreparedStatement`.

## Archivos

- `src/main/java/ar/edu/unrc/bd2/practico4/ej1/ClientesCliApp.java`: menu CLI.
- `src/main/java/ar/edu/unrc/bd2/practico4/ej1/ClienteDao.java`: acceso a datos con JDBC.
- `src/main/java/ar/edu/unrc/bd2/practico4/ej1/DbConfig.java`: carga de configuracion `.properties`.
- `config/db.mysql.properties`: configuracion ejemplo para MySQL.
- `config/db.postgres.properties`: configuracion ejemplo para PostgreSQL.

## Requisitos

1. Tener creada y poblada la base del Practico 1.a:
   - MySQL: base `practico1a_mysql` con tabla `cliente`.
   - PostgreSQL: esquema `practico1a` con tabla `cliente`.
2. Tener Java 11+.
3. Tener los jars de driver JDBC en `lib/`.

En esta carpeta ya quedaron copiados:

- `lib/mysql-connector-j-8.0.33_145047698413.jar`
- `lib/ojdbc14_145047698453.jar`

## Compilacion

Desde `practico-04/ejercicio-01`:

```bash
mkdir -p out
javac -d out src/main/java/ar/edu/unrc/bd2/practico4/ej1/*.java
```

## Ejecucion

### PostgreSQL

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej1.ClientesCliApp \
  config/db.postgres.properties
```

### MySQL

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej1.ClientesCliApp \
  config/db.mysql.properties
```

## Flujo de uso

1. Elegir `1` para alta.
2. Ingresar `nro_cliente`, `apellido`, `nombre`, `direccion`, `telefono`.
3. Elegir `2` para listar clientes.
4. Elegir `0` para salir.

## Notas tecnicas

- El alta se hace con `INSERT` parametrizado para evitar concatenacion insegura de valores.
- El listado se hace con `SELECT ... ORDER BY nro_cliente`.
- Se reportan errores SQL comunes (por ejemplo, PK/UNIQUE duplicada).
- Se cierran recursos con `try-with-resources`.
- `db.password` puede dejarse vacio (`db.password=`) si tu usuario MySQL no usa contraseña.
