# Arquitectura de información — Portafolio Fabrizio Milanesio

> Documento de diseño del sitio: objetivo, mapa, jerarquía de contenido,
> sistema visual y decisiones técnicas.

---

## 1. Objetivo y audiencia

| | |
|---|---|
| **Objetivo primario** | Que un reclutador técnico o QA Lead pida una entrevista. |
| **Objetivo secundario** | Que un reclutador no técnico entienda el diferencial en 30 segundos. |
| **Audiencia** | Recruiters IT · QA Leads / Managers · CTOs de fintech y estudios de gaming. |
| **Conversión** | Descarga de CV · copia de email · WhatsApp · envío del formulario. |
| **Tesis del sitio** | «No repito el CV: demuestro cómo trabajo». |

### Recorrido esperado

```
Hero (30 s)  →  QA Playground (2-4 min)  →  Experiencia (1-2 min)  →  Contacto
   ¿quién es?      ¿sabe hacerlo?             ¿dónde lo hizo?          acción
```

El **QA Playground** es el corazón: se ubica inmediatamente después del hero,
antes de la experiencia, porque es lo que ningún otro portafolio de QA muestra.

---

## 2. Mapa del sitio

Single page con navegación por anclas y scrollspy. Cinco destinos en el menú.

```
/
│
├── #inicio ......................... Hero
│   ├── Badge de estado del sistema ("100% tests passing" + disponibilidad)
│   ├── Titular + subtítulo de posicionamiento
│   ├── Chips de stack (7)
│   ├── CTAs: Descargar CV · LinkedIn · Copiar email
│   ├── Métricas (4): años, industrias, ISTQB, inglés
│   └── Terminal simulada — corrida de Newman escribiéndose en vivo
│
├── #sobre-mi ....................... Perfil
│   ├── 3 párrafos de posicionamiento
│   ├── "Cómo trabajo" (4 principios)
│   └── Idiomas con barras animadas
│
├── #playground ..................... ★ Interactive QA Playground
│   ├── [Tab 1] API Testing — Simulador Postman
│   │   ├── Sidebar: colección con 3 requests en 3 carpetas
│   │   ├── URL bar + botón "Send Request" (latencia simulada)
│   │   ├── Selector de escenario (positivo / negativo) por request
│   │   ├── Panel Request: headers, body JSON, pre-request script
│   │   ├── Panel Response: Body · Headers · Test Results · Console
│   │   ├── Assertions animadas una a una (PASS/FAIL + mensaje de error)
│   │   ├── Footer tipo Collection Runner (passed / failed / tiempo)
│   │   └── Acción: copiar el request como cURL
│   │
│   ├── [Tab 2] Bug Tracker — Mini-board Jira
│   │   ├── 4 columnas: Reportado · En desarrollo · En verificación · Cerrado
│   │   ├── 5 tickets (Blocker, Critical, Major ×2, Minor)
│   │   ├── Panel lateral con el reporte completo:
│   │   │   metadatos, pasos numerados, esperado vs. actual, impacto,
│   │   │   logs de CloudWatch/Splunk, causa raíz, resolución, evidencia, labels
│   │   └── Acción: copiar el ticket en Markdown
│   │
│   └── [Tab 3] Database — Validación SQL
│       ├── 4 consultas de conciliación post-migración
│       ├── SQL resaltado + objetivo de la validación
│       ├── "Ejecutar consulta" → resultset animado con veredicto PASS/FAIL
│       ├── "Lectura de QA": qué revela ese resultado
│       └── Acción: copiar SQL
│
├── #experiencia .................... Timeline / casos de estudio
│   └── Acordeón con 5 posiciones (la actual abierta por defecto)
│       ├── Contexto del proyecto
│       ├── Qué testeé (bullets)
│       ├── Herramientas (chips)
│       ├── Impacto (3 métricas por posición)
│       ├── Highlight destacado
│       └── Referencias laborales cuando existen
│
├── #skills ......................... Matriz de habilidades
│   ├── Filtros: Todas · API Testing · BD · Cloud & Logs · Metodologías · Dev · Game
│   ├── 25 skills con nivel y nota de aplicación real
│   ├── Certificaciones (ISTQB y Analista de Sistemas destacadas)
│   └── Habilidades blandas + intereses
│
├── #contacto ....................... Conversión
│   ├── Email · Teléfono · LinkedIn · Ubicación (tarjetas accionables)
│   ├── Copiar email / copiar teléfono / WhatsApp con mensaje precargado
│   └── Formulario validado que arma un mailto (sin backend)
│
└── Footer .......................... Navegación secundaria + estado del build

Cabecera
├── Navegación + scrollspy
├── Buscar (⌘/Ctrl + K)
├── Selector de idioma ES/EN con bandera (⌘/Ctrl + Shift + L)
└── CTA "Contactar"

Overlays
├── ⌘/Ctrl + K ...... Paleta de comandos (13 acciones: secciones, atajos e idioma)
├── Toasts .......... Feedback de copiado y de corridas de test
└── Drawer .......... Detalle del ticket de Jira
```

