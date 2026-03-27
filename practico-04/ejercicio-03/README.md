# Ejercicio 3 - Listado de metadatos (tablas, columnas, PK, UQ, FK)

Programa Java JDBC que lista, para la base del ejercicio 1.c de la practica 1:

- tablas;
- columnas;
- clave primaria;
- claves unicas;
- claves foraneas.

La implementacion usa `DatabaseMetaData` (`getTables`, `getColumns`, `getPrimaryKeys`, `getIndexInfo`, `getImportedKeys`).

## Archivos

- `src/main/java/ar/edu/unrc/bd2/practico4/ej3/MetadataExplorerApp.java`
- `src/main/java/ar/edu/unrc/bd2/practico4/ej3/MetadataReporter.java`
- `src/main/java/ar/edu/unrc/bd2/practico4/ej3/DbConfig.java`
- `config/db.postgres.properties`
- `config/db.oracle.properties`

## Motores soportados (segun practica 1.c)

- PostgreSQL
- Oracle

## Drivers JDBC ya disponibles en `lib/`

- `lib/postgresql-42.7.4.jar`
- `lib/ojdbc14_145047698453.jar`

## Setup de demo en PostgreSQL (opcional)

```bash
psql -h 127.0.0.1 -U postgres -d postgres -w \
  -f sql/setup_demo_practico1c_postgres.sql
```

## Compilacion

Desde `practico-04/ejercicio-03`:

```bash
mkdir -p out
javac -d out src/main/java/ar/edu/unrc/bd2/practico4/ej3/*.java
```

## Ejecucion

### PostgreSQL

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej3.MetadataExplorerApp \
  config/db.postgres.properties
```

### Oracle

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej3.MetadataExplorerApp \
  config/db.oracle.properties
```

## Nota

En el modelo 1.c de este repo no hay claves unicas adicionales a la PK, por lo que en ese apartado puede aparecer:

- `(sin claves unicas adicionales)`

