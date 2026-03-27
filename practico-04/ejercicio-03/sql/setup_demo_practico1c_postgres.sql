DROP SCHEMA IF EXISTS practico1c CASCADE;
CREATE SCHEMA practico1c;
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
