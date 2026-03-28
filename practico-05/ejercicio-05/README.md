# Ejercicio 5 - Resolucion completa (PostgreSQL)

Tablas del enunciado:

- `persona`
- `recurso`
- `seguimiento_acceso`

## Archivos incluidos

Scripts provistos por catedra (copiados sin modificar):

- `sql/PERSONAPostgres.sql`
- `sql/RecursoPostgres.sql`
- `sql/Seguimiento_AceesoPostgres.sql` (se mantiene el nombre original provisto)

Scripts de resolucion:

- `sql/resolucion/01_a_carga_base.sql`
- `sql/resolucion/02_b_carga_cartesiana_seguimiento.sql`
- `sql/resolucion/03_c_catalogo_estadisticas.sql`
- `sql/resolucion/04_d_plan_fecha_y_mejora.sql`
- `sql/resolucion/05_e_join_y_merge_join.sql`

## a) Crear tablas y cargar datos iniciales

Se resuelve ejecutando los 3 scripts base en este orden:

1. `PERSONAPostgres.sql`
2. `RecursoPostgres.sql`
3. `Seguimiento_AceesoPostgres.sql`

El tercero crea `seguimiento_acceso` con FK hacia `persona` y `recurso`, por eso va al final.

Script listo:

- `sql/resolucion/01_a_carga_base.sql`

## b) Programa para insertar 1 registro por cada persona y por cada recurso

Se implementa con un `INSERT ... SELECT` sobre `CROSS JOIN` entre `persona` y `recurso` (producto cartesiano), agregando:

- `fecha_yhora_entrada`
- `fecha_yhora_salida`
- `host`

Ademas, el script esta hecho para no duplicar pares ya existentes (`NOT EXISTS` por `(persona_id, recurso_id)`).

Script:

- `sql/resolucion/02_b_carga_cartesiana_seguimiento.sql`

Resultado esperado:

- cantidad de filas en `seguimiento_acceso` cercana a `count(persona) * count(recurso)` (exacta si no habia datos previos por par).

## c) Observar y analizar estadisticas en catalogo

Se consulta:

- `pg_class` (estimaciones del planner por tabla: `reltuples`, `relpages`);
- `pg_stat_user_tables` (actividad de tablas: scans, inserts, updates, etc.);
- `pg_stats` (estadisticas por columna: `null_frac`, `n_distinct`, histograma, MCV).

Antes de consultar, el script ejecuta `ANALYZE` para tener estadisticas recientes.

Script:

- `sql/resolucion/03_c_catalogo_estadisticas.sql`

## d) Consulta por fecha, plan y mejora

Consulta del enunciado (adaptada a nombres reales de columna en PostgreSQL):

```sql
SELECT *
FROM seguimiento_acceso
WHERE fecha_yhora_entrada = TIMESTAMP '2023-05-06 00:00:00';
```

### d.a Plan de ejecucion

Se obtiene con:

```sql
EXPLAIN (ANALYZE, BUFFERS) ...
```

Inicialmente, segun cardinalidad/estadisticas, puede aparecer `Seq Scan`.

### d.b Mejora de performance y cambio de plan

Se crea indice B-Tree sobre la columna filtrada y se actualizan estadisticas:

- `CREATE INDEX ... ON seguimiento_acceso(fecha_yhora_entrada)`
- `ANALYZE seguimiento_acceso`

Luego se repite `EXPLAIN (ANALYZE, BUFFERS)` para observar cambio de plan
(habitualmente a `Index Scan` o `Bitmap Index/Heap Scan`, segun selectividad).

Script:

- `sql/resolucion/04_d_plan_fecha_y_mejora.sql`

## e) NATURAL JOIN, analisis de plan y cambio a Merge Join

Consulta base:

```sql
SELECT *
FROM seguimiento_acceso NATURAL JOIN persona;
```

### e.a Analisis

Con `EXPLAIN (ANALYZE, BUFFERS)` normalmente se observa `Hash Join` para este caso.

### e.b Modificacion para usar Merge Join

Se propone:

1. Crear indice sobre `seguimiento_acceso(persona_id)` (la tabla `persona` ya tiene PK en `persona_id`).
2. Reescribir la consulta con join explicito por clave y ordenar por esa clave:

```sql
SELECT sa.*, p.*
FROM seguimiento_acceso sa
JOIN persona p
  ON sa.persona_id = p.persona_id
ORDER BY sa.persona_id;
```

Con ese contexto, el optimizador suele preferir `Merge Join`.
Si en tu instancia sigue eligiendo `Hash Join`, para una verificacion academica se puede forzar en sesion:

```sql
SET enable_hashjoin = off;
... EXPLAIN ...
RESET enable_hashjoin;
```

Script:

- `sql/resolucion/05_e_join_y_merge_join.sql`

## Ejecucion sugerida (de punta a punta)

Desde la raiz del repo:

```bash
psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/01_a_carga_base.sql
psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/02_b_carga_cartesiana_seguimiento.sql
psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/03_c_catalogo_estadisticas.sql
psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/04_d_plan_fecha_y_mejora.sql
psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/05_e_join_y_merge_join.sql
```
