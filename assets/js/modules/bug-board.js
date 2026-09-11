/**
 * bug-board.js — Mini-board estilo Jira con tickets reales de QA.
 * Las tarjetas abren un panel lateral con el reporte completo:
 * pasos, esperado vs. actual, logs adjuntos, causa raíz y evidencia.
 */

import { getContent, ui, fmt, onLangChange } from '../data.js';
import { $, escapeHtml, toast, copyToClipboard, observeReveal } from '../ui.js';

let root = null;
let drawer = null;
let lastFocused = null;
/** Ticket abierto en el panel lateral, para poder redibujarlo al cambiar idioma. */
let openKey = null;

const board = () => getContent().bugBoard;
const sevClass = (severity) => `sev--${severity.toLowerCase()}`;
const findTicket = (key) => board().tickets.find((ticket) => ticket.key === key);

/* ─────────────────────────  BOARD  ───────────────────────── */

function ticketCard(ticket) {
  return `
    <button class="ticket" type="button" data-ticket="${ticket.key}" aria-haspopup="dialog">
      <span class="ticket__top">
        <span class="ticket__key">${ticket.key}</span>
        <span class="sev ${sevClass(ticket.severity)}">${ticket.severity}</span>
      </span>
      <span class="ticket__title">${escapeHtml(ticket.title)}</span>
      <span class="ticket__foot">
        <span class="ticket__type">${ticket.type}</span>
        <span class="chip">${escapeHtml(ticket.component.split('·')[0].trim())}</span>
      </span>
    </button>`;
}

function renderBoard() {
  const data = board();
  const t = ui().bugs;

  const columns = data.columns
    .map((column) => {
      const tickets = data.tickets.filter((ticket) => ticket.column === column.id);
      return `
        <div class="board__col">
          <div class="board__col-head">
            <span>${escapeHtml(column.label)}</span>
            <span class="board__count">${tickets.length}</span>
          </div>
          ${tickets.map(ticketCard).join('') || `<p class="sql-idle" style="padding:22px 6px">${escapeHtml(t.empty)}</p>`}
        </div>`;
    })
    .join('');

  root.innerHTML = `
    <header class="bug-board__head">
      <div>
        <p class="bug-board__project">${escapeHtml(data.project)}</p>
        <p class="bug-board__sprint">${escapeHtml(data.sprint)}</p>
      </div>
      <div class="bug-board__legend">
        <span class="sev sev--blocker">Blocker</span>
        <span class="sev sev--critical">Critical</span>
        <span class="sev sev--major">Major</span>
        <span class="sev sev--minor">Minor</span>
      </div>
    </header>
    <div class="board">${columns}</div>
    <p class="form-hint" style="margin-top:12px">${escapeHtml(t.hint)}</p>`;

  if (openKey) {
    root.querySelectorAll('.ticket').forEach((el) => el.classList.toggle('is-open', el.dataset.ticket === openKey));
  }
}

/* ─────────────────────  DETALLE DEL TICKET  ───────────────────── */

