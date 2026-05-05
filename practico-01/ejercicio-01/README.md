# Ejercicio 1

El núcleo de este ejercicio es el DDL: definir las tablas con `CREATE TABLE` y declarar las restricciones que el enunciado pide explícita o implícitamente. Las cláusulas más relevantes son `PRIMARY KEY`, `UNIQUE`, `CHECK` y `FOREIGN KEY`, mientras que la noción de dominio se puede expresar con `CREATE DOMAIN` cuando el motor lo soporta y, en caso contrario, emularse con `CHECK` o tipos enumerados. Cada inciso se resuelve en los motores que indica el enunciado y se conserva un mismo conjunto de decisiones de modelado para que las versiones sean comparables.

## Inciso a

### Decisiones de modelado

- `cliente.nro_cliente`, `producto.cod_producto` y `factura.nro_factura` son las claves primarias naturales del enunciado.
- Se agrega `UNIQUE` sobre `cliente.telefono`, ya que en este dominio no es razonable que dos clientes distintos compartan teléfono. El enunciado no lo pide explícitamente, pero funciona como clave secundaria realista.
- `factura.nro_cliente` se declara como clave foránea hacia `cliente`, lo que cierra la relación 1:N entre clientes y facturas.
- `item_factura` se modela con clave primaria compuesta `(cod_producto, nro_factura)`, una elección típica en tablas de detalle: cada par (producto, factura) aparece una sola vez.
- El enunciado pide que al borrar un cliente se elimine toda su información de facturas. Para cumplirlo, `factura.nro_cliente` se define con `ON DELETE CASCADE`. Como además los ítems quedarían huérfanos si la factura desaparece, `item_factura.nro_factura` también se propaga con `ON DELETE CASCADE`.
- En cambio, no se debe permitir borrar un producto que ya fue facturado. Por eso `item_factura.cod_producto` se declara con `ON DELETE RESTRICT`, que es justamente el comportamiento que aborta la operación si existen referencias.
- Las restricciones de dominio se traducen en `CHECK`: precio estrictamente positivo, stock mínimo y máximo no negativos y, sobre todo, `stock_minimo <= stock_maximo` para garantizar la consistencia lógica que pide el enunciado.

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

Los `INSERT` correspondientes a este inciso se concentran en `ejercicio-02/README.md`, que es el ejercicio dedicado específicamente a poblar las tablas. La separación evita duplicar el código y deja claro qué pertenece al DDL y qué al DML.

#### Verificación rápida del esquema

```sql
SHOW TABLES;

SELECT * FROM cliente;
SELECT * FROM producto;
SELECT * FROM factura;
SELECT * FROM item_factura;
```

#### Comentario breve

Este inciso se concentra solo en la estructura: tablas, claves primarias y foráneas, restricciones de dominio y reglas de borrado. Una vez ejecutados los `INSERT` del ejercicio 2, las consultas de arriba alcanzan para confirmar que las tablas existen, que las relaciones están bien declaradas y que las filas insertadas respetan todas las restricciones definidas.

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

Igual que en MySQL, los `INSERT` de este inciso se concentran en `ejercicio-02/README.md`. El DDL queda autocontenido y los datos se cargan en un único lugar.

#### Verificación rápida del esquema

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

PostgreSQL no expone un comando equivalente directo a `SHOW TABLES`, así que la lista de tablas del esquema se obtiene consultando `pg_tables`. Una vez corridos los `INSERT` del ejercicio 2, los `SELECT` de arriba alcanzan para verificar que las claves primarias y foráneas se respetan y que las restricciones de dominio están funcionando como se esperaba.

## Inciso b

### Decisiones de modelado

- `vehiculo.patente`, `persona.dni` y `parquimetro.id_parquimetro` son las claves primarias naturales del problema.
- La relación N:N entre vehículos y personas (un vehículo puede tener varios dueños y una persona puede ser dueña de varios vehículos) se resuelve con `duenio` como tabla intermedia, usando `(patente, dni)` como clave primaria compuesta.
- Para `parquimetro` se agrega `UNIQUE (calle, altura)`. La idea es razonable desde el dominio: no tiene sentido que dos parquímetros distintos compartan exactamente la misma ubicación.
- El dominio `nombre_y_apellido VARCHAR(45)` se emula a nivel de columna, ya que ni MySQL ni Oracle implementan `CREATE DOMAIN` del estándar SQL. En la práctica, tipo + `CHECK` cubren la misma necesidad.
- El dominio del atributo `color` queda restringido al conjunto `{gris, negro, azul}`. En MySQL se aprovecha `ENUM`, mientras que en Oracle se utiliza un `CHECK` con `IN (...)`.
- El enunciado pide que no se pueda borrar un vehículo que ya fue estacionado. Para reflejarlo, la FK desde `estacionamiento` hacia `vehiculo` se deja sin `ON DELETE CASCADE`: con el comportamiento por defecto (`RESTRICT` / `NO ACTION`) la eliminación falla mientras existan estacionamientos asociados.
- El `id_estacionamiento` debe ser autonumerado. En MySQL se resuelve con `AUTO_INCREMENT`; en Oracle 10g/11g XE, donde aún no existe `IDENTITY`, se combina una `SEQUENCE` con un trigger `BEFORE INSERT` que asigna el próximo valor cuando la columna llega vacía.

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

