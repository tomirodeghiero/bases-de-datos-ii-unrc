import React, { useState } from 'react'
import { Html, BoardHead, cssv } from '../components/ui.jsx'

const NODES = { DBA: { x: 210, y: 40 }, U1: { x: 110, y: 130 }, U2: { x: 310, y: 130 }, U3: { x: 110, y: 220 }, U4: { x: 310, y: 220 } }

function hasPath(edges, target) {
  if (target === 'DBA') return true
  const seen = new Set(['DBA'])
  let f = ['DBA']
  while (f.length) {
    const n = f.shift()
    for (const e of edges) if (e.from === n && !seen.has(e.to)) { if (e.to === target) return true; seen.add(e.to); f.push(e.to) }
  }
  return false
}

function GrantGraph({ edges }) {
  return (
    <svg viewBox="0 0 420 260" width="100%">
      <defs>
        <marker id="arrP2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6" fill={cssv('--ink-faint')} />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = NODES[e.from], b = NODES[e.to]
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L
        return <line key={i} x1={a.x + ux * 26} y1={a.y + uy * 26} x2={b.x - ux * 30} y2={b.y - uy * 30} stroke={cssv('--ink-faint')} strokeWidth="2" markerEnd="url(#arrP2)" />
      })}
      {Object.entries(NODES).map(([k, n]) => {
        const live = hasPath(edges, k)
        return (
          <g key={k}>
            <circle cx={n.x} cy={n.y} r="24" fill={live ? cssv('--accent-wash') : cssv('--panel-2')} stroke={live ? cssv('--accent') : cssv('--bad')} strokeWidth="2.5" opacity={live ? 1 : 0.5} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fontWeight="700" fill={live ? cssv('--ink') : cssv('--bad')}>{k}</text>
            {!live && k !== 'DBA' && <text x={n.x} y={n.y + 40} textAnchor="middle" fontSize="10" fill={cssv('--bad')}>sin permiso</text>}
          </g>
        )
      })}
    </svg>
  )
}

const GRANS = [
  ['*.*', 'todo el servidor', 'GRANT ALL ON *.*'],
  ['db.*', 'una base', 'GRANT … ON practico1a.*'],
  ['tabla', 'una tabla', 'GRANT SELECT ON personas'],
  ['columna', 'columnas puntuales', 'GRANT SELECT (nombre) ON personas'],
]
const USERS = ['cajero', 'asesor', 'encargado']
const TABLES = ['cliente', 'taller', 'categoria']

