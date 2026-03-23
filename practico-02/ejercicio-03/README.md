# Práctico 02 - DCL

## Ejercicio 3 (PostgreSQL 15+)

Base usada: esquema `practico1c` (inciso c del práctico 1: `cliente`, `categoria`, `taller`, `automovil`, `accidente`).

Objetivo: crear los usuarios `asesor`, `administrativo` y `encargado`, asignarlos al rol `empleado`, y otorgar los privilegios pedidos.

### Pre-chequeo (antes de grants)

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'practico1c';

SELECT tablename
FROM pg_tables
WHERE schemaname = 'practico1c'
ORDER BY tablename;
```

Si no aparece `practico1c`, primero crear la estructura del práctico 1 inciso c (PostgreSQL).

### 1) Crear rol común y usuarios

```sql
-- Limpieza opcional para re-ejecutar el script
DROP ROLE IF EXISTS asesor;
DROP ROLE IF EXISTS administrativo;
DROP ROLE IF EXISTS encargado;
DROP ROLE IF EXISTS empleado;

-- Rol común (sin login)
CREATE ROLE empleado NOLOGIN;

-- Usuarios (roles con login)
CREATE ROLE asesor LOGIN PASSWORD 'Asesor_2026!';
CREATE ROLE administrativo LOGIN PASSWORD 'Administrativo_2026!';
CREATE ROLE encargado LOGIN PASSWORD 'Encargado_2026!';

-- a) Todos pertenecen al rol empleado
GRANT empleado TO asesor, administrativo, encargado;
```

### 2) Otorgar privilegios del enunciado

```sql
-- a) empleado: puede consultar apellido y nombre de cliente
GRANT SELECT (apellido, nombre)
ON practico1c.cliente
TO empleado;

-- b) asesor: además de empleado, consulta taller e inserta en accidente
GRANT SELECT ON practico1c.taller TO asesor;
GRANT INSERT ON practico1c.accidente TO asesor;

-- c) administrativo: consulta automovil
GRANT SELECT ON practico1c.automovil TO administrativo;

-- d) encargado: borrar en todas las tablas y actualizar tasa de categoria
GRANT DELETE ON ALL TABLES IN SCHEMA practico1c TO encargado;
GRANT UPDATE (tasa) ON practico1c.categoria TO encargado;
```

### 3) Comprobación de permisos

```sql
-- roles y capacidad de login
SELECT rolname, rolcanlogin
FROM pg_roles
WHERE rolname IN ('empleado', 'asesor', 'administrativo', 'encargado')
ORDER BY rolname;

-- membresía al rol empleado
SELECT r.rolname AS role, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname = 'empleado'
ORDER BY m.rolname;

-- permisos por tabla
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'practico1c'
  AND grantee IN ('empleado', 'asesor', 'administrativo', 'encargado')
ORDER BY grantee, table_name, privilege_type;

-- permisos por columna (los importantes de este ejercicio)
SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'practico1c'
  AND grantee IN ('empleado', 'encargado')
  AND (
    (table_name = 'cliente' AND column_name IN ('apellido', 'nombre'))
    OR
    (table_name = 'categoria' AND column_name = 'tasa')
  )
ORDER BY grantee, table_name, column_name;

-- chequeo puntual con funciones de privilegios
SELECT
  has_table_privilege('asesor', 'practico1c.taller', 'SELECT') AS asesor_select_taller,
  has_table_privilege('asesor', 'practico1c.accidente', 'INSERT') AS asesor_insert_accidente,
  has_table_privilege('administrativo', 'practico1c.automovil', 'SELECT') AS administrativo_select_automovil,
  has_table_privilege('encargado', 'practico1c.cliente', 'DELETE') AS encargado_delete_cliente,
  has_column_privilege('encargado', 'practico1c.categoria', 'tasa', 'UPDATE') AS encargado_update_tasa,
  has_column_privilege('asesor', 'practico1c.cliente', 'apellido', 'SELECT') AS asesor_select_apellido_via_empleado,
  has_column_privilege('administrativo', 'practico1c.cliente', 'nombre', 'SELECT') AS administrativo_select_nombre_via_empleado;
```

### Resultado esperado por inciso

- `empleado`: `SELECT(apellido, nombre)` en `practico1c.cliente`.
- `asesor`: hereda lo de `empleado` + `SELECT` en `practico1c.taller` + `INSERT` en `practico1c.accidente`.
- `administrativo`: hereda lo de `empleado` + `SELECT` en `practico1c.automovil`.
- `encargado`: hereda lo de `empleado` + `DELETE` en todas las tablas del esquema + `UPDATE(tasa)` en `practico1c.categoria`.

## Bloque único (ejecución directa)

```sql
DROP ROLE IF EXISTS asesor;
DROP ROLE IF EXISTS administrativo;
DROP ROLE IF EXISTS encargado;
DROP ROLE IF EXISTS empleado;

CREATE ROLE empleado NOLOGIN;
CREATE ROLE asesor LOGIN PASSWORD 'Asesor_2026!';
CREATE ROLE administrativo LOGIN PASSWORD 'Administrativo_2026!';
CREATE ROLE encargado LOGIN PASSWORD 'Encargado_2026!';

GRANT empleado TO asesor, administrativo, encargado;

GRANT SELECT (apellido, nombre) ON practico1c.cliente TO empleado;
GRANT SELECT ON practico1c.taller TO asesor;
GRANT INSERT ON practico1c.accidente TO asesor;
GRANT SELECT ON practico1c.automovil TO administrativo;
GRANT DELETE ON ALL TABLES IN SCHEMA practico1c TO encargado;
GRANT UPDATE (tasa) ON practico1c.categoria TO encargado;

SELECT rolname, rolcanlogin
FROM pg_roles
WHERE rolname IN ('empleado', 'asesor', 'administrativo', 'encargado')
ORDER BY rolname;

SELECT r.rolname AS role, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname = 'empleado'
ORDER BY m.rolname;

SELECT
  has_table_privilege('asesor', 'practico1c.taller', 'SELECT') AS asesor_select_taller,
  has_table_privilege('asesor', 'practico1c.accidente', 'INSERT') AS asesor_insert_accidente,
  has_table_privilege('administrativo', 'practico1c.automovil', 'SELECT') AS administrativo_select_automovil,
  has_table_privilege('encargado', 'practico1c.cliente', 'DELETE') AS encargado_delete_cliente,
  has_column_privilege('encargado', 'practico1c.categoria', 'tasa', 'UPDATE') AS encargado_update_tasa,
  has_column_privilege('asesor', 'practico1c.cliente', 'apellido', 'SELECT') AS asesor_select_apellido_via_empleado,
  has_column_privilege('administrativo', 'practico1c.cliente', 'nombre', 'SELECT') AS administrativo_select_nombre_via_empleado;
```