Los `INSERT` de este inciso se centralizan en `ejercicio-02/README.md`. Esa separación deja a la vista en este archivo solo la estructura y las restricciones.

#### Verificación rápida del esquema

```sql
SHOW TABLES;

SELECT * FROM persona;
SELECT * FROM vehiculo;
SELECT * FROM parquimetro;
SELECT * FROM duenio;
SELECT * FROM estacionamiento;
```

#### Comentario breve

Una vez ejecutadas las inserciones del ejercicio 2, estas consultas permiten verificar dos cosas en simultáneo: que el `AUTO_INCREMENT` del `id_estacionamiento` se completa solo y que las claves foráneas vinculan correctamente vehículos, personas y parquímetros.

### Oracle XE 10g/11g

En Oracle no existe el concepto de "base de datos" tal como aparece en MySQL o PostgreSQL: el equivalente práctico es crear un usuario que oficie de esquema dueño de las tablas. Por eso, el primer paso es conectarse como un usuario administrador (por ejemplo `SYSTEM`) y crear el usuario que va a alojar la estructura, junto con los privilegios mínimos para poder operar:

```sql
CREATE USER practico1b IDENTIFIED BY practico1b;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO practico1b;
ALTER USER practico1b QUOTA UNLIMITED ON USERS;
```

Una vez creado el esquema, ya conectado como `practico1b`, se ejecuta el DDL:

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

Como en los otros motores, las inserciones de este inciso se centralizan en `ejercicio-02/README.md`.

#### Verificación rápida del esquema

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

`user_tables` es la vista del diccionario que lista las tablas del esquema actual; en Oracle es la alternativa más directa al `SHOW TABLES` de MySQL. Una vez corridos los `INSERT` del ejercicio 2 conviene revisar específicamente que el trigger asigne el `id_estacionamiento` y que la FK hacia `vehiculo` impida borrar autos ya estacionados.

## Inciso c

### Decisiones de modelado

- `cliente.dni`, `automovil.patente`, `categoria.nro_categoria`, `taller.nro_taller` y `accidente.nro_accidente` se toman como claves primarias siguiendo la subrayado del esquema del enunciado.
- El enunciado declara explícitamente las FK de `accidente`, pero el esquema deja implícitas otras dos: `automovil.dni → cliente(dni)` y `automovil.nro_categoria → categoria(nro_categoria)`. Ambas se incluyen porque cierran la integridad referencial del modelo.
- El enunciado pide que al borrar un cliente se elimine toda la información de los accidentes que lo involucran. Para que esa eliminación no falle por integridad referencial, también se propaga la cascada en `automovil.dni` (un cliente que se va se lleva sus autos) y, en consecuencia, en `accidente.dni`. Así una sola sentencia `DELETE` sobre `cliente` deja todo limpio.
- Las restricciones de dominio se traducen en `CHECK`: `modelo BETWEEN 1990 AND 2015`, `marca IN ('FIAT', 'RENAULT', 'FORD')` y `tarifa > 0 AND tarifa < 10000`, tal como lo exige el enunciado.
- No se agrega `UNIQUE` adicional porque el inciso no sugiere otra clave candidata natural más allá de las primarias.

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

Las inserciones de este inciso están centralizadas en `ejercicio-02/README.md` y se reutilizan tal cual desde las consultas del ejercicio 3.

#### Verificación rápida del esquema

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

El foco del DDL acá está en respetar los dominios (modelo dentro de un rango, marca dentro de un conjunto cerrado, tarifa acotada) y en propagar la eliminación correctamente. Después de cargar los datos del ejercicio 2, los `SELECT` de arriba alcanzan para confirmar que las tablas quedaron pobladas y que las cascadas hacen lo que se espera al hacer pruebas puntuales de borrado.

### Oracle XE 10g/11g

Como en el inciso b, en Oracle la "base" se materializa creando un usuario propietario del esquema. Conectado como administrador:

```sql
CREATE USER practico1c IDENTIFIED BY practico1c;
GRANT CREATE SESSION, CREATE TABLE TO practico1c;
ALTER USER practico1c QUOTA UNLIMITED ON USERS;
```

Y luego, ya como `practico1c`, se ejecuta el DDL:

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

Las inserciones se mantienen en `ejercicio-02/README.md`, igual que en el resto del práctico.

#### Verificación rápida del esquema

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

Mantener separados el DDL y los `INSERT` ayuda especialmente en Oracle, donde es habitual ejecutar los scripts por bloques desde `sqlplus`. Una vez poblada la base, conviene aprovechar los `SELECT` para confirmar tanto el contenido cargado como el correcto funcionamiento de los `CHECK` y de las cascadas declaradas.