---

## 3. Jerarquía de contenido

1. **Titular**: rol + diferencial en una línea → *QA Analyst con mentalidad de Systems Analyst*.
2. **Prueba**: la terminal ejecutándose sola es el primer «esto funciona de verdad».
3. **Demostración**: el Playground reemplaza al típico listado de tecnologías.
4. **Respaldo**: la experiencia valida que lo demostrado ocurrió en proyectos reales.
5. **Detalle**: la matriz de skills responde el filtro de keywords del recruiter.
6. **Acción**: contacto con tres caminos de baja fricción.

---

## 4. Sistema visual

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#070b10` | Fondo base (slate casi negro) |
| `--surface` / `--surface-2` | `#0e151d` / `#121b25` | Tarjetas y paneles |
| `--cyan` | `#22d3ee` | Acento primario, foco, links activos |
| `--emerald` | `#34d399` | Estados OK, assertions PASS, disponibilidad |
| `--violet` | `#a78bfa` | Acento secundario (SQL, keys de headers) |
| `--amber` | `#fbbf24` | Advertencias, método POST, entorno QA |
| `--red` | `#f87171` | Fallos, severidades altas |

- **Tipografía**: `Inter` para texto, `JetBrains Mono` para todo lo que simule una
  herramienta técnica (terminal, código, headers, tablas, IDs).
- **Profundidad**: grilla sutil enmascarada + dos glows radiales fijos + sombras largas.
- **Movimiento**: entradas por `IntersectionObserver`, assertions escalonadas,
  filas de tabla con delay incremental. Todo se desactiva con `prefers-reduced-motion`.

---

## 5. Decisiones técnicas

| Decisión | Motivo |
|---|---|
| **Vanilla JS con ES Modules** | Cero dependencias, cero build, deploy directo en GitHub Pages/Netlify. Coherente con un portafolio que debe cargar rápido y no romperse. |
| **Un archivo de contenido por idioma** | `content.es.js` y `content.en.js` comparten estructura e ids; solo cambia el texto. Actualizar contenido no requiere tocar lógica ni markup. |
| **Store de idioma en `data.js`** | Los módulos piden el contenido en tiempo de render (`getContent()`) y se suscriben con `onLangChange()`. Como los ids son comunes, el estado (request activo, ticket abierto, filtro de skills, acordeón) sobrevive al cambio de idioma. |
| **Banderas en SVG inline** | Windows no renderiza los emoji de bandera: 🇦🇷 se vería como dos letras sueltas. |
| **Render por plantillas de string** | Suficiente para este volumen; sin virtual DOM ni framework. |
| **Escapado explícito (`escapeHtml`)** | Todo el contenido dinámico pasa por escape antes de `innerHTML`. |
| **Formulario con `mailto:`** | Hosting estático sin backend ni servicio de terceros. Se puede cambiar por Formspree/EmailJS en una línea. |
| **Accesibilidad** | Skip link, roles `tablist`/`tabpanel`/`dialog`, `aria-expanded`, foco visible, `Esc` cierra overlays, navegación por flechas en tabs, contraste AA. |
| **SEO** | Meta description, Open Graph, JSON-LD `Person`, `lang="es"`, jerarquía correcta de encabezados. |

### Estructura de archivos

```
portafolioFabri/
├── index.html                  Markup semántico + contenedores de cada módulo
├── assets/
│   ├── css/styles.css           Sistema de diseño completo (tokens → responsive)
│   ├── js/
│   │   ├── content.es.js        Contenido en español (perfil, mocks, textos de UI)
│   │   ├── content.en.js        Contenido en inglés, misma estructura e ids
│   │   ├── data.js              Store de idioma: getContent, ui, setLang, onLangChange
│   │   ├── ui.js                DOM, escape, i18n del markup, resaltado, toasts, reveal
│   │   ├── main.js              Bootstrap: perfil, nav, scrollspy, tabs
│   │   └── modules/
│   │       ├── api-console.js   Simulador Postman
│   │       ├── bug-board.js     Mini-board Jira + drawer de detalle
│   │       ├── sql-lab.js       Visor de consultas SQL
│   │       ├── timeline.js      Acordeón de experiencia
│   │       ├── skills.js        Matriz filtrable + certificaciones
│   │       ├── contact.js       Contacto, copiado y formulario
│   │       ├── terminal.js      Terminal del hero
│   │       ├── lang-toggle.js   Selector ES/EN con banderas SVG
│   │       └── cmdk.js          Paleta de comandos
│   ├── cv/                     CV en PDF
│   └── img/favicon.svg
└── docs/
    ├── ARQUITECTURA.md         Este documento
    └── DATOS-MOCK.md           Especificación de los datos simulados
```

---

## 6. Métricas a seguir tras publicar

- % de visitantes que interactúan con el Playground (clic en *Send Request*).
- Descargas de CV / clics en LinkedIn.
- Tiempo en página (objetivo: > 2 min, contra los ~40 s de un portafolio estático).
- Envíos del formulario y copias de email.
