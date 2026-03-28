# Ejercicio 4 - Carga minima de usuarios, noticias y comentarios

Este ejercicio pide cargar:

- al menos 2 usuarios,
- 4 noticias,
- y 2 comentarios por cada noticia.

## Script de carga

- `mongosh/01_seed_ej4.js`

Lo que inserta:

- 2 usuarios (`moises`, `elias`),
- 4 noticias (codigos `2001..2004`),
- 8 comentarios (2 por noticia, codigos `7001..7008`).

Se implemento con `upsert`, asi se puede ejecutar varias veces sin errores por duplicados.

## Ejecucion

Desde `practico-07/ejercicio-04`:

```bash
mongosh < mongosh/01_seed_ej4.js
```

## Verificacion

En `mongosh`:

```javascript
use practico7_er_noticias

db.usuarios.countDocuments({ nick: { $in: ["moises", "elias"] } })
db.noticias.countDocuments({ codigo: { $in: [2001, 2002, 2003, 2004] } })
db.comentarios.countDocuments({ noticia_codigo: { $in: [2001, 2002, 2003, 2004] } })
```

Esperado:

- usuarios: `2`
- noticias: `4`
- comentarios: `8`

Para confirmar que realmente hay 2 comentarios por noticia:

```javascript
db.comentarios.aggregate([
  { $match: { noticia_codigo: { $in: [2001, 2002, 2003, 2004] } } },
  { $group: { _id: "$noticia_codigo", total: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
```
