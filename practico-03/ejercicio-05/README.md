# Ejercicio 5

Resolucion usando los motores con los que se crearon esas bases en el practico 1:

- Incisos **a** y **b** (base de facturacion 1.a): **MySQL 8+** y **PostgreSQL 14+**.
- Inciso **c** (base de estacionamiento 1.b): **MySQL 8+** y **Oracle XE 10g/11g**.

## Inciso a) Guardar `producto.descripcion` en mayusculas antes del INSERT

### MySQL 8+ (`practico1a_mysql`)

```sql
USE practico1a_mysql;

DROP TRIGGER IF EXISTS bi_producto_mayusculas;
DELIMITER $$
CREATE TRIGGER bi_producto_mayusculas
BEFORE INSERT ON producto
FOR EACH ROW
BEGIN
    SET NEW.descripcion = UPPER(TRIM(NEW.descripcion));
END$$
DELIMITER ;
```

### PostgreSQL 14+ (`practico1a`)

```sql
SET search_path TO practico1a;

DROP TRIGGER IF EXISTS bi_producto_mayusculas ON practico1a.producto;
DROP FUNCTION IF EXISTS practico1a.fn_producto_mayusculas();

CREATE OR REPLACE FUNCTION practico1a.fn_producto_mayusculas()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.descripcion := UPPER(BTRIM(NEW.descripcion));
    RETURN NEW;
END;
$$;

CREATE TRIGGER bi_producto_mayusculas
BEFORE INSERT ON practico1a.producto
FOR EACH ROW
EXECUTE FUNCTION practico1a.fn_producto_mayusculas();
```

## Inciso b) Auditoria luego de cada cambio en `producto.cantidad`

Se pide guardar:

- `cod_producto`;
- `movimiento` (diferencia `NEW.cantidad - OLD.cantidad`);
- `fecha` del cambio;
- usuario que realizo la accion, tomado del usuario logueado en la aplicacion cliente.

### MySQL 8+ (`practico1a_mysql`)

#### 1) Tabla de auditoria

```sql
USE practico1a_mysql;

CREATE TABLE IF NOT EXISTS auditoriaProducto (
    id_auditoria BIGINT AUTO_INCREMENT PRIMARY KEY,
    cod_producto INT NOT NULL,
    movimiento INT NOT NULL,
    fecha_actualizacion DATETIME NOT NULL,
    usuario_aplicacion VARCHAR(100) NOT NULL,
    CONSTRAINT fk_auditoria_producto
        FOREIGN KEY (cod_producto)
        REFERENCES producto(cod_producto)
);
```

#### 2) Trigger de auditoria

```sql
DROP TRIGGER IF EXISTS au_producto_auditoria_cantidad;
DELIMITER $$
CREATE TRIGGER au_producto_auditoria_cantidad
AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
    DECLARE v_usuario_app VARCHAR(100);

    IF NEW.cantidad <> OLD.cantidad THEN
        -- La aplicacion cliente debe setear este valor por sesion.
        -- Ejemplo: SET @app_user_code = 'USR_15';
        SET v_usuario_app = @app_user_code;

        IF v_usuario_app IS NULL OR TRIM(v_usuario_app) = '' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Debe definir @app_user_code en la sesion para auditar la operacion';
        END IF;

        INSERT INTO auditoriaProducto (
            cod_producto,
            movimiento,
            fecha_actualizacion,
            usuario_aplicacion
        )
        VALUES (
            NEW.cod_producto,
            NEW.cantidad - OLD.cantidad,
            NOW(),
            v_usuario_app
        );
    END IF;
END$$
DELIMITER ;
```

#### 3) Uso desde cliente/app

```sql
SET @app_user_code = 'VENDEDOR_APP_01';

UPDATE producto
SET cantidad = cantidad + 5
WHERE cod_producto = 101;

SELECT *
FROM auditoriaProducto
ORDER BY id_auditoria DESC;
```

### PostgreSQL 14+ (`practico1a`)

#### 1) Tabla de auditoria

