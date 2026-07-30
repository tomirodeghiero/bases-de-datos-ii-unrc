import React, { useState } from 'react'
import { Seg, Html, BoardHead, cssv } from '../components/ui.jsx'

function TriggerTimeline({ ev, tm }) {
  const boxes = [
    ['evento ' + ev, cssv('--m-blue')],
    [tm === 'BEFORE' ? 'TRIGGER (BEFORE)' : 'operación DML', cssv('--accent')],
    [tm === 'BEFORE' ? 'operación DML' : 'TRIGGER (AFTER)', cssv('--m-green')],
    ['fila persistida', cssv('--ink-faint')],
  ]
  return (
    <svg viewBox="0 0 560 120" width="100%">
      {boxes.map((b, i) => {
        const x = 10 + i * 140
        return (
          <g key={i}>
            <rect x={x} y="36" width="118" height="44" rx="9" fill={cssv('--panel-2')} stroke={b[1]} strokeWidth="2" />
            <text x={x + 59} y="62" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill={cssv('--ink')}>{b[0]}</text>
            {i < 3 && <text x={x + 128} y="62" textAnchor="middle" fill={cssv('--line-strong')}>→</text>}
          </g>
        )
      })}
    </svg>
  )
}

const CURSOR_DATA = [['Juan', 8, 5], ['Pedro', 3, 9], ['Carlos', 7, 7]]
const CURSOR_PHASES = [
  'DECLARE cursor1 CURSOR FOR SELECT …',
  'OPEN cursor1',
  'FETCH → fila 1',
  'FETCH → fila 2',
  'FETCH → fila 3',
  'FETCH → NOT FOUND (02000) → done=1',
  'CLOSE cursor1',
]

