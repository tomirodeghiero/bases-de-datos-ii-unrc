# Ejercicio 4 - MySQL: actualizar precio y deshacer con rollback

Objetivo del ejercicio:

1. Abrir una sesion en MySQL sobre la base del ejercicio 1.a (`practico1a_mysql`).
2. Aumentar en 20% el precio de un producto.
3. Verificar el cambio.
4. Ejecutar `ROLLBACK`.
5. Verificar si el cambio quedo almacenado o no.

## 1) Conexion desde cliente de linea de comandos

```bash
mysql -u root -p
```

Dentro de MySQL:

```sql
USE practico1a_mysql;
```

## 2) Plan de ejecucion de la transaccion

Para asegurar que el producto elegido no se actualice en paralelo durante la prueba, se toma bloqueo de fila con `FOR UPDATE`.

```sql
-- Trabajar manualmente la transaccion
SET autocommit = 0;
START TRANSACTION;

-- Elegir producto a modificar (ejemplo: 104 segun la carga del practico 1)
SELECT cod_producto, descripcion, precio
FROM producto
WHERE cod_producto = 104
FOR UPDATE;

-- Guardar precio original para comparar
SELECT @precio_original := precio
FROM producto
WHERE cod_producto = 104;

-- Aumentar 20%
UPDATE producto
SET precio = ROUND(precio * 1.20, 2)
WHERE cod_producto = 104;

-- Verificar dentro de la transaccion (debe verse el nuevo precio)
SELECT cod_producto, descripcion, @precio_original AS precio_antes, precio AS precio_despues_update
FROM producto
WHERE cod_producto = 104;

-- Deshacer cambios
ROLLBACK;

-- Verificar luego del rollback (debe volver al precio original)
SELECT cod_producto, descripcion, @precio_original AS precio_antes, precio AS precio_despues_rollback
FROM producto
WHERE cod_producto = 104;
```

## 3) Resultado esperado

Con los datos cargados en `practico-01/ejercicio-02`, para `cod_producto = 104`:

- Precio inicial: `450000.00`
- Luego del `UPDATE`: `540000.00`
- Luego de `ROLLBACK`: `450000.00`

Conclusión:

- El cambio **no se almacenó** en la base de datos, porque `ROLLBACK` revierte la transacción completa.

## 4) Verificacion extra (opcional, recomendada)

Abrir una segunda sesion y consultar el producto antes y despues del `ROLLBACK` en la primera sesion:

```sql
SELECT cod_producto, precio
FROM producto
WHERE cod_producto = 104;
```

En una configuracion normal de InnoDB con `READ COMMITTED` o `REPEATABLE READ`, la segunda sesion no deberia ver el cambio no confirmado.
