// Practico 7 - Ejercicio 3
// Datos de ejemplo para probar el modelo.

use("practico7_er_noticias");

db.usuarios.insertMany([
  {
    nick: "abraham",
    nyape: "Abraham",
    edad: NumberInt(24),
    direccion: { calle: "San Martin", altura: NumberInt(123) },
    telefonos: ["3584010001", "3515001111"]
  },
  {
    nick: "david",
    nyape: "David",
    edad: NumberInt(31),
    direccion: { calle: "Belgrano", altura: NumberInt(450) },
    telefonos: ["3584010002"]
  },
  {
    nick: "jacob",
    nyape: "Jacob",
    edad: NumberInt(28),
    direccion: { calle: "Mitre", altura: NumberInt(980) },
    telefonos: ["3584010003", "3584010004"]
  }
]);

db.noticias.insertMany([
  {
    codigo: NumberInt(1001),
    texto: "Se aprobo el nuevo reglamento de la facultad",
    fecha: ISODate("2024-10-10T10:00:00Z"),
    autor_nick: "abraham"
  },
  {
    codigo: NumberInt(1002),
    texto: "Abren inscripciones para talleres de programacion",
    fecha: ISODate("2024-10-12T15:30:00Z"),
    autor_nick: "abraham"
  },
  {
    codigo: NumberInt(1003),
    texto: "Resultados del torneo interfacultades",
    fecha: ISODate("2024-10-15T19:45:00Z"),
    autor_nick: "david"
  }
]);

db.comentarios.insertMany([
  {
    codigo: NumberInt(5001),
    texto: "Buena noticia, hacia falta actualizar normas",
    autor_nick: "jacob",
    noticia_codigo: NumberInt(1001),
    pal_claves: ["reglamento", "facultad", "actualizacion"]
  },
  {
    codigo: NumberInt(5002),
    texto: "Me anoto al taller de backend",
    autor_nick: "david",
    noticia_codigo: NumberInt(1002),
    pal_claves: ["taller", "inscripcion", "backend"]
  },
  {
    codigo: NumberInt(5003),
    texto: "Gran organizacion del torneo",
    autor_nick: "abraham",
    noticia_codigo: NumberInt(1003),
    pal_claves: ["torneo", "deportes", "organizacion"]
  }
]);

print("Datos insertados.");
print("Usuarios: " + db.usuarios.countDocuments());
print("Noticias: " + db.noticias.countDocuments());
print("Comentarios: " + db.comentarios.countDocuments());
