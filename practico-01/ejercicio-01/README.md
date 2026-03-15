# Ejercicio 1

`CREATE TABLE` es el comando central para definir tablas y que las restricciones relevantes para este practico son `PRIMARY KEY`, `UNIQUE`, `CHECK` y `FOREIGN KEY`. Asimismo, los dominios se pueden modelar con `CREATE DOMAIN`, aunque eso depende del motor.

## Inciso a

### Decisiones de modelado

- `cliente.nro_cliente` es la clave primaria.
- `cliente.telefono` lo tomo como clave secundaria razonable (`UNIQUE`).
- `factura.nro_cliente` referencia a `cliente`.
- `item_factura` usa clave primaria compuesta `(cod_producto, nro_factura)`.
- Al borrar un cliente, sus facturas deben borrarse en cascada; para que no queden items huerfanos, `item_factura.nro_factura` tambien va con `ON DELETE CASCADE`.
- Al borrar un producto usado en una factura, la operacion debe fallar; por eso `item_factura.cod_producto` queda con comportamiento restrictivo.

### MySQL 8+

```sql
CREATE DATABASE IF NOT EXISTS practico1a_mysql;
USE practico1a_mysql;

CREATE TABLE cliente (
    nro_cliente INT PRIMARY KEY,
    apellido VARCHAR(60) NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    direccion VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    CONSTRAINT uq_cliente_telefono UNIQUE (telefono)
);

CREATE TABLE producto (
    cod_producto INT PRIMARY KEY,
    descripcion VARCHAR(120) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock_minimo INT NOT NULL,
    stock_maximo INT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT ck_producto_precio CHECK (precio > 0),
    CONSTRAINT ck_producto_stock_rango CHECK (stock_minimo >= 0 AND stock_maximo >= 0),
    CONSTRAINT ck_producto_stock_logico CHECK (stock_minimo <= stock_maximo),
    CONSTRAINT ck_producto_cantidad CHECK (cantidad >= 0)
);

CREATE TABLE factura (
    nro_factura INT PRIMARY KEY,
    nro_cliente INT NOT NULL,
    fecha DATE NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    CONSTRAINT ck_factura_monto CHECK (monto > 0),
    CONSTRAINT fk_factura_cliente
        FOREIGN KEY (nro_cliente)
        REFERENCES cliente(nro_cliente)
        ON DELETE CASCADE
);

CREATE TABLE item_factura (
    cod_producto INT NOT NULL,
    nro_factura INT NOT NULL,
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_item_factura PRIMARY KEY (cod_producto, nro_factura),
    CONSTRAINT ck_item_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_item_precio CHECK (precio > 0),
    CONSTRAINT fk_item_producto
        FOREIGN KEY (cod_producto)
        REFERENCES producto(cod_producto)
        ON DELETE RESTRICT,
    CONSTRAINT fk_item_factura
        FOREIGN KEY (nro_factura)
        REFERENCES factura(nro_factura)
        ON DELETE CASCADE
);
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SHOW TABLES;

SELECT * FROM cliente;
SELECT * FROM producto;
SELECT * FROM factura;
SELECT * FROM item_factura;
```

#### Comentario breve

- El ejercicio 1 queda enfocado en la estructura: tablas, claves y restricciones.
- La carga de datos se ejecuta desde el ejercicio 2 para no duplicar `INSERT`.
- Despues de correr esos `INSERT`, estas consultas sirven para verificar que todo quedo creado y poblado correctamente.

### PostgreSQL 14+

