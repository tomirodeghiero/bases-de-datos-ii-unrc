# Ejercicio 4 - Catalogo de PostgreSQL

## a) Donde guarda PostgreSQL informacion de tablas, atributos y tipos

En PostgreSQL se puede consultar metadata por dos caminos:

1. Vistas estandar (`information_schema`)
- `information_schema.tables`: tablas y vistas.
- `information_schema.columns`: columnas, tipo, longitud, precision, nullability, etc.

2. Catalogo interno (`pg_catalog`)
- `pg_class`: objetos tipo tabla/indice/vista.
- `pg_namespace`: esquema.
- `pg_attribute`: atributos (columnas) de cada tabla.
- `pg_type`: tipo de dato de cada atributo.

Para trabajos practicos suele convenir `information_schema.columns` por ser mas simple.

### Consulta pedida: nombre y tipo de atributos de `vehiculo`

Version simple (recomendada):

```sql
SELECT
    c.column_name AS atributo,
    c.data_type   AS tipo,
    c.udt_name    AS tipo_interno
FROM information_schema.columns c
WHERE c.table_schema = 'public'      -- cambiar si usas otro schema (ej: practico1b)
  AND c.table_name   = 'vehiculo'
ORDER BY c.ordinal_position;
```

Version catalogo interno (`pg_catalog`):

```sql
SELECT
    a.attname AS atributo,
    format_type(a.atttypid, a.atttypmod) AS tipo
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c
  ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n
  ON n.oid = c.relnamespace
WHERE n.nspname = 'public'           -- cambiar si corresponde
  AND c.relname = 'vehiculo'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
```

## b) Donde guarda PostgreSQL estadisticas de tablas y atributos

### Estadisticas de tablas

- `pg_class`: estimaciones del planner por tabla:
  - `reltuples` (cantidad estimada de filas)
  - `relpages` (cantidad estimada de paginas)
- `pg_stat_user_tables` / `pg_stat_all_tables`: estadisticas de actividad (scans, inserts, updates, deletes, vacuum, analyze).

Consulta ejemplo:

```sql
SELECT
    n.nspname AS schema_name,
    c.relname AS tabla,
    c.reltuples,
    c.relpages
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n
  ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relname = 'vehiculo';
```

### Estadisticas de atributos (columnas)

La fuente real es `pg_statistic` (tabla interna).  
La vista recomendada para consultar es `pg_stats`.

`pg_stats` guarda, entre otras:

- `null_frac`: fraccion de valores `NULL`.
- `n_distinct`: cantidad estimada de valores distintos.
- `avg_width`: ancho promedio del valor.
- `most_common_vals` y `most_common_freqs`: valores mas frecuentes y frecuencia.
- `histogram_bounds`: limites de histograma para estimar rangos.
- `correlation`: correlacion fisica del orden de la columna con el orden en disco.
- (para tipos arreglos) `most_common_elems` y `elem_count_histogram`.

Consulta ejemplo para `vehiculo`:

```sql
SELECT
    s.attname,
    s.null_frac,
    s.n_distinct,
    s.avg_width,
    s.correlation,
    s.most_common_vals,
    s.most_common_freqs,
    s.histogram_bounds
FROM pg_catalog.pg_stats s
WHERE s.schemaname = 'public'
  AND s.tablename  = 'vehiculo'
ORDER BY s.attname;
```

## Nota practica

Si no aparecen estadisticas actualizadas, ejecutar:

```sql
ANALYZE public.vehiculo;
```

Luego volver a consultar `pg_stats`.
