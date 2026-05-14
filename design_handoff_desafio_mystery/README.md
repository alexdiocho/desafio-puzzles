# Handoff: Rediseño "Desafío · Misterio"

## Overview
Rediseño completo de la experiencia pública de la app de Desafíos (puzzle / escape room por equipos) con un lenguaje visual de **misterio / dossier clasificado**: tipografía grande tipo póster, paleta cian sobre negro con acentos magenta/rojo, ruido y scanlines opcionales, glow externo en hover (sin cambio de fondo).

Cubre tres rutas:
- `/` — **Inicio**: mapa-timeline de fases con desafíos como nodos + póster del desafío activo + form de respuesta + estado "señal perdida" (vacío).
- `/ranking` — **Ranking**: podio + filas expandibles. Estado oculto "CLASIFICADO" cuando el admin desactiva la página.
- `/historial` — **Historial**: archivo de expedientes sellados agrupados por fase. Mismo estado "CLASIFICADO".

## About the Design Files
Los archivos de este bundle son **referencias de diseño creadas en HTML/React+Babel** — prototipos para enseñar el look, la jerarquía y el comportamiento de hover/expand/empty state. **No son código de producción para copiar directamente**.

Tu proyecto es **Next.js (App Router)** — la estructura `app/`, `app/ranking/`, `app/historial/`, `app/admin/`, `app/api/` ya existe. La tarea de Claude Code es:
1. Recrear estos diseños como páginas/componentes React en tu codebase existente.
2. Reutilizar tu sistema de estilos actual (Tailwind, CSS Modules, lo que sea) — los tokens de color/tipografía documentados abajo se pueden traducir 1:1.
3. Conectar a los endpoints reales de `app/api/` (los datos en los mocks están hardcoded).

## Fidelity
**Alta fidelidad (hifi)**. Colores, tipografías, tamaños, espaciados, animaciones y estados son finales. Implementa pixel-perfect.

---

## Design Tokens

### Colores
```
--bg-primary:        #0a0a0f   /* fondo base */
--bg-secondary:      #12121a   /* tarjetas */
--bg-elevated:       #1a1a2e   /* hover / pillar / stats */
--bg-hover:          #222240

--border-subtle:     #2a2a3d
--border-active:     #3a3a55   /* aproximado — segundo nivel */
--border-divider:    #2a2a3d (dashed)

--accent-cyan:       #00e5ff   /* acento principal (configurable) */
--accent-cyan-dim:   rgba(0,229,255,.18)
--accent-magenta:    #ff00aa
--accent-gold:       #ffd700   /* líder ranking, ganador historial */
--accent-gold-dim:   rgba(255,215,0,.18)
--accent-red:        #ff3355   /* alertas, sello CLASIFICADO */

--text-primary:      #e8e8f0
--text-secondary:    #8888aa
--text-muted:        #555577
```
`--accent-active` es alias de `--accent-cyan` — es la variable que cambia cuando el usuario elige otro acento desde Tweaks. En producción puedes dejar el cian fijo o exponerlo como preferencia.

### Tipografías
- **Space Grotesk** (400/500/600/700) — UI, títulos grandes, números.
- **JetBrains Mono** (300/400/500/600/700) — overlines, etiquetas, contadores, sellos.
- **Fraunces** (300/400/600, ital 300/400) — subtítulos en cursiva, descripción del desafío.

Cargadas desde Google Fonts.

### Escala tipográfica
- Título de página (h1): `clamp(48px, 7vw, 96px)`, Space Grotesk 700, `letter-spacing: -.03em`, `line-height: .95`.
- Título de póster: `clamp(40px, 6vw, 84px)`, Space Grotesk 700.
- Número de expediente (decorativo): `clamp(120px, 18vw, 220px)`, Fraunces 300, outlined.
- Body cursiva: 17–18px, Fraunces italic.
- Overline / sello: 10–11px, JetBrains Mono, `letter-spacing: .25em–.35em`.
- Counter / mono UI: 11–13px, JetBrains Mono.