export default function P3() {
  const [ev, setEv] = useState('INSERT')
  const [tm, setTm] = useState('BEFORE')
  const [rows, setRows] = useState(3)
  const [scope, setScope] = useState('ROW')
  const [cs, setCs] = useState(0)

  const has = { NEW: ev !== 'DELETE', OLD: ev !== 'INSERT' }
  const fires = scope === 'ROW' ? rows : 1

  return (
    <>
      <BoardHead k="Práctico 03 · Server programming" title="Procedimientos, funciones y triggers">
        Código que vive <b>dentro del motor</b>. Un procedimiento se invoca a mano (
        <code className="inline">CALL</code>); un <b>trigger</b> lo dispara el motor solo, ante un
        INSERT/UPDATE/DELETE. Cada motor tiene su dialecto (SQL/PSM, PL/pgSQL, PL/SQL) pero la lógica
        es la misma.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">01</span> Anatomía de un trigger</h3>
          <span className="demo-tag">Interactivo · NEW / OLD</span>
        </div>
        <p className="lede">
          Elegí el evento y el momento. Se encienden las variables de contexto disponibles (
          <code className="inline">NEW</code> / <code className="inline">OLD</code>) y verás por qué
          un trigger <b>BEFORE</b> puede abortar la operación y uno <b>AFTER</b> ya no.
        </p>
        <div className="controls">
          <Seg options={['INSERT', 'UPDATE', 'DELETE']} value={ev} onChange={setEv} />
          <Seg options={['BEFORE', 'AFTER']} value={tm} onChange={setTm} />
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            filas afectadas
            <input type="range" min="1" max="5" value={rows} onChange={(e) => setRows(+e.target.value)} />
            <span className="mono">{rows}</span>
          </label>
          <Seg options={[{ value: 'ROW', label: 'FOR EACH ROW' }, { value: 'STATEMENT', label: 'STATEMENT' }]} value={scope} onChange={setScope} />
        </div>
        <div className="stage" style={{ padding: 16 }}><TriggerTimeline ev={ev} tm={tm} /></div>
        <div className="grid2 mt">
          <Html className="note" html={`<b>Variables de contexto:</b><br>
            <span class="pill ${has.NEW ? 'good' : 'neutral'}">NEW ${has.NEW ? 'disponible' : 'no aplica'}</span>
            <span class="pill ${has.OLD ? 'good' : 'neutral'}">OLD ${has.OLD ? 'disponible' : 'no aplica'}</span><br>
            <span class="small muted">INSERT→solo NEW · DELETE→solo OLD · UPDATE→ambas · en Oracle se prefijan con «:»</span>`} />
          <Html className="note" html={`<b>El cuerpo se ejecuta ${fires} ${fires === 1 ? 'vez' : 'veces'}.</b><br>` +
            (scope === 'ROW' ? `FOR EACH ROW → una vez por cada una de las ${rows} filas afectadas.` : 'FOR EACH STATEMENT → una sola vez por sentencia, sin importar cuántas filas toque.') +
            (tm === 'BEFORE' ? '<br><span style="color:var(--good)">BEFORE puede modificar NEW o abortar con SIGNAL/RAISE antes de persistir.</span>' : '<br><span style="color:var(--warn)">AFTER ya persistió: no puede cambiar la fila, solo reaccionar (auditoría).</span>')} />
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">02</span> Ciclo de vida de un cursor</h3>
          <p className="lede">
            Recorrer un resultado fila por fila: cuatro etapas. El fin se detecta con{' '}
            <code className="inline">NOT FOUND</code> (SQLSTATE '02000'). Ejecutá paso a paso.
          </p>
          <div className="stage" style={{ padding: 14 }}>
            <div className="trace">
              {CURSOR_PHASES.map((p, i) => (
                <div key={i} className={'ln' + (i <= cs ? ' show' : '') + (i === 5 && cs >= 5 ? ' wait' : '')}>
                  <span className="st">{i + 1}</span><span>{p}</span>
                </div>
              ))}
            </div>
            <div className="tablewrap mt8">
              <table className="data">
                <thead><tr><th>nombre</th><th>b</th><th>c</th><th>destino</th></tr></thead>
                <tbody>
                  {CURSOR_DATA.map((r, i) => {
                    const active = cs >= 2 && cs <= 4 && cs - 2 === i
                    const done = cs > 2 + i
                    return (
                      <tr key={i} className={active || done ? '' : 'dim'} style={active ? { background: 'var(--accent-wash)' } : undefined}>
                        <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
                        <td>{done || active ? (r[1] < r[2] ? '→ tabla2' : '→ tabla3') : '·'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="controls mt">
            <button className="btn primary" onClick={() => setCs((c) => Math.min(c + 1, CURSOR_PHASES.length - 1))}>▶ Siguiente paso</button>
            <button className="btn ghost" onClick={() => setCs(0)}>↺</button>
          </div>
        </div>

        <div className="card">
          <h3 className="h3">Procedimiento vs Trigger</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>—</th><th>Procedimiento</th><th>Trigger</th></tr></thead>
              <tbody>
                <tr><td className="mono">quién lo dispara</td><td>la aplicación (<code className="inline">CALL</code>)</td><td>el motor, automático</td></tr>
                <tr><td className="mono">parámetros</td><td>IN / OUT / INOUT</td><td>NEW / OLD</td></tr>
                <tr><td className="mono">frecuencia</td><td>una vez por llamada</td><td>por fila o por sentencia</td></tr>
                <tr><td className="mono">aborta con</td><td>SIGNAL / RAISE</td><td>SIGNAL en BEFORE</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt">
            <b>Ventaja clave:</b> podés dar <code className="inline">EXECUTE</code> de un
            procedimiento sin dar permisos sobre las tablas subyacentes. Menos tráfico de red y plan
            precompilado.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">03</span> Conceptos clave</h3>
        <div className="deftiles">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Procedimiento vs función</h4><p>La función <b>devuelve un valor</b> (RETURNS/RETURN); el procedimiento no. Ambos corren dentro del motor.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />IN / OUT / INOUT</h4><p>IN entrada por valor, OUT lo escribe la rutina, INOUT ambos. En MySQL, sin modo = IN. En Oracle: "IN OUT".</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Bloque BEGIN…END</h4><p>Unidad de ejecución y de scope; anidable. Regla: <b>DECLARE primero</b>, código después.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />Cursor</h4><p>Recorre fila por fila: DECLARE → OPEN → FETCH (loop) → CLOSE. Fin con NOT FOUND (02000).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-rose)' }} />Handler</h4><p>Reacciona ante una condición: CONTINUE (sigue), EXIT (sale del bloque), UNDO (deshace).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />INSTEAD OF</h4><p>Trigger sobre vistas (Oracle/PostgreSQL): redirige la operación hacia las tablas base.</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Control de flujo</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>estructura</th><th>característica</th></tr></thead>
              <tbody>
                <tr><td className="mono">IF…THEN…ELSE</td><td>condicional</td></tr>
                <tr><td className="mono">CASE…WHEN</td><td>selección múltiple</td></tr>
                <tr><td className="mono">LOOP…END LOOP</td><td>salir con LEAVE, reiniciar con ITERATE</td></tr>
                <tr><td className="mono">WHILE…DO</td><td>evalúa la condición antes</td></tr>
                <tr><td className="mono">REPEAT…UNTIL</td><td>ejecuta al menos una vez</td></tr>
                <tr><td className="mono">FOR</td><td>numérico o sobre filas (PL/pgSQL, PL/SQL)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Handlers de MySQL</h3>
          <p className="lede">Se disparan según el tipo de condición (por prefijo del SQLSTATE).</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>condición</th><th>SQLSTATE</th></tr></thead>
              <tbody>
                <tr><td className="mono">SQLWARNING</td><td>empieza con 01</td></tr>
                <tr><td className="mono">NOT FOUND</td><td>empieza con 02 (fin de cursor)</td></tr>
                <tr><td className="mono">SQLEXCEPTION</td><td>el resto</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt small">Tipos de handler: <b>CONTINUE</b> ejecuta y sigue · <b>EXIT</b> ejecuta y termina el bloque · <b>UNDO</b> deshace (no siempre soportado).</div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">04</span> Dialectos y excepciones de usuario</h3>
        <div className="tablewrap">
          <table className="data">
            <thead><tr><th>—</th><th>MySQL (SQL/PSM)</th><th>PostgreSQL (PL/pgSQL)</th><th>Oracle (PL/SQL)</th></tr></thead>
            <tbody>
              <tr><td className="mono">invocar</td><td>CALL proc(...)</td><td>SELECT func(...)</td><td>bloque BEGIN…END</td></tr>
              <tr><td className="mono">asignar variable</td><td>SET / SELECT INTO</td><td>:=</td><td>:=</td></tr>
              <tr><td className="mono">lanzar excepción</td><td>SIGNAL SQLSTATE '45000'</td><td>RAISE EXCEPTION</td><td>RAISE_APPLICATION_ERROR(-20xxx)</td></tr>
              <tr><td className="mono">capturar</td><td>DECLARE … HANDLER</td><td>EXCEPTION WHEN</td><td>EXCEPTION WHEN OTHERS (SQLCODE/SQLERRM)</td></tr>
              <tr><td className="mono">trigger</td><td>directo en el CREATE</td><td>función RETURNS TRIGGER + asociación</td><td>bloque + WHEN opcional</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note mt"><b>Ventajas de los procedimientos:</b> rendimiento (corren en el motor), compilación previa, menos tráfico de red, centralización de la lógica, seguridad (EXECUTE sin permisos sobre tablas) y encapsulamiento. <b>Contra:</b> cada motor tiene su dialecto, migrar cuesta.</div>
      </div>
    </>
  )
}
