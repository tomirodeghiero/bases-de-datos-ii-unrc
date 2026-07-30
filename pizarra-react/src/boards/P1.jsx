import React, { useState } from 'react'
import { Seg, Html, BoardHead, cssv } from '../components/ui.jsx'

const EMP = [
  { id: 1, nombre: 'Juan', dep: 10 },
  { id: 2, nombre: 'Pedro', dep: 20 },
  { id: 3, nombre: 'Carlos', dep: null },
  { id: 4, nombre: 'Diego', dep: 40 },
]
const DEP = [
  { dep: 10, nombre: 'Ventas' },
  { dep: 20, nombre: 'IT' },
  { dep: 30, nombre: 'RRHH' },
]

const NOTES = {
  INNER: 'Solo filas que hacen match en ambas tablas. Carlos (dep ∅) y Diego (dep 40) se pierden; RRHH tampoco aparece.',
  LEFT: 'Todas las de empleado; NULL donde no hay departamento. Carlos y Diego sobreviven con ∅.',
  RIGHT: 'Todos los departamentos; RRHH aparece aunque no tenga empleados.',
  FULL: 'Todo de ambos lados. No es nativo en MySQL (se emula con UNION de LEFT y RIGHT).',
  CROSS: 'Producto cartesiano: cada empleado con cada departamento. 4×3 = 12 filas.',
}

function joinRows(type) {
  const res = []
  const push = (e, d) => res.push({ emp: e ? e.nombre : null, dep_id: (e && e.dep) || (d && d.dep), depnom: d ? d.nombre : null })
  if (type === 'CROSS') { EMP.forEach((e) => DEP.forEach((d) => push(e, d))); return res }
  const matched = new Set()
  EMP.forEach((e) => {
    const m = DEP.filter((d) => d.dep === e.dep)
    if (m.length) m.forEach((d) => { push(e, d); matched.add(d.dep) })
    else if (type === 'LEFT' || type === 'FULL') push(e, null)
  })
  if (type === 'RIGHT' || type === 'FULL') DEP.forEach((d) => { if (!matched.has(d.dep)) push(null, d) })
  return res
}

function sqlFor(t) {
  if (t === 'CROSS') return 'SELECT * FROM empleado\n  CROSS JOIN departamento;'
  if (t === 'INNER') return 'SELECT e.nombre, d.nombre\n  FROM empleado e\n  JOIN departamento d ON e.dep=d.dep;'
  return `SELECT e.nombre, d.nombre\n  FROM empleado e\n  ${t} JOIN departamento d ON e.dep=d.dep;`
}

