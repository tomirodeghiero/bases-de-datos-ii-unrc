# Ejercicio 7 - PostgreSQL y Deferrable Constraints

Base usada: `practico1c` (modelo del practico 1, inciso c).

Nota de nombres:

- En tu esquema real la columna es `accidente.nro_taller` (equivalente al `codigo_taller` del enunciado).

## Objetivo

Dada la transaccion:

```sql
INSERT INTO accidente VALUES (1, 'DNI 1', 'PAT 1', 1, '2009-10-10', 234);
INSERT INTO automovil VALUES ('PAT 1', ...);
```

resolver:

1. que pasa con el esquema normal,
2. como modificar el esquema para que NO falle,
3. como modificar el esquema para que SI falle.

## a) Que pasa con el esquema normal (FK inmediata)

Con FK inmediata (comportamiento por defecto), PostgreSQL valida la referencia en cada sentencia.

Si `PAT 1` todavia no existe en `automovil`, el primer `INSERT` en `accidente` falla al instante por la FK `fk_accidente_automovil`.

Ejemplo (esquema inmediato):

```sql
BEGIN;

INSERT INTO practico1c.accidente
    (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES
    (1, 30111222, 'PAT1', 1, DATE '2009-10-10', 234);
-- ERROR: insert or update on table "accidente" violates foreign key constraint "fk_accidente_automovil"

INSERT INTO practico1c.automovil
    (patente, marca, modelo, dni, nro_categoria)
VALUES
    ('PAT1', 'FIAT', 2010, 30111222, 1);

COMMIT;
```

Como la primera sentencia da error, la transaccion queda abortada.

## b) Modificar esquema para que NO genere excepcion

La clave es hacer deferible la FK `accidente.patente -> automovil.patente` y diferir su chequeo hasta `COMMIT`.

### Cambio de esquema

```sql
ALTER TABLE practico1c.accidente
    ALTER CONSTRAINT fk_accidente_automovil
    DEFERRABLE INITIALLY DEFERRED;
```

### Transaccion que ahora debe funcionar

```sql
BEGIN;

-- No es obligatorio en este caso porque la constraint ya queda deferred por defecto,
-- pero se puede dejar explicito:
SET CONSTRAINTS fk_accidente_automovil DEFERRED;

INSERT INTO practico1c.accidente
    (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES
    (1, 30111222, 'PAT1', 1, DATE '2009-10-10', 234);

INSERT INTO practico1c.automovil
    (patente, marca, modelo, dni, nro_categoria)
VALUES
    ('PAT1', 'FIAT', 2010, 30111222, 1);

COMMIT;
```

Resultado:

- No hay excepcion.
- La FK se controla al final y en `COMMIT` ya existe `PAT1` en `automovil`.

## c) Modificar esquema para que SI genere excepcion

Para forzar excepcion con esa misma transaccion, volver la FK a no deferible (inmediata).

```sql
ALTER TABLE practico1c.accidente
    ALTER CONSTRAINT fk_accidente_automovil
    NOT DEFERRABLE;
```

Al ejecutar nuevamente:

```sql
BEGIN;

INSERT INTO practico1c.accidente
    (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES
    (2, 30111222, 'PAT2', 1, DATE '2009-10-10', 234);

INSERT INTO practico1c.automovil
    (patente, marca, modelo, dni, nro_categoria)
VALUES
    ('PAT2', 'FIAT', 2010, 30111222, 1);

COMMIT;
```

el primer `INSERT` vuelve a fallar por FK (excepcion inmediata).

## Consulta de control (opcional)

Para verificar si la constraint esta deferible y diferida por defecto:

```sql
SELECT
    conname,
    condeferrable,
    condeferred
FROM pg_constraint
WHERE conrelid = 'practico1c.accidente'::regclass
  AND conname = 'fk_accidente_automovil';
```

- `condeferrable = true`, `condeferred = true`  => `DEFERRABLE INITIALLY DEFERRED`
- `condeferrable = false` => `NOT DEFERRABLE`
