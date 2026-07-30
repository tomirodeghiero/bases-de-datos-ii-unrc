import React, { useState } from 'react'
import { Seg, BoardHead } from '../components/ui.jsx'

/* Cada plantilla: práctico, título, cuándo se usa, y el código/algoritmo crudo (copiable). */
const T = [
  // ---------------- P1 · SQL ----------------
  {
    p: 'P1', title: 'SELECT completo (las 6 cláusulas en orden)',
    when: 'El esqueleto base de cualquier consulta. Recordá el orden de evaluación: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.',
    code: `SELECT   [DISTINCT] col1, col2, AGG(col3) AS alias
FROM     tabla1 t1
JOIN     tabla2 t2 ON t2.fk = t1.pk
WHERE    condicion_sobre_filas          -- filtra FILAS (columnas crudas)
GROUP BY col1, col2                      -- toda col no agregada del SELECT
HAVING   COUNT(*) > 3                     -- filtra GRUPOS (agregados)
ORDER BY alias DESC;                      -- puede usar alias del SELECT`,
  },
  {
    p: 'P1', title: 'JOINs (los 5 tipos)',
    when: 'Reunir tablas. INNER solo matches; LEFT/RIGHT conservan un lado; FULL ambos; CROSS producto cartesiano.',
    code: `-- INNER: solo filas que matchean
FROM a JOIN b ON b.a_id = a.id
-- LEFT: todas las de a, NULL si no hay b
FROM a LEFT JOIN b ON b.a_id = a.id
-- RIGHT: todas las de b
FROM a RIGHT JOIN b ON b.a_id = a.id
-- FULL (no nativo en MySQL): ambas
FROM a FULL OUTER JOIN b ON b.a_id = a.id
-- CROSS: cada a con cada b
FROM a CROSS JOIN b`,
  },
  {
    p: 'P1', title: 'Subconsultas y antijoin ("los que NO tienen")',
    when: 'Filtrar según otra tabla. Para "los que no tienen X" usá NOT EXISTS / NOT IN / LEFT JOIN … IS NULL.',
    code: `-- IN: existe en el conjunto
SELECT * FROM articulos
 WHERE nart IN (SELECT nart FROM provee);

-- NOT EXISTS (correlacionada): clientes sin facturas
SELECT * FROM cliente c
 WHERE NOT EXISTS (
   SELECT 1 FROM factura f WHERE f.nro_cliente = c.nro_cliente);

-- equivalente con LEFT JOIN
SELECT c.* FROM cliente c
 LEFT JOIN factura f ON f.nro_cliente = c.nro_cliente
 WHERE f.nro_cliente IS NULL;`,
  },
  {
    p: 'P1', title: 'CREATE TABLE con todas las ligaduras',
    when: 'Definir un esquema (DDL). PK, FK con acciones referenciales, UNIQUE, CHECK, NOT NULL.',
    code: `CREATE TABLE provee (
  nprov        INTEGER      NOT NULL,
  nart         INTEGER      NOT NULL,
  precio_venta DECIMAL(12,2) CHECK (precio_venta >= 0),
  CONSTRAINT pk_provee PRIMARY KEY (nart, nprov),
  CONSTRAINT fk_prov FOREIGN KEY (nprov) REFERENCES proveedores(nprov)
        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_art  FOREIGN KEY (nart) REFERENCES articulos(nart)
        ON DELETE RESTRICT
);`,
  },
  {
    p: 'P1', title: 'INSERT / UPDATE / DELETE',
    when: 'Manipular datos (DML). Ojo: UPDATE/DELETE sin WHERE afectan toda la tabla.',
    code: `INSERT INTO cliente (dni, nombre) VALUES (123, 'Juan');
INSERT INTO destino (a, b) SELECT a, b FROM origen;   -- desde consulta

UPDATE producto SET precio = precio * 1.20 WHERE cod = 104;

DELETE FROM factura WHERE fecha < '2024-01-01';`,
  },

  // ---------------- P2 · DCL ----------------
  {
    p: 'P2', title: 'GRANT / REVOKE',
    when: 'Dar y quitar privilegios. WITH GRANT OPTION permite delegar. REVOKE CASCADE propaga; RESTRICT falla si hay delegación.',
    code: `GRANT SELECT, INSERT ON personas TO u1, u2;
GRANT UPDATE (tasa) ON categoria TO encargado;      -- por columna
GRANT SELECT ON personas TO u1 WITH GRANT OPTION;    -- delegable

REVOKE INSERT ON personas FROM u1;
REVOKE UPDATE ON personas FROM u1 CASCADE;           -- propaga
REVOKE UPDATE ON personas FROM u1 RESTRICT;          -- falla si delegó`,
  },
  {
    p: 'P2', title: 'Roles y usuarios por motor',
    when: 'Crear cuentas y agrupar permisos en roles. La administración NO es estándar: cambia entre MySQL, PostgreSQL y Oracle.',
    code: `-- estándar
CREATE ROLE empleado;
GRANT SELECT ON cliente TO empleado;
GRANT empleado TO asesor;               -- rol a usuario

-- MySQL (usuario@host + límites de recursos)
CREATE USER 'cobrador'@'%' IDENTIFIED BY 'pwd';
ALTER USER 'cobrador'@'%' WITH MAX_CONNECTIONS_PER_HOUR 3;

-- PostgreSQL (todo es rol; LOGIN = usuario)
CREATE ROLE asesor LOGIN PASSWORD 'pwd' IN ROLE empleado;

-- Oracle (usuario = esquema; perfil limita recursos)
CREATE USER director IDENTIFIED BY pwd PROFILE perfil_dir PASSWORD EXPIRE;
GRANT CONNECT TO director;`,
  },

  // ---------------- P3 · Procedimientos ----------------
  {
    p: 'P3', title: 'Stored procedure (MySQL / SQL-PSM)',
    when: 'Lógica ejecutable en el servidor, con parámetros IN/OUT/INOUT. Se invoca con CALL.',
    code: `DELIMITER $$
CREATE PROCEDURE ajustar_precio(IN p_cod INT, IN p_pct DECIMAL(5,2), OUT p_nuevo DECIMAL(12,2))
  MODIFIES SQL DATA
BEGIN
  DECLARE v_actual DECIMAL(12,2) DEFAULT 0;
  SELECT precio INTO v_actual FROM producto WHERE cod = p_cod;
  SET p_nuevo = v_actual * (1 + p_pct/100);
  UPDATE producto SET precio = p_nuevo WHERE cod = p_cod;
END $$
DELIMITER ;

CALL ajustar_precio(104, 20, @r);  SELECT @r;`,
  },
  {
    p: 'P3', title: 'Función (PostgreSQL / PL/pgSQL)',
    when: 'Devuelve un valor. Estructura DECLARE / BEGIN / EXCEPTION / END entre $$.',
    code: `CREATE OR REPLACE FUNCTION total_facturas(p_cliente INT)
RETURNS NUMERIC AS $$
DECLARE v_total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(monto),0) INTO v_total
    FROM factura WHERE nro_cliente = p_cliente;
  RETURN v_total;
EXCEPTION
  WHEN OTHERS THEN RAISE EXCEPTION 'fallo: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT total_facturas(1);`,
  },
  {
    p: 'P3', title: 'Cursor (recorrer fila por fila)',
    when: 'Cuando necesitás procesar cada fila. Ciclo DECLARE → OPEN → FETCH (loop) → CLOSE; fin con NOT FOUND (02000).',
    code: `DELIMITER $$
CREATE PROCEDURE clasificar(IN p_lim INT)
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_a CHAR(16); DECLARE v_b, v_c INT;
  DECLARE cur CURSOR FOR SELECT a, b, c FROM tabla1 WHERE id < p_lim;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done = 1;
  OPEN cur;
  bucle: LOOP
    FETCH cur INTO v_a, v_b, v_c;
    IF done THEN LEAVE bucle; END IF;
    IF v_b < v_c THEN INSERT INTO tabla2 VALUES (v_a, v_b);
    ELSE             INSERT INTO tabla3 VALUES (v_a, v_c);
    END IF;
  END LOOP;
  CLOSE cur;
END $$
DELIMITER ;`,
  },
  {
    p: 'P3', title: 'Trigger (los 3 dialectos)',
    when: 'Código automático ante INSERT/UPDATE/DELETE. BEFORE puede modificar NEW o abortar; AFTER solo reacciona.',
    code: `-- MySQL: auditar bajas
CREATE TRIGGER trg_baja AFTER DELETE ON articulos
FOR EACH ROW
  INSERT INTO articulos_bajas VALUES (OLD.nart, OLD.descr, NOW());

-- PostgreSQL: función RETURNS TRIGGER + asociación
CREATE FUNCTION fn_audit() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria VALUES (OLD.nart, NOW(), OLD.cant - NEW.cant);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit AFTER UPDATE ON articulos
FOR EACH ROW EXECUTE PROCEDURE fn_audit();

-- Oracle: autonumerar con WHEN
CREATE OR REPLACE TRIGGER trg_id BEFORE INSERT ON parquimetro
FOR EACH ROW WHEN (NEW.id IS NULL)
BEGIN SELECT seq_parq.NEXTVAL INTO :NEW.id FROM dual; END;`,
  },

  // ---------------- P4 · JDBC ----------------
  {
    p: 'P4', title: 'JDBC: consulta segura (patrón recomendado)',
    when: 'SIEMPRE PreparedStatement (evita SQL injection y precompila) + try-with-resources (cierra todo y no agota el pool).',
    code: `String sql = "SELECT id, nombre FROM persona WHERE id = ?";
try (Connection con = DriverManager.getConnection(url, user, pass);
     PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setInt(1, 42);
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            int    id     = rs.getInt("id");
            String nombre = rs.getString("nombre");
        }
    }
}   // Connection, Statement y ResultSet se cierran solos`,
  },
  {
    p: 'P4', title: 'JDBC: transacción y llamada a procedimiento',
    when: 'Varias sentencias atómicas → setAutoCommit(false) + commit/rollback. Procedimientos con CallableStatement.',
    code: `con.setAutoCommit(false);
try {
    // ... varias sentencias ...
    con.commit();
} catch (SQLException e) {
    con.rollback();
    throw e;
}

// procedimiento con parámetro OUT
CallableStatement cs = con.prepareCall("{ call ajustar_precio(?, ?, ?) }");
cs.setInt(1, 104); cs.setBigDecimal(2, new BigDecimal("20"));
cs.registerOutParameter(3, Types.NUMERIC);
cs.execute();
BigDecimal nuevo = cs.getBigDecimal(3);`,
  },

  // ---------------- P5 · Optimización ----------------
  {
    p: 'P5', title: 'Algoritmo: optimizar una consulta (heurística)',
    when: 'Pasos mecánicos para reescribir el árbol de una consulta y bajar el costo.',
    code: `1. Traducir el SQL a álgebra relacional (σ selección, Π proyección, ⋈ join).
2. R1  — partir toda σ conjuntiva:  σ(a∧b) = σa(σb(...)).
3. R7  — EMPUJAR cada σ hacia la tabla base que menciona
         (achica el operando antes del join).
4. R8  — empujar proyecciones Π (dejar solo columnas usadas).
5. R5,R6 — reordenar joins: hacer PRIMERO el más restrictivo
         (el que deja el intermedio más chico).
6. Elegir algoritmo por join (ver plantilla siguiente).
7. Verificar en el motor con EXPLAIN (ANALYZE, BUFFERS).`,
  },
  {
    p: 'P5', title: 'Algoritmo: elegir método de acceso y de join',
    when: 'Cómo decidir Seq Scan vs índice, y qué algoritmo de join conviene.',
    code: `ACCESO (selección σ):
  igualdad sobre PK/único ......... A3 (índice único)   ← ideal
  igualdad índice secundario ...... A5
  rango índice primario ........... A6
  rango índice secundario ......... A7
  selectividad ALTA (muchas filas)  → Seq Scan (A1) gana al índice
  conjunción de condiciones ....... A10 (intersección de RIDs / bitmap)

JOIN:
  una relación chica y cabe en RAM  → Block Nested-Loop
  hay índice en el atributo de join → Indexed Nested-Loop
  entradas YA ordenadas ........... Sort-Merge
  nada ordenado, igualdad ......... Hash Join (default moderno)
  Regla externa: minimizar  n_externa · b_interna.`,
  },
  {
    p: 'P5', title: 'Fórmulas de costo y cardinalidad',
    when: 'Estimar costo de I/O y tamaño de resultados.',
    code: `Costo I/O   = b · t_T  +  s · t_b      (bloques transferidos + búsquedas)
b_r         = ceil(n_r / f_r)          (bloques de la relación)

Selectividad:
  σ A = v   → n_r / V(A,r)              (si A no es clave)
  σ A ≤ v   → n_r · (v - min)/(max - min)
  conjunción (independencia) → producto de selectividades
Tamaño de join a ⋈ b por atributo común C:
  si C es clave en b →  |a⋈b| ≤ |a|
  si no es clave en ninguna → min( n_a·n_b/V(C,a) , n_a·n_b/V(C,b) )`,
  },

  // ---------------- P6 · Transacciones ----------------
  {
    p: 'P6', title: 'Algoritmo: testear serializabilidad por conflicto',
    when: 'Dado un schedule, decidir si es serializable. Es el ejercicio típico de parcial.',
    code: `1. Identificar conflictos: mismo ítem Q y AL MENOS UNA escritura
   (r-r NO; r-w, w-r, w-w SÍ).
2. Dibujar un NODO por transacción.
3. Por cada conflicto entre Ti y Tj donde la op de Ti aparece ANTES
   en el schedule, trazar un arco  Ti → Tj  (uno por par, sin repetir).
4. Buscar ciclos en el grafo:
      grafo ACÍCLICO  → SERIALIZABLE por conflicto.
      hay CICLO       → NO serializable (p.ej. lost update T1↔T2).
5. Si es acíclico, el orden TOPOLÓGICO da la serie equivalente
   (ej.: T1 → T2  ≡  ejecutar T1; luego T2).`,
  },
  {
    p: 'P6', title: 'Traza de bloqueo de dos fases (2PL)',
    when: 'Convertir un schedule en uno con locks legales bajo 2PL. Recordá: primero se piden TODOS los locks (crecimiento), después se liberan (decrecimiento).',
    code: `Por cada transacción:
  FASE DE CRECIMIENTO  — solo pide locks (LS = compartido lectura,
                          LX = exclusivo escritura). NO libera ninguno.
  PUNTO DE VIRAJE      — el primer UNLOCK.
  FASE DE DECRECIMIENTO— solo libera, no pide más.

Compatibilidad:   S+S = OK ;  S+X = NO ;  X+X = NO   (si choca, ESPERA)

Variantes:
  puro     → puede liberar antes del commit (permite cascada)
  estricto → retiene los X hasta commit  (sin cascada) [InnoDB]
  riguroso → retiene S y X hasta commit  (serializa por orden de commit)

Ejemplo:  LX1(X) LX1(Y) r1(X) w1(X)  UX1(X)  LX2(X) ...  commit`,
  },
  {
    p: 'P6', title: 'Reglas de marcas temporales (timestamp ordering)',
    when: 'Cada transacción tiene marca MT(Ti). Cada ítem Q tiene MT-E (última escritura) y MT-L (última lectura).',
    code: `Ti lee Q  (read):
   si MT(Ti) < MT-E(Q)  → ROLLBACK (leería una versión ya sobreescrita)
   si no                → leer;  MT-L(Q) = max(MT-L(Q), MT(Ti))

Ti escribe Q (write):
   si MT(Ti) < MT-L(Q)  → ROLLBACK (alguien más nuevo ya la leyó)
   si MT(Ti) < MT-E(Q)  → ROLLBACK (escribiría valor obsoleto)
   si no                → escribir; MT-E(Q) = MT(Ti)

Propiedades: sin deadlocks (nunca esperan, se reinician);
puede dar planificaciones no recuperables (hay que extenderlo).`,
  },
  {
    p: 'P6', title: 'Transacción y niveles de aislamiento (SQL real)',
    when: 'Delimitar una transacción y elegir cuántas anomalías tolerar.',
    code: `-- MySQL
SET autocommit = 0;
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;
START TRANSACTION;
  SELECT precio FROM producto WHERE cod = 104 FOR UPDATE;  -- X-lock de fila
  UPDATE producto SET precio = precio * 1.20 WHERE cod = 104;
ROLLBACK;   -- o COMMIT

-- Niveles (de más débil a más fuerte) y qué permiten:
--   READ UNCOMMITTED : sucia, no-repetible, phantom
--   READ COMMITTED   :        no-repetible, phantom
--   REPEATABLE READ  :                       phantom
--   SERIALIZABLE     : ninguna`,
  },

  // ---------------- P7 · Mongo ----------------
  {
    p: 'P7', title: 'MongoDB CRUD',
    when: 'Insertar, leer, actualizar y borrar documentos. upsert = actualiza si existe, inserta si no (carga idempotente).',
    code: `db.usuarios.insertOne({ nick:"moises", edad:45 });
db.usuarios.insertMany([ {...}, {...} ]);

db.usuarios.find({ edad:{ $gt:40 } }, { _id:0, nick:1, edad:1 });  // filtro+proyección

db.usuarios.updateOne({ nick:"moises" }, { $set:{ edad:46 } });
db.usuarios.updateOne({ nick:"elias" }, { $set:{...} }, { upsert:true });

db.usuarios.deleteOne({ nick:"moises" });`,
  },
  {
    p: 'P7', title: 'find(): operadores de filtro',
    when: 'El primer argumento filtra, el segundo proyecta. _id viene por defecto (excluir con _id:0).',
    code: `// comparación
{ edad: { $gte:18, $lte:65 } }
{ pais: { $in:["AR","UY"] } }
// lógicos
{ $or: [ {edad:{$lt:18}}, {vip:true} ] }
// existencia y arreglos
{ telefono: { $exists:true } }
{ tags: { $all:["a","b"] } }
{ items: { $size:2 } }
// texto (regex, = LIKE)
{ nyape: /gonzalez$/i }`,
  },
  {
    p: 'P7', title: 'Pipeline de agregación (join + orden + proyección)',
    when: 'Cuando find() no alcanza: joins ($lookup), agrupaciones ($group), transformaciones. Las etapas se aplican en orden.',
    code: `db.noticias.aggregate([
  { $lookup: { from:"usuarios", localField:"autor_nick",
               foreignField:"nick", as:"autor" } },
  { $unwind: "$autor" },                       // $lookup devuelve array
  { $match:  { "autor.nyape": /gonzalez$/i } },
  { $sort:   { fecha: 1 } },
  { $project:{ _id:0, codigo:1, fecha:1, autor:"$autor.nyape" } }
]);

// agrupar / contar (equivale a GROUP BY)
db.comentarios.aggregate([
  { $group: { _id:"$noticia_codigo", total:{ $sum:1 } } },
  { $sort:  { _id:1 } }
]);`,
  },
  {
    p: 'P7', title: 'JsonPath (consultar un JSON)',
    when: 'Navegar y filtrar un documento JSON (JsonPath / Jayway).',
    code: `$                      raíz del documento
$.store.book[0]        primer libro
$..author              todos los "author" en profundidad
$.book[-1]             último elemento
$.book[0,1]            índices 0 y 1
$.book[?(@.price<10)]  filtro: precio < 10
$.items[?(@.cantidad < $['stock_min'])]   compara contra la raíz
// filtros: == != < <= > >= =~ (regex) in nin  ·  funciones: min max avg length`,
  },
]