```sql
CREATE SCHEMA IF NOT EXISTS practico1a;
SET search_path TO practico1a;

CREATE TABLE cliente (
    nro_cliente INTEGER PRIMARY KEY,
    apellido VARCHAR(60) NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    direccion VARCHAR(120) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    CONSTRAINT uq_cliente_telefono UNIQUE (telefono)
);

CREATE TABLE producto (
    cod_producto INTEGER PRIMARY KEY,
    descripcion VARCHAR(120) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    stock_minimo INTEGER NOT NULL,
    stock_maximo INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    CONSTRAINT ck_producto_precio CHECK (precio > 0),
    CONSTRAINT ck_producto_stock_rango CHECK (stock_minimo >= 0 AND stock_maximo >= 0),
    CONSTRAINT ck_producto_stock_logico CHECK (stock_minimo <= stock_maximo),
    CONSTRAINT ck_producto_cantidad CHECK (cantidad >= 0)
);

CREATE TABLE factura (
    nro_factura INTEGER PRIMARY KEY,
    nro_cliente INTEGER NOT NULL,
    fecha DATE NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    CONSTRAINT ck_factura_monto CHECK (monto > 0),
    CONSTRAINT fk_factura_cliente
        FOREIGN KEY (nro_cliente)
        REFERENCES cliente(nro_cliente)
        ON DELETE CASCADE
);

CREATE TABLE item_factura (
    cod_producto INTEGER NOT NULL,
    nro_factura INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_item_factura PRIMARY KEY (cod_producto, nro_factura),
    CONSTRAINT ck_item_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_item_precio CHECK (precio > 0),
    CONSTRAINT fk_item_producto
        FOREIGN KEY (cod_producto)
        REFERENCES producto(cod_producto)
        ON DELETE RESTRICT,
    CONSTRAINT fk_item_factura
        FOREIGN KEY (nro_factura)
        REFERENCES factura(nro_factura)
        ON DELETE CASCADE
);
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'practico1a'
ORDER BY tablename;

SELECT * FROM practico1a.cliente;
SELECT * FROM practico1a.producto;
SELECT * FROM practico1a.factura;
SELECT * FROM practico1a.item_factura;
```

#### Comentario breve

- Mantengo separada la definicion de estructura respecto de la carga de datos.
- Consulto `pg_tables` porque en PostgreSQL el equivalente practico a "show tables" depende del esquema.
- Una vez ejecutados los `INSERT` del ejercicio 2, estas consultas permiten controlar rapido PK, FK y restricciones.

## Inciso b

### Decisiones de modelado

- `vehiculo.patente`, `persona.dni` y `parquimetro.id_parquimetro` son claves primarias.
- `duenio` se modela como tabla intermedia con clave primaria compuesta `(patente, dni)`.
- Tomo `(calle, altura)` como clave secundaria razonable del parquimetro.
- El dominio `nombre_y_apellido VARCHAR(45)` se emula a nivel de columna, porque ni MySQL ni Oracle implementan `CREATE DOMAIN` del estandar en este caso.
- El dominio de color queda limitado a `{gris, negro, azul}`.
- No se permite borrar un vehiculo si aparece en `estacionamiento`; por eso esa FK no tiene borrado en cascada.
- El `id_estacionamiento` debe ser autonumerado: `AUTO_INCREMENT` en MySQL, `SEQUENCE + TRIGGER` en Oracle 11g/XE.

### MySQL 8+

```sql
CREATE DATABASE IF NOT EXISTS practico1b_mysql;
USE practico1b_mysql;

CREATE TABLE persona (
    dni BIGINT PRIMARY KEY,
    nombre_y_apellido VARCHAR(45) NOT NULL,
    direccion VARCHAR(120) NOT NULL
);

CREATE TABLE vehiculo (
    patente VARCHAR(10) PRIMARY KEY,
    marca VARCHAR(40) NOT NULL,
    modelo INT NOT NULL,
    color ENUM('gris', 'negro', 'azul') NOT NULL,
    saldo_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT ck_vehiculo_saldo CHECK (saldo_actual >= 0)
);

CREATE TABLE parquimetro (
    id_parquimetro INT PRIMARY KEY,
    calle VARCHAR(80) NOT NULL,
    altura INT NOT NULL,
    CONSTRAINT uq_parquimetro_ubicacion UNIQUE (calle, altura),
    CONSTRAINT ck_parquimetro_altura CHECK (altura BETWEEN 0 AND 5000)
);

CREATE TABLE duenio (
    patente VARCHAR(10) NOT NULL,
    dni BIGINT NOT NULL,
    CONSTRAINT pk_duenio PRIMARY KEY (patente, dni),
    CONSTRAINT fk_duenio_vehiculo
        FOREIGN KEY (patente)
        REFERENCES vehiculo(patente)
        ON DELETE CASCADE,
    CONSTRAINT fk_duenio_persona
        FOREIGN KEY (dni)
        REFERENCES persona(dni)
        ON DELETE CASCADE
);

CREATE TABLE estacionamiento (
    id_estacionamiento INT AUTO_INCREMENT PRIMARY KEY,
    patente VARCHAR(10) NOT NULL,
    id_parquimetro INT NOT NULL,
    fecha DATE NOT NULL,
    saldo_inicio DECIMAL(10,2) NOT NULL,
    saldo_final DECIMAL(10,2) NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME,
    CONSTRAINT ck_estacionamiento_saldos CHECK (saldo_inicio >= 0 AND saldo_final >= 0),
    CONSTRAINT ck_estacionamiento_consumo CHECK (saldo_final <= saldo_inicio),
    CONSTRAINT ck_estacionamiento_horas CHECK (hora_salida IS NULL OR hora_salida >= hora_entrada),
    CONSTRAINT fk_estacionamiento_vehiculo
        FOREIGN KEY (patente)
        REFERENCES vehiculo(patente),
    CONSTRAINT fk_estacionamiento_parquimetro
        FOREIGN KEY (id_parquimetro)
        REFERENCES parquimetro(id_parquimetro)
);
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SHOW TABLES;

SELECT * FROM persona;
SELECT * FROM vehiculo;
SELECT * FROM parquimetro;
SELECT * FROM duenio;
SELECT * FROM estacionamiento;
```

