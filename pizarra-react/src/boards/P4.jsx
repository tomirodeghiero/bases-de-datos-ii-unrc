import React, { useState } from 'react'
import { Html, BoardHead } from '../components/ui.jsx'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const STEPS = [
  ['Class.forName(driver)', 'Se carga y registra el driver del motor.'],
  ['DriverManager.getConnection(url,u,p)', 'Se abre una Connection: una sesión activa contra la base.'],
  ['con.prepareStatement(sql)', 'La Connection fabrica un PreparedStatement (precompila).'],
  ['ps.executeQuery()', 'Se ejecuta el SQL; vuelve un ResultSet (un cursor de filas).'],
  ['while(rs.next()) rs.getXxx()', 'Se recorre fila por fila y se leen columnas por índice o nombre.'],
  ['close() — try-with-resources', 'Se cierran ResultSet, Statement y Connection. Si no, se agota el pool.'],
]
const LAYERS = [
  ['App Java', 'tu código: conoce solo la API'],
  ['API JDBC', 'interfaces estándar: Connection, Statement…'],
  ['Driver', 'traduce al protocolo del motor'],
  ['Base de Datos', 'MySQL / PostgreSQL / Oracle'],
]

export default function P4() {
  const [inp, setInp] = useState("' OR '1'='1")
  const [js, setJs] = useState(0)

  const finalSql = `SELECT * FROM usuarios WHERE user='${inp}'`
  const stmtCode = `String u = "${inp}";\nString sql =\n  "SELECT * FROM usuarios "\n  + "WHERE user='" + u + "'";\nstmt.executeQuery(sql);`
  const prepCode = `String sql =\n  "SELECT * FROM usuarios WHERE user=?";\nps = con.prepareStatement(sql);\nps.setString(1, "${inp}");\nps.executeQuery();`

  let note
  if (inp === "' OR '1'='1") note = "El <code class='mono'>OR '1'='1'</code> hace la condición siempre verdadera: <b>devuelve todos los usuarios</b> y saltea el login."
  else if (inp.includes('DROP')) note = "El <code class='mono'>;</code> cierra la sentencia y <b>ejecuta un segundo comando destructivo</b>. El <code class='mono'>--</code> comenta el resto."
  else note = 'Input inofensivo: la sentencia queda bien formada. Pero la vulnerabilidad ya existe — depende del input.'

  return (
    <>
      <BoardHead k="Práctico 04 · APIs de acceso" title="JDBC · Java habla con la base">
        La app no escribe SQL a mano comando por comando: usa una API. En Java es <b>JDBC</b>. La app
        conoce solo la API; el <b>driver</b> traduce al protocolo del motor. Cambiar de MySQL a
        PostgreSQL cambia driver y URL, no tu código.
      </BoardHead>

      <div className="card">
        <div className="flex between center wrapf">
          <h3 className="h3"><span className="num">01</span> SQL injection: <code className="inline">Statement</code> vs <code className="inline">PreparedStatement</code></h3>
          <span className="demo-tag">Interactivo · escribí un ataque</span>
        </div>
        <p className="lede">
          Escribí lo que un usuario pondría en un formulario de login y mirá cómo termina la
          sentencia en cada caso. Con <code className="inline">Statement</code> el dato se{' '}
          <b>concatena</b> al SQL; con <code className="inline">PreparedStatement</code> viaja aparte
          del texto.
        </p>
        <div className="controls">
          <label className="field" style={{ flex: 1, minWidth: 240 }}>
            input del usuario (campo "usuario")
            <input type="text" value={inp} onChange={(e) => setInp(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        <div className="flex gap wrapf small" style={{ marginBottom: 12 }}>
          <button className="btn" onClick={() => setInp('admin')}>normal: admin</button>
          <button className="btn" onClick={() => setInp("' OR '1'='1")}>bypass login</button>
          <button className="btn" onClick={() => setInp("'; DROP TABLE usuarios;--")}>destructivo</button>
        </div>
        <div className="grid2">
          <div>
            <div className="sub">Statement <span className="pill bad">vulnerable</span></div>
            <Html as="pre" className="code" html={esc(stmtCode) + `\n\n<span class="cm">// SQL que llega al motor:</span>\n<span style="color:var(--bad)">${esc(finalSql)}</span>`} />
            <Html className="note bad mt8" html={note} />
          </div>
          <div>
            <div className="sub">PreparedStatement <span className="pill good">seguro</span></div>
            <Html as="pre" className="code" html={esc(prepCode) + `\n\n<span class="cm">// el ? recibe el valor como DATO literal:</span>\n<span style="color:var(--good)">busca un usuario llamado exactamente «${esc(inp)}» → 0 filas</span>`} />
            <div className="note good mt8">
              El <code className="inline">?</code> es un placeholder. El input se envía como{' '}
              <b>parámetro</b> con <code className="inline">setString(1, …)</code> y nunca se interpreta
              como SQL. Además precompila el plan y convierte tipos.
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3"><span className="num">02</span> Ciclo de vida de la conexión</h3>
          <p className="lede">
            De la app a la base y de vuelta. Si no cerrás los recursos, se agota el pool de
            conexiones: por eso se usa <code className="inline">try-with-resources</code>.
          </p>
          <div className="stage" style={{ padding: 14 }}>
            <div className="trace">
              {STEPS.map((s, i) => (
                <div key={i} className={'ln' + (i <= js ? ' show' : '')}>
                  <span className="st">{i + 1}</span>
                  <span><b className="mono">{s[0]}</b><br /><span className="small muted">{s[1]}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="controls mt">
            <button className="btn primary" onClick={() => setJs((j) => Math.min(j + 1, STEPS.length - 1))}>▶ Siguiente</button>
            <button className="btn ghost" onClick={() => setJs(0)}>↺</button>
          </div>
        </div>

        <div className="card">
          <h3 className="h3">La arquitectura en capas</h3>
          <div>
            {LAYERS.map((l, i) => (
              <React.Fragment key={i}>
                <div className="layer"><span className="ic">{i + 1}</span><span><b>{l[0]}</b> — <span className="muted">{l[1]}</span></span></div>
                {i < LAYERS.length - 1 && <div className="arrowdown">↓</div>}
              </React.Fragment>
            ))}
          </div>
          <div className="note mt">
            <b>DatabaseMetaData</b> te deja explorar la estructura (
            <code className="inline">getTables</code>, <code className="inline">getColumns</code>,{' '}
            <code className="inline">getPrimaryKeys</code>) sin tocar el catálogo del motor. Y{' '}
            <code className="inline">NUMERIC/DECIMAL</code> → <code className="inline">BigDecimal</code>, ojo con eso.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3"><span className="num">03</span> Conceptos clave</h3>
        <div className="deftiles">
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />JDBC</h4><p>API Java, 100% Java, independiente del motor: mismo código contra cualquier base con driver.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-green)' }} />2 vs 3 capas</h4><p>2 capas: app ↔ base (lo del práctico). 3 capas: app ↔ servidor de aplicaciones ↔ base (sistemas grandes).</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-amber)' }} />Connection</h4><p>Sesión activa. Fábrica de Statement; maneja transacciones con commit()/rollback().</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-violet)' }} />ResultSet</h4><p>Conjunto de filas = un cursor. next() avanza; getXxx lee por índice (desde 1) o nombre.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-rose)' }} />Pool de conexiones</h4><p>Recursos escasos: si no se cierran, se agotan. Por eso try-with-resources cierra todo AutoCloseable.</p></div>
          <div className="deft"><h4><span className="dot" style={{ background: 'var(--m-blue)' }} />JPA / JDO</h4><p>ORMs (Hibernate, EclipseLink) que persisten objetos; por debajo terminan usando JDBC.</p></div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">Tipos de Statement</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>tipo</th><th>parámetros</th><th>precompila</th><th>uso</th></tr></thead>
              <tbody>
                <tr><td className="mono">Statement</td><td>no</td><td>no</td><td>SQL estático sin datos del usuario</td></tr>
                <tr><td className="mono">PreparedStatement</td><td>sí (?)</td><td>sí</td><td>lo recomendado: seguro y rápido</td></tr>
                <tr><td className="mono">CallableStatement</td><td>sí (IN/OUT)</td><td>sí</td><td>invocar procedimientos</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sub mt">Métodos de ejecución</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>método</th><th>devuelve</th></tr></thead>
              <tbody>
                <tr><td className="mono">executeQuery</td><td>ResultSet (SELECT)</td></tr>
                <tr><td className="mono">executeUpdate</td><td>int filas (INSERT/UPDATE/DELETE)</td></tr>
                <tr><td className="mono">execute</td><td>boolean (genérico)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Tipos de ResultSet</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>tipo</th><th>navegación</th></tr></thead>
              <tbody>
                <tr><td className="mono">TYPE_FORWARD_ONLY</td><td>solo avanza (default)</td></tr>
                <tr><td className="mono">SCROLL_INSENSITIVE</td><td>ambos sentidos, no ve cambios posteriores</td></tr>
                <tr><td className="mono">SCROLL_SENSITIVE</td><td>ambos sentidos y refleja cambios</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sub mt">Concurrencia</p>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>modo</th><th>permite</th></tr></thead>
              <tbody>
                <tr><td className="mono">CONCUR_READ_ONLY</td><td>solo lectura (default)</td></tr>
                <tr><td className="mono">CONCUR_UPDATABLE</td><td>updateXxx / insertRow / deleteRow</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3 className="h3">URL JDBC por motor</h3>
          <p className="lede">Forma <code className="inline">jdbc:subprotocolo:fuente</code>. Cambiar de motor cambia driver y URL, no las clases.</p>
          <Html as="pre" className="code" html={`<span class="cm">// PostgreSQL</span>
jdbc:postgresql://localhost:5432/postgres
<span class="cm">// MySQL</span>
jdbc:mysql://localhost:3306/practico1a
<span class="cm">// Oracle</span>
jdbc:oracle:thin:@//localhost:1521/XE`} />
          <div className="note mt small">Conviene externalizar la URL en un archivo <code className="inline">.properties</code>.</div>
        </div>
        <div className="card">
          <h3 className="h3">Mapeo de tipos SQL ↔ Java</h3>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th>SQL</th><th>Java</th><th>getter</th></tr></thead>
              <tbody>
                <tr><td className="mono">INTEGER</td><td>int</td><td>getInt</td></tr>
                <tr><td className="mono">VARCHAR</td><td>String</td><td>getString</td></tr>
                <tr><td className="mono">NUMERIC/DECIMAL</td><td className="hl">BigDecimal</td><td>getBigDecimal</td></tr>
                <tr><td className="mono">DATE</td><td>java.sql.Date</td><td>getDate</td></tr>
                <tr><td className="mono">TIMESTAMP</td><td>Timestamp</td><td>getTimestamp</td></tr>
                <tr><td className="mono">BOOLEAN</td><td>boolean</td><td>getBoolean</td></tr>
              </tbody>
            </table>
          </div>
          <div className="note mt small">Cuando <b>DatabaseMetaData</b> no expone un detalle del motor, se cae al catálogo: <code className="inline">information_schema</code> (MySQL/PG) o vistas <code className="inline">USER_*</code> (Oracle).</div>
        </div>
      </div>
    </>
  )
}
