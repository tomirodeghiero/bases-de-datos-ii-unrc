# Ejercicio 1 - Consultas sobre `jsonInventario.txt`

Para este ejercicio se uso:

- archivo: `practico-07/recursos/json/jsonInventario.txt`
- clase: `practico-07/recursos/json/src/jsonPath/Ejercicio1Inventario.java`

## Consultas resueltas

### a) Todos los items del inventario

```text
$.inventario.items[*]
```

### b) Nombre de todos los items

```text
$.inventario.items[*].nombre
```

Resultado:

```json
["tv","notebook","mesa","planner","postcard"]
```

### c) Items que estan bajos en stock

Se tomo como criterio `cantidad < stock_min` (donde `stock_min` esta en la raiz del JSON).

```text
$.inventario.items[?(@.cantidad < $['stock_min'])]
```

Da como resultado:

- `tv` (25)
- `notebook` (50)
- `postcard` (45)

### d) Colores de los items cuyo alto es mayor a 10 cm

Se filtro por `tamanio.unidad == "cm"` y `tamanio.alto > 10`.

```text
$.inventario.items[?(@.tamanio.unidad == 'cm' && @.tamanio.alto > 10)].colores[*]
```

Resultado:

```json
["negro","amarillo"]
```

## Ejecucion

Desde `practico-07/recursos/json`:

```bash
javac -cp "lib/*" -d bin src/jsonPath/Ejercicio1Inventario.java
java -cp "bin:lib/*" jsonPath.Ejercicio1Inventario
```

Puede aparecer una advertencia de `SLF4J`, pero no afecta la salida de las consultas.
