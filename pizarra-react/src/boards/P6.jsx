import React, { useState } from 'react'
import { Seg, Html, BoardHead, cssv } from '../components/ui.jsx'

const T1_OPS = ['r1(X)', 'w1(X)', 'r1(Y)', 'w1(Y)']
const T2_OPS = ['r2(X)', 'w2(X)']
const parse = (o) => ({ t: +o[1], op: o[0], item: o[3] })

function conflicts(sched) {
  const p = sched.map(parse)
  const edgeSet = new Set()
  const labels = []
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) {
      const a = p[i], b = p[j]
      if (a.t === b.t || a.item !== b.item) continue
      if (a.op === 'r' && b.op === 'r') continue
      const key = a.t + '->' + b.t
      if (!edgeSet.has(key)) { edgeSet.add(key); labels.push(`${sched[i]} antes de ${sched[j]} ⇒ T${a.t}→T${b.t}`) }
    }
  return { edges: [...edgeSet].map((k) => k.split('->').map(Number)), labels }
}
const hasCycle = (edges) => {
  const s = new Set(edges.map((e) => e[0] + '-' + e[1]))
  return s.has('1-2') && s.has('2-1')
}

function PrecGraph({ edges, cyc }) {
  const pos = { 1: { x: 80, y: 75 }, 2: { x: 200, y: 75 } }
  return (
    <svg viewBox="0 0 280 150" width="100%">
      <defs>
        <marker id="paP6" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6" fill={cssv('--ink')} />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = pos[e[0]], b = pos[e[1]]
        const off = e[0] < e[1] ? -14 : 14
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + off
        const d = `M${a.x + (e[0] < e[1] ? 24 : -24)},${a.y + (e[0] < e[1] ? -6 : 6)} Q ${mx},${my} ${b.x + (e[0] < e[1] ? -26 : 26)},${b.y + (e[0] < e[1] ? -6 : 6)}`
        return <path key={i} d={d} fill="none" stroke={cyc ? cssv('--bad') : cssv('--ink')} strokeWidth="2" markerEnd="url(#paP6)" />
      })}
      {[1, 2].map((t) => {
        const n = pos[t]
        return (
          <g key={t}>
            <circle cx={n.x} cy={n.y} r="24" fill={cssv('--panel-2')} stroke={cyc ? cssv('--bad') : cssv('--accent')} strokeWidth="2.5" />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize="14" fontWeight="700" fill={cssv('--ink')}>T{t}</text>
          </g>
        )
      })}
    </svg>
  )
}

const TRACE = [
  ['T1', 'LX1(X)', 'grow'], ['T1', 'LX1(Y)', 'grow'], ['T1', 'leer(X)'], ['T1', 'X:=X−N'], ['T1', 'escribir(X)'],
  ['T2', 'LX2(X) → espera', 'wait'], ['T1', 'UX1(X)', 'pivot'], ['T2', 'LX2(X) concedido', 'grow'], ['T2', 'leer(X)'],
  ['T1', 'leer(Y)'], ['T2', 'X:=X+M'], ['T1', 'Y:=Y+N'], ['T2', 'escribir(X)'], ['T2', 'UX2(X)', 'shrink'], ['T2', 'commit'],
  ['T1', 'escribir(Y)'], ['T1', 'UX1(Y)', 'shrink'], ['T1', 'commit'],
]
const VARIANT_NOTE = {
  puro: '2PL <b>puro</b>: se permite liberar locks antes del commit (paso 7). Da más concurrencia pero abre la puerta al rollback en cascada.',
  estricto: '2PL <b>estricto</b>: los locks <b>exclusivos</b> se retienen hasta el commit. Evita el rollback en cascada. Es lo que usa InnoDB.',
  riguroso: '2PL <b>riguroso</b>: <b>todos</b> los locks (S y X) se retienen hasta el commit. Serializa en el orden de los commits.',
}

const NORMAL = { sched: ['r1(X)', 'w1(X)', 'r2(X)', 'w2(X)', 'r1(Y)', 'w1(Y)', 'r3(Y)', 'w3(Y)'], mt: { 1: 1, 2: 2, 3: 3 } }
const COUNTER = { sched: ['r2(X)', 'w2(X)', 'w1(X)'], mt: { 1: 1, 2: 2 } }

