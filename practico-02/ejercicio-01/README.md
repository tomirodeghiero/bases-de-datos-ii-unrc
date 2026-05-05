# Práctico 02 - DCL

## Ejercicio 1 (MySQL 8+)

Este ejercicio trabaja sobre la base `practico1a_mysql` definida en el ejercicio 1.a del práctico 1 (clientes, productos, facturas e ítems de factura). El foco es DCL: crear cuentas de usuario y administrar sus privilegios. Concretamente, hay que dar de alta `vendedor1`, `vendedor2` y `administrador`, otorgarles los permisos que pide el enunciado, comprobar que quedaron bien aplicados y, al final, revocar todo lo que se le otorgó a `vendedor2`.

Las decisiones más relevantes desde el punto de vista de seguridad son dos: usar `WITH GRANT OPTION` solamente en el caso del administrador (porque el enunciado lo pide explícitamente) y aplicar permisos a nivel de columna en `vendedor2` y `administrador` para acotar el alcance al mínimo necesario.

### Cómo iniciar sesión en MySQL y usar la base

Las operaciones de creación de usuarios y de `GRANT` requieren un usuario con privilegios de administración (típicamente `root`). El acceso al cliente desde terminal se hace de la siguiente manera:

```bash
mysql -u root -p
```

Si conviene fijar host y puerto de manera explícita (por ejemplo, cuando hay varias instancias en la misma máquina):

```bash
mysql -h localhost -P 3306 -u root -p
```

Una vez dentro, vale la pena confirmar contra qué base se está trabajando:

```sql
SHOW DATABASES;
USE practico1a_mysql;
SELECT DATABASE(), CURRENT_USER();
```

También se puede entrar directamente apuntando a la base:

```bash
mysql -u root -p practico1a_mysql
```

Para probar los permisos efectivamente otorgados, conviene reconectarse con cada uno de los usuarios creados:

```bash
mysql -u vendedor1 -p
```

Y luego dentro de la sesión:

```sql
USE practico1a_mysql;
```

### 1) Crear usuarios

Los tres usuarios se crean con alcance `'@localhost'`, que es lo que tiene sentido en un escenario administrado desde la misma máquina. Las contraseñas se eligen suficientemente fuertes para cumplir con la política por defecto de MySQL 8 (`validate_password`).

```sql
CREATE USER IF NOT EXISTS 'vendedor1'@'localhost' IDENTIFIED BY 'Vendedor1_2026!';
CREATE USER IF NOT EXISTS 'vendedor2'@'localhost' IDENTIFIED BY 'Vendedor2_2026!';
CREATE USER IF NOT EXISTS 'administrador'@'localhost' IDENTIFIED BY 'Admin_2026!';
```

### 2) Otorgar privilegios solicitados

Cada `GRANT` traduce literalmente uno de los incisos del enunciado y se acota al mínimo necesario para evitar privilegios innecesarios.

```sql
-- a) vendedor1: puede INSERT en cliente, sin posibilidad de delegar.
--    Se omite WITH GRANT OPTION justamente porque el enunciado lo prohíbe.
GRANT INSERT ON practico1a_mysql.cliente TO 'vendedor1'@'localhost';

-- b) vendedor2: INSERT en factura y SELECT de los campos de producto.
--    Se otorga SELECT a nivel de columna, en lugar de SELECT sobre toda la tabla,
--    para reflejar exactamente el alcance pedido.
GRANT INSERT ON practico1a_mysql.factura TO 'vendedor2'@'localhost';
GRANT SELECT (cod_producto, descripcion, precio, stock_minimo, stock_maximo, cantidad)
ON practico1a_mysql.producto
TO 'vendedor2'@'localhost';

-- c) administrador: UPDATE solo sobre el campo descripcion en producto.
--    Acá sí corresponde WITH GRANT OPTION, porque el enunciado pide
--    que pueda delegar ese privilegio a otros usuarios.
GRANT UPDATE (descripcion)
ON practico1a_mysql.producto
TO 'administrador'@'localhost'
WITH GRANT OPTION;

-- d) DELETE sobre cliente para los tres usuarios. Se otorga en una sola sentencia
--    listando los tres beneficiarios separados por coma.
GRANT DELETE ON practico1a_mysql.cliente
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost', 'administrador'@'localhost';
```

### 3) Verificación de privilegios

`SHOW GRANTS` lista los permisos efectivamente registrados para cada cuenta y permite chequear de un vistazo que los `GRANT` se aplicaron como se esperaba.

```sql
SHOW GRANTS FOR 'vendedor1'@'localhost';
SHOW GRANTS FOR 'vendedor2'@'localhost';
SHOW GRANTS FOR 'administrador'@'localhost';
```

Más allá de la verificación declarativa, conviene probar el comportamiento real ingresando con cada usuario:

- `vendedor1`: el `INSERT` sobre `cliente` debería funcionar y el `DELETE` sobre `cliente` también; en cambio, cualquier intento de `GRANT INSERT ON practico1a_mysql.cliente TO ...` debe fallar, justamente porque no se otorgó `GRANT OPTION`.
- `vendedor2`: el `INSERT` sobre `factura`, el `SELECT` sobre los campos permitidos de `producto` y el `DELETE` sobre `cliente` deberían ejecutarse sin problemas.
- `administrador`: el `UPDATE` del campo `descripcion` en `producto` debe funcionar y, como tiene `WITH GRANT OPTION`, también puede correr un `GRANT UPDATE (descripcion) ON ... TO ...` hacia otro usuario.

### 4) Revocar todos los privilegios de vendedor2

El último inciso pide retirar todos los permisos de `vendedor2`. La forma más directa en MySQL es combinar `ALL PRIVILEGES` con `GRANT OPTION` en un único `REVOKE`.

```sql
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'vendedor2'@'localhost';
SHOW GRANTS FOR 'vendedor2'@'localhost';
```

Luego del `REVOKE`, el `SHOW GRANTS` debería devolver únicamente `USAGE`. Conviene aclarar que `USAGE` no es un privilegio sobre objetos: representa simplemente que la cuenta sigue existiendo y puede conectarse, pero ya no puede operar sobre ninguna tabla.

## Comentario de entrega

La resolución cubre los seis incisos del enunciado con un mínimo de privilegios y diferenciando con cuidado cuáles se otorgan a nivel de tabla y cuáles a nivel de columna:

- `vendedor1` puede insertar en `cliente` y no está habilitado para delegar.
- `vendedor2` puede insertar en `factura` y consultar los campos pedidos de `producto`; al final se le retiran todos los privilegios.
- `administrador` puede actualizar exclusivamente `descripcion` de `producto` y sí cuenta con `WITH GRANT OPTION` para delegar ese privilegio.
- Los tres usuarios mantienen `DELETE` sobre `cliente`, tal como exige el inciso d).
