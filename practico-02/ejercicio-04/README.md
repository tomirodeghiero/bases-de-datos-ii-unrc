# Práctico 02 - DCL

## Ejercicio 4 (Oracle XE 10g/11g - sqlplus)

Este último ejercicio del práctico se resuelve sobre el esquema `PRACTICO1C` (el del ejercicio 1.c del práctico 1, con `CLIENTE`, `CATEGORIA`, `TALLER`, `AUTOMOVIL` y `ACCIDENTE`) y trabaja específicamente con las particularidades del modelo de seguridad de Oracle.

Hay que dar de alta tres usuarios (`empleado1`, `empleado2` y `director`), crear el rol `empleados` y asignárselo a los dos primeros, otorgar los privilegios sobre objetos pedidos en cada inciso, forzar a `empleado1` a renovar su contraseña en el primer inicio de sesión y limitar a `director` a un máximo de 20 minutos de conexión continua. Esto último se logra con un `PROFILE` de Oracle, un mecanismo específico del motor para imponer restricciones sobre recursos y contraseñas.

### Nota importante sobre Oracle y columnas de `cliente`

A diferencia de MySQL o PostgreSQL, Oracle no admite `GRANT SELECT(col1, col2, ...)` directamente sobre una tabla. Para cumplir el pedido del inciso de `empleado2` (consultar `apellido`, `nombre` y `direccion` de `cliente` y poder delegar ese privilegio), se crea una vista con exactamente esas columnas y se otorga `SELECT ... WITH GRANT OPTION` sobre la vista. Es la solución idiomática en Oracle: la vista actúa como una proyección controlada de la tabla y el `WITH GRANT OPTION` queda acotado a esa proyección.

## 1) Bloque de administración (conectar como SYS)

La parte de creación de usuarios, roles y perfiles se ejecuta con privilegios de administrador, así que conviene ingresar por `sqlplus` como `SYSDBA`. La instrucción `ALTER SYSTEM SET RESOURCE_LIMIT = TRUE` es necesaria para que Oracle aplique los límites declarados en los perfiles (por defecto, los profiles existen pero no se hacen efectivos hasta que el parámetro está activo).

```sql
-- sqlplus / as sysdba

-- Habilitar la aplicación de límites de recursos definidos en los perfiles.
-- Sin esta línea, CONNECT_TIME no surte efecto sobre director.
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

-- Creación de los tres usuarios. Se les asigna tablespace por defecto y temporal,
-- más una cuota mínima en USERS por si llegan a crear objetos propios.
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

-- Rol que agrupa los privilegios comunes a empleado1 y empleado2.
CREATE ROLE empleados;

-- Privilegio de sistema necesario para iniciar sesión: sin CREATE SESSION
-- la cuenta existe pero no puede conectarse al motor.
GRANT CREATE SESSION TO empleado1, empleado2, director;

-- Asignación del rol a los dos empleados (director queda fuera, como pide el enunciado).
GRANT empleados TO empleado1, empleado2;

-- Para forzar a empleado1 a renovar su contraseña en el primer login,
-- se marca la actual como expirada.
ALTER USER empleado1 PASSWORD EXPIRE;

-- Perfil que limita a 20 minutos el tiempo total de conexión continua.
-- En Oracle, CONNECT_TIME se mide en minutos.
CREATE PROFILE director_profile LIMIT
  CONNECT_TIME 20;

ALTER USER director PROFILE director_profile;
```

## 2) Bloque de privilegios sobre objetos (conectar como PRACTICO1C)

Los `GRANT` sobre tablas y vistas deben ejecutarse desde el dueño del esquema, ya que es quien tiene autoridad para entregar privilegios sobre sus propios objetos. Por eso, se cambia de sesión al usuario `PRACTICO1C`.

```sql
-- sqlplus practico1c/practico1c

-- El rol empleados consulta AUTOMOVIL y CATEGORIA. Como el rol ya está asignado a
-- empleado1 y empleado2, el privilegio se hereda automáticamente a ambos.
GRANT SELECT ON automovil TO empleados;
GRANT SELECT ON categoria TO empleados;

-- director debe poder consultar todas las tablas del esquema. Para no listarlas a
-- mano, se itera sobre user_tables y se otorga SELECT dinámicamente.
BEGIN
  FOR t IN (SELECT table_name FROM user_tables) LOOP
    EXECUTE IMMEDIATE 'GRANT SELECT ON ' || t.table_name || ' TO director';
  END LOOP;
END;
/

-- empleado1: privilegios DML completos sobre accidente (sin SELECT directo, ya que
-- ese acceso queda cubierto por el rol "empleados" sobre las tablas pedidas).
GRANT INSERT, UPDATE, DELETE ON accidente TO empleado1;

-- empleado2: vista que expone exactamente apellido, nombre y direccion de cliente.
-- Después se otorga SELECT sobre la vista con WITH GRANT OPTION para que pueda
-- delegar el privilegio, tal como pide el enunciado.
CREATE OR REPLACE VIEW vw_cliente_datos AS
SELECT apellido, nombre, direccion
FROM cliente;

GRANT SELECT ON vw_cliente_datos TO empleado2 WITH GRANT OPTION;
```

## 3) Verificación (desde SYS o un usuario con acceso a las vistas DBA_*)

La verificación se hace combinando varias vistas del diccionario de Oracle. Cada una mira un aspecto puntual: existencia de usuarios y rol, membresía al rol, privilegios directos sobre objetos, capacidad de delegar y configuración del perfil de `director`.

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

A modo de resumen, después de ejecutar todos los bloques anteriores se debería observar lo siguiente:

- `empleado1` y `empleado2` aparecen con el rol `empleados` asignado.
- El rol `empleados` tiene `SELECT` sobre `AUTOMOVIL` y `CATEGORIA`, privilegios que se heredan a ambos usuarios.
- `empleado1` cuenta con `INSERT`, `UPDATE` y `DELETE` directos sobre `ACCIDENTE`, y su contraseña queda marcada como expirada (`account_status = EXPIRED`), forzando el cambio en el primer ingreso.
- `empleado2` tiene `SELECT` sobre `VW_CLIENTE_DATOS` (apellido, nombre, dirección) con `GRANTABLE = YES`, lo que confirma la posibilidad de delegar.
- `director` queda con `SELECT` sobre todas las tablas del esquema `PRACTICO1C` y con el perfil `DIRECTOR_PROFILE`, donde `CONNECT_TIME = 20`.

## Cómo correr todo el flujo de una vez

Como las distintas operaciones requieren contextos de conexión diferentes, no hay un único bloque "ejecutable de una": el script se ordena en tres etapas y cada una se conecta con el usuario que corresponde.

1. Conectado como `SYS`, ejecutar la sección **1) Bloque de administración**.
2. Conectado como `PRACTICO1C`, ejecutar la sección **2) Bloque de privilegios sobre objetos**.
3. Volver a `SYS` y ejecutar la sección **3) Verificación**.