function field(label, value) {
  return `<div class="ticket-field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function section(title, content) {
  return content ? `<div class="ticket-section"><h4 class="ticket-section__title">${escapeHtml(title)}</h4>${content}</div>` : '';
}

function detailMarkup(ticket) {
  const t = ui().bugs;
  const steps = `<ol class="ticket-steps">${ticket.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`;

  const compare = `
    <div class="compare">
      <div class="compare__item compare__item--expected">
        <p class="compare__label">${escapeHtml(t.expected)}</p>
        <p>${escapeHtml(ticket.expected)}</p>
      </div>
      <div class="compare__item compare__item--actual">
        <p class="compare__label">${escapeHtml(t.actual)}</p>
        <p>${escapeHtml(ticket.actual)}</p>
      </div>
    </div>`;

  const logs = ticket.logs.length
    ? `<div class="log-block">${ticket.logs.map((log) => `<span>${escapeHtml(log)}</span>`).join('')}</div>`
    : '';

  return `
    <div class="ticket-detail__backdrop" data-close></div>
    <div class="ticket-detail__panel" role="dialog" aria-modal="true" aria-labelledby="ticketTitle">
      <header class="ticket-detail__head">
        <div>
          <p class="ticket-detail__key">${ticket.key} · ${ticket.type}</p>
          <h3 class="ticket-detail__title" id="ticketTitle">${escapeHtml(ticket.title)}</h3>
          <div class="ticket__foot" style="margin-top:12px">
            <span class="sev ${sevClass(ticket.severity)}">${ticket.severity}</span>
            <span class="chip">${escapeHtml(t.priority)}: ${escapeHtml(ticket.priority)}</span>
          </div>
        </div>
        <button class="ticket-detail__close" type="button" data-close aria-label="${escapeHtml(t.close)}">✕</button>
      </header>

      <dl class="ticket-fields">
        ${field(t.fields.component, ticket.component)}
        ${field(t.fields.environment, ticket.environment)}
        ${field(t.fields.reporter, ticket.reporter)}
        ${field(t.fields.assignee, ticket.assignee)}
        ${field(t.fields.foundIn, ticket.foundIn)}
        ${field(t.fields.status, board().columns.find((column) => column.id === ticket.column).label)}
      </dl>

      ${section(t.sections.steps, steps)}
      ${section(t.sections.compare, compare)}
      ${section(t.sections.impact, `<p>${escapeHtml(ticket.impact)}</p>`)}
      ${section(t.sections.logs, logs)}
      ${ticket.rootCause ? section(t.sections.rootCause, `<p>${escapeHtml(ticket.rootCause)}</p>`) : ''}
      ${ticket.resolution ? section(t.sections.resolution, `<p>${escapeHtml(ticket.resolution)}</p>`) : ''}
      ${section(
        t.sections.evidence,
        `<div class="chip-row">${ticket.evidence.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div>`,
      )}
      ${section(
        t.sections.labels,
        `<div class="chip-row">${ticket.labels.map((label) => `<span class="chip chip--accent">${escapeHtml(label)}</span>`).join('')}</div>`,
      )}

      <button class="btn btn--outline btn--sm" type="button" data-copy-ticket="${ticket.key}">
        ${escapeHtml(t.copyMarkdown)}
      </button>
    </div>`;
}

function ticketToMarkdown(ticket) {
  const t = ui().bugs.md;

  const lines = [
    `# [${ticket.key}] ${ticket.title}`,
    '',
    `**${t.severity}:** ${ticket.severity} · **${t.priority}:** ${ticket.priority}`,
    `**${t.component}:** ${ticket.component}`,
    `**${t.environment}:** ${ticket.environment}`,
    `**${t.foundIn}:** ${ticket.foundIn}`,
    '',
    `## ${t.steps}`,
    ...ticket.steps.map((step, i) => `${i + 1}. ${step}`),
    '',
    `## ${t.expected}`,
    ticket.expected,
    '',
    `## ${t.actual}`,
    ticket.actual,
    '',
    `## ${t.impact}`,
    ticket.impact,
  ];

  if (ticket.logs.length) lines.push('', `## ${t.logs}`, '```', ...ticket.logs, '```');
  if (ticket.rootCause) lines.push('', `## ${t.rootCause}`, ticket.rootCause);
  if (ticket.resolution) lines.push('', `## ${t.resolution}`, ticket.resolution);
  lines.push('', `_${t.reportedBy} ${ticket.reporter}_`);

  return lines.join('\n');
}

function openTicket(key) {
  const ticket = findTicket(key);
  if (!ticket) return;

  lastFocused = document.activeElement;
  openKey = key;
  drawer.innerHTML = detailMarkup(ticket);
  drawer.hidden = false;
  document.body.style.overflow = 'hidden';

  root.querySelectorAll('.ticket').forEach((el) => el.classList.toggle('is-open', el.dataset.ticket === key));
  drawer.querySelector('.ticket-detail__close')?.focus();
}

function closeTicket() {
  drawer.hidden = true;
  drawer.innerHTML = '';
  openKey = null;
  document.body.style.overflow = '';
  root.querySelectorAll('.ticket').forEach((el) => el.classList.remove('is-open'));
  lastFocused?.focus();
}

/* ─────────────────────────  INIT  ───────────────────────── */

export function initBugBoard() {
  root = $('#bugBoard');
  if (!root) return;

  drawer = document.createElement('div');
  drawer.className = 'ticket-detail';
  drawer.id = 'ticketDetail';
  drawer.hidden = true;
  document.body.appendChild(drawer);

  renderBoard();
  observeReveal(root);

  root.addEventListener('click', (event) => {
    const card = event.target.closest('[data-ticket]');
    if (card) openTicket(card.dataset.ticket);
  });

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]')) {
      closeTicket();
      return;
    }

    const copyBtn = event.target.closest('[data-copy-ticket]');
    if (copyBtn) {
      const ticket = findTicket(copyBtn.dataset.copyTicket);
      copyToClipboard(ticketToMarkdown(ticket)).then((ok) =>
        toast(
          ok ? fmt(ui().bugs.copied, { key: ticket.key }) : ui().common.copyError,
          ok ? 'success' : 'error',
        ),
      );
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !drawer.hidden) closeTicket();
  });

  onLangChange(() => {
    renderBoard();
    // Si hay un ticket abierto, se redibuja en el nuevo idioma.
    if (openKey) drawer.innerHTML = detailMarkup(findTicket(openKey));
  });
}
