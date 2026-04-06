#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

practicos="$(find . -maxdepth 1 -type d -name 'practico-*' | sed 's#^\./##' | sort -V)"

if [ -z "$practicos" ]; then
  echo "No se encontraron carpetas practico-* en la raiz del proyecto."
  exit 1
fi

upper() {
  echo "$1" | tr '[:lower:]' '[:upper:]'
}

titleize() {
  echo "$1" | sed -E 's/[-_]+/ /g' | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) tolower(substr($i,2)) } print}'
}

practico_title() {
  local tp="$1"
  local n
  n="$(echo "$tp" | sed -E 's/[^0-9]+//g')"
  if [ -n "$n" ]; then
    echo "Practico $((10#$n))"
  else
    echo "$(titleize "$tp")"
  fi
}

readmes_list="$(mktemp)"
for tp in $practicos; do
  find "$tp" -type f \( -name 'README.md' -o -name 'readme.md' \)
done | sort > "$readmes_list"

rm -rf docs
rm -rf static/pdfs
mkdir -p docs static/pdfs

while IFS= read -r src; do
  [ -z "$src" ] && continue

  tp="${src%%/*}"
  sub="${src#*/}"
  dir="$(dirname "$sub")"

  if [ "$dir" = "." ]; then
    title="$(practico_title "$tp")"
    dest="docs/$tp/index.md"
    slug="/$tp/"
    position=1
  else
    bn="$(basename "$dir")"
    bn="${bn/assignmnet/assignment}"
    case "$bn" in
      ejercicio-*|ejercicio[0-9]*)
        n="$(echo "$bn" | sed -E 's/[^0-9]+//g')"
        if [ -n "$n" ]; then
          n="$((10#$n))"
          title="Ejercicio $n"
          position="$n"
        else
          title="$(titleize "$bn")"
          position=99
        fi
        ;;
      *)
        title="$(titleize "$bn")"
        position=99
        ;;
    esac
    dest="docs/$tp/$dir/index.md"
    slug="/$tp/$dir/"
  fi

  mkdir -p "$(dirname "$dest")"
  {
    echo "---"
    echo "title: \"$title\""
    echo "sidebar_position: $position"
    echo "slug: \"$slug\""
    echo "description: \"Contenido importado desde $src\""
    echo "---"
    echo
    sed -E \
      -e 's#(\[[^]]+\]\([^)]*)README\.md#\1index.md#g' \
      -e 's#(\[[^]]+\]\([^)]*)Readme\.md#\1index.md#g' \
      -e 's#(\[[^]]+\]\([^)]*)readme\.md#\1index.md#g' \
      "$src"
  } > "$dest"
done < "$readmes_list"

for tp in $practicos; do
  idx="docs/$tp/index.md"
  if [ ! -f "$idx" ]; then
    mkdir -p "docs/$tp"
    title="$(practico_title "$tp")"
    {
      echo "---"
      echo "title: \"$title\""
      echo "sidebar_position: 1"
      echo "slug: \"/$tp/\""
      echo "description: \"Indice de documentacion para $tp\""
      echo "---"
      echo
      echo "# $title"
      echo
      echo "Este practico no tenia un README general en la raiz."
      echo
    } > "$idx"
  fi
done

for tp in $practicos; do
  idx="docs/$tp/index.md"
  subdocs="$(find "docs/$tp" -type f -name 'index.md' ! -path "$idx" | sort || true)"
  if [ -n "$subdocs" ] && ! grep -q '^## Navegacion interna$' "$idx"; then
    {
      echo
      echo "## Navegacion interna"
      echo
      echo "$subdocs" | while IFS= read -r d; do
        [ -z "$d" ] && continue
        rel="${d#docs/$tp/}"
        rel="${rel%/index.md}"
        bn="$(basename "$rel")"
        bn="${bn/assignmnet/assignment}"
        case "$bn" in
          ejercicio-*|ejercicio[0-9]*)
            n="$(echo "$bn" | sed -E 's/[^0-9]+//g')"
            if [ -n "$n" ]; then
              label="Ejercicio $((10#$n))"
            else
              label="$(titleize "$bn")"
            fi
            ;;
          *)
            label="$(titleize "$bn")"
            ;;
        esac
        echo "- [$label](./$rel/)"
      done
    } >> "$idx"
  fi
done

for tp in $practicos; do
  idx="docs/$tp/index.md"
  pdfs="$(find "$tp" -type f -iname '*.pdf' | sort || true)"
  if [ -n "$pdfs" ]; then
    {
      echo
      echo "## Material PDF"
      echo
      echo "$pdfs" | while IFS= read -r pdf; do
        [ -z "$pdf" ] && continue
        rel="${pdf#./}"
        mkdir -p "static/pdfs/$(dirname "$rel")"
        cp "$pdf" "static/pdfs/$rel"
        name="$(basename "$pdf")"
        echo "- [$name](/pdfs/$rel)"
      done
    } >> "$idx"
  fi
done

cat > docs/intro.md <<EOF
---
title: "Documentacion de Trabajos Practicos"
sidebar_position: 1
slug: "/"
description: "Indice principal de la documentacion de Bases de Datos II"
---

# Documentacion de Trabajos Practicos

Esta documentacion consolida los README de cada practico del repositorio,
organizados por secciones para facilitar la navegacion.

## Practicos

EOF

for tp in $practicos; do
  title="$(practico_title "$tp")"
  echo "- [$title](./$tp/)" >> docs/intro.md
done

cat >> docs/intro.md <<'EOF'

## Notas

- El contenido fue importado desde los README originales sin eliminarlos del proyecto.
- Se incorporo front matter basico para compatibilidad con Docusaurus.
- Los enlaces a otros README fueron adaptados a rutas `index.md` dentro de `docs/`.
- Los PDFs de cada practico se publican en la seccion "Material PDF" del indice.
EOF

rm -f "$readmes_list"
echo "Documentacion regenerada en docs/ y static/pdfs/"