```sql
SET search_path TO practico1a;

CREATE TABLE IF NOT EXISTS practico1a.auditoria_producto (
    id_auditoria BIGSERIAL PRIMARY KEY,
    cod_producto INTEGER NOT NULL REFERENCES practico1a.producto(cod_producto),
    movimiento INTEGER NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL,
    usuario_aplicacion VARCHAR(100) NOT NULL
);
```

#### 2) Funcion + trigger de auditoria

```sql
DROP TRIGGER IF EXISTS au_producto_auditoria_cantidad ON practico1a.producto;
DROP FUNCTION IF EXISTS practico1a.fn_auditoria_producto_cantidad();

CREATE OR REPLACE FUNCTION practico1a.fn_auditoria_producto_cantidad()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario_app TEXT;
BEGIN
    IF NEW.cantidad <> OLD.cantidad THEN
        -- La aplicacion cliente debe setear esta variable de sesion.
        -- Ejemplo: SET app.user_code = 'USR_15';
        v_usuario_app := current_setting('app.user_code', true);

        IF v_usuario_app IS NULL OR BTRIM(v_usuario_app) = '' THEN
            RAISE EXCEPTION
                'Debe definir app.user_code en la sesion para auditar la operacion';
        END IF;

        INSERT INTO practico1a.auditoria_producto (
            cod_producto,
            movimiento,
            fecha_actualizacion,
            usuario_aplicacion
        )
        VALUES (
            NEW.cod_producto,
            NEW.cantidad - OLD.cantidad,
            NOW(),
            v_usuario_app
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER au_producto_auditoria_cantidad
AFTER UPDATE OF cantidad ON practico1a.producto
FOR EACH ROW
EXECUTE FUNCTION practico1a.fn_auditoria_producto_cantidad();
```

#### 3) Uso desde cliente/app

```sql
SET search_path TO practico1a;
SET app.user_code = 'VENDEDOR_APP_01';

UPDATE practico1a.producto
SET cantidad = cantidad - 2
WHERE cod_producto = 101;

SELECT *
FROM practico1a.auditoria_producto
ORDER BY id_auditoria DESC;
```

## Inciso c) Hacer `parquimetro` autonumerado (base del ejercicio 1.b)

### MySQL 8+ (`practico1b_mysql`)

```sql
USE practico1b_mysql;

ALTER TABLE parquimetro
    MODIFY id_parquimetro INT NOT NULL AUTO_INCREMENT;
```

Prueba:

```sql
INSERT INTO parquimetro (calle, altura)
VALUES ('Colon', 1500);

SELECT * FROM parquimetro ORDER BY id_parquimetro;
```

### Oracle XE 10g/11g (`practico1b`)

En Oracle 10g/11g no hay `IDENTITY`, por eso se resuelve con `SEQUENCE + TRIGGER`.

```sql
-- Limpieza opcional para re-ejecutar el script
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER bi_parquimetro_autonumerado'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_parquimetro'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Crear secuencia arrancando desde MAX(id)+1 (si ya hay datos)
DECLARE
    v_start NUMBER;
BEGIN
    SELECT NVL(MAX(id_parquimetro), 0) + 1
      INTO v_start
      FROM parquimetro;

    EXECUTE IMMEDIATE
        'CREATE SEQUENCE seq_parquimetro START WITH ' || v_start || ' INCREMENT BY 1 NOCACHE NOCYCLE';
END;
/

CREATE OR REPLACE TRIGGER bi_parquimetro_autonumerado
BEFORE INSERT ON parquimetro
FOR EACH ROW
WHEN (NEW.id_parquimetro IS NULL)
BEGIN
    SELECT seq_parquimetro.NEXTVAL
      INTO :NEW.id_parquimetro
      FROM dual;
END;
/
```

Prueba:

```sql
INSERT INTO parquimetro (calle, altura)
VALUES ('Colon', 1500);

SELECT * FROM parquimetro ORDER BY id_parquimetro;
```

## Comentario final

- En **a)** se normaliza el dato antes de guardar (`BEFORE INSERT`).
- En **b)** la auditoria se registra solo cuando cambia `cantidad`; el usuario auditado se toma de variable de sesion seteada por la aplicacion cliente.
- En **c)** MySQL usa `AUTO_INCREMENT`; Oracle XE 10/11 requiere `SEQUENCE + TRIGGER`.
