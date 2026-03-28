# Ejercicio 3 - Planificacion con protocolo de marcas temporales

Transacciones dadas:

- `T1`: `leer(X)`, `escribir(X)`, `leer(Y)`, `escribir(Y)`
- `T2`: `leer(X)`, `escribir(X)`
- `T3`: `leer(Y)`, `escribir(Y)`

## 1) Marcas temporales de las transacciones

Asigno marcas temporales crecientes al iniciar:

- `MT(T1) = 1`
- `MT(T2) = 2`
- `MT(T3) = 3`

Estado inicial de los items:

- `MT-E(X)=0`, `MT-L(X)=0`
- `MT-E(Y)=0`, `MT-L(Y)=0`

Donde:

- `MT-E(Q)`: mayor marca temporal de transacciones que escribieron `Q` con exito.
- `MT-L(Q)`: mayor marca temporal de transacciones que leyeron `Q` con exito.

## 2) Planificacion propuesta

Una planificacion concurrente valida con protocolo de marcas temporales:

`r1(X), w1(X), r2(X), w2(X), r1(Y), w1(Y), r3(Y), w3(Y)`

## 3) Evolucion paso a paso de MT-E y MT-L

| Paso | Operacion | Validacion del protocolo | MT-E(X) | MT-L(X) | MT-E(Y) | MT-L(Y) |
|---|---|---|---:|---:|---:|---:|
| 0 | Estado inicial | - | 0 | 0 | 0 | 0 |
| 1 | `r1(X)` | `MT(T1)=1 >= MT-E(X)=0` => lectura permitida. `MT-L(X)=max(0,1)=1` | 0 | 1 | 0 | 0 |
| 2 | `w1(X)` | `1 < MT-L(X)=1`? no. `1 < MT-E(X)=0`? no. Escritura permitida. `MT-E(X)=1` | 1 | 1 | 0 | 0 |
| 3 | `r2(X)` | `MT(T2)=2 >= MT-E(X)=1` => lectura permitida. `MT-L(X)=max(1,2)=2` | 1 | 2 | 0 | 0 |
| 4 | `w2(X)` | `2 < MT-L(X)=2`? no. `2 < MT-E(X)=1`? no. Escritura permitida. `MT-E(X)=2` | 2 | 2 | 0 | 0 |
| 5 | `r1(Y)` | `MT(T1)=1 >= MT-E(Y)=0` => lectura permitida. `MT-L(Y)=max(0,1)=1` | 2 | 2 | 0 | 1 |
| 6 | `w1(Y)` | `1 < MT-L(Y)=1`? no. `1 < MT-E(Y)=0`? no. Escritura permitida. `MT-E(Y)=1` | 2 | 2 | 1 | 1 |
| 7 | `r3(Y)` | `MT(T3)=3 >= MT-E(Y)=1` => lectura permitida. `MT-L(Y)=max(1,3)=3` | 2 | 2 | 1 | 3 |
| 8 | `w3(Y)` | `3 < MT-L(Y)=3`? no. `3 < MT-E(Y)=1`? no. Escritura permitida. `MT-E(Y)=3` | 2 | 2 | 3 | 3 |

## 4) Resultado final

Luego de ejecutar la planificacion:

- Para `X`: `MT-E(X)=2`, `MT-L(X)=2`
- Para `Y`: `MT-E(Y)=3`, `MT-L(Y)=3`

No hay abortos en esta planificacion porque en cada operacion se cumplen las condiciones del protocolo de ordenamiento por marcas temporales.
