# Práctico 02 - DCL

## Ejercicio 3 (PostgreSQL 15+)

Este ejercicio se trabaja en PostgreSQL sobre el esquema `practico1c` definido en el inciso c del práctico 1 (`cliente`, `categoria`, `taller`, `automovil`, `accidente`). A diferencia del primer ejercicio, acá entra en juego el modelo de roles de PostgreSQL: en este motor no existe una distinción real entre "usuario" y "rol", ya que ambos son entidades del sistema y la única diferencia operativa es si el rol puede iniciar sesión (`LOGIN`) o no.

Esta característica permite resolver con naturalidad el pedido del enunciado: se crea un rol común `empleado` sin posibilidad de login, se le otorgan los permisos compartidos por todos los usuarios y luego se hace que `asesor`, `administrativo` y `encargado` (que sí tienen `LOGIN`) hereden de él.

### Pre-chequeo (antes de los grants)

Antes de otorgar privilegios conviene confirmar que el esquema y las tablas existen:

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'practico1c';

SELECT tablename
FROM pg_tables
WHERE schemaname = 'practico1c'
ORDER BY tablename;
```

Si el esquema `practico1c` no aparece, hay que crear primero la estructura del práctico 1 inciso c en PostgreSQL.

### 1) Crear el rol común y los usuarios

El rol `empleado` se declara como `NOLOGIN`: no se usa para iniciar sesión, sino como contenedor de privilegios compartidos. Las tres cuentas que sí pueden conectarse (`asesor`, `administrativo`, `encargado`) se crean con `LOGIN` y, mediante `GRANT empleado TO ...`, heredan automáticamente lo que se otorgue al rol común.

```sql
-- Limpieza opcional para re-ejecutar el script de manera segura
DROP ROLE IF EXISTS asesor;
DROP ROLE IF EXISTS administrativo;
DROP ROLE IF EXISTS encargado;
DROP ROLE IF EXISTS empleado;

-- Rol común sin posibilidad de iniciar sesión: actúa como agrupador de permisos
CREATE ROLE empleado NOLOGIN;

-- Usuarios reales: roles con LOGIN y contraseña
CREATE ROLE asesor LOGIN PASSWORD 'Asesor_2026!';
CREATE ROLE administrativo LOGIN PASSWORD 'Administrativo_2026!';
CREATE ROLE encargado LOGIN PASSWORD 'Encargado_2026!';

-- Inciso a): todos los usuarios pertenecen al rol empleado
GRANT empleado TO asesor, administrativo, encargado;
```

### 2) Otorgar privilegios del enunciado

Los privilegios se otorgan en el orden lógico del enunciado. Lo que es común a todos se asigna al rol `empleado`; lo específico se otorga directamente a cada usuario, que igual mantiene la herencia del rol.

```sql
-- a) empleado: SELECT a nivel de columnas (apellido, nombre) en cliente.
--    Se otorga al rol y, por herencia, todos los usuarios pueden ejecutar la consulta.
GRANT SELECT (apellido, nombre)
ON practico1c.cliente
TO empleado;

-- b) asesor: además de lo de empleado, puede consultar taller e insertar en accidente.
GRANT SELECT ON practico1c.taller TO asesor;
GRANT INSERT ON practico1c.accidente TO asesor;

-- c) administrativo: SELECT sobre la tabla automovil.
GRANT SELECT ON practico1c.automovil TO administrativo;

-- d) encargado: DELETE sobre todas las tablas del esquema y UPDATE solo de la columna
--    tasa en categoria. ALL TABLES IN SCHEMA es un atajo cómodo para no listar tabla
--    por tabla.
GRANT DELETE ON ALL TABLES IN SCHEMA practico1c TO encargado;
GRANT UPDATE (tasa) ON practico1c.categoria TO encargado;
```

### 3) Comprobación de permisos

PostgreSQL no tiene un único `SHOW GRANTS` como MySQL, así que la verificación se arma combinando varias consultas al diccionario y funciones del estilo `has_table_privilege` / `has_column_privilege`. La idea es chequear tres cosas: que los roles existen y saber cuáles pueden iniciar sesión, que la membresía al rol `empleado` quedó bien establecida, y que cada privilegio puntual está efectivamente otorgado.

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

A modo de resumen, los permisos efectivos que debería ver cada rol después de ejecutar todos los `GRANT` son:

- `empleado`: `SELECT(apellido, nombre)` sobre `practico1c.cliente`. Todo lo demás se hereda hacia los tres usuarios.
- `asesor`: lo heredado de `empleado` más `SELECT` sobre `practico1c.taller` e `INSERT` sobre `practico1c.accidente`.
- `administrativo`: lo heredado de `empleado` más `SELECT` sobre `practico1c.automovil`.
- `encargado`: lo heredado de `empleado` más `DELETE` sobre todas las tablas del esquema `practico1c` y `UPDATE(tasa)` sobre `practico1c.categoria`.

## Bloque único (ejecución directa)

El siguiente bloque concentra todo el ejercicio en un solo script, útil cuando se quiere reproducir la resolución desde cero.

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
