/**
 * sql-lab.js — Visor de validación de base de datos.
 * Muestra las consultas SQL que uso para certificar una migración: se ejecutan
 * de forma simulada y devuelven el resultset con su veredicto de QA.
 */

import { getContent, ui, onLangChange } from '../data.js';
import { $, escapeHtml, highlightSql, sleep, prefersReducedMotion, toast, copyToClipboard } from '../ui.js';

const state = {
  queryId: null,
  running: false,
  executed: new Set(),
};

let root = null;

const lab = () => getContent().sqlLab;

function currentQuery() {
  const queries = lab().queries;
  return queries.find((query) => query.id === state.queryId) || queries[0];
}

/** Resalta la celda cuando el valor delata (o descarta) un descuadre. */
function cellClass(query, column, value) {
  const flagged = ['DIFERENCIA', 'MOVIMIENTOS', 'SALDO_MICROSERVICIO'];
  if (query.verdict === 'pass' && value.trim() === '0') return 'is-ok';
  if (query.verdict === 'fail' && flagged.includes(column)) return 'is-diff';
  return '';
}

function renderResult(query) {
  const t = ui().sql;

  if (state.running) return `<p class="sql-idle">${escapeHtml(t.executing)}</p>`;
  if (!state.executed.has(query.id)) return `<p class="sql-idle">${escapeHtml(t.idle)}</p>`;

  const head = query.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join('');

  const body = query.rows
    .map(
      (row, index) => `
        <tr style="animation-delay:${prefersReducedMotion() ? 0 : index * 70}ms">
          ${row
            .map((value, i) => `<td class="${cellClass(query, query.columns[i], value)}">${escapeHtml(value)}</td>`)
            .join('')}
        </tr>`,
    )
    .join('');

  return `
    <div class="sql-result">
      <div class="sql-result__head">
        <span class="verdict verdict--${query.verdict}">
          ${query.verdict === 'pass' ? '✓' : '✕'} ${escapeHtml(query.verdictLabel)}
        </span>
        <span>${escapeHtml(query.footer)}</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <div class="sql-insight">
        <span aria-hidden="true">🔍</span>
        <p><strong>${escapeHtml(t.insight)}</strong>${escapeHtml(query.insight)}</p>
      </div>
    </div>`;
}

function render() {
  const data = lab();
  const t = ui().sql;
  const query = currentQuery();

  state.queryId = query.id;

  root.innerHTML = `
    <header class="sql-lab__head">
      <div class="sql-lab__conn">
        <span class="dot" aria-hidden="true"></span>
        ${escapeHtml(data.engine)} · ${escapeHtml(t.schemaLabel)} ${escapeHtml(data.schema)}
      </div>
      <span class="chip">${escapeHtml(t.readOnly)}</span>
    </header>

    <div class="sql-lab__queries" role="tablist" aria-label="${escapeHtml(t.queriesAria)}">
      ${data.queries
        .map(
          (item) => `
            <button class="sql-tab ${item.id === query.id ? 'is-active' : ''}"
                    type="button" data-query="${item.id}">${escapeHtml(item.name)}</button>`,
        )
        .join('')}
    </div>

    <div class="sql-lab__body">
      <div class="sql-editor">
        <p class="sql-editor__goal"><strong>${escapeHtml(t.goal)}</strong> ${escapeHtml(query.goal)}</p>
        <pre class="sql-code"><code>${highlightSql(query.sql)}</code></pre>
        <div class="sql-actions">
          <button class="sql-run" type="button" data-run ${state.running ? 'disabled' : ''}>
            ${escapeHtml(state.running ? t.running : t.run)}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" data-copy-sql>${escapeHtml(t.copySql)}</button>
          <span class="chip">${escapeHtml(query.verdict === 'pass' ? t.tagPass : t.tagFail)}</span>
        </div>
      </div>
      ${renderResult(query)}
    </div>`;
}

async function run() {
  if (state.running) return;

  const query = currentQuery();
  state.running = true;
  state.executed.delete(query.id);
  render();

  await sleep(prefersReducedMotion() ? 120 : 620);

  state.running = false;
  state.executed.add(query.id);
  render();

  const t = ui().sql;
  toast(query.verdict === 'pass' ? t.toastPass : t.toastFail, query.verdict === 'pass' ? 'success' : 'error', 3600);
}

export function initSqlLab() {
  root = $('#sqlLab');
  if (!root) return;

  render();

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-query]');
    if (tab) {
      state.queryId = tab.dataset.query;
      render();
      return;
    }

    if (event.target.closest('[data-run]')) {
      run();
      return;
    }

    if (event.target.closest('[data-copy-sql]')) {
      copyToClipboard(currentQuery().sql).then((ok) =>
        toast(ok ? ui().sql.sqlCopied : ui().common.copyError, ok ? 'success' : 'error'),
      );
    }
  });

  onLangChange(render);
}
