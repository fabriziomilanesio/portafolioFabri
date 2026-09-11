/**
 * terminal.js — Terminal del hero. Simula la corrida de la suite de pruebas
 * de la colección de Postman con Newman, escribiendo línea por línea.
 */

import { getContent, ui, onLangChange } from '../data.js';
import { $, escapeHtml, sleep, prefersReducedMotion } from '../ui.js';

let body = null;
let badge = null;
let running = false;
let played = false;
/** Se incrementa en cada corrida: una corrida vieja se corta si empieza otra. */
let runToken = 0;

const line = (html) => `<div>${html}</div>`;

async function typeCommand(text, target, token) {
  const node = document.createElement('div');
  node.innerHTML = '<span class="t-prompt">$</span> <span class="t-white"></span>';
  target.appendChild(node);

  const output = node.querySelector('.t-white');

  if (prefersReducedMotion()) {
    output.textContent = text;
    return;
  }

  for (const char of text) {
    if (token !== runToken) return;
    output.textContent += char;
    body.scrollTop = body.scrollHeight;
    await sleep(18);
  }
}

async function play() {
  const token = ++runToken;
  running = true;

  const script = getContent().terminal;
  const t = ui().hero;
  const code = body.querySelector('code');

  code.innerHTML = '';
  badge.textContent = t.terminalRunning;
  badge.classList.remove('is-done');

  for (const item of script) {
    if (token !== runToken) return;

    if (item.type === 'cmd') {
      await typeCommand(item.text, code, token);
      await sleep(prefersReducedMotion() ? 0 : 260);
    } else {
      code.insertAdjacentHTML(
        'beforeend',
        line(item.text ? `<span class="${item.cls || ''}">${escapeHtml(item.text)}</span>` : '&nbsp;'),
      );
      await sleep(prefersReducedMotion() ? 0 : 90);
    }

    body.scrollTop = body.scrollHeight;
  }

  if (token !== runToken) return;

  code.insertAdjacentHTML('beforeend', '<span class="terminal__cursor" aria-hidden="true"></span>');
  badge.textContent = ui().hero.terminalDone;
  badge.classList.add('is-done');
  running = false;
  played = true;
}

export function initTerminal() {
  body = $('#terminalBody');
  badge = $('#terminalBadge');
  if (!body || !badge) return;

  badge.textContent = ui().hero.terminalIdle;

  // Arranca cuando la terminal entra en pantalla.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        play();
        observer.disconnect();
      });
    },
    { threshold: 0.25 },
  );
  observer.observe(body);

  $('#terminalReplay')?.addEventListener('click', play);

  // Al cambiar de idioma: si ya corrió (o está corriendo), se repite traducida.
  onLangChange(() => {
    if (played || running) play();
    else badge.textContent = ui().hero.terminalIdle;
  });
}
