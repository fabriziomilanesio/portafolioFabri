/**
 * lang-toggle.js — Selector de idioma español / inglés.
 *
 * Las banderas son SVG inline en lugar de emoji: Windows no renderiza los
 * emoji de bandera, así que 🇦🇷 se vería como dos letras sueltas.
 */

import { getLang, toggleLang, setLang, onLangChange, ui } from '../data.js';
import { $ } from '../ui.js';

const FLAGS = {
  // Argentina: dos franjas celestes, una blanca y el sol de mayo simplificado.
  es: `<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <rect width="30" height="20" fill="#fff"/>
        <rect width="30" height="6.67" fill="#74ACDF"/>
        <rect y="13.33" width="30" height="6.67" fill="#74ACDF"/>
        <circle cx="15" cy="10" r="2.6" fill="#F6B40E"/>
        <circle cx="15" cy="10" r="1.7" fill="#FCBF49"/>
      </svg>`,
  // Reino Unido: Union Jack.
  en: `<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <clipPath id="lang-uk-clip"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <rect width="60" height="30" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#lang-uk-clip)" stroke="#C8102E" stroke-width="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
      </svg>`,
};

const SHORT = { es: 'ES', en: 'EN' };

let button = null;

function paint() {
  const lang = getLang();
  const labels = ui().nav;

  $('#langFlag').innerHTML = FLAGS[lang];
  $('#langCode').textContent = SHORT[lang];

  // El aria-label anuncia la acción; el title, el idioma actual.
  button.setAttribute('aria-label', labels.langSwitch);
  button.setAttribute('title', `${labels.langCurrent} · ${labels.langSwitch}`);
}

/** Fundido corto del contenido para que el cambio no sea un salto seco. */
function flash() {
  const root = document.documentElement;
  root.classList.add('is-switching-lang');
  setTimeout(() => root.classList.remove('is-switching-lang'), 340);
}

export function initLangToggle() {
  button = $('#langToggle');
  if (!button) return;

  // El idioma detectado se refleja en <html lang> desde el arranque.
  document.documentElement.lang = getLang();
  paint();

  button.addEventListener('click', () => {
    toggleLang();
    flash();
  });

  onLangChange(paint);

  // Atajo: Ctrl/⌘ + Shift + L
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      toggleLang();
      flash();
    }
  });
}

export { setLang };
