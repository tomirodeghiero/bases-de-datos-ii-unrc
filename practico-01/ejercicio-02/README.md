# Ejercicio 2

Este ejercicio carga datos coherentes en las tres bases definidas en el ejercicio 1. La selección de filas no es arbitraria: se eligió de modo que cada consulta del ejercicio 3 devuelva un resultado significativo y que las restricciones declaradas (claves, dominios, integridad referencial) realmente entren en juego. En particular:

- en el inciso a se incluye un cliente sin facturas, para que la consulta de clientes sin ventas devuelva al menos una fila;
- en el inciso b se reparten estacionamientos sobre el parquímetro 9, que es el que se consulta en el ejercicio 3.b;
- en el inciso c se carga un cliente con cuatro accidentes, lo que permite que la consulta con `HAVING COUNT(*) > 3` no quede vacía.

## Inciso a - MySQL / PostgreSQL

```sql
INSERT INTO cliente (nro_cliente, apellido, nombre, direccion, telefono) VALUES
    (1, 'Perez', 'Andres', 'San Martin 123', '3584010001'),
    (2, 'Diaz', 'Bruno', 'Belgrano 450', '3584010002'),
    (3, 'Gomez', 'Carlos', 'Mitre 980', '3584010003'),
    (4, 'Luna', 'Diego', 'Constitucion 75', '3584010004');

INSERT INTO producto (cod_producto, descripcion, precio, stock_minimo, stock_maximo, cantidad) VALUES
    (101, 'Teclado mecanico', 15000.00, 5, 30, 12),
    (102, 'Mouse optico', 8000.00, 10, 40, 25),
    (103, 'Monitor 24', 90000.00, 2, 15, 6),
    (104, 'Notebook 14', 450000.00, 1, 8, 3);

INSERT INTO factura (nro_factura, nro_cliente, fecha, monto) VALUES
    (1001, 1, '2024-08-01', 106000.00),
    (1002, 1, '2024-08-10', 450000.00),
    (1003, 2, '2024-08-12', 46000.00),
    (1004, 3, '2024-08-15', 98000.00);

INSERT INTO item_factura (cod_producto, nro_factura, cantidad, precio) VALUES
    (103, 1001, 1, 90000.00),
    (102, 1001, 2, 8000.00),
    (104, 1002, 1, 450000.00),
    (101, 1003, 2, 15000.00),
    (102, 1003, 2, 8000.00),
    (103, 1004, 1, 90000.00),
    (102, 1004, 1, 8000.00);
```

### Qué valida esta carga

Esta combinación de filas cubre los tres escenarios que después se consultan en el ejercicio 3 sobre la base del inciso a:

- Diego Luna queda intencionalmente sin facturas, así aparece en la consulta de clientes sin ventas.
- Andrés Pérez tiene dos facturas con montos distintos, lo que permite observar correctamente el `MAX` y el `MIN` por cliente.
- Los montos declarados en cada factura coinciden con la suma de los precios y cantidades de sus ítems, manteniendo la coherencia del modelo.

## Inciso b - MySQL

```sql
INSERT INTO persona (dni, nombre_y_apellido, direccion) VALUES
    (30111222, 'Juan Perez', 'Laprida 120'),
    (28999111, 'Mario Lopez', 'Lavalle 455'),
    (33444555, 'Pedro Suarez', 'Mitre 900');

INSERT INTO vehiculo (patente, marca, modelo, color, saldo_actual) VALUES
    ('AA123BB', 'Renault', 2018, 'gris', 1500.00),
    ('AC456DD', 'Ford', 2020, 'negro', 800.00),
    ('AD789EE', 'Fiat', 2016, 'azul', 1200.00);

INSERT INTO parquimetro (id_parquimetro, calle, altura) VALUES
    (9, 'Italia', 1200),
    (10, 'Sarmiento', 845),
    (11, 'San Martin', 2300);

INSERT INTO duenio (patente, dni) VALUES
    ('AA123BB', 30111222),
    ('AC456DD', 28999111),
    ('AD789EE', 33444555);

INSERT INTO estacionamiento
    (patente, id_parquimetro, fecha, saldo_inicio, saldo_final, hora_entrada, hora_salida)
VALUES
    ('AA123BB', 9, '2024-08-02', 1500.00, 1350.00, '08:00:00', '09:30:00'),
    ('AC456DD', 9, '2024-08-02', 800.00, 650.00, '10:15:00', '11:45:00'),
    ('AD789EE', 10, '2024-08-03', 1200.00, 1000.00, '18:00:00', '19:40:00'),
    ('AA123BB', 11, '2024-08-04', 1350.00, 1250.00, '16:00:00', '16:50:00');
```

