-- Ejercicio 5.c
-- Observacion y analisis de estadisticas de catalogo en PostgreSQL.

-- Asegura estadisticas recientes del planner.
ANALYZE persona;
ANALYZE recurso;
ANALYZE seguimiento_acceso;

-- Estadisticas por tabla (estimaciones del planner).
SELECT
    n.nspname AS schema_name,
    c.relname AS tabla,
    c.reltuples::bigint AS filas_estimadas,
    c.relpages AS paginas_estimadas
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n
  ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = ANY (current_schemas(false))
  AND c.relname IN ('persona', 'recurso', 'seguimiento_acceso')
ORDER BY c.relname;

-- Estadisticas de actividad de tablas.
SELECT
    schemaname,
    relname,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_analyze
FROM pg_stat_user_tables
WHERE relname IN ('persona', 'recurso', 'seguimiento_acceso')
ORDER BY relname;

-- Estadisticas por atributo.
SELECT
    schemaname,
    tablename,
    attname,
    null_frac,
    n_distinct,
    avg_width,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE schemaname = ANY (current_schemas(false))
  AND tablename IN ('persona', 'recurso', 'seguimiento_acceso')
ORDER BY tablename, attname;
