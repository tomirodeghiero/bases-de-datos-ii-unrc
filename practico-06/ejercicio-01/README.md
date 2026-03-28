# Ejercicio 1 - Planificaciones concurrentes y serializabilidad por conflicto

Transacciones dadas por el enunciado:

- `T1`:
  - `leer(X)`
  - `X := X - N`
  - `escribir(X)`
  - `leer(Y)`
  - `Y := Y + N`
  - `escribir(Y)`
- `T2`:
  - `leer(X)`
  - `X := X + M`
  - `escribir(X)`

Para analizar serializabilidad por conflicto, uso notacion corta:

- `r1(X)` = leer(X) de `T1`
- `w1(X)` = escribir(X) de `T1`
- `r2(X)` = leer(X) de `T2`
- `w2(X)` = escribir(X) de `T2`

Las asignaciones locales (`X := ...`, `Y := ...`) no generan conflicto entre transacciones porque no acceden a disco por si solas.

## 1) Planificacion concurrente serializable por conflicto

Una planificacion valida (intercalada, no totalmente secuencial) es:

`S1 = r1(X), w1(X), r2(X), w2(X), r1(Y), w1(Y)`

Si la escribimos con el detalle del enunciado:

1. `T1: leer(X)`
2. `T1: X := X - N`
3. `T1: escribir(X)`
4. `T2: leer(X)`
5. `T2: X := X + M`
6. `T2: escribir(X)`
7. `T1: leer(Y)`
8. `T1: Y := Y + N`
9. `T1: escribir(Y)`

### Justificacion (conflictos y grafo)

Los conflictos entre `T1` y `T2` aparecen solo sobre `X`:

- `w1(X)` antes de `r2(X)`  => arco `T1 -> T2`
- `w1(X)` antes de `w2(X)`  => arco `T1 -> T2`
- `r1(X)` antes de `w2(X)`  => arco `T1 -> T2`

No aparece ningun conflicto que fuerce `T2 -> T1`.

Grafo de precedencia:

- nodos: `{T1, T2}`
- arcos: `{T1 -> T2}`

Como el grafo no tiene ciclos, `S1` es **serializable por conflicto** (equivalente a la serie `T1` luego `T2`).

## 2) Planificacion concurrente no serializable por conflicto

Una planificacion concurrente que no es serializable por conflicto:

`S2 = r1(X), r2(X), w1(X), w2(X), r1(Y), w1(Y)`

Con detalle:

1. `T1: leer(X)`
2. `T2: leer(X)`
3. `T1: X := X - N`
4. `T1: escribir(X)`
5. `T2: X := X + M`
6. `T2: escribir(X)`
7. `T1: leer(Y)`
8. `T1: Y := Y + N`
9. `T1: escribir(Y)`

### Justificacion (conflictos y grafo)

Conflictos relevantes sobre `X`:

- `r1(X)` antes de `w2(X)`  => arco `T1 -> T2`
- `r2(X)` antes de `w1(X)`  => arco `T2 -> T1`

Grafo de precedencia:

- nodos: `{T1, T2}`
- arcos: `{T1 -> T2, T2 -> T1}`

Hay ciclo (`T1 <-> T2`), por lo tanto `S2` **no es serializable por conflicto**.

## Conclusion

Se pidieron dos planificaciones concurrentes:

- `S1`: concurrente y **serializable por conflicto**.
- `S2`: concurrente y **no serializable por conflicto**.

La diferencia entre ambas se verifica formalmente con el grafo de precedencia.
