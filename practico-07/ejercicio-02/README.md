# Ejercicio 2 - Generar un JSON unico de facturas con items

Se armo un programa Java que:

1. se conecta por JDBC a `practico1a_mysql`,
2. lee `factura`,
3. lee `item_factura`,
4. arma un solo documento JSON con facturas e items anidados,
5. guarda el resultado en archivo usando Gson.

## Archivos usados

- `practico-07/recursos/json/src/jsonPath/Ejercicio2FacturaJson.java`
- `practico-07/recursos/json/config/db.mysql.properties`
- `practico-07/recursos/json/lib/gson-2.8.6.jar`
- `practico-07/recursos/json/lib/mysql-connector-j-8.0.33.jar`

## Forma del JSON

```json
{
  "generado_en": "2026-03-28T12:34:56.123-03:00",
  "facturas": [
    {
      "nro_factura": 1001,
      "nro_cliente": 1,
      "fecha": "2024-08-01",
      "monto": 106000.0,
      "items": [
        { "cod_producto": 102, "cantidad": 2, "precio": 8000.0 },
        { "cod_producto": 103, "cantidad": 1, "precio": 90000.0 }
      ]
    }
  ]
}
```

## Como compilar

Desde `practico-07/recursos/json`:

```bash
javac -cp "lib/*" -d bin src/jsonPath/Ejercicio2FacturaJson.java
```

## Como ejecutar

```bash
java -cp "bin:lib/*" jsonPath.Ejercicio2FacturaJson config/db.mysql.properties
```

El programa:

- muestra por consola la ruta del archivo generado,
- y crea `salida/facturas_items.json` (segun `output.file` del `.properties`).

## Configuracion

En `config/db.mysql.properties` podes ajustar:

- driver JDBC,
- URL, usuario y password,
- tabla de facturas,
- tabla de items,
- ruta de salida.

Si tu entorno es distinto, cambia `db.url`, `db.user` y `db.password`.

## Resultado de prueba

El programa genero el archivo sin errores y devolvio `Facturas exportadas: 0` (en esa corrida no habia filas en `factura`).
