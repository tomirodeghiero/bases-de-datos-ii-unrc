-- Ejercicio 5.b
-- Inserta al menos 1 registro en seguimiento_acceso por cada par persona-recurso
-- (producto cartesiano persona x recurso), con fecha/hora de acceso.
--
-- Nota: es idempotente por par (persona_id, recurso_id):
-- no vuelve a insertar un par que ya exista.

WITH pares AS (
    SELECT
        p.persona_id,
        r."RECURSO_ID" AS recurso_id,
        row_number() OVER (ORDER BY p.persona_id, r."RECURSO_ID") AS rn
    FROM persona p
    CROSS JOIN recurso r
),
faltantes AS (
    SELECT pa.*
    FROM pares pa
    WHERE NOT EXISTS (
        SELECT 1
        FROM seguimiento_acceso s
        WHERE s.persona_id = pa.persona_id
          AND s.recurso_id = pa.recurso_id
    )
)
INSERT INTO seguimiento_acceso
    (fecha_yhora_entrada, fecha_yhora_salida, host, persona_id, recurso_id)
SELECT
    TIMESTAMP '2023-05-01 00:00:00'
        + ((rn % 30) * INTERVAL '1 day')
        + ((rn % 86400) * INTERVAL '1 second') AS fecha_yhora_entrada,
    TIMESTAMP '2023-05-01 00:20:00'
        + ((rn % 30) * INTERVAL '1 day')
        + ((rn % 86400) * INTERVAL '1 second') AS fecha_yhora_salida,
    'host-' || ((rn % 10) + 1) AS host,
    persona_id,
    recurso_id
FROM faltantes;

-- Verificaciones de consistencia
SELECT
    (SELECT count(*) FROM persona) AS cant_persona,
    (SELECT count(*) FROM recurso) AS cant_recurso,
    (SELECT count(*) FROM persona) * (SELECT count(*) FROM recurso) AS producto_esperado,
    (SELECT count(*) FROM seguimiento_acceso) AS filas_seguimiento;

-- Si esta consulta devuelve filas, hay pares duplicados.
SELECT persona_id, recurso_id, count(*) AS repeticiones
FROM seguimiento_acceso
GROUP BY persona_id, recurso_id
HAVING count(*) > 1
ORDER BY repeticiones DESC, persona_id, recurso_id
LIMIT 20;
