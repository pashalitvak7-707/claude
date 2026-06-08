/* Спортика — shared interactions */
(function () {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  const burger = document.querySelector('[data-burger]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const open = mobileNav.hasAttribute('hidden');
      if (open) { mobileNav.removeAttribute('hidden'); burger.setAttribute('aria-expanded', 'true'); }
      else { mobileNav.setAttribute('hidden', ''); burger.setAttribute('aria-expanded', 'false'); }
    });
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => { mobileNav.setAttribute('hidden', ''); burger.setAttribute('aria-expanded', 'false'); })
    );
  }

  /* ---------- Toast ---------- */
  let toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '<span></span>';
    toastEl.querySelector('span').textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 3600);
  }
  window.spToast = toast;

  /* ---------- Booking modal ---------- */
  const modal = document.querySelector('[data-modal="booking"]');
  function openModal(prefill) {
    if (!modal) { return; }
    if (prefill) {
      const t = modal.querySelector('[data-modal-context]');
      if (t) { t.textContent = prefill; t.hidden = false; }
    }
    modal.classList.add('open');
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input, select, button');
    if (first) { setTimeout(() => first.focus(), 60); }
  }
  function closeModal() {
    if (!modal) { return; }
    modal.classList.remove('open');
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }
  window.spOpenBooking = openModal;

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-booking]');
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute('data-open-booking') || '');
    }
    if (e.target.closest('[data-close-modal]')) { closeModal(); }
    if (e.target === modal) { closeModal(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); } });

  /* ---------- Phone mask (RU) ---------- */
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      if (v.startsWith('8')) { v = '7' + v.slice(1); }
      if (!v.startsWith('7')) { v = '7' + v; }
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) { out += ' (' + v.slice(1, 4); }
      if (v.length >= 4) { out += ') ' + v.slice(4, 7); }
      if (v.length >= 7) { out += '-' + v.slice(7, 9); }
      if (v.length >= 9) { out += '-' + v.slice(9, 11); }
      input.value = out;
    });
  });

  /* ---------- Generic async form (mock submit) ---------- */
  document.querySelectorAll('form[data-mock-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const consent = form.querySelector('input[type="checkbox"][required]');
      if (consent && !consent.checked) { toast('Подтвердите согласие на обработку данных'); return; }
      const original = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.dataset.loading = '1'; btn.innerHTML = '<span class="spinner"></span> Отправляем…'; }
      setTimeout(() => {
        if (btn) { btn.disabled = false; delete btn.dataset.loading; btn.innerHTML = original; }
        const msg = form.getAttribute('data-success') || 'Заявка отправлена! Менеджер свяжется с вами.';
        toast(msg);
        if (modal && modal.contains(form)) { setTimeout(closeModal, 400); }
        form.reset();
      }, 1100);
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.acc-item');
      const panel = item.querySelector('.acc-panel');
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? '0' : panel.scrollHeight + 'px';
    });
  });

  /* ---------- Schedule filter ---------- */
  const scheduleRoot = document.querySelector('[data-schedule]');
  if (scheduleRoot) {
    const filters = { age: 'all', direction: 'all', trainer: 'all' };
    const rows = Array.from(scheduleRoot.querySelectorAll('[data-slot]'));
    const emptyMsg = scheduleRoot.querySelector('[data-schedule-empty]');
    const counter = document.querySelector('[data-schedule-count]');

    function apply() {
      let visible = 0;
      rows.forEach((row) => {
        const ok =
          (filters.age === 'all' || row.dataset.age === filters.age) &&
          (filters.direction === 'all' || row.dataset.direction === filters.direction) &&
          (filters.trainer === 'all' || row.dataset.trainer === filters.trainer);
        row.hidden = !ok;
        if (ok) { visible++; }
      });
      if (emptyMsg) { emptyMsg.hidden = visible !== 0; }
      if (counter) { counter.textContent = visible; }
    }
    scheduleRoot.querySelectorAll('[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const group = chip.dataset.filter;
        scheduleRoot.querySelectorAll('[data-filter="' + group + '"]').forEach((c) => {
          c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('is-active'); chip.setAttribute('aria-pressed', 'true');
        filters[group] = chip.dataset.value;
        apply();
      });
    });
    apply();
  }

  /* ---------- Personal account tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const btns = tabs.querySelectorAll('[data-tab]');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        const target = btn.dataset.tab;
        document.querySelectorAll('[data-panel]').forEach((p) => {
          p.hidden = p.dataset.panel !== target;
        });
      });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.style.opacity = '1'; en.target.style.transform = 'none'; obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });
  }

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

/* spinner via JS-injected style */
(function () {
  const s = document.createElement('style');
  s.textContent = '.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
})();
