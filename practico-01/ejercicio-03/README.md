# Ejercicio 3

Este ejercicio se centra en las consultas DML del repaso: filtros con `WHERE`, ordenamientos con `ORDER BY`, agregaciones con `GROUP BY` y `HAVING`, y subconsultas. Las cuatro primeras consultas son las pedidas por el enunciado y la quinta corresponde a la parte de álgebra relacional. En cada caso se acompaña la sentencia con una breve justificación de por qué resuelve el pedido.

## a) Clientes sin ventas en la base del inciso 1.a

El enunciado pide listar los clientes (con todos sus datos) que no tengan ninguna factura asociada, ordenando el resultado por apellido y nombre en forma descendente.

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

La pregunta se modela naturalmente con una subconsulta correlacionada: `NOT EXISTS` se lee literalmente como "no existe ninguna factura asociada a este cliente". Es una formulación equivalente a `LEFT JOIN ... WHERE factura.nro_cliente IS NULL` o `WHERE nro_cliente NOT IN (SELECT nro_cliente FROM factura)`, pero `NOT EXISTS` se comporta correctamente frente a posibles `NULL` y suele ser la opción más limpia. El `ORDER BY ... DESC` cubre el orden por apellido y nombre en forma descendente que pide el enunciado. Sobre los datos cargados en el ejercicio 2, el resultado esperado es Diego Luna, que es el único cliente sin facturas asociadas.

## b) Vehículos que usaron el parquímetro 9 en la base del inciso 1.b

El enunciado pide listar los vehículos que utilizaron el parquímetro 9 e indicar modelo y color. Se incluye también la patente para identificar inequívocamente cada vehículo, ya que sin ella podrían aparecer filas que parezcan repetidas (mismo modelo y color, distinto auto).

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

La consulta cruza `vehiculo` con `estacionamiento` por la patente y filtra los registros del parquímetro 9. El `DISTINCT` es importante porque un mismo vehículo puede haberse estacionado varias veces en el mismo parquímetro: sin él, cada estacionamiento generaría una fila duplicada en el resultado. Con los datos del ejercicio 2, las patentes `AA123BB` y `AC456DD` tienen estacionamientos en el parquímetro 9, por lo que aparecen en el listado.

## c) Clientes con más de 3 accidentes en la base del inciso 1.c

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

Se trata de un caso típico de agregación con filtro posterior. El `GROUP BY` arma un grupo por cada cliente y `HAVING COUNT(*) > 3` deja solo aquellos cuyos accidentes superan los tres. La diferencia clave con `WHERE` es que `HAVING` aplica sobre filas ya agrupadas, que es lo que se necesita acá. Con la carga del ejercicio 2, el único cliente que cumple es Lucas Gómez, que registra cuatro accidentes.

## d) Máximo y mínimo monto de factura por cliente en la base del inciso 1.a

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

Las funciones `MAX` y `MIN` aplicadas sobre `monto` resuelven directamente el pedido. Como la consulta utiliza `JOIN` (un join interno), solo aparecen los clientes que tienen al menos una factura. Esto es deseable: un cliente sin facturas no tiene un máximo ni un mínimo bien definido y, además, su caso ya se cubre en el inciso a). El `ORDER BY c.nro_cliente` es un detalle de presentación para que el listado quede ordenado de forma estable.

## e) Tres consultas extra en álgebra relacional

Para esta parte se elige como dominio la base del inciso 1.a, porque sus relaciones son simples y permiten ilustrar con claridad cada operador. Entre las tres consultas se cubren los operadores que pide el enunciado: selección, proyección, unión, intersección y producto cartesiano.

### Consulta 1 — Productos con stock por debajo o igual al mínimo

Esta consulta apunta a detectar productos que necesitan reposición. Se usa una unión entre dos selecciones para ejemplificar el operador `∪`, aunque podría escribirse con un único `WHERE cantidad <= stock_minimo`.

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

Operadores usados: selección, proyección y unión.

### Consulta 2 — Productos facturados que aún están por debajo del stock máximo

La consulta combina información del registro de ventas (`ItemFactura`) y del catálogo (`Producto`) para identificar productos que ya tuvieron movimiento pero todavía tienen capacidad de stock disponible.

Álgebra relacional:

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

Operadores usados: selección, proyección e intersección. En SQL se usa un `JOIN` con `DISTINCT` porque modela exactamente la intersección sobre el conjunto de códigos de producto que cumplen ambas condiciones.

### Consulta 3 — Pares cliente-factura a partir del producto cartesiano

Esta consulta sirve para ilustrar el operador de producto cartesiano. El producto entre `Cliente` y `Factura` genera todas las combinaciones posibles, y la selección posterior se queda solo con los pares que coinciden por `nro_cliente`. Esa combinación de operadores es, conceptualmente, lo que un join interno hace por debajo.

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

Operadores usados: producto cartesiano, selección y proyección.
