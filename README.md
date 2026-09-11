# Portafolio — Fabrizio Milanesio

Portafolio web interactivo de **Fabrizio Milanesio**, QA Functional Analyst & Systems
Analyst especializado en Fintech y Banking.

En lugar de repetir el CV, el sitio **demuestra** cómo trabaja un QA: un simulador de
testing de APIs estilo Postman, un mini-board de Jira con tickets reales y un visor de
consultas SQL de validación de datos post-migración.

🔗 **Demo local:** abrir con cualquier servidor estático (ver *Cómo ejecutarlo*).

---

## Qué incluye

| Sección | Qué hace |
|---|---|
| **Hero** | Badge de estado, CTAs (CV / LinkedIn / copiar email) y una terminal que ejecuta la suite de Newman escribiéndose sola. |
| **QA Playground › API Testing** | Elegís endpoint y escenario (positivo o negativo), presionás *Send Request* y ves response, headers, console y las assertions corriendo una a una. Copia el request como cURL. |
| **QA Playground › Bug Tracker** | Board de 4 columnas con 5 tickets. Cada tarjeta abre el reporte completo: pasos, esperado vs. actual, logs de CloudWatch/Splunk, causa raíz y evidencia. Copia el ticket en Markdown. |
| **QA Playground › Database** | 4 consultas SQL de conciliación con resultset animado, veredicto PASS/FAIL y la lectura de QA de cada resultado. |
| **Experiencia** | Acordeón con 5 posiciones como casos de estudio: contexto, qué se testeó, herramientas e impacto. |
| **Skills** | 25 habilidades filtrables por área + certificaciones (ISTQB, diplomaturas UTN). |
| **Contacto** | Tarjetas accionables, copiado con toast, WhatsApp precargado y formulario validado. |
| **Español / Inglés** | Botón con banderita en la cabecera (al lado de *Buscar*) que traduce **todo** el sitio, incluidos los simuladores. Recuerda la elección y detecta el idioma del navegador en la primera visita. |
| **Extras** | Paleta de comandos `⌘/Ctrl + K`, scrollspy, barra de progreso, toasts y modo `prefers-reduced-motion`. |

---

## Stack

**HTML5 + CSS3 + JavaScript vanilla (ES Modules).** Sin frameworks, sin build, sin
dependencias. Solo se cargan las fuentes Inter y JetBrains Mono desde Google Fonts.

Decisión deliberada: un portafolio debe cargar rápido, no romperse nunca y poder
publicarse en cualquier hosting estático en menos de un minuto.

---

## Cómo ejecutarlo

El sitio usa ES Modules, así que **necesita un servidor** (no funciona abriendo el
`index.html` con doble clic por la política CORS de `file://`).

```bash
python -m http.server 4321
```

Luego abrir <http://localhost:4321>.

Alternativas:

```bash
npx serve .
```

```bash
npx http-server -p 4321
```

---

## Cómo publicarlo

### GitHub Pages

```bash
git init && git add . && git commit -m "Portafolio QA"
git branch -M main
git remote add origin https://github.com/USUARIO/portafolio.git
git push -u origin main
```

Después: *Settings → Pages → Source: main / root*.

### Netlify o Vercel

Arrastrar la carpeta en el dashboard, o conectar el repositorio.
No hay comando de build: el directorio de publicación es la raíz.

---

## Bilingüe: cómo funciona

El sitio está en **español e inglés**. El selector con la banderita vive en la cabecera,
junto al botón *Buscar* (atajo: `Ctrl/⌘ + Shift + L`).

- Hay **un archivo de contenido por idioma**: `content.es.js` y `content.en.js`, con la
  misma estructura. Solo cambia el texto visible: los `id`, `key` y `cat` son idénticos.
- Por eso el **estado sobrevive al cambio de idioma**: si corriste un request y cambiás a
  inglés, seguís viendo el mismo escenario con sus assertions, ya traducidas.
- El idioma elegido se guarda en `localStorage`. En la primera visita se detecta por el
  idioma del navegador (español → ES, cualquier otro → EN).
- `assets/js/data.js` es el store: expone `getContent()`, `ui()`, `setLang()` y
  `onLangChange()`. Cada módulo se suscribe y se vuelve a dibujar solo.
- Las banderas son SVG inline, no emoji: Windows no renderiza 🇦🇷 y se vería como dos letras.

> El PDF del CV es el mismo en ambos idiomas. Si más adelante hay una versión en inglés,
> alcanza con dejarla en `assets/cv/` y apuntar `profile.cv` en `content.en.js`.

## Cómo editar el contenido

Todo el contenido vive en **`assets/js/content.es.js`** y **`assets/js/content.en.js`**.
No hace falta tocar el HTML ni la lógica. Al cambiar algo, hacelo en los dos archivos.

| Qué querés cambiar | Dónde |
|---|---|
| Nombre, email, teléfono, LinkedIn, métricas del hero | `profile` |
| Requests, escenarios y assertions del simulador | `apiCollection` |
| Tickets del board de Jira | `bugBoard` |
| Consultas SQL y resultsets | `sqlLab` |
| Experiencia laboral y casos de estudio | `experience` |
| Skills, categorías de filtro y certificaciones | `skills`, `skillCategories`, `certifications` |
| Textos de botones, títulos de sección y mensajes | `ui` |
| Líneas de la terminal del hero | `terminal` |

### Tareas frecuentes

**Cambiar el CV:** reemplazar `assets/cv/CV-Fabrizio-Milanesio-ES.pdf` manteniendo el
nombre, o actualizar `profile.cv` en ambos archivos de contenido.

**Actualizar el LinkedIn:** editar `profile.linkedin` en `content.es.js` y `content.en.js`.

**Cambiar el idioma por defecto:** en `data.js`, la función `detectLang()` decide el orden
(preferencia guardada → idioma del navegador → español).

**Formulario con backend real:** hoy el formulario arma un `mailto:`. Para usar
Formspree o EmailJS, reemplazar el bloque `window.location.href = mailto` en
`assets/js/modules/contact.js` por el `fetch` del servicio.

---

## Estructura

```
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── content.es.js      ← todo el contenido en español
│   │   ├── content.en.js      ← todo el contenido en inglés
│   │   ├── data.js            ← store de idioma (getContent, setLang, onLangChange)
│   │   ├── ui.js              ← utilidades compartidas
│   │   ├── main.js            ← bootstrap
│   │   └── modules/           ← un archivo por módulo interactivo
│   ├── cv/
│   └── img/
└── docs/
    ├── ARQUITECTURA.md        ← IA, sitemap, sistema visual y decisiones
    └── DATOS-MOCK.md          ← especificación de los datos simulados
```

---

## Accesibilidad y rendimiento

- Navegación completa por teclado, incluidas las tabs (flechas) y los overlays (`Esc`).
- Roles ARIA (`tablist`, `tabpanel`, `dialog`), `aria-expanded` y `aria-live` en toasts.
- Skip link, foco visible y contraste AA sobre fondo oscuro.
- `prefers-reduced-motion` desactiva animaciones, tipeo y transiciones.
- Sin dependencias JS: el peso total ronda los 100 KB sin comprimir.

---

## Notas sobre los datos

Los datos del Playground son **simulaciones** construidas sobre el trabajo real de
Fabrizio en la migración COBOL → microservicios. Los nombres de cuentas, importes y
correlationIds son inventados: no contienen información confidencial de ningún cliente.
El detalle de cada dataset está en [`docs/DATOS-MOCK.md`](docs/DATOS-MOCK.md).
