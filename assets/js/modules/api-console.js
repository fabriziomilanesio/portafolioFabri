/**
 * api-console.js — Simulador de testing de APIs al estilo Postman.
 * Permite elegir un endpoint, un escenario (positivo o negativo), enviar el
 * request simulado y ver response + assertions ejecutándose una a una.
 *
 * El contenido se pide en cada render con getContent(), de modo que el módulo
 * se redibuja en el idioma activo sin perder el estado (los ids son comunes).
 */

import { getContent, ui, fmt, onLangChange } from '../data.js';
import { $, escapeHtml, highlightJson, sleep, prefersReducedMotion, toast, copyToClipboard } from '../ui.js';

const state = {
  requestId: null,
  scenarioId: null,
  responseTab: 'body',
  running: false,
  /** Escenarios ya ejecutados, por clave `requestId::scenarioId`. */
  runs: new Set(),
};

let root = null;

/* ─────────────────────────  HELPERS  ───────────────────────── */

const collection = () => getContent().apiCollection;
const runKey = () => `${state.requestId}::${state.scenarioId}`;

function currentRequest() {
  const requests = collection().requests;
  return requests.find((request) => request.id === state.requestId) || requests[0];
}

function currentScenario() {
  const request = currentRequest();
  return request.scenarios.find((scenario) => scenario.id === state.scenarioId) || request.scenarios[0];
}

function statusClass(status) {
  if (status >= 500) return '5xx';
  if (status >= 400) return '4xx';
  return '2xx';
}

const methodClass = (method) => `method--${method.toLowerCase()}`;

function headersToRows(headers) {
  return Object.entries(headers)
    .map(
      ([key, value]) => `
        <div class="kv__row">
          <span class="kv__key">${escapeHtml(key)}</span>
          <span class="kv__val">${escapeHtml(value)}</span>
        </div>`,
    )
    .join('');
}

/* ─────────────────────────  RENDER  ───────────────────────── */

function renderSidebar() {
  const data = collection();
  const folders = new Map();

  data.requests.forEach((request) => {
    if (!folders.has(request.folder)) folders.set(request.folder, []);
    folders.get(request.folder).push(request);
  });

  const groups = Array.from(folders.entries())
    .map(
      ([folder, requests]) => `
        <p class="api-sidebar__folder">${escapeHtml(folder)}</p>
        ${requests
          .map(
            (request) => `
              <button class="api-req ${request.id === currentRequest().id ? 'is-active' : ''}"
                      type="button" data-request="${request.id}">
                <span class="method ${methodClass(request.method)}">${request.method}</span>
                <span>
                  <span class="api-req__name">${escapeHtml(request.name)}</span>
                  <span class="api-req__path">${escapeHtml(request.path)}</span>
                </span>
              </button>`,
          )
          .join('')}`,
    )
    .join('');

  return `
    <aside class="api-sidebar">
      <div class="api-sidebar__head">
        <p class="api-sidebar__title">${escapeHtml(data.name)}</p>
        <span class="api-sidebar__env">● ${escapeHtml(data.env)}</span>
      </div>
      <div class="api-sidebar__list">${groups}</div>
    </aside>`;
}

function renderRequestPane(scenario) {
  const t = ui().api;
  const { request } = scenario;

  const body = request.body
    ? `<p class="block-label">${escapeHtml(t.bodyRaw)}</p>
       <pre class="code-block"><code>${highlightJson(request.body)}</code></pre>`
    : `<p class="block-label">${escapeHtml(t.body)}</p>
       <pre class="code-block"><code><span class="tok-null">${escapeHtml(t.noBody)}</span></code></pre>`;

  return `
    <section class="api-pane">
      <header class="api-pane__head">
        <span>${escapeHtml(t.request)}</span>
        <button class="btn btn--ghost btn--sm" type="button" data-copy-request>${escapeHtml(t.copyCurl)}</button>
      </header>
      <div class="api-pane__body">
        <p class="block-label">${escapeHtml(t.headers)}</p>
        <div class="kv">${headersToRows(request.headers)}</div>
        ${body}
        <p class="block-label">${escapeHtml(t.preScript)}</p>
        <pre class="code-block"><code><span class="tok-null">${escapeHtml(t.preScriptComment)}</span>
<span class="tok-key">if</span> (pm.environment.get(<span class="tok-str">'token_expires_at'</span>) &lt; Date.now()) {
  pm.sendRequest(authRequest, (err, res) =&gt; {
    pm.environment.set(<span class="tok-str">'access_token'</span>, res.json().access_token);
  });
}</code></pre>
      </div>
    </section>`;
}

