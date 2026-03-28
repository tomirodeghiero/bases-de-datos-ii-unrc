# Ejercicio 5 - Consultas MongoDB

Base usada:

- `practico7_er_noticias`

En este modelo, nombre y apellido estan juntos en `usuarios.nyape`.
Por eso, en el inciso (a) se separa ese campo con `$split`.

## Script

- `mongosh/01_queries_ej5.js`

## Consultas resueltas

### a) Listar nick, nombre, apellido y edad de todos los usuarios

```javascript
db.usuarios.aggregate([
  {
    $project: {
      _id: 0,
      nick: 1,
      edad: 1,
      nombre: { $arrayElemAt: [{ $split: ["$nyape", " "] }, 0] },
      apellido: { $arrayElemAt: [{ $split: ["$nyape", " "] }, -1] }
    }
  }
]);
```

### b) Listar usuarios de mas de 40 anios

```javascript
db.usuarios.find(
  { edad: { $gt: 40 } },
  { _id: 0, nick: 1, nyape: 1, edad: 1 }
);
```

### c) Noticias que crearon usuarios de apellido Gonzalez, ordenadas por fecha

```javascript
db.noticias.aggregate([
  {
    $lookup: {
      from: "usuarios",
      localField: "autor_nick",
      foreignField: "nick",
      as: "autor"
    }
  },
  { $unwind: "$autor" },
  { $match: { "autor.nyape": /gonzalez$/i } },
  { $sort: { fecha: 1 } },
  {
    $project: {
      _id: 0,
      codigo: 1,
      texto: 1,
      fecha: 1,
      autor_nick: 1,
      autor: "$autor.nyape"
    }
  }
]);
```

## Ejecucion

Desde `practico-07/ejercicio-05`:

```bash
mongosh < mongosh/01_queries_ej5.js
```
