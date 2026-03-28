# Ejercicio 2 - Planificacion concurrente con protocolo de dos fases puro

Se usan las mismas transacciones del ejercicio 1:

- `T1`: `leer(X)`, `X := X - N`, `escribir(X)`, `leer(Y)`, `Y := Y + N`, `escribir(Y)`
- `T2`: `leer(X)`, `X := X + M`, `escribir(X)`

## Criterio de bloqueo usado

Como ambas transacciones escriben sobre `X`, se toma bloqueo **exclusivo** para `X`.
`T1` tambien toma bloqueo exclusivo sobre `Y` porque va a escribir `Y`.

Notacion:

- `LX1(X)`: `T1` bloquea `X` en modo exclusivo.
- `UX1(X)`: `T1` desbloquea `X`.
- Analogamente para `T2` y para `Y`.

## Planificacion concurrente propuesta (2PL puro)

1. `T1: LX1(X)`
2. `T1: LX1(Y)`
3. `T1: leer(X)`
4. `T1: X := X - N`
5. `T1: escribir(X)`
6. `T2: LX2(X)` (queda esperando, porque `T1` tiene `X`)
7. `T1: UX1(X)`  (aca termina la fase de crecimiento de `T1`)
8. `T2: LX2(X)` (concedido)
9. `T2: leer(X)`
10. `T1: leer(Y)`
11. `T2: X := X + M`
12. `T1: Y := Y + N`
13. `T2: escribir(X)`
14. `T2: UX2(X)`
15. `T2: commit`
16. `T1: escribir(Y)`
17. `T1: UX1(Y)`
18. `T1: commit`

## Por que cumple dos fases puro

### `T1`

- **Fase de crecimiento**: pasos 1 y 2 (solo adquiere bloqueos).
- **Fase de decrecimiento**: desde paso 7 (solo libera bloqueos).
- Luego de liberar `X` en el paso 7, `T1` no pide nuevos bloqueos.

### `T2`

- **Fase de crecimiento**: paso 8 (adquiere `X` cuando se concede).
- **Fase de decrecimiento**: paso 14 (libera `X`).
- No vuelve a pedir bloqueos despues de liberar.

Por lo tanto, la planificacion respeta el protocolo de **dos fases puro (2PL basico)**.

## Observacion importante

Esta planificacion es concurrente (hay intercalado real entre `T1` y `T2`) y resulta serializable por conflicto con orden efectivo `T1 -> T2` sobre `X`.

Ademas, al ser 2PL **puro** y no necesariamente **riguroso**, los desbloqueos pueden ocurrir antes del `commit` (como se muestra en la planificacion).
