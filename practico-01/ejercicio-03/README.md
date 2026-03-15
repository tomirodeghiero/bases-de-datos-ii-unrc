# Ejercicio 3

Las consultas de este archivo se basan en los siguientes comandos:

- `SELECT` para recuperar datos.
- `WHERE` para filtrar.
- `ORDER BY` para ordenar.
- `GROUP BY` y `HAVING` para consultas con agregación.

## a) Clientes sin ventas en la base del inciso 1.a

Quieren todos los datos del cliente y solo los que no tengan ninguna factura asociada.

```sql
SELECT c.nro_cliente,
       c.apellido,
       c.nombre,
       c.direccion,
       c.telefono
FROM cliente c
WHERE NOT EXISTS (
    SELECT 1
    FROM factura f
    WHERE f.nro_cliente = c.nro_cliente
)
ORDER BY c.apellido DESC, c.nombre DESC;
```

### Idea

`NOT EXISTS` expresa directamente "este cliente no tiene ventas". El `ORDER BY` usa apellido y nombre en forma descendente.

## b) Vehículos que usaron el parquímetro 9 en la base del inciso 1.b

```sql
SELECT DISTINCT v.patente,
       v.modelo,
       v.color
FROM vehiculo v
JOIN estacionamiento e
  ON e.patente = v.patente
WHERE e.id_parquimetro = 9;
```

### Idea

Se hace un `JOIN` entre `vehiculo` y `estacionamiento`, y `DISTINCT` evita repetir un vehículo si estaciono varias veces en el mismo parquímetro.

## c) Clientes con mas de 3 accidentes en la base del inciso 1.c

```sql
SELECT c.dni,
       c.nombre,
       c.apellido
FROM cliente c
JOIN accidente a
  ON a.dni = c.dni
GROUP BY c.dni, c.nombre, c.apellido
HAVING COUNT(*) > 3;
```

### Idea

`GROUP BY` forma un grupo por cliente y `HAVING` deja solo los grupos cuya cantidad de accidentes supera 3.

## d) Maximo y minimo monto de factura por cliente en la base del inciso 1.a

```sql
SELECT c.nro_cliente,
       c.nombre,
       c.apellido,
       MAX(f.monto) AS monto_maximo,
       MIN(f.monto) AS monto_minimo
FROM cliente c
JOIN factura f
  ON f.nro_cliente = c.nro_cliente
GROUP BY c.nro_cliente, c.nombre, c.apellido
ORDER BY c.nro_cliente;
```

### Idea

La agregación se hace por cliente. `MAX` y `MIN` son exactamente las funciones agregadas para este tipo de consulta sumaria.

## e) Tres consultas extra en algebra relacional

Tomo como base la del inciso 1.a porque tiene relaciones simples de explicar.

### Consulta 1 - Productos con stock por debajo o exactamente en el minimo

Álgebra relacional:

```text
pi_{cod_producto, descripcion}(sigma_{cantidad < stock_minimo}(Producto))
union
pi_{cod_producto, descripcion}(sigma_{cantidad = stock_minimo}(Producto))
```

SQL equivalente:

```sql
SELECT cod_producto, descripcion
FROM producto
WHERE cantidad < stock_minimo

UNION

SELECT cod_producto, descripcion
FROM producto
WHERE cantidad = stock_minimo;
```

Operadores usados: seleccion, proyeccion y union.

### Consulta 2 - Productos vendidos que todavía estan por debajo del stock máximo

Algebra relacional:

```text
pi_{cod_producto}(ItemFactura)
interseccion
pi_{cod_producto}(sigma_{cantidad < stock_maximo}(Producto))
```

SQL equivalente:

```sql
SELECT DISTINCT i.cod_producto
FROM item_factura i
JOIN producto p
  ON p.cod_producto = i.cod_producto
WHERE p.cantidad < p.stock_maximo;
```

Operadores usados: seleccion, proyeccion e interseccion.

### Consulta 3 - Pares cliente-factura usando producto cartesiano

Álgebra relacional:

```text
pi_{Cliente.nro_cliente, Cliente.apellido, Factura.nro_factura}
(
    sigma_{Cliente.nro_cliente = Factura.nro_cliente}
    (Cliente x Factura)
)
```

SQL equivalente:

```sql
SELECT c.nro_cliente,
       c.apellido,
       f.nro_factura
FROM cliente c
JOIN factura f
  ON c.nro_cliente = f.nro_cliente;
```

Operadores usados: producto cartesiano, seleccion y proyeccion.