function renderAssertions(scenario) {
  return scenario.tests
    .map(
      (test, index) => `
        <li class="assertion assertion--${test.passed ? 'pass' : 'fail'}"
            style="animation-delay:${prefersReducedMotion() ? 0 : index * 90}ms">
          <span class="assertion__icon">${test.passed ? 'PASS' : 'FAIL'}</span>
          <span class="assertion__name">
            ${escapeHtml(test.name)}
            ${test.error ? `<span class="assertion__error">${escapeHtml(test.error)}</span>` : ''}
          </span>
          <span class="assertion__ms">${test.ms} ms</span>
        </li>`,
    )
    .join('');
}

function renderResponseBody(scenario) {
  switch (state.responseTab) {
    case 'headers':
      return `<div class="kv">${headersToRows(scenario.response.headers)}</div>`;
    case 'tests':
      return `<ul class="assertions">${renderAssertions(scenario)}</ul>`;
    case 'console':
      return `<ul class="console-log">${scenario.console
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join('')}</ul>`;
    default:
      return `<pre class="code-block" style="margin:0"><code>${highlightJson(scenario.response.body)}</code></pre>`;
  }
}

function renderResponsePane(scenario) {
  const t = ui().api;

  if (!state.runs.has(runKey())) {
    return `
      <section class="api-pane">
        <header class="api-pane__head"><span>${escapeHtml(t.response)}</span></header>
        <div class="api-pane__body">
          <div class="api-empty">
            <span class="api-empty__icon" aria-hidden="true">⚡</span>
            <p>${t.emptyTitle}</p>
            <p style="font-size:.82rem">${escapeHtml(fmt(t.emptySub, { n: scenario.tests.length }))}</p>
          </div>
        </div>
      </section>`;
  }

  const { response } = scenario;
  const passed = scenario.tests.filter((test) => test.passed).length;
  const failed = scenario.tests.length - passed;

  return `
    <section class="api-pane">
      <header class="api-pane__head">
        <span class="status-badge status-badge--${statusClass(response.status)}">
          ${response.status} ${escapeHtml(response.statusText)}
        </span>
        <span class="api-meta">
          <span>${response.time} ms</span>
          <span>${escapeHtml(response.size)}</span>
        </span>
      </header>

      <nav class="api-tabs" role="tablist" aria-label="${escapeHtml(t.responseAria)}">
        <button type="button" data-res-tab="body" class="${state.responseTab === 'body' ? 'is-active' : ''}">${escapeHtml(t.body)}</button>
        <button type="button" data-res-tab="headers" class="${state.responseTab === 'headers' ? 'is-active' : ''}">${escapeHtml(t.headers)}</button>
        <button type="button" data-res-tab="tests" class="${state.responseTab === 'tests' ? 'is-active' : ''}">
          ${escapeHtml(t.testResults)}
          <span class="count count--${failed ? 'fail' : 'pass'}">${passed}/${scenario.tests.length}</span>
        </button>
        <button type="button" data-res-tab="console" class="${state.responseTab === 'console' ? 'is-active' : ''}">${escapeHtml(t.console)}</button>
      </nav>

      <div class="api-pane__body">${renderResponseBody(scenario)}</div>
    </section>`;
}

function renderSummary(scenario) {
  if (!state.runs.has(runKey())) return '';

  const t = ui().api;
  const passed = scenario.tests.filter((test) => test.passed).length;
  const failed = scenario.tests.length - passed;
  const total = scenario.tests.reduce((acc, test) => acc + test.ms, 0);

  return `
    <footer class="runner-summary">
      <span class="dim">${escapeHtml(t.runner)}</span>
      <span class="ok">${passed} ${escapeHtml(t.passed)}</span>
      <span class="${failed ? 'fail' : 'dim'}">${failed} ${escapeHtml(t.failed)}</span>
      <span class="dim">${scenario.tests.length} ${escapeHtml(t.assertions)} · ${total} ms</span>
      <span class="chip chip--accent">${escapeHtml(failed ? t.jiraNote : t.certified)}</span>
    </footer>`;
}

