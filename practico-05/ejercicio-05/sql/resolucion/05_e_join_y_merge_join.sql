-- Ejercicio 5.e
-- Consulta base con NATURAL JOIN y propuesta para obtener Merge Join.

-- e.a) Plan de la consulta original
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM seguimiento_acceso NATURAL JOIN persona;

-- e.b) Ajustes para favorecer Merge Join
-- (persona.persona_id ya esta indexada por PK en script base).
CREATE INDEX IF NOT EXISTS idx_seguimiento_acceso_persona_id
    ON seguimiento_acceso (persona_id);

ANALYZE persona;
ANALYZE seguimiento_acceso;

-- Reescritura recomendada: join explicito + orden por clave de join.
-- Con los indices suele ser suficiente para que el optimizador elija Merge Join.
EXPLAIN (ANALYZE, BUFFERS)
SELECT sa.*, p.*
FROM seguimiento_acceso sa
JOIN persona p
  ON sa.persona_id = p.persona_id
ORDER BY sa.persona_id;

-- Si en tu entorno aun aparece Hash Join, en practica academica se puede forzar
-- en la sesion deshabilitando hash join:
SET enable_hashjoin = off;

EXPLAIN (ANALYZE, BUFFERS)
SELECT sa.*, p.*
FROM seguimiento_acceso sa
JOIN persona p
  ON sa.persona_id = p.persona_id
ORDER BY sa.persona_id;

RESET enable_hashjoin;
