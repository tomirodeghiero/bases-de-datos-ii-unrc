CREATE SCHEMA IF NOT EXISTS practico3_ej2;
SET search_path TO practico3_ej2;

DROP TABLE IF EXISTS cotizacion;
DROP TABLE IF EXISTS banco;

CREATE TABLE banco (
    cod_banco INTEGER PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    precio NUMERIC(12,4) NOT NULL,
    cotizacion_maxima NUMERIC(12,4),
    CONSTRAINT ck_banco_precio CHECK (precio > 0),
    CONSTRAINT ck_banco_cot_max CHECK (cotizacion_maxima IS NULL OR cotizacion_maxima > 0)
);

CREATE TABLE cotizacion (
    cod_cotizacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cod_banco INTEGER NOT NULL,
    cotizacion NUMERIC(12,4) NOT NULL,
    CONSTRAINT ck_cotizacion_valor CHECK (cotizacion > 0),
    CONSTRAINT fk_cotizacion_banco
        FOREIGN KEY (cod_banco)
        REFERENCES banco(cod_banco)
        ON DELETE RESTRICT
);

CREATE INDEX idx_cotizacion_cod_banco ON cotizacion(cod_banco);

CREATE OR REPLACE FUNCTION practico3_ej2.fn_actualizar_cotizacion_maxima(
    IN p_cod_banco INTEGER,
    OUT p_cotizacion_maxima NUMERIC(12,4)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cot NUMERIC(12,4);
BEGIN
    PERFORM 1
      FROM practico3_ej2.banco b
     WHERE b.cod_banco = p_cod_banco
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe banco con cod_banco=%', p_cod_banco;
    END IF;

    p_cotizacion_maxima := NULL;

    FOR v_cot IN
        SELECT c.cotizacion
          FROM practico3_ej2.cotizacion c
         WHERE c.cod_banco = p_cod_banco
    LOOP
        IF p_cotizacion_maxima IS NULL OR v_cot > p_cotizacion_maxima THEN
            p_cotizacion_maxima := v_cot;
        END IF;
    END LOOP;

    IF p_cotizacion_maxima IS NULL THEN
        RAISE EXCEPTION 'El banco % no tiene cotizaciones cargadas', p_cod_banco;
    END IF;

    UPDATE practico3_ej2.banco b
       SET cotizacion_maxima = p_cotizacion_maxima
     WHERE b.cod_banco = p_cod_banco;

    RETURN;
END;
$$;

INSERT INTO banco (cod_banco, nombre, precio, cotizacion_maxima) VALUES
    (1, 'Banco Rio', 1200.0000, NULL),
    (2, 'Banco Sur', 950.0000, NULL);

INSERT INTO cotizacion (cod_banco, cotizacion) VALUES
    (1, 1210.5000),
    (1, 1198.2000),
    (1, 1245.7500),
    (1, 1222.1000),
    (2, 960.0000),
    (2, 1001.3000),
    (2, 998.9000);
