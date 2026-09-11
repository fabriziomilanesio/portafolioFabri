/**
 * timeline.js — Línea de tiempo de experiencia en formato acordeón.
 * Cada posición se despliega como un caso de estudio: contexto, qué se probó,
 * herramientas e impacto medible del aseguramiento de calidad.
 */

import { getContent, ui, onLangChange } from '../data.js';
import { $, $$, escapeHtml, observeReveal, stagger } from '../ui.js';

let root = null;
/** Posición abierta; se conserva al cambiar de idioma. */
let openId = null;

function impactCard(item) {
  return `
    <div class="impact">
      <p class="impact__value">${escapeHtml(item.value)}</p>
      <p class="impact__label">${escapeHtml(item.label)}</p>
    </div>`;
}

function expMarkup(job) {
  const t = ui().timeline;
  const open = job.id === openId;

  return `
    <article class="exp ${job.current ? 'is-current' : ''} ${open ? 'is-open' : ''}" data-exp="${job.id}">
      <button class="exp__trigger" type="button" aria-expanded="${open}" aria-controls="exp-body-${job.id}">
        <span class="exp__bullet" aria-hidden="true"></span>
        <span class="exp__heads">
          <span class="exp__role">${escapeHtml(job.role)} · <span class="exp__company">${escapeHtml(job.company)}</span></span>
          <span class="exp__meta">
            <span>${escapeHtml(job.period)}</span>
            <span>·</span>
            <span>${escapeHtml(job.industry)}</span>
            ${job.current ? `<span class="badge-current">${escapeHtml(t.current)}</span>` : ''}
          </span>
          <span class="exp__summary">${escapeHtml(job.summary)}</span>
        </span>
        <span class="exp__chevron" aria-hidden="true">⌄</span>
      </button>

      <div class="exp__body" id="exp-body-${job.id}">
        <div class="exp__body-inner">
          <div class="exp__content">
            <p class="exp__context">${escapeHtml(job.context)}</p>

            <div class="exp__grid">
              <div>
                <p class="block-label">${escapeHtml(t.what)}</p>
                <ul class="exp__list">
                  ${job.whatITest.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
                <p class="block-label" style="margin-top:18px">${escapeHtml(t.tools)}</p>
                <div class="chip-row">
                  ${job.tools.map((tool) => `<span class="chip chip--accent">${escapeHtml(tool)}</span>`).join('')}
                </div>
              </div>

              <div>
                <p class="block-label">${escapeHtml(t.impact)}</p>
                <div class="impact-grid">${job.impact.map(impactCard).join('')}</div>
              </div>
            </div>

            <div class="exp__highlight">
              <span aria-hidden="true">💡</span>
              <p>${escapeHtml(job.highlight)}</p>
            </div>

            ${job.references ? `<p class="exp__refs">${escapeHtml(t.references)} ${escapeHtml(job.references)}</p>` : ''}
          </div>
        </div>
      </div>
    </article>`;
}

function toggle(article) {
  const willOpen = !article.classList.contains('is-open');

  // Acordeón: una sola posición abierta a la vez.
  $$('.exp', root).forEach((item) => {
    item.classList.remove('is-open');
    item.querySelector('.exp__trigger').setAttribute('aria-expanded', 'false');
  });

  if (willOpen) {
    article.classList.add('is-open');
    article.querySelector('.exp__trigger').setAttribute('aria-expanded', 'true');
    openId = article.dataset.exp;
  } else {
    openId = null;
  }
}

function render({ animate = true } = {}) {
  root.innerHTML = getContent().experience.map(expMarkup).join('');

  if (animate) {
    stagger($$('.exp', root), 70);
    observeReveal(root);
  }
}

export function initTimeline() {
  root = $('#timeline');
  if (!root) return;

  openId = getContent().experience[0].id;
  render();

  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('.exp__trigger');
    if (trigger) toggle(trigger.closest('.exp'));
  });

  // Al cambiar de idioma no se vuelve a animar: el bloque ya está a la vista.
  onLangChange(() => render({ animate: false }));
}
