// Enquiry form: accessible validation + delivery.
// If VITE_FORM_ENDPOINT is set at build time (a Formspree / Basin / similar URL) the enquiry is POSTed there.
// Otherwise it opens the visitor's email app with a fully written enquiry addressed to the business, so the
// form works on any static host without a backend.
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || '';
const TO = 'ripleysafaris@gmail.com';

export function initForm() {
  const form = document.getElementById('enquiry');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const first = form.querySelector('[name=first_name]');
  const email = form.querySelector('[name=email]');
  const tel = form.querySelector('[name=mobile]');

  const err = (input, msg) => {
    const out = document.getElementById(input.getAttribute('aria-describedby'));
    if (out) out.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const checks = new Map([
    [first, () => { const ok = first.value.trim().length > 0; err(first, ok ? '' : 'Please tell us your first name.'); return ok; }],
    [email, () => {
      const v = email.value.trim(); const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      err(email, ok ? '' : (v ? 'That email address doesn’t look right.' : 'Please enter your email so we can reply.')); return ok;
    }],
    [tel, () => {
      const v = tel.value.trim(); const ok = !v || /^[+()\d][\d\s().-]{5,}$/.test(v);
      err(tel, ok ? '' : 'Use digits, spaces and + only, e.g. +27 71 858 4498.'); return ok;
    }],
  ]);
  checks.forEach((fn, input) => {
    input.addEventListener('blur', fn);
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') fn(); });
  });

  const collect = () => {
    const fd = new FormData(form); const data = {};
    for (const k of new Set([...fd.keys()])) {
      if (k === 'company') continue;
      const all = fd.getAll(k).filter(Boolean);
      if (all.length) data[k] = all.join(', ');
    }
    return data;
  };
  const label = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.querySelector('[data-honeypot]').value) return; // bot trap
    const results = [...checks.values()].map(fn => fn());
    if (!results.every(Boolean)) {
      status.dataset.state = 'error'; status.textContent = 'Please check the highlighted fields.';
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const data = collect();
    const subject = `Safari enquiry from ${data.first_name}${data.last_name ? ' ' + data.last_name : ''}`;
    const text = Object.entries(data).map(([k, v]) => `${label(k)}: ${v}`).join('\n');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      if (ENDPOINT) {
        status.dataset.state = ''; status.textContent = 'Sending…';
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, _subject: subject }) });
        if (!r.ok) throw new Error('send failed');
        form.reset();
        status.dataset.state = 'ok'; status.textContent = 'Thank you — your enquiry has been sent. Our team will be in touch with a tailored quote.';
      } else {
        window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        status.dataset.state = 'ok';
        status.textContent = `Your email app should now open with your enquiry ready to send. If it doesn’t, email ${TO} or message us on WhatsApp.`;
      }
    } catch {
      status.dataset.state = 'error'; status.textContent = `Sorry — that didn’t send. Please email ${TO} or message us on WhatsApp.`;
    } finally { btn.disabled = false; }
  });
}
