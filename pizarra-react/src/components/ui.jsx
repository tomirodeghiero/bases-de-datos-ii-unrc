import React from 'react'

// read a CSS custom property (for SVG fills that must follow the theme)
export function cssv(name) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// segmented control
export function Seg({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        return (
          <button
            key={val}
            role="tab"
            aria-selected={value === val}
            className={value === val ? 'on' : ''}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// render an HTML string safely-ish (our own trusted strings only)
export function Html({ as: Tag = 'div', html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Pill({ kind = 'neutral', children }) {
  return <span className={`pill ${kind}`}>{children}</span>
}

export function BoardHead({ k, title, children }) {
  return (
    <div className="board-head">
      <span className="k">{k}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
