# Práctico 01 - Repaso SQL

## Base teórica usada

- `Teorico_1_Introduccion.pdf`: marco general para los motores pedidos por la catedra y el alcance de la materia.
- `Teorico_2_Repaso_SQL.pdf`: base principal de la resolucion. De ahi salen los bloques de `CREATE TABLE`, `CONSTRAINT`, `PRIMARY KEY`, `UNIQUE`, `CHECK`, `FOREIGN KEY`, `CREATE DOMAIN`, `INSERT`, `SELECT`, `GROUP BY`, `HAVING` y `ORDER BY`.

## Criterios de resolución

1. Cada inciso del ejercicio 1 vive en una base o esquema separado, porque los nombres de tablas se repiten.
2. Cuando el enunciado no define claramente una clave candidata extra, no invento `UNIQUE` arbitrarios. Solo agrego los que son razonables por negocio.
3. En MySQL y Oracle no existe `CREATE DOMAIN` como en el SQL estandar que muestra el teorico. En esos casos emulo el dominio con tipo de dato + `CHECK`.
4. Para Oracle XE, "crear la base" se interpreta como crear un usuario/esquema de trabajo.

## Estructura

- `ejercicio-01/README.md`: DDL completo por inciso y por motor.
- `ejercicio-02/README.md`: cargas de datos coherentes para las bases creadas.
- `ejercicio-03/README.md`: consultas SQL pedidas y tres consultas extra en álgebra relacional.