### Espaciado y radios
- Padding principal de página: `56px 40px 80px` (mobile: `32px 20px 60px`).
- Max-width contenedor: `1080px` (700px en el panel "Locked").
- Gap entre filas: `10px`.
- Border-radius: `3px` (chips), `4px` (botones/celdas), `6px` (filas/tarjetas), `8px` (panel locked).

### Efectos
- **Glow externo en hover** (NUNCA cambia el fondo):
  ```css
  box-shadow:
    0 0 0 1px var(--accent),
    0 0 18px -2px var(--accent),
    0 0 32px -6px var(--accent);
  ```
- **Ruido/textura**: gradiente radial sutil + repeating-linear-gradient en el panel locked.
- **Scanlines CRT** (opcional, tweak): `repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)`.
- **Pulse en candado**: 2.6s scale 1→1.05.
- **Barras de señal "ecualizador agonizando"**: 9 barras, scaleY .2→1, delay escalonado.

---

## Screens

### 1. `/` Inicio
**Layout**: dos columnas en desktop (timeline 360px + póster fluido), apilado en mobile. Configurable como split / stacked vía tweak.

**Header compartido** (`mystery-header`):
- Logo izquierda: `◯ DESAFÍO` (cian, mono, letter-spacing .18em).
- Nav derecha: `Desafío · Ranking · Historial` (mono 13px, cian si activo, gris si no).

**Timeline vertical** (`mystery-timeline`):
- Fases como bloques con título, subtítulo y nodos numerados.
- Cada nodo: rombo cian a la izquierda + número + título del desafío.
- Click en nodo: cambia el póster a la derecha. Hover: glow externo cian, sin cambio de fondo.
- Fases bloqueadas: opacidad reducida, sin glow.

**Póster del desafío** (`poster`):
- Header con chip de fase + status (en curso / cerrado).
- Número de expediente XXL al fondo (Fraunces, outline cian, opacity .35).
- Título XXL Space Grotesk con barra cian debajo.
- Descripción en Fraunces itálica.
- Timer dramático con segmentos `HH : MM : SS`, glow inset.
- Form: input mono + botón outline cian con glow en hover.
- Sidebar activity: log de intentos recientes en magenta + mono.

**Empty state "señal perdida"** (cuando no hay desafío activo):
- Ecualizador de barras agonizando.
- Texto en mono: `// transmisión interrumpida...`

### 2. `/ranking` Ranking
**Header**: overline cian + h1 "Ranking" + subtítulo Fraunces itálica.

**Podio** (`podium`):
- 3 columnas (orden visual: 2 · 1 · 3, altura 70/100/55 px).
- Cada columna: nombre + puntos arriba, pilar con número Fraunces outlined.
- Líder con borde y glow dorado.