function computeTS(data) {
  const E = { X: 0, Y: 0 }, L = { X: 0, Y: 0 }, rows = []
  data.sched.forEach((op) => {
    const t = +op[1], kind = op[0], item = op[3], mt = data.mt[t]
    let verdict = 'OK', roll = false
    if (kind === 'r') {
      if (mt < E[item]) { verdict = `mt(${t})<MT-E=${E[item]} → ROLLBACK`; roll = true }
      else { L[item] = Math.max(L[item], mt); verdict = `mt≥MT-E ⇒ leer; MT-L(${item})=${L[item]}` }
    } else {
      if (mt < L[item]) { verdict = `mt(${t})<MT-L=${L[item]} → ROLLBACK`; roll = true }
      else if (mt < E[item]) { verdict = 'mt<MT-E → ROLLBACK'; roll = true }
      else { E[item] = mt; verdict = `OK ⇒ escribir; MT-E(${item})=${E[item]}` }
    }
    rows.push({ op, verdict, roll, EX: E.X, LX: L.X, EY: E.Y, LY: L.Y })
  })
  return rows
}

const LEVELS = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']
const ANOMS = ['Lectura sucia', 'No repetible', 'Phantom']
const M = [[1, 1, 1], [0, 1, 1], [0, 0, 1], [0, 0, 0]]
const EXPL = {
  '0,0': 'READ UNCOMMITTED permite lectura sucia: T1 lee datos que T2 no confirmó; si T2 aborta, T1 leyó un fantasma.',
  '0,1': 'Permite lectura no repetible.', '0,2': 'Permite phantom.',
  '1,1': 'READ COMMITTED: cada SELECT toma un snapshot nuevo, así que dos lecturas pueden diferir (no repetible).',
  '1,0': 'READ COMMITTED bloquea la lectura sucia: solo ves datos confirmados.', '1,2': 'Aún permite phantom (nuevas filas en un rango).',
  '2,2': 'REPEATABLE READ fija el snapshot en el primer SELECT; en el estándar aún pueden aparecer phantoms (InnoDB los evita con next-key locks).',
  '2,0': 'Sin lectura sucia.', '2,1': 'Sin lectura no repetible: la fila leída no cambia dentro de la transacción.',
  '3,0': 'SERIALIZABLE: máximo aislamiento, como si las transacciones corrieran en serie. Ninguna anomalía.', '3,1': 'Ninguna anomalía.', '3,2': 'Ni siquiera phantoms.',
}

