/* =========================================================
   Lastro Contabilidade — interações
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat('pt-BR');

  /* ---------- Ano no rodapé ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Tema claro/escuro ---------- */
  var root = document.documentElement;
  var themeBtn = $('.theme-toggle');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('lastro-theme', next); } catch (e) {}
    });
  }

  /* ---------- Header: borda ao rolar ---------- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu móvel ---------- */
  var menuBtn = $('.menu-toggle');
  var mobileNav = $('#mobile-nav');
  function setMenu(open) {
    mobileNav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    $('use', menuBtn).setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () { setMenu(mobileNav.hidden); });
    $$('a', mobileNav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080 && !mobileNav.hidden) setMenu(false); });
  }

  /* ---------- Animações de entrada ---------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    // Pequeno atraso escalonado entre irmãos
    revealEls.forEach(function (el) {
      var siblings = $$(':scope > [data-reveal]', el.parentElement);
      var i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
    });
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contadores numéricos ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = num.format(target); return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = num.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- Link ativo no menu ---------- */
  var navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (link && entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) navObs.observe(s); });
  }

  /* ---------- Tabs de nichos ---------- */
  var tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Planos: mensal x anual ---------- */
  var billingBtns = $$('[data-billing]');
  function setBilling(mode) {
    billingBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-billing') === mode)); });
    $$('[data-price]').forEach(function (el) {
      var base = parseInt(el.getAttribute('data-price'), 10);
      var value = mode === 'yearly' ? Math.round(base * 0.85) : base;
      el.textContent = num.format(value);
      var note = $('[data-note]', el.closest('.plan'));
      if (note) note.textContent = mode === 'yearly'
        ? 'cobrado anualmente · ' + brl.format(value * 12) + '/ano'
        : 'cobrado mensalmente';
    });
  }
  billingBtns.forEach(function (b) {
    b.addEventListener('click', function () { setBilling(b.getAttribute('data-billing')); });
  });

  /* ---------- Simulador PF x PJ ----------
     Estimativa ilustrativa com tabelas de 2025:
     - PF (autônomo): INSS 20% até o teto + IRPF mensal (carnê-leão)
     - PJ: Simples Nacional Anexo III (Fator R) + pró-labore de 28%
       com INSS 11% e IRPF + mensalidade do plano Essencial */
  var IR_TABLE = [
    [2428.80, 0, 0],
    [2826.65, 0.075, 182.16],
    [3751.05, 0.15, 394.16],
    [4664.68, 0.225, 675.49],
    [Infinity, 0.275, 896.00]
  ];
  var INSS_TETO = 8157.41;
  var SALARIO_MINIMO = 1518;
  var ANEXO_III = [
    [180000, 0.06, 0],
    [360000, 0.112, 9360],
    [720000, 0.135, 17640],
    [1800000, 0.16, 35640]
  ];
  var HONORARIO = 249;

  function irpf(base) {
    for (var i = 0; i < IR_TABLE.length; i++) {
      if (base <= IR_TABLE[i][0]) return Math.max(0, base * IR_TABLE[i][1] - IR_TABLE[i][2]);
    }
    return 0;
  }
  function simplesAnexoIII(mensal) {
    var rbt12 = mensal * 12;
    for (var i = 0; i < ANEXO_III.length; i++) {
      if (rbt12 <= ANEXO_III[i][0]) {
        var efetiva = (rbt12 * ANEXO_III[i][1] - ANEXO_III[i][2]) / rbt12;
        return mensal * efetiva;
      }
    }
    return mensal * 0.16;
  }
  function custoPF(r) {
    var inss = Math.min(r, INSS_TETO) * 0.20;
    return inss + irpf(r - inss);
  }
  function custoPJ(r) {
    var das = simplesAnexoIII(r);
    var proLabore = Math.max(r * 0.28, SALARIO_MINIMO);
    var inss = Math.min(proLabore, INSS_TETO) * 0.11;
    return das + inss + irpf(proLabore - inss) + HONORARIO;
  }

  var simRange = $('#sim-range');
  var simValue = $('#sim-value');
  if (simRange && simValue) {
    var min = +simRange.min, max = +simRange.max;
    var out = {
      pf: $('#sim-pf'), pj: $('#sim-pj'),
      pfBar: $('#sim-pf-bar'), pjBar: $('#sim-pj-bar'),
      year: $('#sim-year'), month: $('#sim-month'), box: $('#sim-result')
    };

    function render(r) {
      var pf = custoPF(r), pj = custoPJ(r);
      var diff = pf - pj;
      var top = Math.max(pf, pj) || 1;
      out.pf.textContent = brl.format(pf);
      out.pj.textContent = brl.format(pj);
      out.pfBar.style.width = (pf / top * 100) + '%';
      out.pjBar.style.width = (pj / top * 100) + '%';
      simRange.style.setProperty('--fill', ((r - min) / (max - min) * 100) + '%');

      if (diff > 50) {
        out.box.classList.remove('is-neutral');
        out.year.textContent = brl.format(diff * 12);
        out.month.textContent = 'cerca de ' + brl.format(diff) + ' por mês a menos em impostos';
      } else {
        out.box.classList.add('is-neutral');
        out.year.textContent = 'Economia pequena nessa faixa';
        out.month.textContent = 'Vale uma conversa: pode compensar continuar como pessoa física.';
      }
    }

    function parseBRL(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0; }
    function clamp(v) { return Math.min(max, Math.max(min, v)); }

    simRange.addEventListener('input', function () {
      var v = +simRange.value;
      simValue.value = num.format(v);
      render(v);
    });
    simValue.addEventListener('input', function () {
      var v = parseBRL(simValue.value);
      simValue.value = v ? num.format(v) : '';
      if (v >= min && v <= max) { simRange.value = v; render(v); }
    });
    simValue.addEventListener('blur', function () {
      var v = clamp(parseBRL(simValue.value));
      simValue.value = num.format(v);
      simRange.value = v;
      render(v);
    });

    render(+simRange.value);
  }

  /* ---------- Formulário de contato ---------- */
  var form = $('#lead-form');
  var assunto = $('#f-assunto');

  // Botões com data-assunto já preenchem o motivo do contato
  $$('a[data-assunto]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (assunto) assunto.value = a.getAttribute('data-assunto');
    });
  });

  // Máscara de telefone: (11) 90000-0000
  var tel = $('#f-tel');
  if (tel) {
    tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      var f = d;
      if (d.length > 2) f = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) f = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      tel.value = f;
    });
  }

  function setError(input, msg) {
    var field = input.closest('.field');
    var slot = field ? $('.field-error', field) : $('[data-for="' + input.name + '"]', form);
    if (field) field.classList.toggle('has-error', !!msg);
    if (slot) slot.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validate(input) {
    var v = (input.value || '').trim();
    var msg = '';
    switch (input.name) {
      case 'nome':
        if (v.length < 3) msg = 'Informe seu nome.';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Informe um e-mail válido.';
        break;
      case 'telefone':
        if (v.replace(/\D/g, '').length < 10) msg = 'Informe um WhatsApp com DDD.';
        break;
      case 'assunto':
        if (!v) msg = 'Escolha uma opção.';
        break;
      case 'lgpd':
        if (!input.checked) msg = 'Precisamos da sua autorização para entrar em contato.';
        break;
    }
    setError(input, msg);
    return !msg;
  }

  if (form) {
    var required = $$('[required]', form);
    required.forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value || input.type === 'checkbox') validate(input); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
      input.addEventListener('change', function () { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstInvalid = null;
      required.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      // Site estático: simula o envio. Troque por um fetch() para o seu backend/CRM.
      setTimeout(function () {
        var data = new FormData(form);
        var assuntoTxt = assunto.options[assunto.selectedIndex].text;
        var msg = 'Olá! Sou ' + data.get('nome') + '. ' + assuntoTxt + '.' +
          (data.get('mensagem') ? ' ' + data.get('mensagem') : '');
        $('#wa-link').href = 'https://wa.me/5511900000000?text=' + encodeURIComponent(msg);

        form.hidden = true;
        var ok = $('#form-success');
        ok.hidden = false;
        ok.focus();
      }, 700);
    });
  }

  /* ---------- Botão flutuante: esconde na seção de contato ---------- */
  var fab = $('.fab');
  var contato = $('#contato');
  if (fab && contato && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fab.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(contato);
  }
})();