## Inciso b - Oracle

En Oracle se omite explícitamente la columna `id_estacionamiento` en el `INSERT`, ya que el trigger `trg_estacionamiento_bi` definido en el ejercicio 1 se encarga de tomar el siguiente valor de la secuencia y completar el campo. Insertarlo a mano sería redundante y, además, podría romper la consistencia de la secuencia.

```sql
INSERT INTO persona (dni, nombre_y_apellido, direccion)
VALUES (30111222, 'Juan Perez', 'Laprida 120');

INSERT INTO persona (dni, nombre_y_apellido, direccion)
VALUES (28999111, 'Mario Lopez', 'Lavalle 455');

INSERT INTO persona (dni, nombre_y_apellido, direccion)
VALUES (33444555, 'Pedro Suarez', 'Mitre 900');

INSERT INTO vehiculo (patente, marca, modelo, color, saldo_actual)
VALUES ('AA123BB', 'Renault', 2018, 'gris', 1500.00);

INSERT INTO vehiculo (patente, marca, modelo, color, saldo_actual)
VALUES ('AC456DD', 'Ford', 2020, 'negro', 800.00);

INSERT INTO vehiculo (patente, marca, modelo, color, saldo_actual)
VALUES ('AD789EE', 'Fiat', 2016, 'azul', 1200.00);

INSERT INTO parquimetro (id_parquimetro, calle, altura)
VALUES (9, 'Italia', 1200);

INSERT INTO parquimetro (id_parquimetro, calle, altura)
VALUES (10, 'Sarmiento', 845);

INSERT INTO parquimetro (id_parquimetro, calle, altura)
VALUES (11, 'San Martin', 2300);

INSERT INTO duenio (patente, dni)
VALUES ('AA123BB', 30111222);

INSERT INTO duenio (patente, dni)
VALUES ('AC456DD', 28999111);

INSERT INTO duenio (patente, dni)
VALUES ('AD789EE', 33444555);

INSERT INTO estacionamiento
    (patente, id_parquimetro, fecha, saldo_inicio, saldo_final, hora_entrada, hora_salida)
VALUES
    (
        'AA123BB',
        9,
        DATE '2024-08-02',
        1500.00,
        1350.00,
        TIMESTAMP '2024-08-02 08:00:00',
        TIMESTAMP '2024-08-02 09:30:00'
    );

INSERT INTO estacionamiento
    (patente, id_parquimetro, fecha, saldo_inicio, saldo_final, hora_entrada, hora_salida)
VALUES
    (
        'AC456DD',
        9,
        DATE '2024-08-02',
        800.00,
        650.00,
        TIMESTAMP '2024-08-02 10:15:00',
        TIMESTAMP '2024-08-02 11:45:00'
    );

INSERT INTO estacionamiento
    (patente, id_parquimetro, fecha, saldo_inicio, saldo_final, hora_entrada, hora_salida)
VALUES
    (
        'AD789EE',
        10,
        DATE '2024-08-03',
        1200.00,
        1000.00,
        TIMESTAMP '2024-08-03 18:00:00',
        TIMESTAMP '2024-08-03 19:40:00'
    );

INSERT INTO estacionamiento
    (patente, id_parquimetro, fecha, saldo_inicio, saldo_final, hora_entrada, hora_salida)
VALUES
    (
        'AA123BB',
        11,
        DATE '2024-08-04',
        1350.00,
        1250.00,
        TIMESTAMP '2024-08-04 16:00:00',
        TIMESTAMP '2024-08-04 16:50:00'
    );
```

## Inciso c - PostgreSQL