function render() {
  const t = ui().api;
  const request = currentRequest();
  const scenario = currentScenario();

  // Mantiene el estado alineado con el contenido activo.
  state.requestId = request.id;
  state.scenarioId = scenario.id;

  root.innerHTML = `
    ${renderSidebar()}
    <div class="api-main">
      <header class="api-main__head">
        <h3 class="api-main__title">${escapeHtml(request.name)}</h3>
        <p class="api-main__desc">${escapeHtml(request.description)}</p>
      </header>

      <div class="api-urlbar">
        <span class="method ${methodClass(request.method)}" style="font-size:.74rem;padding:6px 10px">${request.method}</span>
        <span class="api-urlbar__field">${escapeHtml(scenario.request.url)}</span>
        <button class="api-send" type="button" data-send ${state.running ? 'disabled' : ''}>
          ${escapeHtml(state.running ? t.sending : t.send)}
          <span aria-hidden="true">${state.running ? '⏳' : '↵'}</span>
        </button>
      </div>
      <div class="api-progress ${state.running ? 'is-loading' : ''}"></div>

      <div class="api-scenarios">
        <span class="api-scenarios__label">${escapeHtml(t.scenario)}</span>
        ${request.scenarios
          .map(
            (item) => `
              <button class="scenario-chip ${item.id === scenario.id ? 'is-active' : ''}"
                      type="button" data-scenario="${item.id}" data-type="${item.type}">
                ${escapeHtml(item.label)}
              </button>`,
          )
          .join('')}
      </div>

      <div class="api-split">
        ${renderRequestPane(scenario)}
        ${renderResponsePane(scenario)}
      </div>

      ${renderSummary(scenario)}
    </div>`;
}

/* ─────────────────────────  ACCIONES  ───────────────────────── */

async function send() {
  if (state.running) return;

  const t = ui().api;
  const scenario = currentScenario();

  state.running = true;
  state.runs.delete(runKey());
  render();

  // Latencia simulada, proporcional al tiempo de respuesta del mock.
  const delay = prefersReducedMotion() ? 120 : Math.min(scenario.response.time * 1.6, 1000);
  await sleep(delay);

  state.running = false;
  state.responseTab = 'tests';
  state.runs.add(runKey());
  render();

  const failed = scenario.tests.filter((test) => !test.passed).length;
  if (failed) {
    toast(fmt(t.toastFail, { n: failed }), 'error', 4200);
  } else {
    toast(fmt(t.toastPass, { n: scenario.tests.length }), 'success');
  }
}

function toCurl(scenario) {
  const { request } = scenario;
  const headers = Object.entries(request.headers)
    .map(([key, value]) => `  -H '${key}: ${value}'`)
    .join(' \\\n');
  const body = request.body ? ` \\\n  -d '${JSON.stringify(request.body)}'` : '';
  return `curl -X ${request.method} '${request.url}' \\\n${headers}${body}`;
}

function onClick(event) {
  const requestBtn = event.target.closest('[data-request]');
  if (requestBtn) {
    const next = collection().requests.find((request) => request.id === requestBtn.dataset.request);
    state.requestId = next.id;
    state.scenarioId = next.scenarios[0].id;
    state.responseTab = 'body';
    render();
    return;
  }

  const scenarioBtn = event.target.closest('[data-scenario]');
  if (scenarioBtn) {
    state.scenarioId = scenarioBtn.dataset.scenario;
    state.responseTab = 'body';
    render();
    return;
  }

  const tabBtn = event.target.closest('[data-res-tab]');
  if (tabBtn) {
    state.responseTab = tabBtn.dataset.resTab;
    render();
    return;
  }

  if (event.target.closest('[data-send]')) {
    send();
    return;
  }

  if (event.target.closest('[data-copy-request]')) {
    copyToClipboard(toCurl(currentScenario())).then((ok) =>
      toast(ok ? ui().api.curlCopied : ui().common.copyError, ok ? 'success' : 'error'),
    );
  }
}

/* ─────────────────────────  INIT  ───────────────────────── */

export function initApiConsole() {
  root = $('#apiConsole');
  if (!root) return;

  render();
  root.addEventListener('click', onClick);
  onLangChange(render);
}