#### Comentario breve

- El ejercicio 1 define solo la estructura y las reglas del modelo.
- La carga queda en el ejercicio 2 para evitar repetir datos en dos lugares.
- Despues de poblar, estas consultas muestran rapido si el autonumerado y las FK quedaron funcionando.

### Oracle XE 10g/11g

Primero, conectado como un usuario administrador:

```sql
CREATE USER practico1b IDENTIFIED BY practico1b;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO practico1b;
ALTER USER practico1b QUOTA UNLIMITED ON USERS;
```

Luego, conectado como `practico1b`:

```sql
CREATE TABLE persona (
    dni NUMBER(10) PRIMARY KEY,
    nombre_y_apellido VARCHAR2(45 CHAR) NOT NULL,
    direccion VARCHAR2(120 CHAR) NOT NULL
);

CREATE TABLE vehiculo (
    patente VARCHAR2(10 CHAR) PRIMARY KEY,
    marca VARCHAR2(40 CHAR) NOT NULL,
    modelo NUMBER(4) NOT NULL,
    color VARCHAR2(10 CHAR) NOT NULL,
    saldo_actual NUMBER(10,2) DEFAULT 0 NOT NULL,
    CONSTRAINT ck_vehiculo_color CHECK (LOWER(color) IN ('gris', 'negro', 'azul')),
    CONSTRAINT ck_vehiculo_saldo CHECK (saldo_actual >= 0)
);

CREATE TABLE parquimetro (
    id_parquimetro NUMBER(10) PRIMARY KEY,
    calle VARCHAR2(80 CHAR) NOT NULL,
    altura NUMBER(4) NOT NULL,
    CONSTRAINT uq_parquimetro_ubicacion UNIQUE (calle, altura),
    CONSTRAINT ck_parquimetro_altura CHECK (altura BETWEEN 0 AND 5000)
);

CREATE TABLE duenio (
    patente VARCHAR2(10 CHAR) NOT NULL,
    dni NUMBER(10) NOT NULL,
    CONSTRAINT pk_duenio PRIMARY KEY (patente, dni),
    CONSTRAINT fk_duenio_vehiculo
        FOREIGN KEY (patente)
        REFERENCES vehiculo(patente)
        ON DELETE CASCADE,
    CONSTRAINT fk_duenio_persona
        FOREIGN KEY (dni)
        REFERENCES persona(dni)
        ON DELETE CASCADE
);

CREATE TABLE estacionamiento (
    id_estacionamiento NUMBER(10) PRIMARY KEY,
    patente VARCHAR2(10 CHAR) NOT NULL,
    id_parquimetro NUMBER(10) NOT NULL,
    fecha DATE NOT NULL,
    saldo_inicio NUMBER(10,2) NOT NULL,
    saldo_final NUMBER(10,2) NOT NULL,
    hora_entrada TIMESTAMP NOT NULL,
    hora_salida TIMESTAMP,
    CONSTRAINT ck_estacionamiento_saldos CHECK (saldo_inicio >= 0 AND saldo_final >= 0),
    CONSTRAINT ck_estacionamiento_consumo CHECK (saldo_final <= saldo_inicio),
    CONSTRAINT ck_estacionamiento_horas CHECK (hora_salida IS NULL OR hora_salida >= hora_entrada),
    CONSTRAINT fk_estacionamiento_vehiculo
        FOREIGN KEY (patente)
        REFERENCES vehiculo(patente),
    CONSTRAINT fk_estacionamiento_parquimetro
        FOREIGN KEY (id_parquimetro)
        REFERENCES parquimetro(id_parquimetro)
);

CREATE SEQUENCE seq_estacionamiento START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_estacionamiento_bi
BEFORE INSERT ON estacionamiento
FOR EACH ROW
WHEN (NEW.id_estacionamiento IS NULL)
BEGIN
    SELECT seq_estacionamiento.NEXTVAL
    INTO :NEW.id_estacionamiento
    FROM dual;
END;
/
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SELECT table_name
FROM user_tables
ORDER BY table_name;

SELECT * FROM persona;
SELECT * FROM vehiculo;
SELECT * FROM parquimetro;
SELECT * FROM duenio;
SELECT * FROM estacionamiento;
```

