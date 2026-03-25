# Ejercicio 1

Enunciado resumido: agregar a `factura` el campo de cantidad maxima de items permitidos y evitar que una factura tenga mas items que ese limite.

La solucion se implementa con:

- cambio de estructura (`ALTER TABLE factura`);
- trigger sobre `item_factura` para bloquear altas/traslados que excedan el maximo;
- trigger sobre `factura` para impedir bajar el maximo por debajo de los items ya cargados.

## MySQL 8+

Base usada: `practico1a_mysql` (ejercicio 1.a del practico 1).

```sql
USE practico1a_mysql;

-- 1) Agregar columna con un valor por defecto para no romper datos existentes.
ALTER TABLE factura
    ADD COLUMN cantidad_maxima_items INT NOT NULL DEFAULT 10,
    ADD CONSTRAINT ck_factura_cantidad_maxima_items
        CHECK (cantidad_maxima_items > 0);

-- 2) Trigger para INSERT de item_factura.
--    Controla que la cantidad de renglones por factura no supere el maximo.
DROP TRIGGER IF EXISTS bi_item_factura_control_max_items;
DELIMITER $$
CREATE TRIGGER bi_item_factura_control_max_items
BEFORE INSERT ON item_factura
FOR EACH ROW
BEGIN
    DECLARE v_max INT;
    DECLARE v_actual INT;

    SELECT f.cantidad_maxima_items
      INTO v_max
      FROM factura f
     WHERE f.nro_factura = NEW.nro_factura;

    SELECT COUNT(*)
      INTO v_actual
      FROM item_factura i
     WHERE i.nro_factura = NEW.nro_factura;

    IF v_actual + 1 > v_max THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La factura supera la cantidad maxima de items permitidos';
    END IF;
END$$
DELIMITER ;

-- 3) Trigger para UPDATE de item_factura.
--    Solo valida cuando el item se mueve a otra factura.
DROP TRIGGER IF EXISTS bu_item_factura_control_max_items;
DELIMITER $$
CREATE TRIGGER bu_item_factura_control_max_items
BEFORE UPDATE ON item_factura
FOR EACH ROW
BEGIN
    DECLARE v_max INT;
    DECLARE v_actual INT;

    IF NEW.nro_factura <> OLD.nro_factura THEN
        SELECT f.cantidad_maxima_items
          INTO v_max
          FROM factura f
         WHERE f.nro_factura = NEW.nro_factura;

        SELECT COUNT(*)
          INTO v_actual
          FROM item_factura i
         WHERE i.nro_factura = NEW.nro_factura;

        IF v_actual + 1 > v_max THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'La factura destino supera la cantidad maxima de items permitidos';
        END IF;
    END IF;
END$$
DELIMITER ;

-- 4) Trigger para UPDATE de factura.
--    Impide reducir el maximo por debajo de la cantidad de items ya existentes.
DROP TRIGGER IF EXISTS bu_factura_control_max_items;
DELIMITER $$
CREATE TRIGGER bu_factura_control_max_items
BEFORE UPDATE ON factura
FOR EACH ROW
BEGIN
    DECLARE v_actual INT;

    IF NEW.cantidad_maxima_items <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'cantidad_maxima_items debe ser mayor que 0';
    END IF;

    IF NEW.cantidad_maxima_items <> OLD.cantidad_maxima_items THEN
        SELECT COUNT(*)
          INTO v_actual
          FROM item_factura i
         WHERE i.nro_factura = OLD.nro_factura;

        IF v_actual > NEW.cantidad_maxima_items THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede reducir el maximo: ya hay mas items cargados';
        END IF;
    END IF;
END$$
DELIMITER ;
```

## PostgreSQL 14+

Esquema usado: `practico1a` (ejercicio 1.a del practico 1).

