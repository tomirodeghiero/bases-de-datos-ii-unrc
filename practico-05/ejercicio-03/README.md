# Ejercicio 3 - Estimacion de tamano y orden de join

Datos del enunciado:

- `R1(A, B, C)`, clave: `A`, con `|R1| = 250`
- `R2(C, D, E)`, clave: `C`, con `|R2| = 3000`
- `R3(E, F)`, clave: `E`, con `|R3| = 5000`

Consulta:

- estimar el tamano de `R1 ⋈ R2 ⋈ R3`
- elegir el orden de ejecucion mas eficiente

## 1) Estimacion de cardinalidad

### Join `R1 ⋈ R2` (por `C`)

Como `C` es clave en `R2`, cada tupla de `R1` puede matchear con **a lo sumo una** tupla de `R2`.

Entonces:

- `|R1 ⋈ R2| <= |R1| = 250`

Si asumimos el caso habitual de integridad referencial (los `C` de `R1` referencian `R2.C`), la estimacion queda:

- `|R1 ⋈ R2| = 250`

### Join final con `R3` (por `E`)

Ahora se hace `(R1 ⋈ R2) ⋈ R3`, y `E` es clave en `R3`, por lo tanto cada tupla intermedia matchea con **a lo sumo una** tupla de `R3`.

Entonces:

- `|R1 ⋈ R2 ⋈ R3| <= |R1 ⋈ R2| <= 250`

Con la misma suposicion usual de referencia valida hacia `R3.E`:

- `|R1 ⋈ R2 ⋈ R3| = 250`

Resultado estimado:

- **Cardinalidad esperada del join total: `250` tuplas**.

## 2) Orden de ejecucion mas eficiente

Comparando planes validos:

1. `(R1 ⋈ R2) ⋈ R3`
- Tamaño intermedio estimado: `|R1 ⋈ R2| = 250`
- Muy conveniente porque el resultado intermedio ya es chico.

2. `(R2 ⋈ R3) ⋈ R1`
- Tamaño intermedio estimado: `|R2 ⋈ R3|` puede ser cercano a `3000` (si `E` de `R2` referencia `R3.E`).
- Es bastante mas grande que 250.

Por costo de procesamiento y memoria intermedia, conviene:

- **Primero `R1 ⋈ R2`, luego join con `R3`**.

## Conclusión

- `|R1 ⋈ R2 ⋈ R3|` estimado: **250**.
- Orden recomendado: **`(R1 ⋈ R2) ⋈ R3`**.
