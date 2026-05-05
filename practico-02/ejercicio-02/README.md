# Práctico 02 - DCL

## Ejercicio 2 (MySQL 8+)

Este ejercicio se resuelve sobre la base `practico1b_mysql`, definida en el inciso b del práctico 1 (vehículos, parquímetros, estacionamiento). Lo característico de este caso, además de los privilegios sobre tablas, es que el enunciado pide controlar desde dónde puede conectarse cada usuario y limitar el consumo de recursos del `cobrador`.

El plan es crear `encargado_estacionamiento` con acceso restringido al servidor local, dar de alta a `cobrador` con conexión desde cualquier host, otorgar a cada uno los privilegios pedidos, dejar configurados los límites de conexiones/consultas por hora del `cobrador`, verificar que todo quedó bien aplicado y, finalmente, revocar el permiso de consulta del `cobrador`.

### Pre-chequeo (antes de los grants)

```sql
SHOW DATABASES;
```

Si la base `practico1b_mysql` no aparece en la lista, hay que crearla previamente siguiendo el DDL del práctico 1, inciso b:

- `practico-01/ejercicio-01/README.md` (sección **MySQL 8+** del inciso b).

### 1) Crear usuarios con el alcance de host pedido

La parte del nombre que sigue al `@` define el host desde el cual el usuario puede iniciar sesión. Eso es lo que permite restringir la conexión del `encargado_estacionamiento` al servidor local y, en cambio, dejar al `cobrador` con acceso desde cualquier máquina mediante el comodín `'%'`.

```sql
-- Limpieza opcional para re-ejecutar el script de manera idempotente
DROP USER IF EXISTS 'encargado_estacionamiento'@'localhost';
DROP USER IF EXISTS 'cobrador'@'%';

-- encargado_estacionamiento: solo se conecta desde localhost
CREATE USER 'encargado_estacionamiento'@'localhost'
IDENTIFIED BY 'Encargado_2026!';

-- cobrador: puede conectarse desde cualquier máquina
CREATE USER 'cobrador'@'%'
IDENTIFIED BY 'Cobrador_2026!';
```

### 2) Otorgar privilegios del enunciado

Cada `GRANT` traduce un inciso del enunciado, y los límites del `cobrador` se configuran con `ALTER USER ... WITH`, que es la forma idiomática en MySQL 8 para fijar cuotas de uso por hora.

```sql
-- a) cobrador: solo SELECT sobre estacionamiento
GRANT SELECT ON practico1b_mysql.estacionamiento
TO 'cobrador'@'%';

-- Límites de recursos: 3 conexiones/hora y 10 consultas/hora.
-- Se aplican a la cuenta, no al privilegio en particular.
ALTER USER 'cobrador'@'%'
WITH
  MAX_CONNECTIONS_PER_HOUR 3
  MAX_QUERIES_PER_HOUR 10;

-- b) encargado_estacionamiento: SELECT en todas las tablas e INSERT en parquímetro.
--    El primer GRANT usa "*" para abarcar el esquema completo, y el segundo se acota
--    a una sola tabla.
GRANT SELECT ON practico1b_mysql.*
TO 'encargado_estacionamiento'@'localhost';

GRANT INSERT ON practico1b_mysql.parquimetro
TO 'encargado_estacionamiento'@'localhost';
```

### 3) Comprobación de permisos y accesos (inciso c)

La verificación se realiza en dos planos: por un lado los privilegios efectivos sobre objetos, y por otro la configuración de la cuenta (host y límites de recursos).

```sql
-- Permisos efectivos sobre objetos
SHOW GRANTS FOR 'cobrador'@'%';
SHOW GRANTS FOR 'encargado_estacionamiento'@'localhost';

-- Definición de la cuenta: incluye host de origen y límites declarados
SHOW CREATE USER 'cobrador'@'%';
SHOW CREATE USER 'encargado_estacionamiento'@'localhost';
```

La verificación se considera correcta cuando se observa lo siguiente:

- `cobrador@'%'` aparece con `SELECT` sobre `practico1b_mysql.estacionamiento`.
- `cobrador@'%'` muestra `MAX_CONNECTIONS_PER_HOUR 3` y `MAX_QUERIES_PER_HOUR 10` en `SHOW CREATE USER`.
- `encargado_estacionamiento@'localhost'` figura con `SELECT` sobre `practico1b_mysql.*` y con `INSERT` sobre `parquimetro`.

### 4) Revocar el privilegio de consulta del cobrador (inciso d)

```sql
REVOKE SELECT ON practico1b_mysql.estacionamiento
FROM 'cobrador'@'%';

SHOW GRANTS FOR 'cobrador'@'%';
```

Tras el `REVOKE`, la cuenta del `cobrador` y sus límites de recursos siguen vigentes, pero ya no tiene acceso de lectura a `estacionamiento`. El `SHOW GRANTS` debería devolver únicamente `USAGE`, lo que confirma que el único permiso pedido en el inciso a) fue retirado correctamente.

## Bloque único (ejecución directa)

Para correr todo el flujo del ejercicio en una sola pasada, se concentra el script completo a continuación. Es útil cuando se quiere reproducir el resultado desde cero, por ejemplo para una entrega o una corrección.

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