function DataTable({ rows, cols }) {
  return (
    <table className="data">
      <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {cols.map((c) => (
              <td key={c}>{r[c] == null ? <span className="muted">∅</span> : r[c]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Venn({ type }) {
  const cA = cssv('--m-blue'), cB = cssv('--m-amber')
  let a = 1, b = 1
  if (type === 'LEFT') b = 0.15
  if (type === 'RIGHT') a = 0.15
  if (type === 'INNER') { a = 0.12; b = 0.12 }
  if (type === 'CROSS') { a = 0.5; b = 0.5 }
  return (
    <svg viewBox="0 0 300 120" width="100%">
      <circle cx="120" cy="60" r="52" fill={cA} fillOpacity={a} stroke={cA} strokeWidth="2" />
      <circle cx="180" cy="60" r="52" fill={cB} fillOpacity={b} stroke={cB} strokeWidth="2" />
      {type !== 'CROSS' && (
        <>
          <clipPath id="clP1"><circle cx="120" cy="60" r="52" /></clipPath>
          <circle cx="180" cy="60" r="52" fill={cssv('--accent')} fillOpacity="0.5" clipPath="url(#clP1)" />
        </>
      )}
      <text x="95" y="64" fontFamily="var(--mono)" fontSize="11" fill={cssv('--ink')} textAnchor="middle">empleado</text>
      <text x="205" y="64" fontFamily="var(--mono)" fontSize="11" fill={cssv('--ink')} textAnchor="middle">depto</text>
    </svg>
  )
}

const STAGES = [
  { st: 'FROM', rc: 12, lbl: 'empleado × factura' },
  { st: 'WHERE', rc: 7, lbl: 'monto > 0' },
  { st: 'GROUP BY', rc: 4, lbl: 'por cliente' },
  { st: 'HAVING', rc: 2, lbl: 'COUNT(*) > 3' },
  { st: 'SELECT', rc: 2, lbl: 'dni, total' },
  { st: 'ORDER BY', rc: 2, lbl: 'total DESC' },
]
const STAGE_NOTES = [
  '<b>FROM.</b> Se materializan las tablas y sus JOINs. Acá nacen todas las combinaciones de filas.',
  '<b>WHERE.</b> Filtra <b>filas</b> individuales por una condición sobre columnas crudas. No puede usar agregados.',
  '<b>GROUP BY.</b> Colapsa las filas en grupos: una fila por valor de la clave de agrupación.',
  '<b>HAVING.</b> Filtra <b>grupos</b> ya formados. Acá sí van los agregados (COUNT, SUM…).',
  '<b>SELECT.</b> Recién ahora se calculan las columnas y alias de salida. Por eso el alias no existía en el WHERE.',
  '<b>ORDER BY.</b> Última etapa: ordena el resultado final. Puede usar los alias del SELECT.',
]

export default function P1() {
  const [type, setType] = useState('INNER')
  const [stage, setStage] = useState(0)
  const rows = joinRows(type)

  return (
    <>
      <BoardHead k="Práctico 01 · DML + DDL" title="Repaso de SQL">
        SQL tiene tres sublenguajes: <b>DML</b> (SELECT/INSERT/UPDATE/DELETE), <b>DDL</b>{' '}
        (CREATE/ALTER/DROP) y <b>DCL</b> (P2). Lo que a veces confunde: el orden en que{' '}
        <em>escribís</em> un SELECT no es el orden en que el motor lo <em>evalúa</em>. Y un JOIN es,
        literalmente, álgebra relacional dentro del FROM.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf" style={{ marginBottom: 2 }}>
          <h3 className="h3"><span className="num">01</span> Visualizador de JOINs</h3>
          <span className="demo-tag">Interactivo</span>
        </div>
        <p className="lede">
          Elegí el tipo de reunión y mirá qué filas sobreviven y dónde aparecen los{' '}
          <code className="inline">NULL</code>. Las dos tablas comparten <code className="inline">dep</code>.
        </p>
        <div className="controls">
          <Seg options={['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS']} value={type} onChange={setType} />
        </div>
        <div className="grid2">
          <div>
            <div className="stage" style={{ padding: 10 }}><Venn type={type} /></div>
            <div className="grid2 mt" style={{ gap: 12 }}>
              <div><div className="sub">empleado</div><div className="tablewrap"><DataTable rows={EMP} cols={['id', 'nombre', 'dep']} /></div></div>
              <div><div className="sub">departamento</div><div className="tablewrap"><DataTable rows={DEP} cols={['dep', 'nombre']} /></div></div>
            </div>
          </div>
          <div>
            <div className="sub">Resultado <span className="pill neutral">{rows.length} filas</span></div>
            <div className="tablewrap"><DataTable rows={rows} cols={['emp', 'dep_id', 'depnom']} /></div>
            <pre className="code mt">{sqlFor(type)}</pre>
            <Html className="note mt" html={`<b>${type} JOIN.</b> ${NOTES[type]}`} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">02</span> Orden lógico de evaluación</h3>
        <p className="lede">
          Escribís <code className="inline">SELECT … FROM … WHERE …</code>, pero el motor procesa en
          otro orden. Por eso un alias del <code className="inline">SELECT</code> no siempre sirve en
          el <code className="inline">WHERE</code>, y por eso <b>WHERE filtra filas</b> mientras{' '}
          <b>HAVING filtra grupos</b>. Tocá cada etapa.
        </p>
        <div className="pipeline">
          {STAGES.map((s, i) => (
            <div
              key={s.st}
              className={'pstage' + (stage === i ? ' on' : '')}
              tabIndex={0}
              onClick={() => setStage(i)}
              onKeyDown={(e) => e.key === 'Enter' && setStage(i)}
            >
              <div className="st">{s.st}</div>
              <div className="rc">{s.rc}</div>
              <div className="lbl">{s.lbl} filas</div>
              {i < STAGES.length - 1 && <div className="arrow">→</div>}
            </div>
          ))}
        </div>
        <Html className="note mt" html={STAGE_NOTES[stage]} />
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">WHERE vs HAVING</h3>
          <p className="lede">
            Regla mecánica: si la condición usa un <b>agregado</b> (COUNT, SUM, AVG…), va en{' '}
            <code className="inline">HAVING</code>; si mira una columna cruda, va en{' '}
            <code className="inline">WHERE</code>.
          </p>
          <Html as="pre" className="code" html={`<span class="cm">-- clientes con más de 3 accidentes</span>
<span class="kw">SELECT</span> c.dni, c.nombre
  <span class="kw">FROM</span> cliente c <span class="kw">JOIN</span> accidente a <span class="kw">ON</span> a.dni=c.dni
 <span class="kw">GROUP BY</span> c.dni, c.nombre
<span class="kw">HAVING</span> <span class="fn">COUNT</span>(*) &gt; <span class="num">3</span>;`} />
        </div>
        <div className="card">
          <h3 className="h3">Antijoin: "los que no tienen"</h3>
          <p className="lede">
            Clientes sin ninguna factura. Se resuelve con <code className="inline">NOT EXISTS</code>{' '}
            (subconsulta correlacionada), <code className="inline">NOT IN</code> o un{' '}
            <code className="inline">LEFT JOIN … IS NULL</code>.
          </p>
          <Html as="pre" className="code" html={`<span class="kw">SELECT</span> * <span class="kw">FROM</span> cliente c
 <span class="kw">WHERE NOT EXISTS</span> (
   <span class="kw">SELECT</span> <span class="num">1</span> <span class="kw">FROM</span> factura f
    <span class="kw">WHERE</span> f.nro_cliente = c.nro_cliente);`} />
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">03</span> Conceptos clave</h3>
        <p className="sub">Definiciones que se dan por sabidas en el resto del curso</p>
        <div className="deftiles">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Tres sublenguajes</h4><p><b>DML</b> manipula datos (SELECT/INSERT/UPDATE/DELETE), <b>DDL</b> define estructura (CREATE/ALTER/DROP), <b>DCL</b> controla acceso (GRANT/REVOKE).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />DISTINCT vs ALL</h4><p><code>DISTINCT</code> elimina filas repetidas; <code>ALL</code> (por defecto) las conserva.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Agregados</h4><p><code>COUNT/SUM/AVG/MIN/MAX</code> devuelven un único valor e <b>ignoran NULL</b> (salvo <code>COUNT(*)</code>).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />Subconsulta correlacionada</h4><p>Referencia una columna de la consulta externa; se evalúa una vez por fila externa (patrón EXISTS/NOT EXISTS).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-rose)' }} />Vista</h4><p>Relación virtual nominada (<code>CREATE VIEW</code>). Sirve para seguridad, simplificar y desacoplar; su actualización es problemática.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Índice</h4><p>Estructura auxiliar (B-tree/hash) que acelera accesos. PK y UNIQUE lo crean implícito; penaliza INSERT/UPDATE/DELETE.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />Dominio</h4><p><code>CREATE DOMAIN</code>: tipo del usuario sobre un tipo base con DEFAULT/CHECK. Nativo en PostgreSQL; se emula en MySQL/Oracle.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />DROP vs DELETE</h4><p><code>DROP TABLE</code> borra la tabla y su definición; <code>DELETE FROM</code> solo vacía filas.</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Operadores del WHERE</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>operador</th><th>uso</th></tr></thead>
              <tbody>
                <tr><td className="mono">= &lt;&gt; &lt; &gt; &lt;= &gt;=</td><td>comparación</td></tr>
                <tr><td className="mono">BETWEEN a AND b</td><td>intervalo cerrado</td></tr>
                <tr><td className="mono">LIKE '%_'</td><td>patrón: % cualquier cadena, _ un carácter</td></tr>
                <tr><td className="mono">IN (…)</td><td>pertenece a lista o subconsulta</td></tr>
                <tr><td className="mono">EXISTS (…)</td><td>la subconsulta devuelve alguna fila</td></tr>
                <tr><td className="mono">IS [NOT] NULL</td><td>nunca <code className="inline">= NULL</code> (da UNKNOWN)</td></tr>
                <tr><td className="mono">AND · OR · NOT</td><td>AND tiene mayor precedencia que OR</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Operaciones de conjuntos</h3>
          <p className="lede">Requieren misma cantidad de columnas y tipos compatibles.</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>operador</th><th>resultado</th></tr></thead>
              <tbody>
                <tr><td className="mono">UNION</td><td>unión sin duplicados</td></tr>
                <tr><td className="mono">UNION ALL</td><td>unión conservando duplicados</td></tr>
                <tr><td className="mono">INTERSECT</td><td>filas en ambas</td></tr>
                <tr><td className="mono">EXCEPT / MINUS</td><td>en la primera y no en la segunda</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt small"><b>MINUS</b> es el nombre en Oracle; <b>EXCEPT</b> en el estándar y PostgreSQL.</div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">04</span> Ligaduras de integridad y acciones referenciales</h3>
        <div className="grid2">
          <div>
            <p className="sub">Constraints</p>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>constraint</th><th>qué garantiza</th></tr></thead>
                <tbody>
                  <tr><td className="mono">PRIMARY KEY</td><td>NOT NULL + UNIQUE; una por tabla</td></tr>
                  <tr><td className="mono">UNIQUE</td><td>claves candidatas (permiten NULL)</td></tr>
                  <tr><td className="mono">NOT NULL</td><td>obliga a tener valor</td></tr>
                  <tr><td className="mono">CHECK</td><td>condición de dominio</td></tr>
                  <tr><td className="mono">FOREIGN KEY</td><td>integridad referencial</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="sub">Acciones al borrar/actualizar el padre</p>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>acción</th><th>efecto sobre las hijas</th></tr></thead>
                <tbody>
                  <tr><td className="mono">CASCADE</td><td>borra/actualiza también las hijas</td></tr>
                  <tr><td className="mono">RESTRICT</td><td>rechaza si hay hijas</td></tr>
                  <tr><td className="mono">SET NULL</td><td>pone NULL en la FK</td></tr>
                  <tr><td className="mono">SET DEFAULT</td><td>pone el valor por defecto</td></tr>
                  <tr><td className="mono">NO ACTION</td><td>rechaza (chequeo diferido)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Del SQL al álgebra relacional</h3>
          <p className="lede">El SELECT se traduce a operadores del álgebra relacional. Esto es la base del práctico 5.</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>símbolo</th><th>operación</th><th>SQL</th></tr></thead>
              <tbody>
                <tr><td className="mono">σ</td><td>selección (filas)</td><td>WHERE</td></tr>
                <tr><td className="mono">Π</td><td>proyección (columnas)</td><td>SELECT</td></tr>
                <tr><td className="mono">⋈</td><td>join</td><td>JOIN … ON</td></tr>
                <tr><td className="mono">×</td><td>producto cartesiano</td><td>CROSS JOIN</td></tr>
                <tr><td className="mono">∪ ∩ −</td><td>unión, intersección, resta</td><td>UNION/INTERSECT/EXCEPT</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Diferencias entre motores</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>—</th><th>MySQL</th><th>PostgreSQL</th><th>Oracle</th></tr></thead>
              <tbody>
                <tr><td className="mono">autoincremento</td><td>AUTO_INCREMENT</td><td>SERIAL / IDENTITY</td><td>SEQUENCE + trigger</td></tr>
                <tr><td className="mono">dominios</td><td>emula (CHECK/ENUM)</td><td>nativo</td><td>emula</td></tr>
                <tr><td className="mono">booleano</td><td>TINYINT(1)</td><td>BOOLEAN real</td><td>NUMBER(1)+CHECK</td></tr>
                <tr><td className="mono">conjunto cerrado</td><td>ENUM</td><td>CHECK IN / TYPE</td><td>CHECK IN</td></tr>
                <tr><td className="mono">FULL OUTER JOIN</td><td>no nativo</td><td>sí</td><td>sí</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
