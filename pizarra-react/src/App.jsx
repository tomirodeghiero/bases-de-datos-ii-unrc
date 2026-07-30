import React, { useState, useEffect, useCallback } from 'react'
import P1 from './boards/P1.jsx'
import P2 from './boards/P2.jsx'
import P3 from './boards/P3.jsx'
import P4 from './boards/P4.jsx'
import P5 from './boards/P5.jsx'
import P6 from './boards/P6.jsx'
import P7 from './boards/P7.jsx'
import Templates from './boards/Templates.jsx'

const BOARDS = [
  { id: 'p1', tag: 'P1', name: 'Repaso SQL', Comp: P1 },
  { id: 'p2', tag: 'P2', name: 'DCL · Privilegios', Comp: P2 },
  { id: 'p3', tag: 'P3', name: 'Procedimientos', Comp: P3 },
  { id: 'p4', tag: 'P4', name: 'JDBC · APIs', Comp: P4 },
  { id: 'p5', tag: 'P5', name: 'Optimización', Comp: P5 },
  { id: 'p6', tag: 'P6', name: 'Transacciones', Comp: P6 },
  { id: 'p7', tag: 'P7', name: 'JSON · MongoDB', Comp: P7 },
  { id: 'tpl', tag: '★', name: 'Plantillas', Comp: Templates },
]

const CHIPS = [
  ['SQL', 'joins · agregación'],
  ['DCL', 'grant · revoke'],
  ['Procedimientos', 'triggers · cursores'],
  ['JDBC', 'ciclo de conexión'],
  ['Optimización', 'árbol de plan'],
  ['Transacciones', 'serializabilidad'],
  ['MongoDB', 'agregación'],
]

export default function App() {
  const initial = (typeof location !== 'undefined' && location.hash.replace('#', '')) || 'p1'
  const [active, setActive] = useState(BOARDS.some((b) => b.id === initial) ? initial : 'p1')
  // theme: null = follow system; otherwise 'light' | 'dark'
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme)
    else document.documentElement.removeAttribute('data-theme')
  }, [theme])

  const go = useCallback((id) => {
    setActive(id)
    if (typeof history !== 'undefined') history.replaceState(null, '', '#' + id)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches?.('input,textarea,select')) return
      const i = BOARDS.findIndex((b) => b.id === active)
      if (e.key === 'ArrowRight' && i < BOARDS.length - 1) go(BOARDS[i + 1].id)
      if (e.key === 'ArrowLeft' && i > 0) go(BOARDS[i - 1].id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, go])

  const idx = BOARDS.findIndex((b) => b.id === active)
  const Active = BOARDS[idx].Comp

  const toggleTheme = () => {
    const sysDark = matchMedia('(prefers-color-scheme:dark)').matches
    const cur = theme || (sysDark ? 'dark' : 'light')
    setTheme(cur === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <div className="topbar">
        <div className="row">
          <div className="brand">
            <span className="mark">DB</span>
            <span>
              Pizarra Interactiva
              <small>Bases de Datos II · UNRC</small>
            </span>
          </div>
          <span className="spacer" />
          <span className="progress-mini">{active === 'tpl' ? '★ Plantillas' : `P${idx + 1} / 7`}</span>
          <button className="tbtn" onClick={toggleTheme} aria-label="Cambiar tema">
            ◐ Tema
          </button>
        </div>
      </div>

      <header className="hero">
        <p className="eyebrow">7 prácticos · una sola pizarra</p>
        <h1 className="title">Bases de Datos II, para tocar con las manos.</h1>
        <p className="lead">
          Cada concepto del curso convertido en un simulador: armá <em>joins</em>, propagá
          privilegios, ejecutá procedimientos paso a paso, transformá árboles de consulta, construí
          planificaciones concurrentes y seguí un pipeline de MongoDB en vivo. Nada de leer y creer
          — probalo.
        </p>
        <div className="meta">
          {CHIPS.map(([b, t]) => (
            <span className="chip" key={b}>
              <b>{b}</b> {t}
            </span>
          ))}
        </div>
      </header>

      <div className="app">
        <nav className="rail" aria-label="Prácticos">
          <div className="rlabel">Prácticos</div>
          <ol>
            {BOARDS.map((b) => (
              <React.Fragment key={b.id}>
                {b.id === 'tpl' && (
                  <li aria-hidden="true" style={{ borderTop: '1px solid var(--line)', margin: '8px 0 4px' }} />
                )}
                <li>
                  <button
                    className={'navitem' + (active === b.id ? ' active' : '')}
                    onClick={() => go(b.id)}
                  >
                    <span className="tag">{b.tag}</span> {b.name}
                  </button>
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>

        <main>
          {/* key includes theme so SVG components re-read CSS vars on theme switch */}
          <div className="board" key={active + (theme || 'sys')}>
            <Active />
          </div>
        </main>
      </div>

      <footer className="footer">
        Pizarra interactiva · Bases de Datos II · Universidad Nacional de Río Cuarto — construida
        sobre los resúmenes teóricos y resoluciones de los prácticos 01–07. Navegá con la barra
        lateral o las teclas <span className="kbd">←</span> <span className="kbd">→</span>.
      </footer>
    </>
  )
}
