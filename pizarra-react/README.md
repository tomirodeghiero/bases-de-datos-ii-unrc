# Pizarra Interactiva · Bases de Datos II (UNRC)

Aplicación **React + Vite** que convierte cada concepto del curso en un simulador interactivo. Una sola pizarra con 7 prácticos + un recetario de plantillas.

## Correr en local

```bash
cd pizarra-react
npm install      # solo la primera vez
npm run dev      # http://localhost:5173
```

Build de producción y previsualización:

```bash
npm run build    # genera dist/
npm run preview
```

## Qué hay en cada pizarra

| Board | Tema | Interactivo |
|-------|------|-------------|
| **P1** | Repaso SQL | Visualizador de JOINs (con Venn y resultado en vivo) · orden lógico de evaluación |
| **P2** | DCL | Grafo de concesión (GRANT/REVOKE CASCADE vs RESTRICT) · matriz de privilegios · granularidad |
| **P3** | Procedimientos | Anatomía de trigger (NEW/OLD, BEFORE/AFTER, ROW/STATEMENT) · ciclo de vida de un cursor |
| **P4** | JDBC | Demo de SQL injection (Statement vs PreparedStatement) · ciclo de vida de la conexión |
| **P5** | Optimización | Árbol de plan transformable (push-down) · comparador de joins · estimador de costo I/O |
| **P6** | Transacciones | Constructor de schedules + grafo de precedencia con detección de ciclo · 2PL · marcas temporales · matriz de anomalías |
| **P7** | JSON / MongoDB | Explorador de documento + JsonPath · relacional vs documental · pipeline de agregación paso a paso · embebido vs referenciado |
| **★** | Plantillas | Recetario copiable: SELECT, triggers, procedimientos, JDBC, pipelines Mongo y algoritmos paso a paso (optimización, serializabilidad, 2PL, timestamps) |

## Estructura

```
src/
  main.jsx          punto de entrada
  App.jsx           shell: navegación, tema claro/oscuro, teclado ← →
  styles.css        design system (tokens + componentes)
  components/ui.jsx  helpers (Seg, Html, BoardHead, cssv)
  boards/           un componente por pizarra (P1–P7 + Templates)
```

El contenido está construido sobre los resúmenes teóricos y resoluciones de los prácticos 01–07.

## Stack

- React 18 + Vite 5
- Sin dependencias de UI externas: todo es CSS propio y SVG a mano
- Tema claro/oscuro automático (sigue el sistema) + toggle manual