export default function P6() {
  const [sched, setSched] = useState([])
  const [variant, setVariant] = useState('puro')
  const [ls, setLs] = useState(0)
  const [tsMode, setTsMode] = useState('normal')
  const [ts, setTs] = useState(0)
  const [isoSel, setIsoSel] = useState(null)

  // --- schedule ---
  const nextOp = (t) => {
    const arr = t === 1 ? T1_OPS : T2_OPS
    const used = sched.filter((o) => +o[1] === t).length
    return used < arr.length ? arr[used] : null
  }
  const { edges, labels } = conflicts(sched)
  const cyc = hasCycle(edges)
  const complete = sched.length === 6
  let verdict
  if (!complete) verdict = `<span class="muted">Schedule incompleto (${sched.length}/6 ops). El grafo se actualiza en vivo.</span>`
  else if (cyc) verdict = '<span class="pill bad">NO SERIALIZABLE ✗</span> Hay ciclo <b>T1↔T2</b>: ningún orden serial es compatible. Es el clásico <b>lost update</b>.'
  else verdict = `<span class="pill good">SERIALIZABLE ✓</span> Grafo acíclico ⇒ equivalente a la serie <b>${edges.some((e) => e[0] === 1) ? 'T1; T2' : 'T2; T1'}</b>.`
  if (labels.length) verdict += `<div class="small muted mt8">Conflictos: ${labels.join(' · ')}</div>`

  // --- timestamp ---
  const tsData = tsMode === 'normal' ? NORMAL : COUNTER
  const tsRows = computeTS(tsData)
  const anyRoll = tsRows.slice(0, ts + 1).some((r) => r.roll)
  const tsNote = tsMode === 'normal'
    ? (ts >= tsRows.length - 1 ? '<b>Sin rollbacks.</b> Cada operación llegó en orden temporal compatible. Marcas: MT(T1)=1, MT(T2)=2, MT(T3)=3.' : 'Marcas: MT(T1)=1, MT(T2)=2, MT(T3)=3. Avanzá para validar cada operación.')
    : (anyRoll ? "<b style='color:var(--bad)'>Rollback.</b> T1 (marca 1) quiere escribir X, pero T2 (marca 2) ya escribió una versión más nueva: llega tarde ⇒ se rechaza y reinicia." : 'Contraejemplo: T2 escribe X antes que T1. Avanzá hasta w1(X).')

  return (
    <>
      <BoardHead k="Práctico 06 · El corazón del curso" title="Transacciones y control de concurrencia">
        Una transacción es una unidad lógica de trabajo: una secuencia de{' '}
        <code className="inline">r(Q)</code> / <code className="inline">w(Q)</code> que termina en
        COMMIT o ROLLBACK, con garantías <b>ACID</b>. Cuando varias corren entrelazadas, ¿el
        resultado sigue siendo correcto? La respuesta formal es la <b>serializabilidad por
        conflicto</b>, y se testea con un grafo.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">01</span> Constructor de planificaciones + grafo de precedencia</h3>
          <span className="demo-tag">Interactivo · la joya</span>
        </div>
        <p className="lede">
          Armá un schedule entrelazando las operaciones de <span className="t1"><b>T1</b></span> y{' '}
          <span className="t2"><b>T2</b></span> (respetando su orden interno). El grafo se construye
          solo: un arco <code className="inline">Ti→Tj</code> por cada conflicto donde la op de Ti va
          antes. <b>Serializable ⟺ el grafo es acíclico.</b>
        </p>
        <div className="controls">
          <button className="btn" onClick={() => setSched(['r1(X)', 'w1(X)', 'r2(X)', 'w2(X)', 'r1(Y)', 'w1(Y)'])}>Preset S1 · serializable</button>
          <button className="btn" onClick={() => setSched(['r1(X)', 'r2(X)', 'w1(X)', 'w2(X)', 'r1(Y)', 'w1(Y)'])}>Preset S2 · lost update</button>
          <button className="btn ghost" onClick={() => setSched([])}>Vaciar</button>
        </div>
        <div className="grid2">
          <div>
            <div className="sub">Operaciones disponibles</div>
            <div>
              {[1, 2].map((t) => {
                const nx = nextOp(t)
                return (
                  <button key={t} className={'opblk op-t' + t} disabled={!nx} onClick={() => nx && setSched((s) => [...s, nx])}>
                    {nx || `T${t} ✓`}
                  </button>
                )
              })}
            </div>
            <div className="sub mt">Planificación (clic para truncar)</div>
            <div className="stage" style={{ padding: 12, minHeight: 56 }}>
              {sched.length === 0 && <span className="muted small">Agregá operaciones desde arriba, o cargá un preset.</span>}
              {sched.map((o, i) => (
                <span key={i} className={'opblk op-t' + o[1]} title="clic para truncar hasta acá" onClick={() => setSched((s) => s.slice(0, i))}>{o}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="sub">Grafo de precedencia</div>
            <div className="stage" style={{ padding: 8 }}><PrecGraph edges={edges} cyc={cyc} /></div>
            <Html className="note mt" html={verdict} />
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">02</span> Simulador 2PL</h3>
          <p className="lede">
            Bloqueo de dos fases: <b>fase de crecimiento</b> (solo pide locks) y <b>decrecimiento</b>{' '}
            (solo libera). El primer <code className="inline">UNLOCK</code> es el <b>punto de
            viraje</b>. Reproducí la traza del ejercicio 2.
          </p>
          <div className="controls">
            <Seg options={[{ value: 'puro', label: '2PL puro' }, { value: 'estricto', label: 'estricto' }, { value: 'riguroso', label: 'riguroso' }]} value={variant} onChange={setVariant} />
          </div>
          <div className="stage" style={{ padding: 14 }}>
            <div className="trace">
              {TRACE.map((r, i) => {
                const cls = r[2] || ''
                return (
                  <div key={i} className={'ln' + (i <= ls ? ' show' : '') + (cls === 'wait' || cls === 'pivot' ? ' ' + cls : '')}>
                    <span className="st">{i + 1}</span>
                    <span className={'op-t' + r[0][1]} style={{ fontWeight: 700 }}>{r[0]}</span>
                    <span>{r[1]}</span>
                    {cls === 'grow' && <span className="badge grow">crece</span>}
                    {cls === 'shrink' && <span className="badge shrink">decrece</span>}
                    {cls === 'pivot' && <span className="badge shrink">punto de viraje</span>}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="controls mt">
            <button className="btn primary" onClick={() => setLs((v) => Math.min(v + 1, TRACE.length - 1))}>▶ Siguiente</button>
            <button className="btn ghost" onClick={() => setLs(0)}>↺</button>
          </div>
          <Html className="note mt" html={VARIANT_NOTE[variant]} />
        </div>

        <div className="card">
          <h3 className="h3"><span className="num">03</span> Marcas temporales (timestamp ordering)</h3>
          <p className="lede">
            Cada ítem guarda <b>MT-E</b> (última escritura) y <b>MT-L</b> (última lectura). Cada
            operación se valida contra la marca de su transacción; si "llega tarde", <b>rollback</b>.
            Ejercicio 3, paso a paso.
          </p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>#</th><th>op</th><th>validación</th><th>E(X)</th><th>L(X)</th><th>E(Y)</th><th>L(Y)</th></tr></thead>
              <tbody>
                {tsRows.map((r, i) => {
                  const show = i <= ts
                  return (
                    <tr key={i} className={show ? '' : 'dim'} style={r.roll && show ? { background: 'color-mix(in srgb,var(--bad) 14%,transparent)' } : undefined}>
                      <td>{i + 1}</td>
                      <td className="mono" style={{ fontWeight: 700 }}>{show ? r.op : '·'}</td>
                      <td className="small">{show ? r.verdict : ''}</td>
                      <td>{show ? r.EX : ''}</td><td>{show ? r.LX : ''}</td><td>{show ? r.EY : ''}</td><td>{show ? r.LY : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="controls mt">
            <button className="btn primary" onClick={() => setTs((v) => Math.min(v + 1, tsData.sched.length - 1))}>▶ Siguiente</button>
            <button className="btn ghost" onClick={() => setTs(0)}>↺</button>
            <button className="btn" onClick={() => { setTsMode((m) => (m === 'normal' ? 'counter' : 'normal')); setTs(0) }}>
              {tsMode === 'normal' ? 'Cargar contraejemplo (rollback)' : 'Volver al ejercicio 3'}
            </button>
          </div>
          <Html className="note mt" html={tsNote} />
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">04</span> Anomalías por nivel de aislamiento</h3>
          <p className="lede">Subir el aislamiento cuesta concurrencia. Clic en una celda para ver la anomalía.</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>nivel \ anomalía</th>{ANOMS.map((a) => <th key={a}>{a}</th>)}</tr></thead>
              <tbody>
                {LEVELS.map((lv, i) => (
                  <tr key={lv}>
                    <td className="mono small">{lv}</td>
                    {ANOMS.map((a, j) => {
                      const p = M[i][j]
                      const key = i + ',' + j
                      return (
                        <td key={a} className={'isocell ' + (p ? 'posible' : 'no') + (isoSel === key ? ' sel' : '')} onClick={() => setIsoSel(key)}>
                          {p ? 'posible' : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Html className="note mt" html={isoSel ? EXPL[isoSel] : 'Elegí una celda de la matriz.'} />
        </div>

        <div className="card">
          <h3 className="h3">ACID + tipos de conflicto</h3>
          <div className="deftiles" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Atomicidad</h4><p>Todo o nada. Logs + rollback.</p></div>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />Consistencia</h4><p>De estado válido a estado válido. La cuida el programador.</p></div>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Aislamiento</h4><p>Cada transacción cree que está sola.</p></div>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />Durabilidad</h4><p>Tras COMMIT, sobrevive a fallos.</p></div>
          </div>
          <div className="mt">
            <div className="sub">Conflicto = mismo ítem, al menos una escritura</div>
            <div className="flex gap wrapf">
              <span className="pill neutral">r·r → sin conflicto</span>
              <span className="pill bad">w·r → WR (lectura sucia)</span>
              <span className="pill bad">r·w → RW</span>
              <span className="pill bad">w·w → WW</span>
            </div>
          </div>
          <div className="note mt">
            <b>MVCC (PostgreSQL):</b> un UPDATE no machaca — crea una versión nueva (
            <code className="inline">xmin</code>=XID, <code className="inline">xmax</code>=0) y marca la
            vieja con <code className="inline">xmax</code>. Las lecturas no bloquean escrituras.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">05</span> Estados de una transacción</h3>
        <div className="pipeline">
          <div className="pstage on"><div className="st">Activa</div><div className="lbl">ejecutándose</div><div className="arrow">→</div></div>
          <div className="pstage on"><div className="st">Parcialmente comprometida</div><div className="lbl">ejecutó la última instrucción; falta trabajo del motor</div><div className="arrow">→</div></div>
          <div className="pstage on"><div className="st">Comprometida</div><div className="lbl">COMMIT: efectos permanentes</div></div>
        </div>
        <div className="pipeline mt8">
          <div className="pstage"><div className="st">Fallida</div><div className="lbl">error, violación de constraint, deadlock o fallo del sistema</div><div className="arrow">→</div></div>
          <div className="pstage"><div className="st">Abortada</div><div className="lbl">ROLLBACK: se restaura el estado previo. Puede reintentarse o cancelarse</div></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Recuperabilidad (la dimensión del aborto)</h3>
          <p className="lede">La serializabilidad garantiza el resultado, pero falta ver qué pasa si una transacción aborta.</p>
          <div className="deftiles" style={{ gridTemplateColumns: '1fr' }}>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Recuperable</h4><p>Si T_j lee lo que T_i escribió, el commit de T_i va antes que el de T_j. Si no, T_j confirmó sobre algo que se abortó.</p></div>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />Sin cascada (cascadeless)</h4><p>T_j solo lee datos de T_i ya <b>confirmados</b>. Evita el rollback en cascada (avalancha de abortos).</p></div>
            <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Estricta</h4><p>Ni lee ni sobrescribe datos no confirmados. SQL exige garantizar serializabilidad <b>y</b> ausencia de cascada.</p></div>
          </div>
          <div className="note mt small">Toda planificación sin cascada es recuperable; el recíproco no se cumple.</div>
        </div>
        <div className="card">
          <h3 className="h3">Cerrojos y deadlock</h3>
          <p className="sub">Matriz de compatibilidad</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>—</th><th>S (compartido)</th><th>X (exclusivo)</th></tr></thead>
              <tbody>
                <tr><td className="mono">S</td><td className="isocell no">compatible</td><td className="isocell posible">no</td></tr>
                <tr><td className="mono">X</td><td className="isocell posible">no</td><td className="isocell posible">no</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note bad mt"><b>Deadlock:</b> T1 tiene X(B) y pide X(A); T2 tiene S(A) y pide S(B). Ninguna avanza. El motor hace rollback de una <b>víctima</b> (grafo <i>wait-for</i>) y libera sus locks.</div>
          <div className="note mt small"><b>Timestamp ordering</b>, en cambio, no tiene deadlocks: las transacciones nunca esperan, se reinician.</div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">06</span> MVCC: PostgreSQL vs InnoDB</h3>
        <div className="tablewrap">
          <table className="data">
            <thead><tr><th>—</th><th>PostgreSQL</th><th>InnoDB (MySQL)</th></tr></thead>
            <tbody>
              <tr><td className="mono">columnas de versión</td><td>xmin / xmax (visibles por SQL)</td><td>DB_TRX_ID / DB_ROLL_PTR (ocultas)</td></tr>
              <tr><td className="mono">dónde guarda versiones</td><td>en la propia tabla (puede generar bloat)</td><td>en el undo log (tablespace aparte)</td></tr>
              <tr><td className="mono">limpieza</td><td>VACUUM / autovacuum</td><td>purge thread automático</td></tr>
              <tr><td className="mono">2PL</td><td>MVCC + locks explícitos</td><td>2PL estricto (no puro) + wait-for</td></tr>
              <tr><td className="mono">aislamiento default</td><td>READ COMMITTED</td><td>REPEATABLE READ (next-key locks evitan phantoms)</td></tr>
              <tr><td className="mono">FK deferibles</td><td>DEFERRABLE INITIALLY DEFERRED</td><td>no soporta (chequeo inmediato)</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note mt"><b>UPDATE en PostgreSQL:</b> crea versión nueva (<code className="inline">xmin</code>=XID, <code className="inline">xmax</code>=0) y deja la vieja con <code className="inline">xmax</code>=XID. <b>DELETE:</b> marca <code className="inline">xmax</code> sin crear versión. Dos transacciones concurrentes pueden ver versiones distintas de la misma fila sin esperarse.</div>
      </div>
    </>
  )
}
