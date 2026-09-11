/**
 * data.js — Store de idioma y punto de acceso al contenido.
 *
 * El contenido vive en content.es.js / content.en.js con la misma estructura.
 * Los módulos piden el contenido en tiempo de render con `getContent()` y se
 * suscriben con `onLangChange()` para volver a dibujarse al cambiar de idioma.
 */

import es from './content.es.js';
import en from './content.en.js';

const CONTENT = { es, en };
const STORAGE_KEY = 'fm-portfolio-lang';

export const LANGS = [
  { code: 'es', short: 'ES', name: 'Español' },
  { code: 'en', short: 'EN', name: 'English' },
];

/** Preferencia guardada → idioma del navegador → español. */
function detectLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CONTENT[stored]) return stored;
  } catch {
    /* localStorage bloqueado (modo privado, file://): seguimos con la detección */
  }

  const browser = (navigator.language || 'es').toLowerCase();
  return browser.startsWith('es') ? 'es' : 'en';
}

let current = detectLang();
const listeners = new Set();

export const getLang = () => current;
export const getContent = () => CONTENT[current];
/** Atajo a los textos de interfaz del idioma activo. */
export const ui = () => CONTENT[current].ui;

/** Reemplaza `{clave}` por su valor: fmt('{n} assertions', { n: 8 }). */
export function fmt(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );
}

export function setLang(code) {
  if (!CONTENT[code] || code === current) return;

  current = code;
  document.documentElement.lang = code;

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* Sin persistencia: el cambio igual aplica en esta sesión */
  }

  listeners.forEach((listener) => listener(CONTENT[code], code));
}

export const toggleLang = () => setLang(current === 'es' ? 'en' : 'es');

/** Registra un callback que se ejecuta en cada cambio de idioma. */
export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
