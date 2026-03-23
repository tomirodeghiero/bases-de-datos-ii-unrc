# Práctico 02 - DCL

## Ejercicio 1 (MySQL 8+)

Base usada: `practico1a_mysql` (la del ejercicio 1.a del práctico 1).

Objetivo: crear `vendedor1`, `vendedor2` y `administrador` con los privilegios pedidos, verificarlos y finalmente revocar todo a `vendedor2`.

### Cómo iniciar sesión en MySQL y usar la base

Desde terminal:

```bash
mysql -u root -p
```

Si querés indicar host/puerto explícitamente:

```bash
mysql -h localhost -P 3306 -u root -p
```

Una vez dentro del cliente MySQL:

```sql
SHOW DATABASES;
USE practico1a_mysql;
SELECT DATABASE(), CURRENT_USER();
```

También podés entrar directo a esa base:

```bash
mysql -u root -p practico1a_mysql
```

Para probar con un usuario del ejercicio:

```bash
mysql -u vendedor1 -p
```

Luego:

```sql
USE practico1a_mysql;
```

### 1) Crear usuarios

```sql
CREATE USER IF NOT EXISTS 'vendedor1'@'localhost' IDENTIFIED BY 'Vendedor1_2026!';
CREATE USER IF NOT EXISTS 'vendedor2'@'localhost' IDENTIFIED BY 'Vendedor2_2026!';
CREATE USER IF NOT EXISTS 'administrador'@'localhost' IDENTIFIED BY 'Admin_2026!';
```

### 2) Otorgar privilegios solicitados

```sql
-- a) vendedor1: puede INSERT en cliente (sin grant option)
GRANT INSERT ON practico1a_mysql.cliente TO 'vendedor1'@'localhost';

-- b) vendedor2: INSERT en factura + SELECT de los campos de producto
GRANT INSERT ON practico1a_mysql.factura TO 'vendedor2'@'localhost';
GRANT SELECT (cod_producto, descripcion, precio, stock_minimo, stock_maximo, cantidad)
ON practico1a_mysql.producto
TO 'vendedor2'@'localhost';

-- c) administrador: UPDATE solo del campo descripcion en producto,
--    pudiendo otorgar ese privilegio a otros
GRANT UPDATE (descripcion)
ON practico1a_mysql.producto
TO 'administrador'@'localhost'
WITH GRANT OPTION;

-- d) todos pueden DELETE en cliente
GRANT DELETE ON practico1a_mysql.cliente
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost', 'administrador'@'localhost';
```

### 3) Verificación de privilegios

```sql
SHOW GRANTS FOR 'vendedor1'@'localhost';
SHOW GRANTS FOR 'vendedor2'@'localhost';
SHOW GRANTS FOR 'administrador'@'localhost';
```

Pruebas esperadas rápidas:

- `vendedor1`: `INSERT` en `cliente` OK, `GRANT ...` falla, `DELETE` en `cliente` OK.
- `vendedor2`: `INSERT` en `factura` OK, `SELECT` en `producto` OK, `DELETE` en `cliente` OK.
- `administrador`: `UPDATE descripcion` en `producto` OK y puede delegar ese permiso (`WITH GRANT OPTION`).

### 4) Revocar todos los privilegios de vendedor2

```sql
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'vendedor2'@'localhost';
SHOW GRANTS FOR 'vendedor2'@'localhost';
```

Después del `REVOKE`, `vendedor2` debería quedar solo con `USAGE` (sin permisos efectivos sobre tablas).

## Comentario de entrega

La resolución cumple exactamente con los incisos (a)-(f):

- `vendedor1` inserta en `cliente` y no puede delegar.
- `vendedor2` inserta en `factura`, consulta `producto`, y al final se le revoca todo.
- `administrador` actualiza solo `descripcion` y sí puede delegar ese privilegio.
- Los tres usuarios pueden borrar en `cliente`.
