# Ejercicio 3 (Oracle)

Enunciado resumido:

1. Crear tablas `cuenta` y `movimiento`.
2. Crear procedimientos almacenados:
   - a) insertar movimiento y mantener consistente `cuenta.saldo`, imprimiendo nro de cuenta y saldo actual;
   - b) calcular saldo de una cuenta a una fecha dada, mostrarlo por pantalla y retornarlo por parametro.

## Script SQL completo (Oracle 10g/11g XE)

```sql
SET SERVEROUTPUT ON;

-- Limpieza opcional para re-ejecutar
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER bi_movimiento'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_movimiento'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE movimiento'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE cuenta'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- 1) Tablas
CREATE TABLE cuenta (
    nro_cuenta NUMBER(10) CONSTRAINT pk_cuenta PRIMARY KEY,
    saldo NUMBER(14,2) DEFAULT 0 NOT NULL
);

CREATE TABLE movimiento (
    nro_movimiento NUMBER(12) CONSTRAINT pk_movimiento PRIMARY KEY,
    nro_cuenta NUMBER(10) NOT NULL,
    fecha DATE DEFAULT SYSDATE NOT NULL,
    debe NUMBER(14,2) DEFAULT 0 NOT NULL,
    haber NUMBER(14,2) DEFAULT 0 NOT NULL,
    CONSTRAINT fk_movimiento_cuenta
        FOREIGN KEY (nro_cuenta)
        REFERENCES cuenta(nro_cuenta),
    CONSTRAINT ck_mov_montos_no_negativos
        CHECK (debe >= 0 AND haber >= 0),
    CONSTRAINT ck_mov_operacion_valida
        CHECK ((debe > 0 AND haber = 0) OR (haber > 0 AND debe = 0))
);

-- Oracle XE 10/11: autonumerico via sequence + trigger.
CREATE SEQUENCE seq_movimiento
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE OR REPLACE TRIGGER bi_movimiento
BEFORE INSERT ON movimiento
FOR EACH ROW
BEGIN
    IF :NEW.nro_movimiento IS NULL THEN
        SELECT seq_movimiento.NEXTVAL
          INTO :NEW.nro_movimiento
          FROM dual;
    END IF;

    IF :NEW.fecha IS NULL THEN
        :NEW.fecha := SYSDATE;
    END IF;
END;
/

-- 2.a) Procedimiento: insertar movimiento y actualizar saldo
CREATE OR REPLACE PROCEDURE sp_registrar_movimiento (
    p_nro_cuenta IN cuenta.nro_cuenta%TYPE,
    p_debe       IN NUMBER,
    p_haber      IN NUMBER
)
IS
    v_saldo_actual cuenta.saldo%TYPE;
    v_debe NUMBER(14,2) := NVL(p_debe, 0);
    v_haber NUMBER(14,2) := NVL(p_haber, 0);
BEGIN
    IF v_debe < 0 OR v_haber < 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Debe/Haber no pueden ser negativos');
    END IF;

    IF NOT ((v_debe > 0 AND v_haber = 0) OR (v_haber > 0 AND v_debe = 0)) THEN
        RAISE_APPLICATION_ERROR(-20002, 'La operacion debe tener solo DEBE o solo HABER');
    END IF;

    -- Bloqueo de la cuenta para mantener consistencia en concurrencia.
    SELECT c.saldo
      INTO v_saldo_actual
      FROM cuenta c
     WHERE c.nro_cuenta = p_nro_cuenta
     FOR UPDATE;

    INSERT INTO movimiento (nro_cuenta, fecha, debe, haber)
    VALUES (p_nro_cuenta, SYSDATE, v_debe, v_haber);

    UPDATE cuenta c
       SET c.saldo = c.saldo + v_debe - v_haber
     WHERE c.nro_cuenta = p_nro_cuenta
     RETURNING c.saldo INTO v_saldo_actual;

    DBMS_OUTPUT.PUT_LINE(
        'Cuenta: ' || p_nro_cuenta || ' | Saldo actual: ' ||
        TO_CHAR(v_saldo_actual, 'FM9999999990D00')
    );
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20003, 'No existe la cuenta ' || p_nro_cuenta);
END;
/

-- 2.b) Procedimiento: saldo de una cuenta a una fecha
-- Devuelve por OUT e imprime por pantalla.
CREATE OR REPLACE PROCEDURE sp_saldo_a_fecha (
    p_nro_cuenta IN cuenta.nro_cuenta%TYPE,
    p_fecha      IN DATE,
    p_saldo      OUT NUMBER
)
IS
    v_saldo_actual cuenta.saldo%TYPE;
    v_delta_posterior NUMBER(14,2);
BEGIN
    -- Saldo actual guardado.
    SELECT c.saldo
      INTO v_saldo_actual
      FROM cuenta c
     WHERE c.nro_cuenta = p_nro_cuenta;

    -- Movimientos posteriores a la fecha consultada.
    SELECT NVL(SUM(m.debe - m.haber), 0)
      INTO v_delta_posterior
      FROM movimiento m
     WHERE m.nro_cuenta = p_nro_cuenta
       AND m.fecha > p_fecha;

    p_saldo := v_saldo_actual - v_delta_posterior;

    DBMS_OUTPUT.PUT_LINE(
        'Cuenta: ' || p_nro_cuenta ||
        ' | Fecha: ' || TO_CHAR(p_fecha, 'YYYY-MM-DD HH24:MI:SS') ||
        ' | Saldo: ' || TO_CHAR(p_saldo, 'FM9999999990D00')
    );
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20004, 'No existe la cuenta ' || p_nro_cuenta);
END;
/
```

## Prueba de ejecucion

```sql
SET SERVEROUTPUT ON;

-- Cuentas de ejemplo
INSERT INTO cuenta (nro_cuenta, saldo) VALUES (1001, 0);
INSERT INTO cuenta (nro_cuenta, saldo) VALUES (1002, 500);

-- Movimientos de cuenta 1001 (credito/debito)
BEGIN
    sp_registrar_movimiento(1001, 1000, 0); -- saldo 1000
    sp_registrar_movimiento(1001, 0, 150);  -- saldo 850
    sp_registrar_movimiento(1001, 200, 0);  -- saldo 1050
END;
/

-- Consultar saldo a fecha (por OUT + salida en pantalla)
DECLARE
    v_saldo NUMBER;
BEGIN
    sp_saldo_a_fecha(1001, SYSDATE, v_saldo);
    DBMS_OUTPUT.PUT_LINE('Saldo retornado por OUT: ' || TO_CHAR(v_saldo, 'FM9999999990D00'));
END;
/

-- Verificacion final
SELECT * FROM cuenta ORDER BY nro_cuenta;
SELECT * FROM movimiento ORDER BY nro_movimiento;
```

## Comentario tecnico

- El procedimiento `sp_registrar_movimiento` garantiza atomicidad logica:
  - valida parametros;
  - inserta movimiento;
  - actualiza saldo de la cuenta en la misma transaccion.
- El calculo de `sp_saldo_a_fecha` parte del saldo actual y revierte movimientos posteriores a la fecha pedida.
- Se usa `DBMS_OUTPUT.PUT_LINE` para cumplir el requisito de "imprimir por pantalla".
