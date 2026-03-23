# Práctico 02 - DCL

## Ejercicio 4 (Oracle XE 10g/11g - sqlplus)

Base usada: esquema del ejercicio 1.c de la práctica 1 (`PRACTICO1C`), con tablas `CLIENTE`, `CATEGORIA`, `TALLER`, `AUTOMOVIL`, `ACCIDENTE`.

Objetivo: crear `empleado1`, `empleado2`, `director`; crear rol `empleados`; asignar privilegios pedidos; forzar cambio de password a `empleado1`; limitar `director` a 20 minutos de conexión.

### Nota importante sobre Oracle y columnas de `cliente`

Oracle no soporta `GRANT SELECT(col1, col2, ...)` sobre tabla como en otros motores. Para cumplir el inciso de `empleado2` (apellido, nombre, dirección) y poder delegarlo, se crea una vista con esas columnas y se otorga `SELECT ... WITH GRANT OPTION` sobre esa vista.

## 1) Bloque de administración (conectar como SYS)

Entrar por `sqlplus` como SYSDBA y ejecutar:

```sql
-- sqlplus / as sysdba

-- (opcional) habilitar control de perfiles por tiempo/recursos
ALTER SYSTEM SET RESOURCE_LIMIT = TRUE;

-- Limpieza opcional para re-ejecutar
BEGIN
  EXECUTE IMMEDIATE 'DROP USER empleado1 CASCADE';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -1918 THEN RAISE; END IF;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP USER empleado2 CASCADE';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -1918 THEN RAISE; END IF;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP USER director CASCADE';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -1918 THEN RAISE; END IF;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP ROLE empleados';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -1919 THEN RAISE; END IF;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP PROFILE director_profile';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -2380 THEN RAISE; END IF;
END;
/

-- Crear usuarios
CREATE USER empleado1 IDENTIFIED BY "Empleado1_2026!"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 5M ON users;

CREATE USER empleado2 IDENTIFIED BY "Empleado2_2026!"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 5M ON users;

CREATE USER director IDENTIFIED BY "Director_2026!"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 5M ON users;

-- Crear rol empleados
CREATE ROLE empleados;

-- Permiso de conexión
GRANT CREATE SESSION TO empleado1, empleado2, director;

-- Asignar rol a empleado1 y empleado2
GRANT empleados TO empleado1, empleado2;

-- empleado1 debe renovar su password al primer login
ALTER USER empleado1 PASSWORD EXPIRE;

-- Perfil para director con máximo 20 minutos conectados
CREATE PROFILE director_profile LIMIT
  CONNECT_TIME 20;

ALTER USER director PROFILE director_profile;
```

## 2) Bloque de privilegios sobre objetos (conectar como PRACTICO1C)

Conectar ahora como dueño del esquema (`PRACTICO1C`) y ejecutar:

```sql
-- sqlplus practico1c/practico1c

-- El rol empleados puede consultar AUTOMOVIL y CATEGORIA
GRANT SELECT ON automovil TO empleados;
GRANT SELECT ON categoria TO empleados;

-- director puede consultar todas las tablas del esquema PRACTICO1C
BEGIN
  FOR t IN (SELECT table_name FROM user_tables) LOOP
    EXECUTE IMMEDIATE 'GRANT SELECT ON ' || t.table_name || ' TO director';
  END LOOP;
END;
/

-- empleado1 puede insertar, actualizar y borrar en ACCIDENTE
GRANT INSERT, UPDATE, DELETE ON accidente TO empleado1;

-- empleado2: consulta apellido, nombre, direccion y puede delegar
CREATE OR REPLACE VIEW vw_cliente_datos AS
SELECT apellido, nombre, direccion
FROM cliente;

GRANT SELECT ON vw_cliente_datos TO empleado2 WITH GRANT OPTION;
```

## 3) Verificación (desde SYS o usuario con vistas DBA_*)

```sql
-- Usuarios creados
SELECT username, account_status, profile
FROM dba_users
WHERE username IN ('EMPLEADO1', 'EMPLEADO2', 'DIRECTOR')
ORDER BY username;

-- Rol empleados creado
SELECT role
FROM dba_roles
WHERE role = 'EMPLEADOS';

-- Membresía del rol
SELECT grantee, granted_role
FROM dba_role_privs
WHERE grantee IN ('EMPLEADO1', 'EMPLEADO2', 'DIRECTOR')
ORDER BY grantee, granted_role;

-- Privilegios del rol empleados
SELECT grantee, owner, table_name, privilege
FROM dba_tab_privs
WHERE grantee = 'EMPLEADOS'
  AND owner = 'PRACTICO1C'
ORDER BY table_name, privilege;

-- Privilegios directos de empleado1 y director
SELECT grantee, owner, table_name, privilege
FROM dba_tab_privs
WHERE grantee IN ('EMPLEADO1', 'DIRECTOR')
  AND owner = 'PRACTICO1C'
ORDER BY grantee, table_name, privilege;

-- Vista para empleado2 y capacidad de delegar
SELECT grantee, owner, table_name, privilege, grantable
FROM dba_tab_privs
WHERE grantee = 'EMPLEADO2'
  AND owner = 'PRACTICO1C'
  AND table_name = 'VW_CLIENTE_DATOS';

-- Columna de perfil (20 min) para director
SELECT profile, resource_name, limit
FROM dba_profiles
WHERE profile = 'DIRECTOR_PROFILE'
  AND resource_name = 'CONNECT_TIME';
```

## Resultado esperado por inciso

- `empleado1` y `empleado2` tienen el rol `empleados`.
- Rol `empleados`: `SELECT` sobre `AUTOMOVIL` y `CATEGORIA`.
- `empleado1`: `INSERT`, `UPDATE`, `DELETE` sobre `ACCIDENTE` + password expirada para cambio obligatorio.
- `empleado2`: `SELECT` sobre `VW_CLIENTE_DATOS` (apellido, nombre, dirección) con `WITH GRANT OPTION`.
- `director`: `SELECT` sobre todas las tablas del esquema `PRACTICO1C` + perfil `DIRECTOR_PROFILE` con `CONNECT_TIME=20`.

## Bloque único (si querés correr todo de una)

1. Conectado como `SYS`, ejecutar la sección **1) Bloque de administración**.
2. Conectado como `PRACTICO1C`, ejecutar la sección **2) Bloque de privilegios sobre objetos**.
3. Volver a `SYS` y ejecutar **3) Verificación**.
