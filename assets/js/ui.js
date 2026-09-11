/**
 * ui.js — Utilidades compartidas: DOM, escapes, resaltado de sintaxis,
 * toasts, portapapeles y observador de scroll.
 */

/* ─────────────────────────  DOM  ───────────────────────── */

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Escapa texto para inyección segura en innerHTML. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ─────────────────────────  I18N  ───────────────────────── */

/** Lee una ruta con puntos dentro de un objeto: get(ui, 'nav.search'). */
export function get(source, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), source);
}

/**
 * Aplica los textos del idioma activo al markup estático.
 * `data-i18n` reemplaza el contenido (acepta HTML del propio diccionario),
 * `data-i18n-placeholder` y `data-i18n-aria` reemplazan atributos.
 */
export function applyI18n(dict, scope = document) {
  $$('[data-i18n]', scope).forEach((el) => {
    const value = get(dict, el.dataset.i18n);
    if (typeof value === 'string') el.innerHTML = value;
  });

  $$('[data-i18n-placeholder]', scope).forEach((el) => {
    const value = get(dict, el.dataset.i18nPlaceholder);
    if (typeof value === 'string') el.setAttribute('placeholder', value);
  });

  $$('[data-i18n-aria]', scope).forEach((el) => {
    const value = get(dict, el.dataset.i18nAria);
    if (typeof value === 'string') el.setAttribute('aria-label', value);
  });
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────  RESALTADO DE SINTAXIS  ──────────────────── */

/**
 * Recorre `source` con `regex`, envuelve cada coincidencia en un span y escapa
 * todo lo demás. Trabajar sobre el texto crudo (y escapar al final de cada
 * tramo) evita que el resaltado rompa entidades HTML.
 */
function tokenize(source, regex, classify) {
  let out = '';
  let last = 0;

  for (const match of source.matchAll(regex)) {
    const [full] = match;
    out += escapeHtml(source.slice(last, match.index));
    out += `<span class="${classify(match)}">${escapeHtml(full)}</span>`;
    last = match.index + full.length;
  }

  return out + escapeHtml(source.slice(last));
}

const JSON_TOKEN_RE = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Colorea un valor JSON serializado. Devuelve HTML seguro. */
export function highlightJson(value) {
  const json = JSON.stringify(value, null, 2);
  if (json === undefined) return '';

  // La clave incluye el ":" en la coincidencia; se recorta al envolver.
  let out = '';
  let last = 0;

  for (const match of json.matchAll(JSON_TOKEN_RE)) {
    const [full, key, str, bool, nul, num] = match;
    out += escapeHtml(json.slice(last, match.index));

    if (key) {
      out += `<span class="tok-key">${escapeHtml(key)}</span>`;
      out += `<span class="tok-punct">${escapeHtml(full.slice(key.length))}</span>`;
    } else {
      const cls = str ? 'tok-str' : bool ? 'tok-bool' : nul ? 'tok-null' : 'tok-num';
      out += `<span class="${cls}">${escapeHtml(full)}</span>`;
    }

    last = match.index + full.length;
  }

  return out + escapeHtml(json.slice(last));
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'LEFT\\s+JOIN', 'INNER\\s+JOIN', 'JOIN', 'WHERE', 'GROUP\\s+BY', 'ORDER\\s+BY',
  'HAVING', 'ON', 'AND', 'OR', 'NOT', 'AS', 'IS', 'NULL', 'DESC', 'ASC', 'TIMESTAMP', 'BETWEEN', 'IN',
];
const SQL_FUNCTIONS = ['COUNT', 'SUM', 'MIN', 'MAX', 'AVG', 'ABS', 'ROUND', 'TRUNC', 'SYSDATE'];

const SQL_TOKEN_RE = new RegExp(
  [
    "('[^']*')",
    '(--[^\\n]*)',
    `\\b(${SQL_KEYWORDS.join('|')})\\b`,
    `\\b(${SQL_FUNCTIONS.join('|')})\\b`,
    '(\\d+(?:\\.\\d+)?)',
  ].join('|'),
  'gi',
);

/** Colorea una consulta SQL. Devuelve HTML seguro. */
export function highlightSql(sql) {
  return tokenize(sql, SQL_TOKEN_RE, ([, str, comment, keyword, fn]) => {
    if (str) return 'sql-str';
    if (comment) return 'sql-comment';
    if (keyword) return 'sql-kw';
    if (fn) return 'sql-fn';
    return 'sql-num';
  });
}

/* ───────────────────────  TOASTS  ─────────────────────── */

const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function toast(message, type = 'success', duration = 3200) {
  const host = $('#toaster');
  if (!host) return;

  const node = document.createElement('div');
  node.className = `toast toast--${type}`;
  node.innerHTML = `<span class="toast__icon" aria-hidden="true">${TOAST_ICONS[type] || '•'}</span><span>${escapeHtml(message)}</span>`;
  host.appendChild(node);

  setTimeout(() => {
    node.classList.add('is-out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }, duration);
}

/* ─────────────────────  PORTAPAPELES  ───────────────────── */

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback para file:// y navegadores sin Clipboard API.
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

/* ──────────────────  REVEAL ON SCROLL  ────────────────── */

let revealObserver = null;

/** Marca elementos con .reveal y los muestra al entrar en viewport. */
export function observeReveal(scope = document) {
  const targets = $$('.reveal:not(.is-visible)', scope);
  if (!targets.length) return;

  if (prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px' },
    );
  }

  targets.forEach((el) => revealObserver.observe(el));
}

/** Aplica .reveal con delay escalonado a una lista de nodos. */
export function stagger(nodes, step = 60) {
  nodes.forEach((node, i) => {
    node.classList.add('reveal');
    node.style.transitionDelay = `${i * step}ms`;
  });
}
