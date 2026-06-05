(function () {
  'use strict';

  // Sticky nav
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mobile menu
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach(el => revealObserver.observe(el));

  // Counter animation
  const counters = document.querySelectorAll('.stat__number');
  let countersAnimated = false;

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimal, 10) || 0;
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (decimals > 0) {
        el.textContent = current.toFixed(decimals) + suffix;
      } else if (target >= 1000) {
        el.textContent = Math.floor(current).toLocaleString('kk-KZ') + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const statsSection = document.getElementById('stats');
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersAnimated) {
          countersAnimated = true;
          counters.forEach(c => animateCounter(c));
        }
      });
    },
    { threshold: 0.3 }
  );
  if (statsSection) statsObserver.observe(statsSection);

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-item__question');
    const answer = item.querySelector('.faq-item__answer');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach(openItem => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.faq-item__answer').style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Pricing toggle
  const pricingSwitch = document.getElementById('pricingSwitch');
  const periodLabels = document.querySelectorAll('.pricing-toggle__label');
  let isYearly = false;

  function updatePricing() {
    const period = isYearly ? 'year' : 'month';
    document.querySelectorAll('.pricing-card__amount').forEach(el => {
      el.textContent = el.dataset[period];
    });
    pricingSwitch.classList.toggle('active', isYearly);
    periodLabels.forEach(label => {
      label.classList.toggle(
        'pricing-toggle__label--active',
        label.dataset.period === period
      );
    });
  }

  pricingSwitch.addEventListener('click', () => {
    isYearly = !isYearly;
    updatePricing();
  });

  periodLabels.forEach(label => {
    label.addEventListener('click', () => {
      isYearly = label.dataset.period === 'year';
      updatePricing();
    });
  });

  // CTA form — validation, honeypot, rate limit, Telegram
  const ctaForm = document.getElementById('ctaForm');
  const ctaFormError = document.getElementById('ctaFormError');
  const ctaFormSuccess = document.getElementById('ctaFormSuccess');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[\+\d\s\-\(\)]{7,20}$/;

  // ⚙️ Telegram credentials — замените после revoke старого токена
  const TG_TOKEN = '8748264121:AAGoacCeZuIAYNRC-EN3UomijYEfOCI2S0w';
  const TG_CHAT_ID = '7134011854';
  const TG_API = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  let lastSubmit = 0;

  function showFormError(msg) {
    if (!ctaFormError) return;
    ctaFormError.textContent = msg;
    ctaFormError.hidden = !msg;
  }

  function showFormSuccess(msg) {
    if (!ctaFormSuccess) return;
    ctaFormSuccess.textContent = msg;
    ctaFormSuccess.hidden = !msg;
  }

  function getField(id) {
    const el = ctaForm.querySelector(`#${id}`);
    return el ? el.value.trim() : '';
  }

  ctaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormError('');
    showFormSuccess('');

    // Honeypot
    const honeypot = ctaForm.querySelector('#website');
    if (honeypot && honeypot.value.trim()) return;

    // Rate limit
    const now = Date.now();
    if (now - lastSubmit < 5000) {
      showFormError('Бірнеше секунд күтіңіз / Подождите несколько секунд.');
      return;
    }

    // Collect fields
    const name    = getField('name');
    const email   = getField('email');
    const phone   = getField('phone');
    const message = getField('message');

    // Validate
    if (name && name.length > 100) {
      showFormError('Есім тым ұзын / Имя слишком длинное.');
      return;
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      showFormError('Email дұрыс емес / Введите корректный email.');
      ctaForm.querySelector('#email').focus();
      return;
    }
    if (phone && !PHONE_RE.test(phone)) {
      showFormError('Телефон нөмірі дұрыс емес / Неверный формат телефона.');
      ctaForm.querySelector('#phone').focus();
      return;
    }

    // Build Telegram message
    const lines = [
      '🔔 <b>Жаңа өтінім / Новая заявка — ShieldGuard</b>',
      '',
      name    ? `👤 <b>Аты-жөні:</b> ${escHtml(name)}`       : null,
      email   ? `📧 <b>Email:</b> ${escHtml(email)}`          : null,
      phone   ? `📞 <b>Телефон:</b> ${escHtml(phone)}`        : null,
      message ? `💬 <b>Хабарлама:</b>\n${escHtml(message)}`   : null,
      '',
      `🕐 ${new Date().toLocaleString('ru-KZ', { timeZone: 'Asia/Aqtau' })}`,
    ].filter(l => l !== null);

    const text = lines.join('\n');

    // UI — loading state
    const btn = ctaForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Жіберілуде…';
    btn.disabled = true;
    lastSubmit = now;

    try {
      const res = await fetch(TG_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' }),
      });

      if (!res.ok) throw new Error(`Telegram API error: ${res.status}`);

      // Success
      showFormSuccess('✅ Өтініміңіз қабылданды! Жақын арада хабарласамыз.');
      ctaForm.reset();
    } catch (err) {
      console.error(err);
      showFormError('Жіберу қатесі. Тікелей хабарласыңыз: info@shieldguard.kz');
      lastSubmit = 0; // allow retry immediately on error
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Smooth anchor offset handled via scroll-padding-top in CSS
})();
