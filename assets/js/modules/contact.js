/**
 * contact.js — Datos de contacto, acciones de copiado y formulario.
 * El formulario valida en cliente y envía el mensaje mediante FormSubmit,
 * compatible con hosting estático como GitHub Pages.
 */

import { getContent, ui, fmt, onLangChange } from '../data.js';
import { $, escapeHtml, toast, copyToClipboard } from '../ui.js';

const ICONS = {
  email: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  location: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  linkedin: '<svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.2 8.5h3.5V21H3.2V8.5Zm6 0h3.35v1.7h.05a3.67 3.67 0 0 1 3.3-1.82c3.53 0 4.18 2.33 4.18 5.35V21h-3.5v-5.6c0-1.34-.02-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V21H9.2V8.5Z"/></svg>',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* ─────────────────────  LISTA DE CONTACTO  ───────────────────── */

function renderContactList() {
  const host = $('#contactList');
  if (!host) return;

  const { profile } = getContent();
  const t = ui().contact;

  const items = [
    { icon: 'email', label: t.labels.email, value: profile.email, href: `mailto:${profile.email}` },
    { icon: 'phone', label: t.labels.phone, value: profile.phone, href: `tel:+${profile.phoneRaw}` },
    { icon: 'linkedin', label: t.labels.linkedin, value: 'fabrizio-milanesio', href: profile.linkedin, external: true },
    { icon: 'location', label: t.labels.location, value: `${profile.location} · ${t.locationSuffix}` },
  ];

  host.innerHTML = items
    .map((item) => {
      const inner = `
        <span class="contact__icon">${ICONS[item.icon]}</span>
        <span>
          <span class="contact__label">${escapeHtml(item.label)}</span>
          <span class="contact__value">${escapeHtml(item.value)}</span>
        </span>`;

      if (!item.href) return `<li class="contact__item">${inner}</li>`;

      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<li><a class="contact__item" href="${item.href}"${target}>${inner}</a></li>`;
    })
    .join('');
}

/** Opciones del asunto: se regeneran conservando el índice elegido. */
function renderSubjects() {
  const select = $('#fSubject');
  if (!select) return;

  const selectedIndex = Math.max(select.selectedIndex, 0);
  select.innerHTML = ui()
    .contact.subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`)
    .join('');
  select.selectedIndex = selectedIndex;
}

function renderWhatsapp() {
  const whatsapp = $('#whatsappBtn');
  if (!whatsapp) return;

  const { profile } = getContent();
  whatsapp.href = `https://wa.me/${profile.phoneRaw}?text=${encodeURIComponent(ui().contact.whatsappText)}`;
}

/* ─────────────────────────  COPIAR  ───────────────────────── */

function initCopyButtons() {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;

    const { profile } = getContent();
    const value = button.dataset.copy === 'phone' ? profile.phone : profile.email;
    const ok = await copyToClipboard(value);

    toast(
      ok ? fmt(ui().contact.copied, { value }) : ui().common.copyError,
      ok ? 'success' : 'error',
    );
  });
}

/* ─────────────────────────  FORMULARIO  ───────────────────────── */

function setError(fieldId, message) {
  const input = $(`#${fieldId}`);
  const error = $(`#${fieldId}Error`);
  if (!input || !error) return;

  input.closest('.field').classList.toggle('has-error', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  error.textContent = message || '';
}

function validate(form) {
  const t = ui().contact;
  const values = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value,
    message: form.message.value.trim(),
  };

  let firstInvalid = null;

  const checks = [
    ['fName', values.name.length >= 2, t.errors.name],
    ['fEmail', EMAIL_RE.test(values.email), t.errors.email],
    ['fMessage', values.message.length >= 10, t.errors.message],
  ];

  checks.forEach(([id, valid, message]) => {
    setError(id, valid ? '' : message);
    if (!valid && !firstInvalid) firstInvalid = id;
  });

  return { valid: !firstInvalid, firstInvalid, values };
}

function initForm() {
  const form = $('#contactForm');
  if (!form) return;

  const note = $('#formNote');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const t = ui().contact;
    const { valid, firstInvalid, values } = validate(form);

    if (!valid) {
      $(`#${firstInvalid}`).focus();
      toast(t.formError, 'error');
      return;
    }

    const to = getContent().profile.email;
    const submitButton = form.querySelector('[type="submit"]');

    try {
      submitButton.disabled = true;

      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
          _subject: `[Portafolio] ${values.subject}`,
          _replyto: values.email,
          _template: 'table',
          _url: window.location.href,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error('Form submission failed');

      form.reset();
      note.textContent = t.formNote;
      toast(t.formOk, 'success');
    } catch {
      note.textContent = t.formSubmitError;
      toast(t.formSubmitError, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  // Limpia el error del campo apenas el usuario corrige.
  form.addEventListener('input', (event) => {
    const field = event.target.closest('.field');
    if (field?.classList.contains('has-error')) setError(event.target.id, '');
  });
}

export function initContact() {
  renderContactList();
  renderSubjects();
  renderWhatsapp();
  initCopyButtons();
  initForm();

  onLangChange(() => {
    renderContactList();
    renderSubjects();
    renderWhatsapp();
    $('#formNote').textContent = '';
  });
}
