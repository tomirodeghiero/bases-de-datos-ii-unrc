// Practico 7 - Ejercicio 5
// Consultas pedidas por enunciado.

use("practico7_er_noticias");

print("\n=== a) Nick, nombre, apellido y edad de todos los usuarios ===");
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
]).forEach(doc => printjson(doc));

print("\n=== b) Usuarios de mas de 40 anios ===");
db.usuarios.find(
  { edad: { $gt: 40 } },
  { _id: 0, nick: 1, nyape: 1, edad: 1 }
).forEach(doc => printjson(doc));

print("\n=== c) Noticias creadas por usuarios de apellido Gonzalez (ordenadas por fecha) ===");
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
]).forEach(doc => printjson(doc));
