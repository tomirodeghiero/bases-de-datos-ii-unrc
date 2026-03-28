// Practico 7 - Ejercicio 4
// Carga minima pedida: 2 usuarios, 4 noticias y 2 comentarios por noticia.

use("practico7_er_noticias");

// Usuarios (masculinos biblicos)
db.usuarios.replaceOne(
  { nick: "moises" },
  {
    nick: "moises",
    nyape: "Moises",
    edad: NumberInt(36),
    direccion: { calle: "Exodo", altura: NumberInt(40) },
    telefonos: ["3584100001", "3515100001"]
  },
  { upsert: true }
);

db.usuarios.replaceOne(
  { nick: "elias" },
  {
    nick: "elias",
    nyape: "Elias",
    edad: NumberInt(33),
    direccion: { calle: "Profetas", altura: NumberInt(19) },
    telefonos: ["3584100002"]
  },
  { upsert: true }
);

// Noticias (4)
db.noticias.replaceOne(
  { codigo: NumberInt(2001) },
  {
    codigo: NumberInt(2001),
    texto: "Lanzan nuevo programa de becas estudiantiles",
    fecha: ISODate("2024-11-01T09:00:00Z"),
    autor_nick: "moises"
  },
  { upsert: true }
);

db.noticias.replaceOne(
  { codigo: NumberInt(2002) },
  {
    codigo: NumberInt(2002),
    texto: "Se inauguraron nuevos laboratorios de computacion",
    fecha: ISODate("2024-11-03T14:30:00Z"),
    autor_nick: "elias"
  },
  { upsert: true }
);

db.noticias.replaceOne(
  { codigo: NumberInt(2003) },
  {
    codigo: NumberInt(2003),
    texto: "Cronograma oficial de examenes finales",
    fecha: ISODate("2024-11-05T18:00:00Z"),
    autor_nick: "moises"
  },
  { upsert: true }
);

db.noticias.replaceOne(
  { codigo: NumberInt(2004) },
  {
    codigo: NumberInt(2004),
    texto: "Convocatoria a voluntarios para extension universitaria",
    fecha: ISODate("2024-11-07T11:15:00Z"),
    autor_nick: "elias"
  },
  { upsert: true }
);

// Comentarios (2 por noticia = 8)
db.comentarios.replaceOne(
  { codigo: NumberInt(7001) },
  {
    codigo: NumberInt(7001),
    texto: "Muy buena iniciativa para estudiantes.",
    autor_nick: "elias",
    noticia_codigo: NumberInt(2001),
    pal_claves: ["becas", "estudiantes", "oportunidad"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7002) },
  {
    codigo: NumberInt(7002),
    texto: "Ojala llegue a mas carreras.",
    autor_nick: "moises",
    noticia_codigo: NumberInt(2001),
    pal_claves: ["becas", "carreras", "inclusion"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7003) },
  {
    codigo: NumberInt(7003),
    texto: "Excelente mejora de infraestructura.",
    autor_nick: "moises",
    noticia_codigo: NumberInt(2002),
    pal_claves: ["laboratorio", "infraestructura", "equipamiento"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7004) },
  {
    codigo: NumberInt(7004),
    texto: "Era muy necesario renovar equipos.",
    autor_nick: "elias",
    noticia_codigo: NumberInt(2002),
    pal_claves: ["laboratorio", "equipos", "mejora"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7005) },
  {
    codigo: NumberInt(7005),
    texto: "Gracias por publicar fechas con anticipacion.",
    autor_nick: "elias",
    noticia_codigo: NumberInt(2003),
    pal_claves: ["examenes", "cronograma", "fechas"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7006) },
  {
    codigo: NumberInt(7006),
    texto: "Ahora queda organizar bien los tiempos de estudio.",
    autor_nick: "moises",
    noticia_codigo: NumberInt(2003),
    pal_claves: ["examenes", "estudio", "organizacion"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7007) },
  {
    codigo: NumberInt(7007),
    texto: "Me interesa participar como voluntario.",
    autor_nick: "moises",
    noticia_codigo: NumberInt(2004),
    pal_claves: ["extension", "voluntariado", "participacion"]
  },
  { upsert: true }
);

db.comentarios.replaceOne(
  { codigo: NumberInt(7008) },
  {
    codigo: NumberInt(7008),
    texto: "Gran propuesta para vincularse con la comunidad.",
    autor_nick: "elias",
    noticia_codigo: NumberInt(2004),
    pal_claves: ["extension", "comunidad", "voluntariado"]
  },
  { upsert: true }
);

print("Carga de ejercicio 4 aplicada.");
print("Usuarios (moises, elias): " + db.usuarios.countDocuments({ nick: { $in: ["moises", "elias"] } }));
print("Noticias (2001..2004): " + db.noticias.countDocuments({ codigo: { $in: [2001, 2002, 2003, 2004] } }));
print("Comentarios de esas noticias: " + db.comentarios.countDocuments({ noticia_codigo: { $in: [2001, 2002, 2003, 2004] } }));
