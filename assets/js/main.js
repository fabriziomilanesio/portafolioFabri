/**
 * main.js — Punto de entrada.
 * Renderiza el contenido del perfil, aplica los textos de interfaz del idioma
 * activo, arma la navegación (scrollspy, menú móvil, barra de progreso),
 * controla las pestañas del QA Playground e inicializa los módulos.
 */

import { getContent, ui, onLangChange } from './data.js';
import { $, $$, escapeHtml, applyI18n, observeReveal, stagger } from './ui.js';
import { initApiConsole } from './modules/api-console.js';
import { initBugBoard } from './modules/bug-board.js';
import { initSqlLab } from './modules/sql-lab.js';
import { initTimeline } from './modules/timeline.js';
import { initSkills } from './modules/skills.js';
import { initContact } from './modules/contact.js';
import { initTerminal } from './modules/terminal.js';
import { initCmdk } from './modules/cmdk.js';
import { initLangToggle } from './modules/lang-toggle.js';

/** Las barras de idioma solo se animan la primera vez que entran en pantalla. */
let langBarsAnimated = false;

/* ─────────────────────────  PERFIL  ───────────────────────── */

function renderProfile() {
  const { profile } = getContent();
  const t = ui();

  $('#heroSubtitle').textContent = profile.subtitle;
  $('#heroChips').innerHTML = profile.heroChips.map((chip) => `<li>${escapeHtml(chip)}</li>`).join('');

  $('#heroMetrics').innerHTML = profile.metrics
    .map(
      (metric) => `
        <div>
          <dt>${escapeHtml(metric.value)}</dt>
          <dd>${escapeHtml(metric.label)}<small>${escapeHtml(metric.hint)}</small></dd>
        </div>`,
    )
    .join('');

  $('#aboutText').innerHTML = profile.about.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  $('#howList').innerHTML = t.about.how.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  $('#langList').innerHTML = profile.languages
    .map(
      (lang) => `
        <li>
          <div class="lang-list__head">
            <span>${escapeHtml(lang.name)}</span>
            <span>${escapeHtml(lang.level)}</span>
          </div>
          <div class="lang-bar">
            <span data-pct="${lang.pct}" ${langBarsAnimated ? `style="width:${lang.pct}%"` : ''}></span>
          </div>
        </li>`,
    )
    .join('');

  $('#softSkills').innerHTML = profile.softSkills.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  $('#interests').innerHTML = profile.interests.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  $('#linkedinBtn').href = profile.linkedin;
  $('#cvDownloadEs').href = profile.cvEs;
  $('#cvDownloadEn').href = profile.cvEn;
  $('#footerYear').textContent = `© ${new Date().getFullYear()} Fabrizio Milanesio`;

  $('#statusPillText').textContent = profile.available
    ? `${t.hero.statusPrefix} · ${profile.availabilityLabel}`
    : t.hero.statusPrefix;
}

/** Anima las barras de idioma cuando entran en pantalla. */
function animateLanguageBars() {
  const bars = $$('.lang-bar span');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.width = `${entry.target.dataset.pct}%`;
        langBarsAnimated = true;
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 },
  );

  bars.forEach((bar) => observer.observe(bar));
}

/* ─────────────────────────  NAVEGACIÓN  ───────────────────────── */

/** Sección visible actual; se repinta tras cada render de la navegación. */
let activeSection = null;

function paintActiveNav() {
  $$('[data-nav]').forEach((link) => link.classList.toggle('is-active', link.dataset.nav === activeSection));
}

function renderNav() {
  const { navItems } = getContent();

  $('#navList').innerHTML = navItems
    .map(
      (item) => `
        <li>
          <a class="site-nav__link" href="#${item.id}" data-nav="${item.id}">${escapeHtml(item.label)}</a>
        </li>`,
    )
    .join('');

  // El pie repite la navegación sin "Inicio".
  $('#footerNav').innerHTML = navItems
    .slice(1)
    .map((item) => `<a href="#${item.id}">${escapeHtml(item.label)}</a>`)
    .join('');

  paintActiveNav();
}

function initHeaderBehaviour() {
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');

  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 12);

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = `${pct}%`;
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileNav() {
  const toggle = $('#navToggle');
  const nav = $('#siteNav');

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? ui().nav.menuClose : ui().nav.menuOpen);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', ui().nav.menuOpen);
    }
  });
}

function initScrollSpy() {
  // Los enlaces se consultan al pintar, porque la navegación se vuelve a
  // renderizar en cada cambio de idioma.
  const sections = getContent()
    .navItems.map((item) => document.getElementById(item.id))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        activeSection = entry.target.id;
        paintActiveNav();
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
}

/* ─────────────────────  TABS DEL PLAYGROUND  ───────────────────── */

function initTabs() {
  const container = $('[data-tabs="playground"]');
  if (!container) return;

  const tabs = $$('.tabs__tab', container);
  const panels = $$('.tabs__panel', container);

  const activate = (name) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      const active = panel.dataset.panel === name;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  };

  container.addEventListener('click', (event) => {
    const tab = event.target.closest('.tabs__tab');
    if (tab) activate(tab.dataset.tab);
  });

  // Navegación con flechas entre pestañas (patrón ARIA tablist).
  container.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;

    event.preventDefault();
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    activate(next.dataset.tab);
  });
}

/* ─────────────────────────  ARRANQUE  ───────────────────────── */

function init() {
  applyI18n(ui());
  renderProfile();
  renderNav();

  initLangToggle();
  initHeaderBehaviour();
  initMobileNav();
  initScrollSpy();
  initTabs();

  initTerminal();
  initApiConsole();
  initBugBoard();
  initSqlLab();
  initTimeline();
  initSkills();
  initContact();
  initCmdk();

  animateLanguageBars();

  // Al cambiar de idioma se rehacen los textos estáticos y el perfil;
  // cada módulo se redibuja por su cuenta con su propia suscripción.
  onLangChange(() => {
    applyI18n(ui());
    renderProfile();
    renderNav();
    if (!langBarsAnimated) animateLanguageBars();
  });

  // Animación de entrada para bloques estáticos.
  stagger($$('.section-head, .about__intro, .about__aside > *, .soft-grid > *, .contact__form'), 70);
  observeReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
