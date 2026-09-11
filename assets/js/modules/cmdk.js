/**
 * cmdk.js — Paleta de comandos (Ctrl/⌘ + K) para saltar a cualquier sección
 * o disparar acciones rápidas. Detalle de producto pensado para reclutadores
 * técnicos que navegan con teclado.
 */

import { getContent, ui, getLang, toggleLang, onLangChange } from '../data.js';
import { $, escapeHtml, toast, copyToClipboard } from '../ui.js';

let overlay = null;
let input = null;
let list = null;
let commands = [];
let filtered = [];
let cursor = 0;

function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToPlayground(tabId) {
  goTo('playground');
  $(`#tab-${tabId}`)?.click();
}

function buildCommands() {
  const { profile, navItems } = getContent();
  const t = ui().cmdk;

  const sections = navItems.map((item) => ({
    label: item.label,
    hint: t.section,
    icon: '→',
    run: () => goTo(item.id),
  }));

  return [
    ...sections,
    {
      label: t.copyEmail,
      hint: profile.email,
      icon: '@',
      run: async () => {
        const ok = await copyToClipboard(profile.email);
        toast(ok ? t.emailCopied : ui().common.copyError, ok ? 'success' : 'error');
      },
    },
    { label: t.downloadCv, hint: t.cvHint, icon: '↓', run: () => $('#cvDownloadEs')?.click() },
    { label: t.openLinkedin, hint: t.linkedinHint, icon: '↗', run: () => window.open(profile.linkedin, '_blank', 'noopener') },
    { label: t.whatsapp, hint: profile.phone, icon: '↗', run: () => $('#whatsappBtn')?.click() },
    { label: t.apiDemo, hint: t.playgroundHint, icon: '⚡', run: () => goToPlayground('api') },
    { label: t.bugsDemo, hint: t.playgroundHint, icon: '🐞', run: () => goToPlayground('bugs') },
    { label: t.sqlDemo, hint: t.playgroundHint, icon: '🗄️', run: () => goToPlayground('sql') },
    { label: t.switchLang, hint: t.langHint, icon: getLang() === 'es' ? 'EN' : 'ES', run: () => toggleLang() },
  ];
}

function renderList() {
  list.innerHTML = filtered.length
    ? filtered
        .map(
          (command, index) => `
            <li class="cmdk__item ${index === cursor ? 'is-active' : ''}" role="option"
                aria-selected="${index === cursor}" data-index="${index}">
              <span aria-hidden="true">${escapeHtml(command.icon)}</span>
              <span>${escapeHtml(command.label)}</span>
              <small>${escapeHtml(command.hint)}</small>
            </li>`,
        )
        .join('')
    : `<li class="cmdk__item" aria-disabled="true">${escapeHtml(ui().cmdk.empty)}</li>`;
}

function filter(query) {
  const needle = query.trim().toLowerCase();
  filtered = needle
    ? commands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(needle))
    : commands.slice();
  cursor = 0;
  renderList();
}

function open() {
  commands = buildCommands();
  overlay.hidden = false;
  input.value = '';
  filter('');
  input.focus();
  document.body.style.overflow = 'hidden';
}

function close() {
  overlay.hidden = true;
  document.body.style.overflow = '';
}

function execute(index) {
  const command = filtered[index];
  if (!command) return;
  close();
  command.run();
}

export function initCmdk() {
  overlay = $('#cmdk');
  input = $('#cmdkInput');
  list = $('#cmdkList');
  if (!overlay || !input || !list) return;

  commands = buildCommands();

  $('#cmdkTrigger')?.addEventListener('click', open);

  overlay.addEventListener('click', (event) => {
    if (event.target.closest('[data-cmdk-close]')) close();
    const item = event.target.closest('[data-index]');
    if (item) execute(Number(item.dataset.index));
  });

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      cursor = (cursor + 1) % Math.max(filtered.length, 1);
      renderList();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      cursor = (cursor - 1 + filtered.length) % Math.max(filtered.length, 1);
      renderList();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      execute(cursor);
    }
  });

  document.addEventListener('keydown', (event) => {
    const isShortcut = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'k';
    if (isShortcut) {
      event.preventDefault();
      overlay.hidden ? open() : close();
    } else if (event.key === 'Escape' && !overlay.hidden) {
      close();
    }
  });

  onLangChange(() => {
    commands = buildCommands();
    if (!overlay.hidden) filter(input.value);
  });
}
