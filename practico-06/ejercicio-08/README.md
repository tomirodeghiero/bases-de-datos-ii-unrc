# Ejercicio 8 - PostgreSQL MVCC (`xmin` / `xmax`)

Objetivo:

- diseñar una prueba donde dos transacciones vean valores distintos para la misma fila,
- observar columnas de sistema `xmin` y `xmax`.

La prueba se hace sobre el modelo del ejercicio b) (tabla `vehiculo`).
Voy a usar la fila `patente = 'AA123BB'`.

## Idea de la prueba

1. `T1` actualiza una fila pero **no hace commit**.
2. `T2`, en paralelo, lee la misma fila.
3. Por MVCC, en ese momento:
   - `T1` ve la version nueva de la fila.
   - `T2` ve la version vieja (valor anterior).
4. Se observan `xmin` y `xmax` en ambos lados.

## Sesion A (Transaccion T1)

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT txid_current() AS tx_a;

SELECT patente, saldo_actual, xmin, xmax
FROM vehiculo
WHERE patente = 'AA123BB';

UPDATE vehiculo
SET saldo_actual = saldo_actual + 100
WHERE patente = 'AA123BB';

SELECT patente, saldo_actual, xmin, xmax
FROM vehiculo
WHERE patente = 'AA123BB';
```

Que se espera en A:

- Antes del `UPDATE`: se ve el valor original.
- Despues del `UPDATE`: se ve el valor incrementado.
- En la version visible luego del update, normalmente `xmin` coincide con `tx_a` y `xmax = 0`.

No hacer `COMMIT` todavia.

## Sesion B (Transaccion T2), en paralelo

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT txid_current() AS tx_b;

SELECT patente, saldo_actual, xmin, xmax
FROM vehiculo
WHERE patente = 'AA123BB';
```

Que se espera en B mientras A no confirma:

- B ve el valor **anterior** (distinto al que ve A).
- Esto demuestra que dos transacciones concurrentes ven versiones diferentes de la misma fila.
- `xmin` corresponde a la transaccion que creo la version vieja.
- `xmax` puede aparecer en `0` o con XID de borrado/actualizacion segun la version visible y estado de visibilidad.

## Confirmacion y segunda lectura en B

Ahora en sesion A:

```sql
COMMIT;
```

Luego en sesion B, volver a leer:

```sql
SELECT patente, saldo_actual, xmin, xmax
FROM vehiculo
WHERE patente = 'AA123BB';

COMMIT;
```

En `READ COMMITTED`, la segunda lectura de B ya puede ver la version nueva (la confirmada por A).

## Interpretacion de `xmin` y `xmax`

- `xmin`: XID que inserto esa version de la tupla.
- `xmax`: XID que invalida esa version (por `UPDATE`/`DELETE`).
- Un `UPDATE` crea una nueva version:
  - version vieja: queda marcada con `xmax = XID del UPDATE`.
  - version nueva: nace con `xmin = XID del UPDATE` y `xmax = 0`.

## Restaurar el dato (opcional)

Si queres dejar el valor como estaba:

```sql
UPDATE vehiculo
SET saldo_actual = saldo_actual - 100
WHERE patente = 'AA123BB';
```