const PRACTICOS = ['Todos', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']
const LABEL = { P1: 'SQL', P2: 'DCL', P3: 'Procedimientos', P4: 'JDBC', P5: 'Optimización', P6: 'Transacciones', P7: 'MongoDB' }

function CopyBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn ghost"
        onClick={copy}
        style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', fontSize: 12, zIndex: 2 }}
      >
        {copied ? '✓ copiado' : '⧉ copiar'}
      </button>
      <pre className="code" style={{ paddingTop: 34 }}>{code}</pre>
    </div>
  )
}

export default function Templates() {
  const [filter, setFilter] = useState('Todos')
  const list = filter === 'Todos' ? T : T.filter((x) => x.p === filter)

  return (
    <>
      <BoardHead k="Recetario · plantillas copiables" title="Plantillas para resolver cualquier ejercicio">
        Los esqueletos que se repiten en todo el curso: cómo escribir siempre un SELECT, un trigger,
        un procedimiento, una consulta JDBC segura, un pipeline de Mongo — y los <b>algoritmos paso a
        paso</b> para optimizar una consulta o testear serializabilidad. Copiá, pegá y completá los
        huecos.
      </BoardHead>

      <div className="card" style={{ position: 'sticky', top: 66, zIndex: 10 }}>
        <div className="controls" style={{ margin: 0 }}>
          <span className="mono muted small">Filtrar por práctico:</span>
          <Seg
            options={PRACTICOS.map((p) => ({ value: p, label: p === 'Todos' ? 'Todos' : `${p} · ${LABEL[p]}` }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
      </div>

      {list.map((t, i) => (
        <div className="card" key={i}>
          <div className="flex between center wrapf" style={{ marginBottom: 4 }}>
            <h3 className="h3">{t.title}</h3>
            <span className="demo-tag">{t.p} · {LABEL[t.p]}</span>
          </div>
          <p className="lede">{t.when}</p>
          <CopyBlock code={t.code} />
        </div>
      ))}

      <div className="note mt">
        <b>Tip.</b> Estas plantillas siguen los dialectos y ejemplos de los prácticos 01–07. Los
        algoritmos (optimización, serializabilidad, 2PL, marcas temporales) están escritos como
        receta paso a paso para que los apliques directo en el parcial.
      </div>
    </>
  )
}
