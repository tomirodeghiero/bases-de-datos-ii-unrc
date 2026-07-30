import React, { useState } from 'react'
import { Html, BoardHead, cssv } from '../components/ui.jsx'

const NOTES = [
  'Árbol inicial: la σ conjuntiva está en la <b>raíz</b>. Los joins se hacen completos y el filtro llega al final, sobre un intermedio enorme.',
  'R1 — se parte la σ conjuntiva en dos selecciones encadenadas. Todavía arriba, pero ya separables.',
  "R7 — cada σ baja hasta la tabla base que menciona: <code class='mono'>precio</code>→provee, <code class='mono'>desc</code>→articulos. Ahora los joins operan sobre relaciones filtradas.",
  'R5·R6 — se reordenan los joins para hacer primero el de las dos ramas ya reducidas. Intermedio mínimo.',
]
const COSTS = [{ i: '12 000', f: '120' }, { i: '12 000', f: '120' }, { i: '800', f: '120' }, { i: '140', f: '120' }]

function Node({ x, y, t, fill, fs }) {
  return (
    <g>
      <rect x={x - 30} y={y - 15} width="60" height="30" rx="7" fill={fill || cssv('--panel')} stroke={cssv('--line-strong')} strokeWidth="1.5" />
      <text x={x} y={y + 5} textAnchor="middle" fontFamily="var(--mono)" fontSize={fs || 13} fill={cssv('--ink')}>{t}</text>
    </g>
  )
}
const Edge = ({ x1, y1, x2, y2 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cssv('--ink-faint')} strokeWidth="1.5" />

function Tree({ stage }) {
  const sel = cssv('--accent-wash'), join = cssv('--panel-2')
  let content
  if (stage <= 1) {
    const jy = stage === 0 ? 100 : 135
    content = (
      <>
        <Edge x1={280} y1={jy + 15} x2={190} y2={jy + 55} /><Edge x1={280} y1={jy + 15} x2={370} y2={jy + 55} />
        <Edge x1={190} y1={jy + 70} x2={140} y2={jy + 130} /><Edge x1={190} y1={jy + 70} x2={240} y2={jy + 130} />
        {stage === 0 ? (<><Edge x1={280} y1={45} x2={280} y2={85} /><Node x={280} y={30} t="σ∧" fill={sel} /></>)
          : (<><Edge x1={280} y1={40} x2={280} y2={70} /><Edge x1={280} y1={95} x2={280} y2={120} /><Node x={280} y={25} t="σ desc" fill={sel} /><Node x={280} y={80} t="σ precio" fill={sel} /></>)}
        <Node x={280} y={jy} t="⋈" fill={join} />
        <Node x={190} y={jy + 70} t="⋈" fill={join} />
        <Node x={370} y={jy + 70} t="artic." />
        <Node x={140} y={jy + 145} t="prov." /><Node x={240} y={jy + 145} t="provee" />
      </>
    )
  } else if (stage === 2) {
    content = (
      <>
        <Edge x1={280} y1={45} x2={180} y2={90} /><Edge x1={280} y1={45} x2={390} y2={90} />
        <Edge x1={180} y1={120} x2={120} y2={165} /><Edge x1={180} y1={120} x2={250} y2={165} />
        <Edge x1={250} y1={165} x2={250} y2={195} /><Edge x1={390} y1={120} x2={390} y2={150} />
        <Node x={280} y={30} t="⋈" fill={join} />
        <Node x={180} y={105} t="⋈" fill={join} /><Node x={390} y={105} t="σ desc" fill={sel} />
        <Node x={120} y={180} t="prov." /><Node x={250} y={150} t="σ precio" fill={sel} />
        <Node x={250} y={205} t="provee" /><Node x={390} y={160} t="artic." />
      </>
    )
  } else {
    content = (
      <>
        <Edge x1={280} y1={45} x2={160} y2={90} /><Edge x1={280} y1={45} x2={400} y2={90} />
        <Edge x1={400} y1={120} x2={340} y2={165} /><Edge x1={400} y1={120} x2={470} y2={165} />
        <Edge x1={340} y1={165} x2={340} y2={195} /><Edge x1={470} y1={165} x2={470} y2={195} />
        <Node x={280} y={30} t="⋈" fill={join} />
        <Node x={160} y={105} t="prov." /><Node x={400} y={105} t="⋈" fill={join} />
        <Node x={340} y={150} t="σ precio" fill={sel} /><Node x={470} y={150} t="σ desc" fill={sel} />
        <Node x={340} y={205} t="provee" /><Node x={470} y={205} t="artic." />
      </>
    )
  }
  return <svg viewBox="0 0 560 300" width="100%">{content}</svg>
}

function CostChart({ br, sel, hi }) {
  const nr = br * 40
  const seq = br
  const idxSec = hi + Math.ceil(nr * sel)
  const max = Math.max(seq, idxSec, 1)
  const W = 520
  const w1 = Math.max(4, (seq / max) * W)
  const w2 = Math.max(4, (idxSec / max) * W)
  return (
    <svg viewBox="0 0 560 120" width="100%">
      <text x="20" y="24" fontFamily="var(--mono)" fontSize="12" fill={cssv('--ink')}>Costo aproximado (lecturas de bloque)</text>
      <rect x="20" y="40" width={w1} height="24" rx="5" fill={cssv('--m-blue')} />
      <text x="28" y="57" fontFamily="var(--mono)" fontSize="11" fill="#fff">Seq Scan: {Math.round(seq)}</text>
      <rect x="20" y="74" width={w2} height="24" rx="5" fill={idxSec < seq ? cssv('--m-green') : cssv('--m-rose')} />
      <text x="28" y="91" fontFamily="var(--mono)" fontSize="11" fill="#fff">Índice secundario: {Math.round(idxSec)}</text>
    </svg>
  )
}

export default function P5() {
  const [stage, setStage] = useState(0)
  const [br, setBr] = useState(400)
  const [selPct, setSelPct] = useState(30)
  const [hi, setHi] = useState(3)

  const sel = selPct / 100
  const nr = br * 40
  const seq = br
  const idxSec = hi + Math.ceil(nr * sel)
  const winner = idxSec < seq ? 'el <b>índice</b> gana' : 'el <b>Seq Scan</b> gana'

  return (
    <>
      <BoardHead k="Práctico 05 · Procesamiento de consultas" title="Optimización de consultas">
        Entre dos planes que dan el <b>mismo resultado</b>, el costo puede diferir en varios órdenes
        de magnitud. El optimizador traduce el SQL a álgebra relacional (σ, Π, ⋈), reescribe el árbol
        con reglas de equivalencia y elige el plan más barato. La heurística estrella:{' '}
        <b>empujar las selecciones hacia las hojas</b>.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">01</span> Empuje de selección (push-down)</h3>
          <span className="demo-tag">Interactivo · reescribir el árbol</span>
        </div>
        <p className="lede">
          Consulta: <code className="inline">σ<sub>precio&lt;15 ∧ desc='Pan'</sub>(proveedor ⋈ provee ⋈ articulos)</code>.
          En el árbol inicial el filtro está en la raíz: primero se hacen los joins completos
          (intermedios enormes) y recién al final se filtra. Aplicá las reglas y mirá caer la
          cardinalidad.
        </p>
        <div className="controls">
          <button className="btn" onClick={() => setStage(1)}>R1 · partir σ conjuntiva</button>
          <button className="btn" onClick={() => setStage(2)}>R7 · empujar hacia las hojas</button>
          <button className="btn" onClick={() => setStage(3)}>R5·R6 · reordenar joins</button>
          <button className="btn ghost" onClick={() => setStage(0)}>↺ Árbol inicial</button>
        </div>
        <div className="stage" style={{ padding: 10 }}><Tree stage={stage} /></div>
        <div className="grid2 mt">
          <Html className="note" html={NOTES[stage]} />
          <Html className="note" html={`<b>Tuplas del intermedio más grande:</b> <span class="mono" style="font-size:1.3em;color:${stage >= 2 ? 'var(--good)' : 'var(--bad)'}">${COSTS[stage].i}</span><br><span class="small muted">Resultado final siempre = ${COSTS[stage].f} tuplas. Mismo resultado, costo muy distinto.</span>`} />
        </div>
      </div>

      <div className="grid3">
        <div className="card" style={{ padding: 16 }}>
          <h4 className="h3" style={{ fontSize: '1rem' }}>Nested-loop</h4>
          <p className="small muted">Cualquier condición. Doble bucle. Regla: la relación externa debe minimizar <code className="inline">n·b</code>. La chica adentro y en RAM.</p>
          <pre className="code" style={{ fontSize: 11 }}>{'for r in R:\n  for s in S:\n    if r.k==s.k: emit'}</pre>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h4 className="h3" style={{ fontSize: '1rem' }}>Sort-merge</h4>
          <p className="small muted">Equi-joins. Ordena ambas por el atributo y las recorre en paralelo una sola vez. Barato si ya vienen ordenadas.</p>
          <pre className="code" style={{ fontSize: 11 }}>{'sort(R); sort(S)\nmerge en paralelo →'}</pre>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h4 className="h3" style={{ fontSize: '1rem' }}>Hash join</h4>
          <p className="small muted">Igualdad. Particiona con un hash en buckets; solo cruza <code className="inline">r_i</code> con <code className="inline">s_i</code>. El default cuando nada viene ordenado.</p>
          <pre className="code" style={{ fontSize: 11 }}>{'build hash(R)\nprobe con S →'}</pre>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">02</span> Estimador de costo I/O</h3>
        <p className="lede">
          Costo ≈ <code className="inline">b·t_T + s·t_b</code> (bloques transferidos + búsquedas).
          Movés la selectividad y ves el cruce donde el <b>Seq Scan</b> (leer todo contiguo) le gana a
          un índice secundario (una I/O por tupla).
        </p>
        <div className="controls">
          <label className="field">bloques b_r <input type="range" min="50" max="2000" value={br} onChange={(e) => setBr(+e.target.value)} /></label>
          <label className="field">selectividad <input type="range" min="1" max="100" value={selPct} onChange={(e) => setSelPct(+e.target.value)} /></label>
          <label className="field">altura índice h_i <input type="range" min="1" max="4" value={hi} onChange={(e) => setHi(+e.target.value)} /></label>
        </div>
        <div className="stage" style={{ padding: 14 }}><CostChart br={br} sel={sel} hi={hi} /></div>
        <Html className="note mt" html={`Con selectividad ${selPct}% sobre ${Math.round(nr)} tuplas, ${winner}. ` +
          (idxSec < seq ? 'Pocas tuplas coinciden: saltar por el índice sale barato.' : 'Muchas tuplas coinciden: el índice haría una I/O por tupla, más caro que leer todo contiguo.')} />
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">03</span> Las tres fases del procesamiento</h3>
        <div className="pipeline">
          <div className="pstage on"><div className="st">1 · Parsing</div><div className="lbl">verifica sintaxis y traduce a álgebra relacional (σ, Π, ⋈)</div><div className="arrow">→</div></div>
          <div className="pstage on"><div className="st">2 · Optimización</div><div className="lbl">genera expresiones equivalentes, estima costos con estadísticas, elige el plan</div><div className="arrow">→</div></div>
          <div className="pstage on"><div className="st">3 · Evaluación</div><div className="lbl">el motor ejecuta el plan elegido contra los datos</div></div>
        </div>
        <div className="deftiles mt">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Modelo de costo</h4><p>Domina el acceso a disco: <code>b·t_T + s·t_b</code> (bloques transferidos + búsquedas). Las búsquedas son caras vs transferencias contiguas.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />Estadísticas del catálogo</h4><p><code>n_r</code> tuplas, <code>b_r</code> bloques, <code>V(A,r)</code> valores distintos, histogramas, MCV. Se actualizan con <code>ANALYZE</code>.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Materialización vs pipelining</h4><p>Materializar escribe intermedios a disco; el pipeline hace fluir tuplas sin escribir. Sort y build de hash-join bloquean el pipeline.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />Heurística vs costos</h4><p>Heurística: empujar σ y Π, joins restrictivos primero. Por costos: enumerar planes con programación dinámica (el espacio explota con n joins).</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Reglas de equivalencia</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>regla</th><th>equivalencia</th></tr></thead>
              <tbody>
                <tr><td className="mono">R1</td><td>σ<sub>a∧b</sub>(E) = σ<sub>a</sub>(σ<sub>b</sub>(E)) — cascada</td></tr>
                <tr><td className="mono">R2</td><td>σ<sub>a</sub>(σ<sub>b</sub>) = σ<sub>b</sub>(σ<sub>a</sub>) — conmuta</td></tr>
                <tr><td className="mono">R3</td><td>proyecciones: solo importa la externa</td></tr>
                <tr><td className="mono">R4</td><td>σ<sub>θ</sub>(E1×E2) = E1 ⋈<sub>θ</sub> E2</td></tr>
                <tr><td className="mono">R5</td><td>E1 ⋈ E2 = E2 ⋈ E1 — conmuta</td></tr>
                <tr><td className="mono">R6</td><td>(E1⋈E2)⋈E3 = E1⋈(E2⋈E3) — asocia</td></tr>
                <tr><td className="mono">R7</td><td>push-down de σ sobre join</td></tr>
                <tr><td className="mono">R8</td><td>push-down de Π sobre join</td></tr>
                <tr><td className="mono">R9–R12</td><td>conjuntos: ∪ ∩ conmutan/asocian; − no</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Algoritmos de selección σ</h3>
          <p className="lede">El optimizador elige según haya índice y la forma de la condición.</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>alg.</th><th>caso</th></tr></thead>
              <tbody>
                <tr><td className="mono">A1</td><td>búsqueda lineal (Seq Scan) — siempre aplicable</td></tr>
                <tr><td className="mono">A2</td><td>búsqueda binaria (archivo ordenado)</td></tr>
                <tr><td className="mono">A3</td><td>igualdad, índice único/PK — <b>ideal</b></td></tr>
                <tr><td className="mono">A5</td><td>igualdad, índice secundario</td></tr>
                <tr><td className="mono">A6 / A7</td><td>rango, índice primario / secundario</td></tr>
                <tr><td className="mono">A8 / A9</td><td>conjunción con un índice / índice compuesto</td></tr>
                <tr><td className="mono">A10 / A11</td><td>conjunción ∩ / disyunción ∪ de RIDs (bitmap)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">04</span> Estimación de cardinalidad y orden de join</h3>
        <div className="grid2">
          <div>
            <Html as="pre" className="code" html={`<span class="cm">// Selectividad</span>
σ A = v   → n_r / V(A,r)        <span class="cm">(A no clave)</span>
σ A ≤ v   → n_r · (v-min)/(max-min)
conjunción (independencia) → producto
<span class="cm">// Tamaño de join por atributo C</span>
C clave en b →  |a⋈b| ≤ |a|
si no       →  min(n_a·n_b/V(C,a), n_a·n_b/V(C,b))`} />
          </div>
          <div>
            <p className="sub">Orden de join (ejemplo del práctico)</p>
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th>plan</th><th>intermedio</th><th>final</th></tr></thead>
                <tbody>
                  <tr><td className="mono">A: (R1⋈R2)⋈R3</td><td className="hl">250</td><td>250</td></tr>
                  <tr><td className="mono">B: R1⋈(R2⋈R3)</td><td>3000</td><td>250</td></tr>
                </tbody>
              </table>
            </div>
            <div className="note mt small">Mismo resultado (250), pero el plan A tiene un intermedio 12× más chico. <b>Regla:</b> primero los joins que reduzcan más el intermedio.</div>
          </div>
        </div>
      </div>
    </>
  )
}