#### Comentario breve

- En Oracle conviene mantener esta separacion entre DDL y carga para ejecutar por bloques.
- El trigger y la secuencia se validan despues de correr los `INSERT` del ejercicio 2.
- Consulto `user_tables` porque es la forma mas directa de listar tablas del esquema actual.

## Inciso c

### Decisiones de modelado

- `cliente.dni`, `automovil.patente`, `categoria.nro_categoria`, `taller.nro_taller` y `accidente.nro_accidente` son claves primarias.
- El enunciado explicita las FK de `accidente`, pero tambien infiero `automovil.dni -> cliente(dni)` y `automovil.nro_categoria -> categoria(nro_categoria)` porque estan implicitas en el esquema.
- Para que borrar un cliente no deje autos huerfanos, `automovil.dni` queda con `ON DELETE CASCADE`.
- Para cumplir la condicion del enunciado, `accidente.dni` tambien queda con `ON DELETE CASCADE`.
- No agrego `UNIQUE` extra porque el inciso no define claramente otra clave candidata natural.

### PostgreSQL 14+

```sql
CREATE SCHEMA IF NOT EXISTS practico1c;
SET search_path TO practico1c;

CREATE TABLE cliente (
    dni BIGINT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    direccion VARCHAR(120) NOT NULL,
    tarifa INTEGER NOT NULL,
    CONSTRAINT ck_cliente_tarifa CHECK (tarifa > 0 AND tarifa < 10000)
);

CREATE TABLE categoria (
    nro_categoria INTEGER PRIMARY KEY,
    tasa NUMERIC(6,2) NOT NULL,
    CONSTRAINT ck_categoria_tasa CHECK (tasa > 0)
);

CREATE TABLE taller (
    nro_taller INTEGER PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    direccion VARCHAR(120) NOT NULL
);

CREATE TABLE automovil (
    patente VARCHAR(10) PRIMARY KEY,
    marca VARCHAR(10) NOT NULL,
    modelo INTEGER NOT NULL,
    dni BIGINT NOT NULL,
    nro_categoria INTEGER NOT NULL,
    CONSTRAINT ck_automovil_modelo CHECK (modelo BETWEEN 1990 AND 2015),
    CONSTRAINT ck_automovil_marca CHECK (marca IN ('FIAT', 'RENAULT', 'FORD')),
    CONSTRAINT fk_automovil_cliente
        FOREIGN KEY (dni)
        REFERENCES cliente(dni)
        ON DELETE CASCADE,
    CONSTRAINT fk_automovil_categoria
        FOREIGN KEY (nro_categoria)
        REFERENCES categoria(nro_categoria)
);

CREATE TABLE accidente (
    nro_accidente INTEGER PRIMARY KEY,
    dni BIGINT NOT NULL,
    patente VARCHAR(10) NOT NULL,
    nro_taller INTEGER NOT NULL,
    fecha DATE NOT NULL,
    costo NUMERIC(12,2) NOT NULL,
    CONSTRAINT ck_accidente_costo CHECK (costo > 0),
    CONSTRAINT fk_accidente_cliente
        FOREIGN KEY (dni)
        REFERENCES cliente(dni)
        ON DELETE CASCADE,
    CONSTRAINT fk_accidente_automovil
        FOREIGN KEY (patente)
        REFERENCES automovil(patente)
        ON DELETE CASCADE,
    CONSTRAINT fk_accidente_taller
        FOREIGN KEY (nro_taller)
        REFERENCES taller(nro_taller)
);
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'practico1c'
ORDER BY tablename;

SELECT * FROM practico1c.cliente;
SELECT * FROM practico1c.categoria;
SELECT * FROM practico1c.taller;
SELECT * FROM practico1c.automovil;
SELECT * FROM practico1c.accidente;
```

