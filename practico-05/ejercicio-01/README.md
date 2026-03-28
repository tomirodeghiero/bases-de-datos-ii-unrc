# Ejercicio 1 - Seleccion de algoritmos para consultas

Dada la relacion:

- `curso(codigo, nombre, cantidad_inscriptos, cupo_maximo)`

Con las siguientes condiciones del enunciado:

- `codigo` es clave primaria.
- Hay indice secundario sobre `cantidad_inscriptos`.
- Hay indice secundario sobre `cupo_maximo`.

La seleccion de algoritmos queda asi:

## a) `σ codigo = 1001 (curso)`

Algoritmo elegido: **A1 (busqueda lineal)**.

Justificacion:

- No se informa ningun indice sobre `codigo`.
- Como `codigo` es clave primaria, existe a lo sumo una tupla que cumple la igualdad, por lo que la busqueda puede detenerse cuando aparece.

## b) `σ codigo < 1000 (curso)`

Algoritmo elegido: **A1 (busqueda lineal)**.

Justificacion:

- Es una condicion de rango sobre `codigo`.
- Como no se especifica indice sobre ese atributo, no se puede explotar A6/A7 ni busqueda binaria por indice.

## c) `σ cantidad_inscriptos = 40 (curso)`

Algoritmo elegido: **A5 (igualdad usando indice secundario)**.

Justificacion:

- Hay indice secundario sobre `cantidad_inscriptos`.
- La condicion es de igualdad, caso directo de A5.

## d) `σ cantidad_inscriptos < 50 (curso)`

Algoritmo elegido: **A7 (rango usando indice secundario)**.

Justificacion:

- Hay indice secundario sobre `cantidad_inscriptos`.
- La condicion es de rango (`< 50`), y A7 esta definido para ese escenario con indices secundarios.

## e) `σ cantidad_inscriptos = 50 and cupo_maximo > 40 (curso)`

Algoritmo elegido: **A10 (conjuncion por interseccion de identificadores)**.

Justificacion:

- La consulta es una conjuncion de dos condiciones.
- Existen indices para ambas: `cantidad_inscriptos` (igualdad) y `cupo_maximo` (rango).
- Se obtienen los punteros/RID de cada condicion usando los indices correspondientes y luego se intersectan.
- Finalmente se recuperan solo las tuplas que quedaron en la interseccion.

## Nota practica

Aunque los algoritmos anteriores son los correctos segun el enunciado y la teoria, un optimizador real puede elegir escaneo lineal en consultas de baja selectividad (por ejemplo, si `cantidad_inscriptos < 50` devuelve gran parte de la tabla).
