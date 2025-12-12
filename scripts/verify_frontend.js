// scripts/verify_frontend.js
// Frontend verification + helpers for Hybrid MLM plan
// - Form validations (signup, login, epin activation, package purchase)
// - Debounced server-side checks (email uniqueness, sponsor/placement validity)
// - Safe fetch wrapper with JSON, error handling, timeouts
// - In-app simple notification UI helpers (toast)
// - Basic socket connect helper (optional) for realtime notifications
// - Attach to window.VerifyFrontend for app usage
//
// Usage example (plain HTML):
// <script src="/scripts/verify_frontend.js"></script>
// <script> VerifyFrontend.init({ apiBase: '/api', csrfToken: 'abc' }); </script>

(function (global) {
  'use strict';

  // -----------------------
  // CONFIG
  // -----------------------
  const DEFAULT_CONFIG = {
    apiBase: '/api',               // backend base url
    timeout: 15000,                // fetch timeout ms
    debounceMs: 450,               // debounce for server checks
    minPasswordLen: 6,
    allowedEmailDomains: [],       // optional allowed email domains (empty = any)
    enableSocket: true,
    socketPath: '/socket.io',      // used if enableSocket true
    maxRetries: 2,                 // fetch retry attempts on network failure
    selectors: {
      toastContainer: '#toast-container'
    }
  };

  // -----------------------
  // UTIL: shallow merge
  // -----------------------
  function merge(a, b) {
    return Object.assign({}, a, b);
  }

  // -----------------------
  // Toast / Notification UI (simple)
  // -----------------------
  function ensureToastContainer(selector) {
    let cont = document.querySelector(selector);
    if (!cont) {
      cont = document.createElement('div');
      cont.id = selector.replace('#', '');
      Object.assign(cont.style, {
        position: 'fixed',
        right: '16px',
        top: '16px',
        zIndex: 99999,
        width: '320px',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
      });
      document.body.appendChild(cont);
    }
    return cont;
  }

  function showToast(message, type = 'info', timeout = 4000) {
    const cont = ensureToastContainer(config.selectors.toastContainer);
    const el = document.createElement('div');
    el.className = `vf-toast vf-toast-${type}`;
    Object.assign(el.style, {
      marginBottom: '8px',
      pointerEvents: 'auto',
      padding: '10px 12px',
      borderRadius: '8px',
      background: type === 'error' ? '#ffefef' : (type === 'success' ? '#e6ffef' : '#f2f7ff'),
      color: '#111',
      boxShadow: '0 6px 18px rgba(11,12,16,0.08)',
      fontSize: '13px'
    });
    el.textContent = message;
    cont.appendChild(el);
    setTimeout(() => {
      el.style.transform = 'translateX(20px)';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 350);
    }, timeout);
  }

  // -----------------------
  // UTIL: debounce
  // -----------------------
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // -----------------------
  // UTIL: timeout-able fetch + JSON parse + retry
  // -----------------------
  async function fetchJson(url, options = {}) {
    const timeout = options.timeout || config.timeout;
    let attempts = 0;
    const maxAttempts = typeof options.retries === 'number' ? options.retries : config.maxRetries;

    while (true) {
      attempts++;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const resp = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
        clearTimeout(id);
        const contentType = resp.headers.get('content-type') || '';
        if (!resp.ok) {
          // attempt to parse JSON error message
          let body = null;
          if (contentType.includes('application/json')) {
            try { body = await resp.json(); } catch (e) { /* ignore */ }
          } else {
            try { body = await resp.text(); } catch (e) {}
          }
          const err = new Error(body?.message || `HTTP ${resp.status}`);
          err.status = resp.status;
          err.body = body;
          throw err;
        }
        if (contentType.includes('application/json')) {
          return await resp.json();
        } else {
          return await resp.text();
        }
      } catch (err) {
        clearTimeout(id);
        // retry only on network or aborted (timeout) errors, not on 4xx/5xx responses
        if (attempts <= maxAttempts && (err.name === 'AbortError' || err.name === 'TypeError')) {
          await new Promise(r => setTimeout(r, 200 * attempts)); // backoff
          continue;
        }
        throw err;
      }
    }
  }

  // -----------------------
  // VALIDATORS (pure)
  // -----------------------
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    // basic RFC-ish check
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return false;
    if (config.allowedEmailDomains.length) {
      const domain = email.split('@')[1] || '';
      return config.allowedEmailDomains.includes(domain);
    }
    return true;
  }

  function isValidMobile(mobile) {
    if (!mobile) return false;
    // allow + and digits, 7..15 digits after removing non-digit chars
    const digits = (mobile + '').replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  function isStrongPassword(pw) {
    if (!pw || typeof pw !== 'string') return false;
    if (pw.length < config.minPasswordLen) return false;
    // require letter and number (basic)
    if (!(/[A-Za-z]/.test(pw) && /[0-9]/.test(pw))) return false;
    return true;
  }

  // -----------------------
  // SERVER-SIDE CHECKS (debounced)
  // -----------------------
  const checks = {
    email: null,
    sponsor: null,
    placement: null,
    epin: null
  };

  async function checkEmailUnique(apiBase, email) {
    if (!isValidEmail(email)) return { ok: false, reason: 'invalid_email' };
    try {
      const res = await fetchJson(`${apiBase}/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      });
      return res; // expected { ok: true, exists: false }
    } catch (err) {
      return { ok: false, reason: 'server_error', detail: err.message || err };
    }
  }

  async function checkUserExists(apiBase, userIdOrNumber) {
    try {
      const res = await fetchJson(`${apiBase}/users/check-id?user=${encodeURIComponent(userIdOrNumber)}`, { method: 'GET' });
      return res; // { ok:true, exists: true/false }
    } catch (err) {
      return { ok: false, reason: 'server_error', detail: err.message || err };
    }
  }

  async function checkEpinValid(apiBase, code) {
    try {
      const res = await fetchJson(`${apiBase}/epin/validate?code=${encodeURIComponent(code)}`, { method: 'GET' });
      return res; // { ok:true, valid:true, package: {...} }
    } catch (err) {
      return { ok: false, reason: 'server_error', detail: err.message || err };
    }
  }

  // -----------------------
  // FORM VALIDATION HANDLERS (attach to forms)
  // -----------------------
  function validateSignupForm(formEl) {
    if (!formEl) throw new Error('formEl required');
    const data = {};
    const name = (formEl.querySelector('[name="name"]')?.value || '').trim();
    const mobile = (formEl.querySelector('[name="mobile"]')?.value || '').trim();
    const email = (formEl.querySelector('[name="email"]')?.value || '').trim();
    const password = (formEl.querySelector('[name="password"]')?.value || '').trim();
    const sponsor = (formEl.querySelector('[name="sponsorId"]')?.value || '').trim();
    // optional placement and package fields
    const placement = (formEl.querySelector('[name="placementId"]')?.value || '').trim();
    const packageName = (formEl.querySelector('[name="package"]')?.value || '').trim();

    const errors = [];
    if (!name) errors.push('Name is required');
    if (!isValidMobile(mobile)) errors.push('Valid mobile required');
    if (!isValidEmail(email)) errors.push('Valid email required');
    if (!isStrongPassword(password)) errors.push(`Password must be at least ${config.minPasswordLen} chars, include letters and numbers`);
    if (!sponsor) errors.push('Sponsor ID is required');

    data.name = name; data.mobile = mobile; data.email = email; data.password = password;
    data.sponsor = sponsor; data.placement = placement; data.package = packageName;

    return { valid: errors.length === 0, errors, data };
  }

  function validateLoginForm(formEl) {
    const emailOrId = (formEl.querySelector('[name="login"]')?.value || '').trim();
    const password = (formEl.querySelector('[name="password"]')?.value || '').trim();
    const errors = [];
    if (!emailOrId) errors.push('Login id/email required');
    if (!password) errors.push('Password required');
    return { valid: errors.length === 0, errors, data: { login: emailOrId, password } };
  }

  function validateEPINForm(formEl) {
    const epin = (formEl.querySelector('[name="epin"]')?.value || '').trim();
    const errors = [];
    if (!epin) errors.push('EPIN code required');
    // EPIN format: alphanumeric 6-32
    if (!/^[A-Z0-9\-]{4,32}$/i.test(epin)) errors.push('Invalid EPIN format');
    return { valid: errors.length === 0, errors, data: { epin } };
  }

  // -----------------------
  // UI helpers: attach validation + async checks
  // -----------------------
  function attachSignupValidation(formEl) {
    if (!formEl) return;
    const emailInput = formEl.querySelector('[name="email"]');
    const sponsorInput = formEl.querySelector('[name="sponsorId"]');

    const debEmail = debounce(async () => {
      if (!emailInput) return;
      const v = emailInput.value.trim();
      if (!isValidEmail(v)) return;
      const res = await checkEmailUnique(config.apiBase, v);
      if (res && res.exists) {
        showToast('Email already used', 'error');
      }
    }, config.debounceMs);

    const debSponsor = debounce(async () => {
      if (!sponsorInput) return;
      const v = sponsorInput.value.trim();
      if (!v) return;
      const res = await checkUserExists(config.apiBase, v);
      if (res && !res.exists) {
        showToast('Sponsor/Placement ID not found', 'error');
      }
    }, config.debounceMs);

    emailInput?.addEventListener('input', debEmail);
    sponsorInput?.addEventListener('blur', debSponsor);

    // On submit
    formEl.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { valid, errors, data } = validateSignupForm(formEl);
      if (!valid) {
        errors.forEach(e => showToast(e, 'error'));
        return;
      }
      try {
        const resp = await fetchJson(`${config.apiBase}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (resp.ok) {
          showToast('Signup successful', 'success');
          formEl.reset();
        } else {
          showToast(resp.message || 'Signup failed', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Network error', 'error');
      }
    });
  }

  function attachLoginValidation(formEl) {
    if (!formEl) return;
    formEl.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { valid, errors, data } = validateLoginForm(formEl);
      if (!valid) { errors.forEach(e => showToast(e, 'error')); return; }
      try {
        const resp = await fetchJson(`${config.apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (resp.ok) {
          showToast('Login successful', 'success');
          // store token and redirect
          if (resp.token) localStorage.setItem('authToken', resp.token);
          if (resp.redirect) window.location.href = resp.redirect;
        } else showToast(resp.message || 'Login failed', 'error');
      } catch (err) {
        showToast(err.message || 'Network error', 'error');
      }
    });
  }

  function attachEPINValidation(formEl) {
    if (!formEl) return;
    const epinInput = formEl.querySelector('[name="epin"]');
    const debEpin = debounce(async () => {
      const code = (epinInput?.value || '').trim();
      if (!code) return;
      const res = await checkEpinValid(config.apiBase, code);
      if (!res.ok) { showToast('EPIN check failed', 'error'); return; }
      if (!res.valid) showToast('EPIN invalid or used', 'error');
      else showToast(`EPIN valid for ${res.package?.name || 'package'}`, 'success');
    }, config.debounceMs);

    epinInput?.addEventListener('input', debEpin);

    formEl.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { valid, errors, data } = validateEPINForm(formEl);
      if (!valid) { errors.forEach(e => showToast(e, 'error')); return; }
      try {
        const token = localStorage.getItem('authToken');
        const resp = await fetchJson(`${config.apiBase}/epin/activate`, {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {}),
          body: JSON.stringify({ code: data.epin })
        });
        if (resp.ok) {
          showToast('EPIN activated & package applied', 'success');
          formEl.reset();
        } else {
          showToast(resp.message || 'Activation failed', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Network error', 'error');
      }
    });
  }

  // -----------------------
  // Socket helper (optional) - minimal, expects socket.io-client loaded if used
  // -----------------------
  let socket = null;
  function initSocket() {
    if (!config.enableSocket) return;
    try {
      // expects io global (socket.io-client) to be available on page
      if (typeof io === 'undefined') {
        console.warn('Socket.io client not found (io) — skipping realtime init');
        return;
      }
      socket = io(config.apiBase, { path: config.socketPath });
      socket.on('connect', () => {
        console.info('Realtime socket connected', socket.id);
      });
      socket.on('notification', (n) => {
        // simple default handling
        if (n && n.title) showToast(n.title, 'info');
      });
      socket.on('disconnect', () => { console.info('socket disconnected'); });
    } catch (e) {
      console.error('socket init error', e);
    }
  }

  // -----------------------
  // Small helpers to auto-wire forms by data attributes
  // e.g. <form data-vf="signup"> or data-vf="login" or data-vf="epin">
  // -----------------------
  function autoWireForms() {
    document.querySelectorAll('form[data-vf]').forEach(form => {
      const role = form.getAttribute('data-vf');
      if (role === 'signup') attachSignupValidation(form);
      if (role === 'login') attachLoginValidation(form);
      if (role === 'epin') attachEPINValidation(form);
      // more roles can be attached here later
    });
  }

  // -----------------------
  // Public init + expose
  // -----------------------
  let config = merge(DEFAULT_CONFIG, {});

  function init(userConfig = {}) {
    config = merge(DEFAULT_CONFIG, userConfig || {});
    // create toast container
    ensureToastContainer(config.selectors.toastContainer);
    // auto wire forms
    document.addEventListener('DOMContentLoaded', () => {
      autoWireForms();
      // init socket optionally
      setTimeout(() => initSocket(), 400);
    });
  }

  // expose API
  const VerifyFrontend = {
    init,
    showToast,
    validateSignupForm,
    validateLoginForm,
    validateEPINForm,
    attachSignupValidation,
    attachLoginValidation,
    attachEPINValidation,
    checkEmailUnique: (email) => checkEmailUnique(config.apiBase, email),
    checkUserExists: (id) => checkUserExists(config.apiBase, id),
    checkEpinValid: (code) => checkEpinValid(config.apiBase, code),
    fetchJson: (url, opts) => fetchJson(url, opts)
  };

  // attach to window
  global.VerifyFrontend = VerifyFrontend;

})(window);