#### Comentario breve

- El ejercicio 1 se concentra en modelar correctamente claves, dominios y relaciones.
- La carga queda en el ejercicio 2 para reutilizarla luego en las consultas del ejercicio 3.
- Estas consultas de verificacion sirven para revisar rapido el contenido ya cargado.

### Oracle XE 10g/11g

Primero, conectado como un usuario administrador:

```sql
CREATE USER practico1c IDENTIFIED BY practico1c;
GRANT CREATE SESSION, CREATE TABLE TO practico1c;
ALTER USER practico1c QUOTA UNLIMITED ON USERS;
```

Luego, conectado como `practico1c`:

```sql
CREATE TABLE cliente (
    dni NUMBER(10) PRIMARY KEY,
    nombre VARCHAR2(60 CHAR) NOT NULL,
    apellido VARCHAR2(60 CHAR) NOT NULL,
    direccion VARCHAR2(120 CHAR) NOT NULL,
    tarifa NUMBER(5) NOT NULL,
    CONSTRAINT ck_cliente_tarifa CHECK (tarifa > 0 AND tarifa < 10000)
);

CREATE TABLE categoria (
    nro_categoria NUMBER(10) PRIMARY KEY,
    tasa NUMBER(6,2) NOT NULL,
    CONSTRAINT ck_categoria_tasa CHECK (tasa > 0)
);

CREATE TABLE taller (
    nro_taller NUMBER(10) PRIMARY KEY,
    nombre VARCHAR2(80 CHAR) NOT NULL,
    direccion VARCHAR2(120 CHAR) NOT NULL
);

CREATE TABLE automovil (
    patente VARCHAR2(10 CHAR) PRIMARY KEY,
    marca VARCHAR2(10 CHAR) NOT NULL,
    modelo NUMBER(4) NOT NULL,
    dni NUMBER(10) NOT NULL,
    nro_categoria NUMBER(10) NOT NULL,
    CONSTRAINT ck_automovil_modelo CHECK (modelo BETWEEN 1990 AND 2015),
    CONSTRAINT ck_automovil_marca CHECK (marca IN ('FIAT', 'RENAULT', 'FORD')),
    CONSTRAINT fk_automovil_cliente
        FOREIGN KEY (dni)
        REFERENCES cliente(dni)
        ON DELETE CASCADE,
    CONSTRAINT fk_automovil_categoria
        FOREIGN KEY (nro_categoria)
        REFERENCES categoria(nro_categoria)
);

CREATE TABLE accidente (
    nro_accidente NUMBER(10) PRIMARY KEY,
    dni NUMBER(10) NOT NULL,
    patente VARCHAR2(10 CHAR) NOT NULL,
    nro_taller NUMBER(10) NOT NULL,
    fecha DATE NOT NULL,
    costo NUMBER(12,2) NOT NULL,
    CONSTRAINT ck_accidente_costo CHECK (costo > 0),
    CONSTRAINT fk_accidente_cliente
        FOREIGN KEY (dni)
        REFERENCES cliente(dni)
        ON DELETE CASCADE,
    CONSTRAINT fk_accidente_automovil
        FOREIGN KEY (patente)
        REFERENCES automovil(patente)
        ON DELETE CASCADE,
    CONSTRAINT fk_accidente_taller
        FOREIGN KEY (nro_taller)
        REFERENCES taller(nro_taller)
);
```

#### Carga de datos

Los `INSERT` de este inciso quedaron centralizados en `ejercicio-02/README.md`, porque ese es el ejercicio dedicado a poblar las tablas.

#### Show de las tablas

```sql
SELECT table_name
FROM user_tables
ORDER BY table_name;

SELECT * FROM cliente;
SELECT * FROM categoria;
SELECT * FROM taller;
SELECT * FROM automovil;
SELECT * FROM accidente;
```

#### Comentario breve

- Mantengo el DDL separado de la carga para que el script Oracle sea mas ordenado.
- Uso `user_tables` para listar las tablas visibles del usuario actual.
- Despues de ejecutar los `INSERT` del ejercicio 2, estas consultas permiten comprobar relaciones y restricciones.
