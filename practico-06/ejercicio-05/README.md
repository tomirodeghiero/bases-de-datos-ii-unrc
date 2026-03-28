# Ejercicio 5 - Dos conexiones MySQL en SERIALIZABLE sobre la misma fila

Objetivo del ejercicio:

- abrir dos conexiones a `practico1a_mysql`,
- poner ambas transacciones en nivel `SERIALIZABLE`,
- intentar modificar el mismo registro de `cliente`,
- observar que sucede,
- finalizar con `COMMIT` en ambas.

Para el ejemplo uso `nro_cliente = 1` (existe en la carga del practico 1).

## Sesion A (Terminal 1)

```sql
USE practico1a_mysql;

SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET autocommit = 0;
START TRANSACTION;

SELECT nro_cliente, direccion
FROM cliente
WHERE nro_cliente = 1;

UPDATE cliente
SET direccion = 'San Martin 123 - A'
WHERE nro_cliente = 1;
```

En este punto, la fila queda bloqueada por la transaccion de la sesion A.

## Sesion B (Terminal 2)

```sql
USE practico1a_mysql;

SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET autocommit = 0;
START TRANSACTION;

SELECT nro_cliente, direccion
FROM cliente
WHERE nro_cliente = 1;

UPDATE cliente
SET direccion = 'San Martin 123 - B'
WHERE nro_cliente = 1;
```

Al ejecutar el `UPDATE` en la sesion B:

- la sentencia queda **esperando** (bloqueada), porque la sesion A ya tiene lock de escritura sobre esa misma fila.

## Finalizacion pedida por el enunciado

1. En sesion A, ejecutar:

```sql
COMMIT;
```

2. Cuando A confirma, la sesion B se desbloquea y su `UPDATE` se ejecuta.

3. En sesion B, ejecutar:

```sql
COMMIT;
```

## Que sucede

- No se actualiza la misma fila en paralelo.
- El motor serializa el acceso mediante bloqueos de fila.
- La segunda transaccion (`B`) espera a la primera (`A`).
- Al hacer `COMMIT` en ambas, las dos transacciones terminan exitosamente y prevalece el valor del `UPDATE` que se confirmo al final (en este orden, el de B).

## Verificacion final

```sql
SELECT nro_cliente, direccion
FROM cliente
WHERE nro_cliente = 1;
```

Resultado esperado en este ejemplo:

- `direccion = 'San Martin 123 - B'` (porque B confirmo despues de A).

## Nota practica

Si la sesion B espera demasiado, MySQL puede devolver `Lock wait timeout exceeded` (error 1205).  
Si A hace `COMMIT` dentro del tiempo de espera, B continua normalmente.
