-- Ejercicio 5.a
-- Crea/carga tablas base usando los scripts provistos por catedra.
-- Ejecutar este archivo desde la raiz del repo:
-- psql -h localhost -U <usuario> -d <base> -f practico-05/ejercicio-05/sql/resolucion/01_a_carga_base.sql

\i practico-05/ejercicio-05/sql/PERSONAPostgres.sql
\i practico-05/ejercicio-05/sql/RecursoPostgres.sql
\i practico-05/ejercicio-05/sql/Seguimiento_AceesoPostgres.sql

-- Verificacion minima de carga
SELECT 'persona' AS tabla, count(*) AS filas FROM persona
UNION ALL
SELECT 'recurso' AS tabla, count(*) AS filas FROM recurso
UNION ALL
SELECT 'seguimiento_acceso' AS tabla, count(*) AS filas FROM seguimiento_acceso;
