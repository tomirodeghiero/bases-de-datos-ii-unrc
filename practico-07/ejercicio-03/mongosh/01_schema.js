// Practico 7 - Ejercicio 3
// Crea base y colecciones para el modelo E/R de usuarios, noticias y comentarios.

use("practico7_er_noticias");

db.dropDatabase();

db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nick", "nyape", "edad", "direccion", "telefonos"],
      properties: {
        nick: { bsonType: "string", minLength: 1, description: "Clave unica del usuario" },
        nyape: { bsonType: "string", minLength: 1 },
        edad: { bsonType: "int", minimum: 0 },
        direccion: {
          bsonType: "object",
          required: ["calle", "altura"],
          properties: {
            calle: { bsonType: "string", minLength: 1 },
            altura: { bsonType: "int", minimum: 0 }
          }
        },
        telefonos: {
          bsonType: "array",
          minItems: 1,
          items: { bsonType: "string", minLength: 1 }
        }
      }
    }
  }
});

db.createCollection("noticias", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["codigo", "texto", "fecha", "autor_nick"],
      properties: {
        codigo: { bsonType: "int", minimum: 1, description: "Clave unica de noticia" },
        texto: { bsonType: "string", minLength: 1 },
        fecha: { bsonType: "date" },
        autor_nick: { bsonType: "string", minLength: 1, description: "Ref logica a usuarios.nick" }
      }
    }
  }
});

db.createCollection("comentarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["codigo", "texto", "autor_nick", "noticia_codigo", "pal_claves"],
      properties: {
        codigo: { bsonType: "int", minimum: 1, description: "Clave unica de comentario" },
        texto: { bsonType: "string", minLength: 1 },
        autor_nick: { bsonType: "string", minLength: 1, description: "Ref logica a usuarios.nick" },
        noticia_codigo: { bsonType: "int", minimum: 1, description: "Ref logica a noticias.codigo" },
        pal_claves: {
          bsonType: "array",
          items: { bsonType: "string", minLength: 1 }
        }
      }
    }
  }
});

// Claves unicas del modelo
db.usuarios.createIndex({ nick: 1 }, { unique: true, name: "ux_usuarios_nick" });
db.noticias.createIndex({ codigo: 1 }, { unique: true, name: "ux_noticias_codigo" });
db.comentarios.createIndex({ codigo: 1 }, { unique: true, name: "ux_comentarios_codigo" });

// Indices de referencia para consultas por relacion
db.noticias.createIndex({ autor_nick: 1 }, { name: "ix_noticias_autor_nick" });
db.comentarios.createIndex({ autor_nick: 1 }, { name: "ix_comentarios_autor_nick" });
db.comentarios.createIndex({ noticia_codigo: 1 }, { name: "ix_comentarios_noticia_codigo" });

print("Schema creado en base: practico7_er_noticias");
