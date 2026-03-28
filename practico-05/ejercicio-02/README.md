# Ejercicio 2 - Arbol de query y expresiones equivalentes

Esquema dado por el enunciado:

- `articulos(Nart, desc, precio, cant, stock_min, stock_max)`
- `provee(Nprov, Nart, precio_venta)`
- `proveedor(Nprov, nombre, direccion)`
- `cliente(Ncli, nombre, direccion)`
- `compran(Ncli, Nart)`

Para evitar ambiguedad:

- En el inciso (a), se usa `desc` (en el enunciado aparece como `descripcion`).
- En ambos incisos, se toma `articulo` como `articulos`.
- `⋈` se interpreta como join natural sobre los atributos con el mismo nombre (`Nprov`, `Nart`, `Ncli`).

## a) `σ desc = "Pan Rallado" and precio_venta < 15 (proveedor ⋈ provee ⋈ articulos)`

### Expresion base (E0)

`E0 = σ(desc = "Pan Rallado" and precio_venta < 15) (((proveedor ⋈ provee) ⋈ articulos))`

### Arbol de query (E0)

```text
σ(desc = "Pan Rallado" and precio_venta < 15)
                    |
                    ⋈
                  /   \
                ⋈     articulos
               / \
        proveedor provee
```

### Expresiones equivalentes

1. `E1 = σ(desc = "Pan Rallado") ( σ(precio_venta < 15) (((proveedor ⋈ provee) ⋈ articulos)) )`
Justificacion del paso `E0 -> E1`:
Se aplica la regla de cascada de selecciones:
`σ(c1 and c2)(R) = σ(c1)(σ(c2)(R))`.

2. `E2 = (proveedor ⋈ σ(precio_venta < 15)(provee)) ⋈ σ(desc = "Pan Rallado")(articulos)`
Justificacion del paso `E1 -> E2`:
Se aplica push-down de seleccion porque cada condicion usa atributos de una sola relacion:
- `precio_venta < 15` solo depende de `provee`.
- `desc = "Pan Rallado"` solo depende de `articulos`.

3. `E3 = proveedor ⋈ (σ(precio_venta < 15)(provee) ⋈ σ(desc = "Pan Rallado")(articulos))`
Justificacion del paso `E2 -> E3`:
Se usa asociatividad (y conmutatividad) del join para reordenar:
conviene unir primero relaciones ya filtradas.

## b) `σ precio > 25 (cliente ⋈ compran ⋈ articulos)`

### Expresion base (E0)

`E0 = σ(precio > 25) (((cliente ⋈ compran) ⋈ articulos))`

### Arbol de query (E0)

```text
σ(precio > 25)
        |
        ⋈
      /   \
    ⋈     articulos
   / \
cliente compran
```

### Expresiones equivalentes

1. `E1 = ((cliente ⋈ compran) ⋈ σ(precio > 25)(articulos))`
Justificacion del paso `E0 -> E1`:
Push-down de seleccion, ya que `precio > 25` depende solo de `articulos`.

2. `E2 = cliente ⋈ (compran ⋈ σ(precio > 25)(articulos))`
Justificacion del paso `E1 -> E2`:
Asociatividad del join para unir primero `compran` con `articulos` ya filtrado.

3. `E3 = (σ(precio > 25)(articulos) ⋈ compran) ⋈ cliente`
Justificacion del paso `E2 -> E3`:
Conmutatividad y asociatividad del join para una forma equivalente alternativa.

## Nota

Las transformaciones mantienen equivalencia semantica y, en general, mejoran costo al bajar selecciones lo antes posible para reducir cardinalidad intermedia.
