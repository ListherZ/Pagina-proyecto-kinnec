const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const navLinks = document.querySelectorAll('.site-nav a');
const yearNode = document.querySelector('#year');
const revealNodes = document.querySelectorAll('[data-reveal]');
const form = document.querySelector('#contact-form');
const formResponse = document.querySelector('#form-response');
const formSubmitButton = document.querySelector('#contact-submit');
const header = document.querySelector('.site-header');
const backToTop = document.querySelector('#back-to-top') || document.querySelector('.back-to-top');

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

/* ── Mobile menu ─────────────────────────────────── */
function closeMenu() {
  document.body.classList.remove('menu-open');
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('menu-open') &&
        !nav.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

/* ── Scroll reveal (per-section delays) ──────────── */
if ('IntersectionObserver' in window) {
  const sections = document.querySelectorAll('section, .signal-strip');

  sections.forEach((section) => {
    const children = section.querySelectorAll('[data-reveal]');
    children.forEach((node, i) => {
      node.style.transitionDelay = `${Math.min(i * 80, 320)}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

/* ── Header auto-hide on scroll down ─────────────── */
let lastScrollY = 0;
let ticking = false;

function updateHeader() {
  const currentY = window.scrollY;
  if (!header) return;

  if (currentY > lastScrollY && currentY > 120) {
    header.classList.add('header-hidden');
  } else {
    header.classList.remove('header-hidden');
  }

  lastScrollY = currentY;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateHeader);
    ticking = true;
  }
}, { passive: true });

/* ── Active nav link on scroll ───────────────────── */
const sectionTargets = document.querySelectorAll('section[id]');
const navMap = {};
navLinks.forEach((link) => {
  const hash = link.getAttribute('href');
  if (hash && hash.startsWith('#')) navMap[hash.slice(1)] = link;
});

function updateActiveNav() {
  let current = '';
  sectionTargets.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 200) {
      current = sec.id;
    }
  });

  Object.values(navMap).forEach((link) => link.classList.remove('nav-active'));
  if (current && navMap[current]) navMap[current].classList.add('nav-active');
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ── Back to top ─────────────────────────────────── */
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Contact form demo ───────────────────────────── */
function setFormResponse(message, state = '') {
  if (!formResponse) return;

  formResponse.textContent = message;
  formResponse.classList.remove('is-success', 'is-error', 'is-loading');

  if (state) {
    formResponse.classList.add(`is-${state}`);
  }
}

function encodeFormData(formData) {
  return new URLSearchParams(formData).toString();
}

function getFormSuccessUrl() {
  if (!form) return '/gracias/';

  return form.dataset.successUrl || form.getAttribute('action') || '/gracias/';
}

if (form && formResponse) {
  const defaultButtonText = formSubmitButton ? formSubmitButton.textContent : '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);

    if (formSubmitButton) {
      formSubmitButton.disabled = true;
      formSubmitButton.textContent = 'Enviando...';
    }

    setFormResponse('Enviando solicitud...', 'loading');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: encodeFormData(formData),
      });

      if (!response.ok) {
        throw new Error('No fue posible enviar la solicitud.');
      }

      form.reset();
      setFormResponse('Solicitud enviada. Redirigiendo...', 'success');

      window.setTimeout(() => {
        window.location.assign(getFormSuccessUrl());
      }, 700);
    } catch (error) {
      setFormResponse('No se pudo enviar desde esta vista. En Netlify quedará activo al publicar el sitio.', 'error');
    } finally {
      if (formSubmitButton) {
        formSubmitButton.disabled = false;
        formSubmitButton.textContent = defaultButtonText;
      }
    }
  });
}