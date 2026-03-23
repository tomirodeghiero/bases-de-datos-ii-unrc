# Práctico 02 - DCL

## Ejercicio 2 (MySQL 8+)

Base usada: `practico1b_mysql` (inciso b del práctico 1: automóviles, estacionamiento, etc).

Objetivo: crear los usuarios `encargado_estacionamiento` y `cobrador` con las restricciones pedidas, verificar permisos/acceso y revocar el permiso de consulta de `cobrador`.

### Pre-chequeo (antes de grants)

```sql
SHOW DATABASES;
```

Si no existe `practico1b_mysql`, primero crear la base y tablas del práctico 1 inciso b (MySQL) desde:

- `practico-01/ejercicio-01/README.md` (sección **MySQL 8+** del inciso b).

### 1) Crear usuarios con alcance de host pedido

```sql
-- Limpieza opcional para re-ejecutar sin errores
DROP USER IF EXISTS 'encargado_estacionamiento'@'localhost';
DROP USER IF EXISTS 'cobrador'@'%';

-- encargado_estacionamiento: solo desde localhost
CREATE USER 'encargado_estacionamiento'@'localhost'
IDENTIFIED BY 'Encargado_2026!';

-- cobrador: desde cualquier máquina
CREATE USER 'cobrador'@'%'
IDENTIFIED BY 'Cobrador_2026!';
```

### 2) Otorgar privilegios del enunciado

```sql
-- a) cobrador: solo consulta de estacionamiento
GRANT SELECT ON practico1b_mysql.estacionamiento
TO 'cobrador'@'%';

-- límites: 3 conexiones/hora y 10 consultas/hora
ALTER USER 'cobrador'@'%'
WITH
  MAX_CONNECTIONS_PER_HOUR 3
  MAX_QUERIES_PER_HOUR 10;

-- b) encargado_estacionamiento: SELECT en todas las tablas + INSERT en parquimetro
GRANT SELECT ON practico1b_mysql.*
TO 'encargado_estacionamiento'@'localhost';

GRANT INSERT ON practico1b_mysql.parquimetro
TO 'encargado_estacionamiento'@'localhost';
```

### 3) Comprobación de permisos y accesos (inciso c)

```sql
-- permisos efectivos
SHOW GRANTS FOR 'cobrador'@'%';
SHOW GRANTS FOR 'encargado_estacionamiento'@'localhost';

-- validación de host + límites del usuario
SHOW CREATE USER 'cobrador'@'%';
SHOW CREATE USER 'encargado_estacionamiento'@'localhost';
```

Verificación esperada:

- `cobrador@'%'` aparece con `SELECT` sobre `practico1b_mysql.estacionamiento`.
- `cobrador@'%'` aparece con `MAX_CONNECTIONS_PER_HOUR 3` y `MAX_QUERIES_PER_HOUR 10`.
- `encargado_estacionamiento@'localhost'` aparece con `SELECT` sobre `practico1b_mysql.*` y `INSERT` sobre `parquimetro`.

### 4) Revocar el privilegio de consulta de cobrador (inciso d)

```sql
REVOKE SELECT ON practico1b_mysql.estacionamiento
FROM 'cobrador'@'%';

SHOW GRANTS FOR 'cobrador'@'%';
```

Después del `REVOKE`, `cobrador` conserva la cuenta y sus límites de recursos, pero ya no puede consultar `estacionamiento`.

## Bloque único (ejecución directa)

```sql
DROP USER IF EXISTS 'encargado_estacionamiento'@'localhost';
DROP USER IF EXISTS 'cobrador'@'%';

CREATE USER 'encargado_estacionamiento'@'localhost' IDENTIFIED BY 'Encargado_2026!';
CREATE USER 'cobrador'@'%' IDENTIFIED BY 'Cobrador_2026!';

GRANT SELECT ON practico1b_mysql.estacionamiento TO 'cobrador'@'%';
ALTER USER 'cobrador'@'%' WITH MAX_CONNECTIONS_PER_HOUR 3 MAX_QUERIES_PER_HOUR 10;

GRANT SELECT ON practico1b_mysql.* TO 'encargado_estacionamiento'@'localhost';
GRANT INSERT ON practico1b_mysql.parquimetro TO 'encargado_estacionamiento'@'localhost';

SHOW GRANTS FOR 'cobrador'@'%';
SHOW GRANTS FOR 'encargado_estacionamiento'@'localhost';
SHOW CREATE USER 'cobrador'@'%';
SHOW CREATE USER 'encargado_estacionamiento'@'localhost';

REVOKE SELECT ON practico1b_mysql.estacionamiento FROM 'cobrador'@'%';
SHOW GRANTS FOR 'cobrador'@'%';
```