```sql
SET search_path TO practico1a;

-- 1) Agregar columna con default para datos existentes.
ALTER TABLE practico1a.factura
    ADD COLUMN cantidad_maxima_items INTEGER NOT NULL DEFAULT 10;

ALTER TABLE practico1a.factura
    ADD CONSTRAINT ck_factura_cantidad_maxima_items
    CHECK (cantidad_maxima_items > 0);

-- 2) Funcion + trigger para INSERT/UPDATE en item_factura.
DROP TRIGGER IF EXISTS biu_item_factura_control_max_items ON practico1a.item_factura;
DROP FUNCTION IF EXISTS practico1a.fn_control_max_items_item_factura();

CREATE OR REPLACE FUNCTION practico1a.fn_control_max_items_item_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max INTEGER;
    v_actual INTEGER;
BEGIN
    -- En UPDATE de la misma factura no cambia la cantidad de items.
    IF TG_OP = 'UPDATE' AND NEW.nro_factura = OLD.nro_factura THEN
        RETURN NEW;
    END IF;

    SELECT f.cantidad_maxima_items
      INTO v_max
      FROM practico1a.factura f
     WHERE f.nro_factura = NEW.nro_factura
     FOR UPDATE;

    SELECT COUNT(*)
      INTO v_actual
      FROM practico1a.item_factura i
     WHERE i.nro_factura = NEW.nro_factura;

    IF v_actual + 1 > v_max THEN
        RAISE EXCEPTION 'La factura % supera la cantidad maxima de items permitidos (%).',
            NEW.nro_factura, v_max;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER biu_item_factura_control_max_items
BEFORE INSERT OR UPDATE ON practico1a.item_factura
FOR EACH ROW
EXECUTE FUNCTION practico1a.fn_control_max_items_item_factura();

-- 3) Funcion + trigger para UPDATE de factura.cantidad_maxima_items.
DROP TRIGGER IF EXISTS bu_factura_control_max_items ON practico1a.factura;
DROP FUNCTION IF EXISTS practico1a.fn_control_update_max_items_factura();

CREATE OR REPLACE FUNCTION practico1a.fn_control_update_max_items_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actual INTEGER;
BEGIN
    IF NEW.cantidad_maxima_items <= 0 THEN
        RAISE EXCEPTION 'cantidad_maxima_items debe ser mayor que 0';
    END IF;

    IF NEW.cantidad_maxima_items <> OLD.cantidad_maxima_items THEN
        SELECT COUNT(*)
          INTO v_actual
          FROM practico1a.item_factura i
         WHERE i.nro_factura = OLD.nro_factura;

        IF v_actual > NEW.cantidad_maxima_items THEN
            RAISE EXCEPTION
                'No se puede reducir el maximo de la factura %: tiene % items cargados',
                OLD.nro_factura, v_actual;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER bu_factura_control_max_items
BEFORE UPDATE OF cantidad_maxima_items ON practico1a.factura
FOR EACH ROW
EXECUTE FUNCTION practico1a.fn_control_update_max_items_factura();
```

## Prueba rapida (ambos motores)

Usando los datos cargados en el practico 1:

```sql
-- Factura 1001 tiene 2 items en la carga base.
UPDATE factura
SET cantidad_maxima_items = 2
WHERE nro_factura = 1001;

-- Debe FALLAR: intentaria dejar 3 items en la factura 1001.
INSERT INTO item_factura (cod_producto, nro_factura, cantidad, precio)
VALUES (101, 1001, 1, 15000.00);

-- Debe FALLAR: intenta reducir el maximo por debajo de los 2 items ya cargados.
UPDATE factura
SET cantidad_maxima_items = 1
WHERE nro_factura = 1001;

-- Debe FUNCIONAR: subir el maximo siempre es valido.
UPDATE factura
SET cantidad_maxima_items = 5
WHERE nro_factura = 1001;
```

En PostgreSQL, si estas en `search_path = practico1a`, el bloque es igual.
Si no, usar nombres calificados: `practico1a.factura` y `practico1a.item_factura`.
