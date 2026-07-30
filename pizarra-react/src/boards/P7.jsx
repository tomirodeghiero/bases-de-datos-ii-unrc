import React, { useState } from 'react'
import { Seg, Html, BoardHead } from '../components/ui.jsx'

const DOC = {
  nick: 'moises', nyape: 'Moises Gonzalez', edad: 45,
  direccion: { calle: 'San Martin', altura: 1250 },
  telefonos: ['358-4123456', '358-4987654'],
}
const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v)

function JsonNode({ k, val, path, onHover }) {
  const [open, setOpen] = useState(true)
  const t = typeOf(val)
  const keyEl = k != null ? <><span className="jkey">"{k}"</span>: </> : null
  if (t === 'object' || t === 'array') {
    const entries = t === 'array' ? val.map((v, i) => [i, v]) : Object.entries(val)
    return (
      <>
        <div className="jrow" onMouseEnter={() => onHover(path, t)}>
          <span className="jtoggle" onClick={() => setOpen((o) => !o)}>{open ? '▾' : '▸'}</span>
          {keyEl}
          <span className="muted">{t === 'array' ? `[ ${val.length} ]` : '{ … }'}</span>
        </div>
        {open && (
          <div className="jindent">
            {entries.map(([kk, vv]) => (
              <JsonNode key={kk} k={t === 'array' ? null : kk} val={vv} path={t === 'array' ? `${path}[${kk}]` : `${path}.${kk}`} onHover={onHover} />
            ))}
          </div>
        )}
      </>
    )
  }
  const disp = t === 'string' ? <span className="jstr">"{val}"</span> : t === 'number' ? <span className="jnum">{val}</span> : <span className="jbool">{String(val)}</span>
  return (
    <div className="jrow" onMouseEnter={() => onHover(path, t)}>
      {keyEl}{disp}
    </div>
  )
}

const ALL_DOCS = [
  { codigo: 2001, autor_nick: 'moises', fecha: '07-10' },
  { codigo: 2002, autor_nick: 'elias', fecha: '07-02' },
  { codigo: 2003, autor_nick: 'moises', fecha: '07-20' },
]
const AUTHORS = { moises: 'Moises Gonzalez', elias: 'Elias Perez' }
const STAGES = [
  { name: '$lookup', code: '{ $lookup: { from:"usuarios",\n    localField:"autor_nick",\n    foreignField:"nick", as:"autor" } }' },
  { name: '$unwind', code: '{ $unwind: "$autor" }' },
  { name: '$match', code: '{ $match: { "autor.nyape": /gonzalez$/i } }' },
  { name: '$sort', code: '{ $sort: { fecha: 1 } }' },
  { name: '$project', code: '{ $project: { _id:0, codigo:1, fecha:1,\n    autor:"$autor.nyape" } }' },
]

function aggDocsAt(ags) {
  let docs = ALL_DOCS.map((d) => ({ ...d }))
  if (ags >= 0) docs = docs.map((d) => ({ ...d, autor: [{ nick: d.autor_nick, nyape: AUTHORS[d.autor_nick] }] }))
  if (ags >= 1) docs = docs.map((d) => ({ ...d, autor: d.autor[0] }))
  if (ags >= 2) docs = docs.filter((d) => /gonzalez$/i.test(d.autor.nyape))
  if (ags >= 3) docs = [...docs].sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
  return docs
}