**Filas de equipos** (`rank-list`):
- Cada fila: posición (★ si #1) · nombre · barra de progreso · puntos grandes · caret.
- Click: expande mostrando **solo**:
  - Stat: **Resueltos** (NO intentos, NO racha, NO miembros).
  - Motto en Fraunces itálica entre comillas.
  - Última victoria si la hay (mono, prefijo `ÚLTIMA VICTORIA →` en cian).
- Líder con borde y glow dorado permanentes.

**Estado oculto** (admin lo desactiva): renderiza `<Locked kind="ranking" />` en vez del contenido. Ver sección "Locked panel" abajo.

### 3. `/historial` Historial
**Header**: overline cian + h1 "Historial" + subtítulo Fraunces + contadores mono.

**Stack de fases** (`arch-stack`):
- Por fase: chip "FASE N" cian + título + línea + contador.
- Si la fase no tiene cerrados: mensaje punteado `// fase en curso · sin expedientes sellados todavía`.
- Por desafío cerrado: stamp "CERRADO" + título + ganador (★ dorado) + fecha.
- Click expande: descripción itálica + grid 4 col (respuesta correcta, duración, intentos totales, cierre) + footer `// EXPEDIENTE SELLADO`.

**Estado oculto**: mismo `<Locked kind="historial" />`.

### Locked panel (estado "CLASIFICADO")
Reutilizable en cualquier página que el admin pueda ocultar.
- Tarjeta centrada, max-width 720px.
- Sello rojo "CLASIFICADO" en diagonal arriba a la derecha (rotate 35deg).
- SVG de candado cian con pulse + label "EXPEDIENTE · CLASIFICADO".
- Overline mono + h1 "Clasificado" + subtítulo Fraunces itálica (copy distinto por kind).
- Barras de señal animadas.
- Footer: `// ACCESO DENEGADO — NIVEL DE CLASIFICACIÓN INSUFICIENTE`.

---

## Interactions & Behavior

- **Hover en cualquier nodo/fila/desafío**: glow externo (box-shadow), `transition: box-shadow 220ms`. NO cambiar background.
- **Click en nodo timeline**: actualiza estado `selectedChallengeId`, el póster re-renderiza.
- **Click en fila ranking / desafío historial**: toggle del `openId` (uno abierto a la vez).
- **Submit form del póster**: POST a `app/api/respuestas` (o el endpoint real). El log de actividad lateral debe reflejar el intento.
- **Página oculta**: leer del API/config del admin si la ruta está activa. Si no, renderizar `<Locked kind="..." />`. El toggle en los mocks es solo demo.
- **Timer**: countdown al `endsAt` del desafío activo. Actualizar cada segundo. Si llega a 0, marcar como cerrado.
- **Empty state inicio**: cuando no hay desafío activo, mostrar señal perdida. No hay póster a la derecha.

---

## State Management
- `currentChallenge` (id, fase, título, descripción, endsAt, estado).
- `phases[]` con sus desafíos y locked flag.
- `ranking[]` (equipos ordenados por puntos).
- `historial[]` agrupado por fase.
- `pageVisibility` desde admin: `{ ranking: bool, historial: bool }`.
- UI local: `selectedChallengeId`, `openRowId`.

---

## API endpoints (a confirmar con tu app/api/ actual)
- `GET /api/desafio-actual` — desafío en curso + fases.
- `POST /api/respuesta` — enviar respuesta.
- `GET /api/ranking` — equipos ordenados.
- `GET /api/historial` — agrupado por fase.
- `GET /api/admin/visibility` — `{ ranking, historial }`.

---

## Assets
No hay imágenes propietarias. Todo es CSS + SVG inline (el candado del panel locked). El logo `◯ DESAFÍO` es solo tipografía + un círculo unicode.

Fuentes desde Google Fonts (preconnect ya en el `<head>` de cada HTML).

---

## Files incluidos en este handoff
- `Inicio rediseñado.html` — página principal.
- `Ranking.html` — ranking.
- `Historial.html` — historial.
- `app.jsx` / `timeline.jsx` / `poster.jsx` / `empty.jsx` / `data.jsx` — componentes del inicio.
- `ranking-app.jsx` / `historial-app.jsx` — componentes de ranking e historial.
- `header.jsx` — header compartido entre las 3 páginas.
- `locked.jsx` — panel "CLASIFICADO" compartido.
- `styles.css` — tokens + estilos base + inicio.
- `pages.css` — estilos de ranking + historial + locked.
- `tweaks-panel.jsx` — solo panel de demo, **no portar a producción**.

---

## Notas para Claude Code
1. **Empieza por los tokens**: tradúcelos a tu Tailwind config / CSS variables. El resto sale solo.
2. **Header y Locked son componentes compartidos** — colócalos en `app/components/`.
3. **El timeline del inicio es una sola pieza con estado local** — un Server Component con un Client Component anidado para el `useState(selectedChallengeId)` es lo más limpio.
4. **No copies los Tweaks** — son solo herramienta de prototipado.
5. **Respeta el "hover solo glow"** — es la decisión visual clave de todo el rediseño.
6. **El acento cian** está parametrizado en los mocks pero puedes fijarlo en producción si no quieres exponer la opción.
