# Ejercicio 6 - Lectura no repetible en MySQL

Objetivo:

- mostrar una transaccion que lee dos veces la misma fila y obtiene valores distintos,
- sin que esa transaccion haga `UPDATE` sobre esa fila.

Este fenomeno se llama **lectura no repetible** (`non-repeatable read`).

## Prueba propuesta (MySQL, dos sesiones)

Se usa la base del practico 1.a: `practico1a_mysql`.
Fila ejemplo: `producto.cod_producto = 102`.

### Sesion A (la transaccion que solo lee)

```sql
USE practico1a_mysql;

SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET autocommit = 0;
START TRANSACTION;

SELECT cod_producto, precio
FROM producto
WHERE cod_producto = 102;
```

Supongamos que devuelve `8000.00`.

### Sesion B (la transaccion que modifica)

```sql
USE practico1a_mysql;

SET autocommit = 0;
START TRANSACTION;

UPDATE producto
SET precio = precio + 500
WHERE cod_producto = 102;

COMMIT;
```

### Vuelta a Sesion A (segunda lectura del mismo registro)

```sql
SELECT cod_producto, precio
FROM producto
WHERE cod_producto = 102;

COMMIT;
```

Ahora la sesion A ve un valor distinto (por ejemplo `8500.00`) sin haber actualizado esa fila.
Eso demuestra la lectura no repetible.

## Niveles de aislamiento que permiten esto

En MySQL/InnoDB, este fenomeno puede aparecer en:

- `READ UNCOMMITTED`
- `READ COMMITTED`

No deberia aparecer con lecturas consistentes normales en:

- `REPEATABLE READ`
- `SERIALIZABLE`

## Verificacion opcional (misma prueba, cambiando nivel)

Si en la sesion A usas:

```sql
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

la segunda lectura de A deberia devolver el mismo valor que la primera (dentro de la misma transaccion).