export default function P7() {
  const [path, setPath] = useState('$')
  const [ptype, setPtype] = useState('object')
  const [model, setModel] = useState('rel')
  const [ags, setAgs] = useState(-1)
  const [embed, setEmbed] = useState('embed')

  const docs = aggDocsAt(ags)
  const proj = ags >= 4

  return (
    <>
      <BoardHead k="Práctico 07 · Bases documentales" title="JSON y MongoDB">
        En vez de romper los datos en muchas tablas (1FN), una base documental los mantiene{' '}
        <b>juntos</b>: objetos anidados y arreglos dentro de un documento. No hay foreign keys — la
        consistencia la cuida la app — y las consultas complejas se arman con el <b>pipeline de
        agregación</b>.
      </BoardHead>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">01</span> Explorador de documento + JsonPath</h3>
          <p className="lede">Plegá y desplegá el documento. Pasá el mouse por un nodo para ver su ruta <b>JsonPath</b> y su tipo.</p>
          <div className="stage jsonnode" style={{ padding: 14 }}>
            <JsonNode k={null} val={DOC} path="$" onHover={(p, t) => { setPath(p || '$'); setPtype(t) }} />
          </div>
          <div className="note mt">
            <span className="jpath">{path}</span> · tipo <b>{ptype}</b>
            <div className="small muted mt8"><span className="mono">$</span> = raíz · <span className="mono">.hijo</span> · <span className="mono">[i]</span> índice · <span className="mono">[?(@.x&lt;10)]</span> filtro</div>
          </div>
        </div>

        <div className="card">
          <h3 className="h3"><span className="num">02</span> Relacional vs Documental</h3>
          <p className="lede">La misma factura con sus ítems: dos tablas con FK (1:N) contra un documento con los ítems embebidos.</p>
          <div className="controls">
            <Seg options={[{ value: 'rel', label: 'Relacional' }, { value: 'doc', label: 'Documental' }]} value={model} onChange={setModel} />
          </div>
          {model === 'rel' ? (
            <div>
              <div className="sub">factura</div>
              <div className="tablewrap"><table className="data"><thead><tr><th>nro</th><th>fecha</th><th>cliente</th></tr></thead><tbody><tr><td>1</td><td>2026-07-01</td><td>Juan</td></tr></tbody></table></div>
              <div className="sub mt">item_factura <span className="muted small">(FK nro_factura → factura)</span></div>
              <div className="tablewrap"><table className="data"><thead><tr><th>nro_factura</th><th>producto</th><th>cant</th></tr></thead><tbody><tr><td>1</td><td>Teclado</td><td>2</td></tr><tr><td>1</td><td>Mouse</td><td>1</td></tr></tbody></table></div>
              <div className="note mt">Dos tablas unidas por FK. Traer la factura completa exige un <code className="inline">JOIN</code>.</div>
            </div>
          ) : (
            <div>
              <Html as="pre" className="code" html={`{
  <span class="jkey">"nro"</span>: <span class="jnum">1</span>,
  <span class="jkey">"fecha"</span>: <span class="jstr">"2026-07-01"</span>,
  <span class="jkey">"cliente"</span>: <span class="jstr">"Juan"</span>,
  <span class="jkey">"items"</span>: [
    { <span class="jkey">"producto"</span>:<span class="jstr">"Teclado"</span>, <span class="jkey">"cant"</span>:<span class="jnum">2</span> },
    { <span class="jkey">"producto"</span>:<span class="jstr">"Mouse"</span>, <span class="jkey">"cant"</span>:<span class="jnum">1</span> }
  ]
}`} />
              <div className="note good mt">Un solo documento: los ítems viven <b>embebidos</b> dentro de la factura. Se lee de una, sin join.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">03</span> Pipeline de agregación paso a paso</h3>
          <span className="demo-tag">Interactivo</span>
        </div>
        <p className="lede">
          Objetivo: noticias cuyo autor tiene apellido "Gonzalez", ordenadas por fecha. Se resuelve
          encadenando etapas. Avanzá y mirá cómo se transforma la colección en cada una.
        </p>
        <div className="stage" style={{ padding: 12 }}>
          <div>
            {STAGES.map((s, i) => (
              <React.Fragment key={s.name}>
                <span className={'stagechip' + (i < ags ? ' done' : i === ags ? ' cur' : '')}>{s.name}</span>
                {i < STAGES.length - 1 && ' → '}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="controls mt">
          <button className="btn primary" onClick={() => setAgs((a) => Math.min(a + 1, STAGES.length - 1))}>▶ Siguiente etapa</button>
          <button className="btn ghost" onClick={() => setAgs(-1)}>↺</button>
          <span className="pill neutral">{docs.length} docs</span>
        </div>
        <div className="grid2 mt">
          <Html as="pre" className="code" html={ags < 0
            ? '<span class="cm">// pulsá "Siguiente etapa"</span>\ndb.noticias.aggregate([ … ])'
            : STAGES.slice(0, ags + 1).map((s) => s.code).join(',\n')} />
          <div className="stage" style={{ padding: 12 }}>
            {docs.length === 0 && <span className="muted small">0 documentos</span>}
            {docs.map((d, i) => {
              let inner
              if (proj) inner = <><b>codigo</b>:{d.codigo}<br /><b>fecha</b>:{d.fecha}<br /><b>autor</b>:"{d.autor.nyape}"</>
              else if (ags >= 1) inner = <>codigo:{d.codigo}<br />fecha:{d.fecha}<br />autor:{`{${d.autor.nyape}}`}</>
              else if (ags >= 0) inner = <>codigo:{d.codigo}<br />autor:{`[{${d.autor[0].nyape}}]`}</>
              else inner = <>codigo:{d.codigo}<br />autor_nick:{d.autor_nick}<br />fecha:{d.fecha}</>
              return <span key={i} className={'aggcard' + (ags >= 0 && ags <= 1 ? ' fresh' : '')}>{inner}</span>
            })}
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">04</span> Embebido vs Referenciado</h3>
          <p className="lede">¿Los comentarios van dentro de la noticia o en su propia colección? Depende de si crecen sin tope.</p>
          <div className="controls">
            <Seg options={[{ value: 'embed', label: 'Embebido' }, { value: 'ref', label: 'Referenciado' }]} value={embed} onChange={setEmbed} />
          </div>
          {embed === 'embed' ? (
            <>
              <Html as="pre" className="code" html={`noticia = {
  <span class="jkey">"codigo"</span>: <span class="jnum">2001</span>,
  <span class="jkey">"texto"</span>: <span class="jstr">"..."</span>,
  <span class="jkey">"comentarios"</span>: [
    { texto:<span class="jstr">"buenísimo"</span> },
    { texto:<span class="jstr">"gracias"</span> },
    <span class="muted">… y crece … y crece …</span>
  ]
}`} />
              <div className="note warn mt">Cómodo para leer todo junto, pero los comentarios <b>crecen sin tope</b>: el documento se infla sin control.</div>
            </>
          ) : (
            <>
              <Html as="pre" className="code" html={`noticia   = { codigo: <span class="jnum">2001</span>, texto: <span class="jstr">"..."</span> }
comentario= { codigo: <span class="jnum">9</span>,
  <span class="jkey">"noticia_codigo"</span>: <span class="jnum">2001</span>,  <span class="cm">// referencia</span>
  texto: <span class="jstr">"buenísimo"</span> }`} />
              <div className="note good mt">Colección aparte enlazada por <code className="inline">noticia_codigo</code>. Escala sin límite; para reunirlos se usa <code className="inline">$lookup</code>.</div>
            </>
          )}
        </div>

        <div className="card">
          <h3 className="h3">find vs aggregation</h3>
          <p className="lede">Un <code className="inline">find()</code> alcanza para filtrar y proyectar. Cuando hay joins, agrupaciones o transformaciones, se necesita el pipeline.</p>
          <Html as="pre" className="code" html={`<span class="cm">// find: filtro + proyección</span>
db.usuarios.<span class="fn">find</span>(
  { edad: { <span class="kw">$gt</span>: <span class="num">40</span> } },
  { _id: <span class="num">0</span>, nick: <span class="num">1</span>, edad: <span class="num">1</span> }
)`} />
          <Html as="pre" className="code mt" html={`<span class="cm">// aggregation: join + orden</span>
db.noticias.<span class="fn">aggregate</span>([
  { <span class="kw">$lookup</span>: { from:<span class="str">"usuarios"</span>,
      localField:<span class="str">"autor_nick"</span>,
      foreignField:<span class="str">"nick"</span>, as:<span class="str">"autor"</span> } },
  { <span class="kw">$unwind</span>: <span class="str">"$autor"</span> },
  { <span class="kw">$sort</span>: { fecha: <span class="num">1</span> } }
])`} />
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">05</span> Conceptos clave</h3>
        <div className="deftiles">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Semiestructurado</h4><p>Cada dato lleva su etiqueta/clave y la estructura puede variar entre documentos. Lo contrario a la 1FN.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />JSON</h4><p>Dos estructuras: objeto <code>{'{clave:valor}'}</code> y arreglo <code>[…]</code>. Tipos: string, número, bool, null, objeto, arreglo.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Colección / documento</h4><p>Colección ≈ tabla sin esquema rígido; documento ≈ fila con <code>_id</code> único. Unidad mínima de almacenamiento.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />BSON</h4><p>JSON binario interno: distingue <code>int</code> (NumberInt) de <code>double</code>, y tiene <code>Date</code> (ISODate).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-rose)' }} />Sin foreign keys</h4><p>MongoDB no valida referencias entre colecciones: la consistencia la cuida la aplicación.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Índices</h4><p>Únicos sobre claves de negocio (<code>nick</code>, <code>codigo</code>) y simples sobre los campos por los que se filtra o se hace <code>$lookup</code>.</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Operadores de find()</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>grupo</th><th>operadores</th></tr></thead>
              <tbody>
                <tr><td className="mono">comparación</td><td><code className="inline">$eq $ne $gt $gte $lt $lte $in $nin</code></td></tr>
                <tr><td className="mono">lógicos</td><td><code className="inline">$and $or $not $nor</code></td></tr>
                <tr><td className="mono">existencia</td><td><code className="inline">$exists</code></td></tr>
                <tr><td className="mono">arreglos</td><td><code className="inline">$all $size $elemMatch</code></td></tr>
                <tr><td className="mono">texto</td><td><code className="inline">/patrón/i</code> o <code className="inline">$regex</code></td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt small">Proyección: 2º parámetro de <code className="inline">find</code>. <code className="inline">1</code> incluye, <code className="inline">0</code> excluye; <code className="inline">_id</code> viene por defecto.</div>
        </div>
        <div className="card">
          <h3 className="h3">Etapas del pipeline de agregación</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>etapa</th><th>función</th></tr></thead>
              <tbody>
                <tr><td className="mono">$match</td><td>filtra (como find)</td></tr>
                <tr><td className="mono">$project</td><td>selecciona / calcula campos</td></tr>
                <tr><td className="mono">$group</td><td>agrupa (como GROUP BY)</td></tr>
                <tr><td className="mono">$sort / $limit / $skip</td><td>ordena / pagina</td></tr>
                <tr><td className="mono">$unwind</td><td>desempaqueta un arreglo</td></tr>
                <tr><td className="mono">$lookup</td><td>join lógico con otra colección</td></tr>
                <tr><td className="mono">$addFields</td><td>agrega / transforma campos</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">06</span> ¿Embeber o referenciar? checklist de decisión</h3>
        <div className="grid2">
          <div>
            <p className="sub" style={{ color: 'var(--good)' }}>Embeber si…</p>
            <div className="deftiles" style={{ gridTemplateColumns: '1fr' }}>
              <div className="deft"><p>✔ el embebido es <b>parte</b> del padre</p></div>
              <div className="deft"><p>✔ la consulta dominante los pide <b>juntos</b></p></div>
              <div className="deft"><p>✔ la cardinalidad es <b>chica y acotada</b> (ej: dirección, teléfonos)</p></div>
            </div>
          </div>
          <div>
            <p className="sub" style={{ color: 'var(--warn)' }}>Referenciar si…</p>
            <div className="deftiles" style={{ gridTemplateColumns: '1fr' }}>
              <div className="deft"><p>✔ las entidades tienen <b>ciclo de vida independiente</b></p></div>
              <div className="deft"><p>✔ el embebido <b>crecería sin tope</b> (ej: comentarios de una noticia)</p></div>
              <div className="deft"><p>✔ se comparte / consulta por separado</p></div>
            </div>
          </div>
        </div>
        <div className="note mt"><b>Documental vs relacional:</b> el relacional rompe los atributos compuestos y multivaluados en tablas (1FN) y valida FK; el documental los mantiene embebidos y delega la consistencia a la app. Las consultas complejas usan el pipeline (<code className="inline">$lookup</code> en vez de JOIN).</div>
      </div>
    </>
  )
}
