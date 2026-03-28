# Ejercicio 3 - Diseno de base y colecciones en MongoDB

En este ejercicio se modelo la base en MongoDB para representar el E/R del enunciado
con tres colecciones:

- `usuarios`
- `noticias`
- `comentarios`

## Como se llevo el modelo a documentos

### 1) Coleccion `usuarios`

Se guarda:

- `nick` (clave unica),
- `nyape`,
- `edad`,
- `direccion` como objeto `{ calle, altura }`,
- `telefonos` como arreglo.

### 2) Coleccion `noticias`

Se guarda:

- `codigo` (clave unica),
- `texto`,
- `fecha`,
- `autor_nick` (referencia logica al usuario que la creo).

### 3) Coleccion `comentarios`

Se guarda:

- `codigo` (clave unica),
- `texto`,
- `autor_nick` (quien hizo el comentario),
- `noticia_codigo` (a que noticia pertenece),
- `pal_claves` (arreglo).

MongoDB no usa FK como en SQL, asi que esas referencias se controlan por logica de aplicacion/consultas.

## Scripts del ejercicio

- `mongosh/01_schema.js`: crea base, colecciones, validaciones e indices.
- `mongosh/02_seed_data.js`: inserta datos de ejemplo.

## Ejecucion

Desde `practico-07/ejercicio-03`:

```bash
mongosh < mongosh/01_schema.js
mongosh < mongosh/02_seed_data.js
```

## Verificacion simple

En `mongosh`:

```javascript
use practico7_er_noticias

db.usuarios.find().pretty()
db.noticias.find().pretty()
db.comentarios.find().pretty()
```
