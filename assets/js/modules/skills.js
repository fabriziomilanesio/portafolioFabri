/**
 * skills.js — Matriz de habilidades con filtros por área + certificaciones.
 */

import { getContent, ui, onLangChange } from '../data.js';
import { $, $$, escapeHtml, observeReveal, stagger } from '../ui.js';

let root = null;
/** Filtro activo; se conserva al cambiar de idioma porque los ids son comunes. */
let activeFilter = 'all';

const countFor = (categoryId) => {
  const { skills } = getContent();
  return categoryId === 'all' ? skills.length : skills.filter((skill) => skill.cat.includes(categoryId)).length;
};

/** Nivel → clase de color, reconociendo la etiqueta en ambos idiomas. */
const levelClass = (level) =>
  /avanzad|advanced/i.test(level) ? 'skill__level--avanzado' : 'skill__level--intermedio';

function skillCard(skill) {
  return `
    <article class="skill" data-cats="${skill.cat.join(' ')}">
      <div class="skill__top">
        <h3 class="skill__name">${escapeHtml(skill.name)}</h3>
        <span class="skill__level ${levelClass(skill.level)}">${escapeHtml(skill.level)}</span>
      </div>
      <p class="skill__note">${escapeHtml(skill.note)}</p>
    </article>`;
}

function applyFilter(categoryId) {
  activeFilter = categoryId;

  $$('.filter-chip', root).forEach((chip) =>
    chip.classList.toggle('is-active', chip.dataset.filter === categoryId),
  );

  $$('.skill', root).forEach((card) => {
    const match = categoryId === 'all' || card.dataset.cats.split(' ').includes(categoryId);
    card.classList.toggle('is-hidden', !match);
  });
}

function renderCerts({ animate = true } = {}) {
  const host = $('#certs');
  if (!host) return;

  host.innerHTML = getContent()
    .certifications.map(
      (cert) => {
        const tag = cert.href ? 'a' : 'article';
        const linkAttrs = cert.href
          ? ` href="${escapeHtml(cert.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${cert.name} (PDF)`)}`
          : '';

        return `
        <${tag} class="cert ${cert.featured ? 'cert--featured' : ''} ${cert.href ? 'cert--link' : ''}"${linkAttrs}>
          <span class="cert__icon" aria-hidden="true">${cert.icon}</span>
          <div>
            <h3 class="cert__name">${escapeHtml(cert.name)}</h3>
            <p class="cert__issuer">${escapeHtml(cert.issuer)}${cert.year ? ` · ${escapeHtml(cert.year)}` : ''}</p>
          </div>
        </${tag}>`;
      },
    )
    .join('');

  if (animate) {
    stagger($$('.cert', host), 55);
    observeReveal(host);
  }
}

function render({ animate = true } = {}) {
  const { skills, skillCategories } = getContent();

  root.innerHTML = `
    <div class="skills__filters" role="group" aria-label="${escapeHtml(ui().skills.filtersAria)}">
      ${skillCategories
        .map(
          (category) => `
            <button class="filter-chip ${category.id === activeFilter ? 'is-active' : ''}"
                    type="button" data-filter="${category.id}">
              ${escapeHtml(category.label)}<span class="n">${countFor(category.id)}</span>
            </button>`,
        )
        .join('')}
    </div>
    <div class="skills__grid">${skills.map(skillCard).join('')}</div>`;

  if (animate) {
    stagger($$('.skill', root), 35);
    observeReveal(root);
  }

  applyFilter(activeFilter);
  renderCerts({ animate });
}

export function initSkills() {
  root = $('#skillsModule');
  if (!root) return;

  render();

  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter]');
    if (chip) applyFilter(chip.dataset.filter);
  });

  onLangChange(() => render({ animate: false }));
}
