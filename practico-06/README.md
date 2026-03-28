# Practico 06 - Transacciones

Resolucion del Practico 6 enfocada en planificaciones concurrentes, serializabilidad por conflicto y justificacion con grafo de precedencia.

## Base teorica usada

- `Teorico_8_Transacciones_y_control_de_concurrencia_145712475100.pdf`: transacciones ACID, planificaciones, conflictos, serializabilidad por conflicto y test del grafo de precedencia.

## Estructura

- `ejercicio-01/README.md`: resolucion detallada del ejercicio 1 (una planificacion concurrente serializable por conflicto y otra no serializable).
- `ejercicio-02/README.md`: planificacion concurrente aplicando protocolo de dos fases puro (2PL basico).
- `ejercicio-03/README.md`: planificacion con protocolo de marcas temporales y evolucion de `MT-E` y `MT-L` para `X` e `Y`.
- `ejercicio-04/README.md`: prueba en MySQL CLI de `UPDATE` dentro de transaccion, verificacion y `ROLLBACK`.
- `ejercicio-05/README.md`: prueba concurrente con dos sesiones en nivel `SERIALIZABLE` modificando el mismo registro de `cliente`.
- `ejercicio-06/README.md`: prueba de lectura no repetible en MySQL y niveles de aislamiento que la permiten.
- `ejercicio-07/README.md`: uso de `DEFERRABLE CONSTRAINTS` en PostgreSQL para permitir o forzar excepcion en una transaccion con FK.
- `ejercicio-08/README.md`: prueba MVCC en PostgreSQL para que dos transacciones vean distintos valores de la misma fila, observando `xmin` y `xmax`.
