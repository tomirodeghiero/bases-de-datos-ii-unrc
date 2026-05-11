# Ejercicio 1 - Seleccion de algoritmos para consultas

Dada la relacion:

- `curso(codigo, nombre, cantidad_inscriptos, cupo_maximo)`

Condiciones del enunciado:

- `codigo` es clave primaria.
- Hay indice secundario sobre `cantidad_inscriptos`.
- Hay indice secundario sobre `cupo_maximo`.

Para cada consulta se justifica el algoritmo segun la clasificacion A1 a A11 del
Teorico 6 (Procesamiento de Consultas).

## a) `σ codigo = 1001 (curso)`

Algoritmo elegido: **A3 (igualdad sobre indice primario / clave unica)**.

Justificacion:

- `codigo` es clave primaria. En la convencion del curso (y de la implementacion
  habitual en cualquier motor real) toda clave primaria tiene asociado un indice
  unico (tipicamente B+tree). La condicion es de igualdad sobre ese atributo.
- A3 esta definido justamente para "condiciones de igualdad sobre indices de
  clave primaria o unica" y recupera a lo sumo un registro.
- Costo estimado: `(hi + 1) * (tT + tb)`, donde `hi` es la altura del indice.

Alternativa estrictamente literal: si se interpreta que solo existen los
indices explicitamente mencionados en el enunciado, no habria indice sobre
`codigo` y caberia A1 (busqueda lineal), con corte temprano por ser igualdad
sobre clave: `costo = (br / 2) * tT + tb`. A3 es la respuesta mas razonable y
acorde a la teoria.

## b) `σ codigo < 1000 (curso)`

Algoritmo elegido: **A6 (rango usando indice primario)**.

Justificacion:

- Bajo la misma convencion (PK con indice primario), el archivo se considera
  ordenado por `codigo`. Para `codigo < v` se recorren secuencialmente los
  registros desde el inicio hasta encontrar la primera tupla con `codigo >= v`;
  no es necesario consultar el indice (el ordenamiento basta).
- Si en cambio se interpreta literalmente que no hay indice utilizable sobre
  `codigo`, corresponde A1 (busqueda lineal completa), porque es una condicion
  de rango sobre clave pero sin estructura que la soporte.

## c) `σ cantidad_inscriptos = 40 (curso)`

Algoritmo elegido: **A5 (igualdad usando indice secundario)**.

Justificacion:

- Hay indice secundario sobre `cantidad_inscriptos`.
- La condicion es de igualdad. Como la clave de busqueda no es unica, en el peor
  caso pueden recuperarse varios registros, cada uno potencialmente en un bloque
  distinto.
- Costo: `(hi + n) * (tT + tb)`, donde `n` es el numero de registros que
  cumplen la condicion.

## d) `σ cantidad_inscriptos < 50 (curso)`

Algoritmo elegido: **A7 (rango usando indice secundario)**.

Justificacion:

- Hay indice secundario sobre `cantidad_inscriptos` y la condicion es de rango
  (`< 50`).
- A7 esta especificado para este caso: recorre las hojas del indice y, para
  cada puntero, recupera el registro correspondiente.
- Observacion practica: si la selectividad es baja (mucho de la tabla cumple
  la condicion), un optimizador real puede preferir A1, porque A7 implica una
  operacion de I/O por cada registro recuperado.

## e) `σ cantidad_inscriptos = 50 ∧ cupo_maximo > 40 (curso)`

Algoritmo elegido: **A10 (conjuncion por interseccion de identificadores)**.

Justificacion:

- Conjuncion de dos condiciones, ambas con indice asociado: `cantidad_inscriptos`
  (igualdad, A5) y `cupo_maximo` (rango, A7).
- A10 obtiene el conjunto de RIDs/punteros por cada condicion utilizando su
  indice, intersecta los conjuntos y solo recupera fisicamente las tuplas que
  quedaron en la interseccion.
- Si no se quisiera usar A10, otra opcion valida seria A8 (elegir la condicion
  mas selectiva, recuperar por su indice y testear el resto en memoria);
  tipicamente `cantidad_inscriptos = 50` sera la mas selectiva.

## Nota sobre selectividad

Los algoritmos justificados arriba son los que aplican segun la teoria del
Teorico 6 dado el enunciado. Un optimizador real (basado en costos) puede
preferir busqueda lineal cuando la selectividad estimada es alta (devuelve gran
parte de la tabla), porque A7/A5/A10 con muchos accesos aislados a disco
pueden ser mas caros que un Sequential Scan.
