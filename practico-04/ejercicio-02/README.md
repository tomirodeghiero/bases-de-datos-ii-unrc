# Ejercicio 2 - Invocacion de funcion (maxima cotizacion)

Programa Java JDBC que invoca la funcion del Practico 3, ejercicio 2:

- funcion: `practico3_ej2.fn_actualizar_cotizacion_maxima`
- entrada: `p_cod_banco`
- salida: `p_cotizacion_maxima`

La app muestra el parametro de salida y luego consulta la tabla `banco` para verificar la actualizacion.

## Archivos

- `src/main/java/ar/edu/unrc/bd2/practico4/ej2/CotizacionMaximaApp.java`
- `src/main/java/ar/edu/unrc/bd2/practico4/ej2/CotizacionMaximaService.java`
- `src/main/java/ar/edu/unrc/bd2/practico4/ej2/DbConfig.java`
- `config/db.postgres.properties`

## Requisitos

1. Tener ejecutado el SQL del Practico 3, ejercicio 2 (schema `practico3_ej2`, tablas y funcion).
2. Java 11+.
3. Driver JDBC de PostgreSQL en `lib/` (por ejemplo `postgresql-42.x.x.jar`).

En esta carpeta ya se dejo:

- `lib/postgresql-42.7.4.jar`

## Carga rapida de demo (opcional)

Si queres dejar el entorno listo con datos de prueba, ejecuta:

```bash
psql -h 127.0.0.1 -U postgres -d postgres -w \
  -f sql/setup_demo_practico3_ej2.sql
```

## Compilacion

Desde `practico-04/ejercicio-02`:

```bash
mkdir -p out
javac -d out src/main/java/ar/edu/unrc/bd2/practico4/ej2/*.java
```

## Ejecucion

Con ingreso interactivo de `cod_banco`:

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej2.CotizacionMaximaApp \
  config/db.postgres.properties
```

Con `cod_banco` por argumento:

```bash
java -cp "out:lib/*" \
  ar.edu.unrc.bd2.practico4.ej2.CotizacionMaximaApp \
  config/db.postgres.properties 1
```

## Salida esperada (ejemplo)

```text
Funcion invocada: practico3_ej2.fn_actualizar_cotizacion_maxima
Parametro IN  p_cod_banco         = 1
Parametro OUT p_cotizacion_maxima = 1245.7500
Banco actualizado -> cod_banco=1, nombre=Banco Rio, cotizacion_maxima=1245.7500
```

## Nota tecnica

- Se intenta primero con `CallableStatement` (enfoque pedido por teoria JDBC).
- Si el driver/entorno no soporta el escape call esperado, hay fallback via `SELECT` para mantener compatibilidad.
