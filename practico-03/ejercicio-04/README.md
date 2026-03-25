# Ejercicio 4 (MySQL 8+)

Enunciado resumido:

- Usar la base del ejercicio 1.a (`practico1a_mysql`).
- Crear un procedimiento que detecte facturas inconsistentes:
  - inconsistente = `monto factura` distinto de `suma(cantidad * precio)` de sus items.
- Guardar esas inconsistencias en una tabla.
- Condiciones:
  - el procedimiento debe ser creado por `vendedor2`;
  - debe ejecutarse con permisos del invocador (`SQL SECURITY INVOKER`);
  - ejecutarlo con `vendedor2` y `vendedor1`.

## 1) Preparacion (como root)

Nota importante: en el practico 2 se revocaron todos los permisos de `vendedor2`, por eso primero hay que reotorgar los minimos.

```sql
USE practico1a_mysql;

-- Tabla donde se guardan las inconsistencias detectadas
CREATE TABLE IF NOT EXISTS facturas_inconsistentes (
    nro_factura INT PRIMARY KEY,
    monto_factura DECIMAL(12,2) NOT NULL,
    monto_items DECIMAL(12,2) NOT NULL,
    diferencia DECIMAL(12,2) NOT NULL,
    fecha_control DATETIME NOT NULL,
    usuario_ejecucion VARCHAR(100) NOT NULL
);

-- Permisos minimos para que vendedor2 pueda crear el procedimiento
GRANT CREATE ROUTINE ON practico1a_mysql.* TO 'vendedor2'@'localhost';

-- Como el procedimiento corre con SQL SECURITY INVOKER,
-- cada usuario que lo ejecute necesita estos permisos:
GRANT SELECT (nro_factura, monto)
ON practico1a_mysql.factura
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost';

GRANT SELECT (nro_factura, cantidad, precio)
ON practico1a_mysql.item_factura
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost';

GRANT INSERT, UPDATE, SELECT
ON practico1a_mysql.facturas_inconsistentes
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost';
```

## 2) Crear el procedimiento como vendedor2

Entrar con:

```bash
mysql -u vendedor2 -p practico1a_mysql
```

Luego crear el procedimiento:

```sql
DROP PROCEDURE IF EXISTS sp_guardar_facturas_inconsistentes;
DELIMITER $$
CREATE PROCEDURE sp_guardar_facturas_inconsistentes()
SQL SECURITY INVOKER
BEGIN
    INSERT INTO facturas_inconsistentes (
        nro_factura,
        monto_factura,
        monto_items,
        diferencia,
        fecha_control,
        usuario_ejecucion
    )
    SELECT
        f.nro_factura,
        f.monto AS monto_factura,
        ROUND(COALESCE(SUM(i.cantidad * i.precio), 0), 2) AS monto_items,
        ROUND(COALESCE(SUM(i.cantidad * i.precio), 0) - f.monto, 2) AS diferencia,
        NOW() AS fecha_control,
        USER() AS usuario_ejecucion
    FROM factura f
    LEFT JOIN item_factura i
        ON i.nro_factura = f.nro_factura
    GROUP BY f.nro_factura, f.monto
    HAVING ROUND(COALESCE(SUM(i.cantidad * i.precio), 0), 2) <> ROUND(f.monto, 2)
    ON DUPLICATE KEY UPDATE
        monto_factura = VALUES(monto_factura),
        monto_items = VALUES(monto_items),
        diferencia = VALUES(diferencia),
        fecha_control = VALUES(fecha_control),
        usuario_ejecucion = VALUES(usuario_ejecucion);
END$$
DELIMITER ;
```

Verificacion del punto (a):

```sql
SHOW CREATE PROCEDURE sp_guardar_facturas_inconsistentes;
```

En la salida debe verse:

- `DEFINER` = `vendedor2@localhost`
- `SQL SECURITY INVOKER`

## 3) Permiso EXECUTE (como root)

```sql
GRANT EXECUTE ON PROCEDURE practico1a_mysql.sp_guardar_facturas_inconsistentes
TO 'vendedor1'@'localhost', 'vendedor2'@'localhost';
```

## 4) Prueba de ejecucion con vendedor2 y vendedor1

Primero generar una inconsistencia (como root, porque normalmente vendedores no tienen `UPDATE` sobre `factura`):

```sql
USE practico1a_mysql;
UPDATE factura
SET monto = monto + 100
WHERE nro_factura = 1001;
```

### 4.1 Ejecutar como vendedor2

```bash
mysql -u vendedor2 -p practico1a_mysql
```

```sql
CALL sp_guardar_facturas_inconsistentes();
SELECT * FROM facturas_inconsistentes ORDER BY fecha_control DESC, nro_factura;
```

### 4.2 Ejecutar como vendedor1

```bash
mysql -u vendedor1 -p practico1a_mysql
```

```sql
CALL sp_guardar_facturas_inconsistentes();
SELECT * FROM facturas_inconsistentes ORDER BY fecha_control DESC, nro_factura;
```

Con esto se cumple el punto (b): ambos usuarios ejecutan el procedimiento correctamente.

## Comentario tecnico

- Se uso `SQL SECURITY INVOKER`, por lo tanto el control de permisos se hace contra quien llama al procedimiento.
- Por eso se otorgaron a `vendedor1` y `vendedor2` permisos de `SELECT` sobre `factura/item_factura` y `INSERT/UPDATE` sobre `facturas_inconsistentes`.
- `ON DUPLICATE KEY UPDATE` evita duplicar una misma factura inconsistente y actualiza su ultimo estado de control.
