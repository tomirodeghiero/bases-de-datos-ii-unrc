# Práctico 01 - Repaso SQL

Este práctico funciona como repaso integral de SQL: definición de esquemas con DDL, carga inicial de datos y consultas con filtros, joins y agregaciones. El objetivo no es solo escribir las sentencias, sino justificar las decisiones de modelado y dejar las bases listas para reutilizarlas en prácticos posteriores (en particular en el práctico 02 de DCL).

## Base teórica usada

- `Teorico_1_Introduccion.pdf`: presenta el marco general de la materia y los motores que la cátedra pide manejar (MySQL, PostgreSQL y Oracle XE).
- `Teorico_2_Repaso_SQL.pdf`: es la referencia principal de toda la resolución. De ahí provienen los bloques de `CREATE TABLE`, `CONSTRAINT`, `PRIMARY KEY`, `UNIQUE`, `CHECK`, `FOREIGN KEY`, `CREATE DOMAIN`, `INSERT`, `SELECT`, `GROUP BY`, `HAVING` y `ORDER BY` que se aplican a lo largo del práctico.

## Criterios de resolución

1. Cada inciso del ejercicio 1 vive en una base o esquema separado. Como varios incisos usan nombres de tablas repetidos (por ejemplo `cliente`), aislarlos en `practico1a`, `practico1b` y `practico1c` evita colisiones y permite ejecutar los scripts de manera independiente.
2. Solo se agregan restricciones `UNIQUE` cuando hay una justificación razonable desde el dominio del problema. No se inventan claves candidatas extra si el enunciado no las sugiere.
3. Ni MySQL ni Oracle implementan `CREATE DOMAIN` tal como aparece en el SQL estándar del teórico. Cuando hace falta restringir el dominio de un atributo en esos motores, se emula con la combinación de tipo de dato + `CHECK` (o `ENUM` en MySQL).
4. En Oracle XE, "crear la base" se interpreta como crear un usuario/esquema de trabajo, ya que ese motor no expone el concepto de base de datos del mismo modo que MySQL o PostgreSQL.

## Estructura

- `ejercicio-01/README.md`: DDL completo de cada inciso, con la versión específica para cada motor pedido.
- `ejercicio-02/README.md`: carga de datos coherentes para las tres bases, pensada también para soportar las consultas del ejercicio 3.
- `ejercicio-03/README.md`: consultas SQL pedidas por la cátedra más tres consultas adicionales en álgebra relacional.
