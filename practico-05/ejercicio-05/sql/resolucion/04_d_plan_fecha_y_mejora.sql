-- Ejercicio 5.d
-- Consulta pedida por enunciado y analisis de plan.
--
-- Nota importante:
-- En PostgreSQL esta tabla se creo con identificadores sin comillas,
-- por lo tanto los nombres reales quedaron en minuscula:
-- fecha_yhora_entrada (no "FECHA_YHORA_ENTRADA").

-- d.a) Plan inicial
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM seguimiento_acceso
WHERE fecha_yhora_entrada = TIMESTAMP '2023-05-06 00:00:00';

-- d.b) Mejora de performance para ese filtro puntual
CREATE INDEX IF NOT EXISTS idx_seguimiento_acceso_fecha_entrada
    ON seguimiento_acceso (fecha_yhora_entrada);

ANALYZE seguimiento_acceso;

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM seguimiento_acceso
WHERE fecha_yhora_entrada = TIMESTAMP '2023-05-06 00:00:00';

-- Variante recomendada cuando el requerimiento funcional es "todo el dia":
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM seguimiento_acceso
WHERE fecha_yhora_entrada >= DATE '2023-05-06'
  AND fecha_yhora_entrada <  DATE '2023-05-07';