```sql
INSERT INTO cliente (dni, nombre, apellido, direccion, tarifa) VALUES
    (30111222, 'Lucas', 'Gomez', 'Colon 120', 3500),
    (28999111, 'Martin', 'Sosa', 'Belgrano 455', 4200),
    (33444555, 'Sergio', 'Perez', 'Rivadavia 900', 2800);

INSERT INTO categoria (nro_categoria, tasa) VALUES
    (1, 0.80),
    (2, 1.10),
    (3, 1.35);

INSERT INTO taller (nro_taller, nombre, direccion) VALUES
    (1, 'Taller Centro', 'Sobremonte 100'),
    (2, 'Taller Sur', 'Ruta 8 km 601');

INSERT INTO automovil (patente, marca, modelo, dni, nro_categoria) VALUES
    ('AAA111', 'FIAT', 2010, 30111222, 1),
    ('BBB222', 'FORD', 2012, 30111222, 2),
    ('CCC333', 'RENAULT', 2015, 28999111, 1),
    ('DDD444', 'FIAT', 2008, 33444555, 3);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo) VALUES
    (5001, 30111222, 'AAA111', 1, '2024-01-10', 150000.00),
    (5002, 30111222, 'BBB222', 2, '2024-03-12', 230000.00),
    (5003, 30111222, 'AAA111', 1, '2024-06-01', 80000.00),
    (5004, 30111222, 'BBB222', 1, '2024-07-20', 120000.00),
    (5005, 28999111, 'CCC333', 2, '2024-05-05', 95000.00),
    (5006, 33444555, 'DDD444', 1, '2024-08-09', 110000.00);
```

## Inciso c - Oracle

```sql
INSERT INTO cliente (dni, nombre, apellido, direccion, tarifa)
VALUES (30111222, 'Lucas', 'Gomez', 'Colon 120', 3500);

INSERT INTO cliente (dni, nombre, apellido, direccion, tarifa)
VALUES (28999111, 'Martin', 'Sosa', 'Belgrano 455', 4200);

INSERT INTO cliente (dni, nombre, apellido, direccion, tarifa)
VALUES (33444555, 'Sergio', 'Perez', 'Rivadavia 900', 2800);

INSERT INTO categoria (nro_categoria, tasa)
VALUES (1, 0.80);

INSERT INTO categoria (nro_categoria, tasa)
VALUES (2, 1.10);

INSERT INTO categoria (nro_categoria, tasa)
VALUES (3, 1.35);

INSERT INTO taller (nro_taller, nombre, direccion)
VALUES (1, 'Taller Centro', 'Sobremonte 100');

INSERT INTO taller (nro_taller, nombre, direccion)
VALUES (2, 'Taller Sur', 'Ruta 8 km 601');

INSERT INTO automovil (patente, marca, modelo, dni, nro_categoria)
VALUES ('AAA111', 'FIAT', 2010, 30111222, 1);

INSERT INTO automovil (patente, marca, modelo, dni, nro_categoria)
VALUES ('BBB222', 'FORD', 2012, 30111222, 2);

INSERT INTO automovil (patente, marca, modelo, dni, nro_categoria)
VALUES ('CCC333', 'RENAULT', 2015, 28999111, 1);

INSERT INTO automovil (patente, marca, modelo, dni, nro_categoria)
VALUES ('DDD444', 'FIAT', 2008, 33444555, 3);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5001, 30111222, 'AAA111', 1, DATE '2024-01-10', 150000.00);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5002, 30111222, 'BBB222', 2, DATE '2024-03-12', 230000.00);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5003, 30111222, 'AAA111', 1, DATE '2024-06-01', 80000.00);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5004, 30111222, 'BBB222', 1, DATE '2024-07-20', 120000.00);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5005, 28999111, 'CCC333', 2, DATE '2024-05-05', 95000.00);

INSERT INTO accidente (nro_accidente, dni, patente, nro_taller, fecha, costo)
VALUES (5006, 33444555, 'DDD444', 1, DATE '2024-08-09', 110000.00);
```

### Qué valida esta carga

La carga del inciso c está pensada para que las consultas del ejercicio 3.c puedan ejercitarse:

- Lucas Gómez aparece con cuatro accidentes, lo que asegura que la consulta con `HAVING COUNT(*) > 3` devuelva al menos una fila.
- Todas las marcas y modelos respetan los dominios definidos en el DDL (`marca IN ('FIAT', 'RENAULT', 'FORD')` y `modelo BETWEEN 1990 AND 2015`), así que ninguna inserción es rechazada por los `CHECK` y se confirma indirectamente que las restricciones están funcionando.