export default function P2() {
  const [edges, setEdges] = useState([])
  const [log, setLog] = useState('Ejecutá los pasos en orden. Cada <code class="mono">GRANT</code> dibuja un arco.')
  const [matrix, setMatrix] = useState(() => {
    const m = {}
    USERS.forEach((u) => TABLES.forEach((t) => { m[u + '|' + t] = u === 'asesor' && t === 'taller' ? 1 : t === 'cliente' ? 2 : 0 }))
    return m
  })

  const addEdge = (list, from, to) => (list.some((e) => e.from === from && e.to === to) ? list : [...list, { from, to }])

  const step = (n) => {
    setEdges((prev) => {
      let next = prev
      if (n === '1') { next = addEdge(addEdge(prev, 'DBA', 'U1'), 'DBA', 'U2'); setLog('<code class="mono">DBA: GRANT UPDATE ON personas TO U1, U2 WITH GRANT OPTION;</code>') }
      if (n === '2') { if (!hasPath(prev, 'U1')) { setLog('⚠ U1 todavía no tiene el permiso.'); return prev } next = addEdge(prev, 'U1', 'U3'); setLog('<code class="mono">U1: GRANT UPDATE ON personas TO U3;</code> — U1 delega porque tiene GRANT OPTION.') }
      if (n === '3') { if (!hasPath(prev, 'U2')) { setLog('⚠ U2 todavía no tiene el permiso.'); return prev } next = addEdge(prev, 'U2', 'U4'); setLog('<code class="mono">U2: GRANT UPDATE ON personas TO U4;</code>') }
      return next
    })
  }

  const revoke = (mode) => {
    setEdges((prev) => {
      const u3dep = prev.some((e) => e.from === 'U1' && e.to === 'U3')
      if (mode === 'RESTRICT') {
        if (u3dep) { setLog('<b style="color:var(--bad)">ERROR.</b> RESTRICT falla: U1 ya delegó el permiso a U3. Hay que revocar a U3 primero.'); return prev }
        setLog('REVOKE … FROM U1 RESTRICT; — se pudo porque U1 no había delegado.')
        return prev.filter((e) => !(e.from === 'DBA' && e.to === 'U1'))
      }
      setLog('REVOKE … FROM U1 CASCADE; — cae el arco DBA→U1 y <b>U3 queda sin camino a la raíz</b>: pierde el permiso en cascada.')
      return prev.filter((e) => !(e.from === 'DBA' && e.to === 'U1'))
    })
  }

  const cycleCell = (k) => setMatrix((m) => ({ ...m, [k]: (m[k] + 1) % 3 }))

  return (
    <>
      <BoardHead k="Práctico 02 · Data Control Language" title="DCL · Privilegios, roles y el grafo de concesión">
        DCL responde una sola pregunta: <b>¿quién puede hacer qué sobre cada objeto?</b> Dos
        comandos, <code className="inline">GRANT</code> y <code className="inline">REVOKE</code>, más
        tres piezas: usuarios, privilegios y roles. La joya del tema es el <b>grafo de concesión</b>:
        revocar un permiso puede tumbar en cascada a todos los que dependían de él.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">01</span> Grafo de concesión</h3>
          <span className="demo-tag">Interactivo · WITH GRANT OPTION</span>
        </div>
        <p className="lede">
          El <b>DBA</b> es la raíz. Un usuario tiene el privilegio <em>si y solo si</em> existe un
          camino desde la raíz hasta su nodo. Reproducí la secuencia del teórico y mirá qué pasa al
          revocar en <b>CASCADE</b> vs <b>RESTRICT</b>.
        </p>
        <div className="controls">
          <button className="btn" onClick={() => step('1')}>1 · DBA → U1, U2 <span className="mono muted">WITH GRANT OPTION</span></button>
          <button className="btn" onClick={() => step('2')}>2 · U1 → U3</button>
          <button className="btn" onClick={() => step('3')}>3 · U2 → U4</button>
        </div>
        <div className="controls">
          <span className="mono muted small">Revocar UPDATE a U1:</span>
          <button className="btn" onClick={() => revoke('CASCADE')}>REVOKE … FROM U1 CASCADE</button>
          <button className="btn" onClick={() => revoke('RESTRICT')}>REVOKE … FROM U1 RESTRICT</button>
          <button className="btn ghost" onClick={() => { setEdges([]); setLog('Ejecutá los pasos en orden.') }}>↺ Reiniciar</button>
        </div>
        <div className="stage" style={{ padding: 8 }}><GrantGraph edges={edges} /></div>
        <Html className="note mt" html={log} />
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">02</span> Matriz de privilegios</h3>
          <p className="lede">
            Clic en una celda para conceder / revocar. El permiso puede ser <b>directo</b>,{' '}
            <b>heredado por rol</b> o sin permiso.
          </p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>usuario \ tabla</th>{TABLES.map((t) => <th key={t}>{t}</th>)}</tr></thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u}>
                    <td className="mono">{u}</td>
                    {TABLES.map((t) => {
                      const v = matrix[u + '|' + t]
                      const cls = v === 1 ? 'good' : v === 2 ? 'warn' : 'neutral'
                      const lbl = v === 1 ? 'SELECT' : v === 2 ? 'rol' : '—'
                      return <td key={t} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => cycleCell(u + '|' + t)}><span className={'pill ' + cls}>{lbl}</span></td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap wrapf mt8 small">
            <span className="pill good">directo</span>
            <span className="pill warn">por rol</span>
            <span className="pill neutral">sin permiso</span>
          </div>
        </div>

        <div className="card">
          <h3 className="h3">Granularidad</h3>
          <p className="lede">Un <code className="inline">GRANT</code> se acota progresivamente: de todo el servidor a una sola columna.</p>
          <div>
            {GRANS.map((g, i) => (
              <div className="gran-ring" key={g[0]} style={{ marginLeft: i * 14, width: `calc(100% - ${i * 14}px)` }}>
                <span><b>{g[0]}</b> · {g[1]}</span><span className="muted">{g[2]}</span>
              </div>
            ))}
          </div>
          <Html as="pre" className="code mt" html={`<span class="kw">GRANT SELECT</span> (apellido, nombre)
   <span class="kw">ON</span> personas <span class="kw">TO</span> empleado;`} />
          <div className="note mt"><b>REVOKE por defecto es en cascada.</b> PostgreSQL respeta CASCADE/RESTRICT; MySQL ignora la diferencia y revoca directo.</div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">03</span> Conceptos clave</h3>
        <div className="deftiles">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Usuario</h4><p>Cuenta con la que se inicia sesión en el motor. Se autentica con contraseña (y en MySQL, host).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />Privilegio</h4><p>Permiso individual sobre un objeto (tabla, vista, procedimiento). Se otorga y se revoca.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Rol</h4><p>Conjunto nominado de privilegios asignable a varios usuarios. Evita repetir configuración; admite anidamiento.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />WITH GRANT OPTION</h4><p>El receptor puede a su vez <b>delegar</b> ese permiso a un tercero.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-rose)' }} />Ownership</h4><p>El propietario de un objeto es quien lo creó; solo él (o un DBA) puede otorgar permisos sobre él.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />Grafo de concesión</h4><p>Grafo dirigido por recurso: nodos = usuarios, arcos = concesiones. Tenés el permiso si hay camino desde la raíz (DBA).</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Tipos de privilegio</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>privilegio</th><th>permite</th></tr></thead>
              <tbody>
                <tr><td className="mono">SELECT</td><td>leer filas</td></tr>
                <tr><td className="mono">INSERT</td><td>agregar filas</td></tr>
                <tr><td className="mono">UPDATE</td><td>modificar (acotable a columnas)</td></tr>
                <tr><td className="mono">DELETE</td><td>eliminar filas</td></tr>
                <tr><td className="mono">REFERENCES</td><td>crear FK que apunten a la tabla</td></tr>
                <tr><td className="mono">EXECUTE</td><td>ejecutar funciones/procedimientos</td></tr>
                <tr><td className="mono">CREATE/DROP/ALTER</td><td>modificar la estructura</td></tr>
                <tr><td className="mono">GRANT OPTION</td><td>delegar el permiso</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Modelo de seguridad</h3>
          <p className="lede">Cómo se relacionan las piezas (cardinalidades del teórico).</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>relación</th><th>cardinalidad</th></tr></thead>
              <tbody>
                <tr><td className="mono">Usuario — Privilegio</td><td>1 : 1..N</td></tr>
                <tr><td className="mono">Usuario — Rol</td><td>1 : 0..N</td></tr>
                <tr><td className="mono">Rol — Privilegio</td><td>1 : 1..N</td></tr>
                <tr><td className="mono">Usuario — Perfil</td><td>1 : 0..1</td></tr>
                <tr><td className="mono">Perfil — Recurso</td><td>1 : 1..N</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt small">Un usuario obtiene privilegios directo o vía roles; el perfil regula el consumo de recursos.</div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">04</span> Administración por motor <span className="demo-tag">no es estándar</span></h3>
        <p className="lede">Reconocer qué es SQL estándar y qué es específico del motor es "la mitad del práctico".</p>
        <div className="tablewrap">
          <table className="data">
            <thead><tr><th>—</th><th>MySQL</th><th>PostgreSQL</th><th>Oracle XE</th></tr></thead>
            <tbody>
              <tr><td className="mono">cuenta</td><td>usuario@host</td><td>rol con LOGIN</td><td>usuario = esquema</td></tr>
              <tr><td className="mono">roles</td><td>CREATE ROLE (≥8)</td><td>todo es rol</td><td>CONNECT/RESOURCE/DBA</td></tr>
              <tr><td className="mono">restricción de host</td><td>parte del nombre</td><td>pg_hba.conf</td><td>config de red</td></tr>
              <tr><td className="mono">límites de recursos</td><td>MAX_*_PER_HOUR</td><td>CONNECTION LIMIT</td><td>CREATE PROFILE</td></tr>
              <tr><td className="mono">REVOKE RESTRICT/CASCADE</td><td>no respeta</td><td>estándar</td><td>estándar</td></tr>
              <tr><td className="mono">forzar cambio de clave</td><td>—</td><td>VALID UNTIL</td><td>PASSWORD EXPIRE</td></tr>
              <tr><td className="mono">verificación</td><td>SHOW GRANTS</td><td>\dp · \z</td><td>USER_TAB_PRIVS</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note mt"><b>Verificar de verdad:</b> además de consultar los privilegios, loguearse con cada usuario y probar operaciones permitidas (deben funcionar) y prohibidas (deben fallar). Si los tests positivos y negativos coinciden con la consigna, los permisos están bien.</div>
      </div>
    </>
  )
}
