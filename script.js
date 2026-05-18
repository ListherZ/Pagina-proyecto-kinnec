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
/* --------------------------------------------------
   KINECT INTERFACE PAGE
-------------------------------------------------- */
(function () {
  const cameraCanvases = Array.from(document.querySelectorAll('[data-kinect-camera]'));
  const calibrationCanvases = Array.from(document.querySelectorAll('[data-kinect-calibration]'));
  const interactiveScreens = Array.from(document.querySelectorAll('[data-kinect-dwell-root]'));
  const screenSwitchers = Array.from(document.querySelectorAll('[data-screen-switcher]'));

  if (
    cameraCanvases.length === 0 &&
    calibrationCanvases.length === 0 &&
    interactiveScreens.length === 0 &&
    screenSwitchers.length === 0
  ) {
    return;
  }

  function getVersionCopy(root, version) {
    if (version === 2) {
      return {
        label: root.dataset.versionTwoLabel || 'Version 2',
        note: root.dataset.versionTwoNote || '',
      };
    }

    return {
      label: root.dataset.versionOneLabel || 'Version 1',
      note: root.dataset.versionOneNote || '',
    };
  }

  function renderScreenSwitcher(root) {
    const version = Number(root.dataset.screenVersion || '1') === 2 ? 2 : 1;
    const labelNode = root.querySelector('[data-screen-version-label]');
    const noteNode = root.querySelector('[data-screen-version-note]');
    const indexNode = root.querySelector('[data-screen-version-index]');
    const copy = getVersionCopy(root, version);

    root.dataset.screenVersion = String(version);

    if (indexNode) {
      indexNode.textContent = `${String(version).padStart(2, '0')} / 02`;
    }

    if (labelNode) {
      labelNode.textContent = copy.label;
    }

    if (noteNode) {
      noteNode.textContent = copy.note;
    }
  }

  function initScreenSwitcher(root) {
    renderScreenSwitcher(root);

    const buttons = Array.from(root.querySelectorAll('[data-screen-direction]'));
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const currentVersion = Number(root.dataset.screenVersion || '1') === 2 ? 2 : 1;
        let nextVersion = currentVersion + Number(button.dataset.screenDirection || '0');

        if (nextVersion > 2) {
          nextVersion = 1;
        }

        if (nextVersion < 1) {
          nextVersion = 2;
        }

        root.dataset.screenVersion = String(nextVersion);
        renderScreenSwitcher(root);
      });
    });
  }

  function drawStaticCamera(canvas) {
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const glow = '#4cff97';
    const ink = '#8dffc0';

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#07100d';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(76, 255, 151, 0.14)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 18) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 18) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const joints = {
      head: { x: centerX, y: 34 },
      neck: { x: centerX, y: 55 },
      leftShoulder: { x: centerX - 20, y: 64 },
      rightShoulder: { x: centerX + 20, y: 64 },
      leftElbow: { x: centerX - 29, y: 86 },
      rightElbow: { x: centerX + 29, y: 86 },
      leftHand: { x: centerX - 34, y: 112 },
      rightHand: { x: centerX + 34, y: 112 },
      torso: { x: centerX, y: 96 },
      leftHip: { x: centerX - 12, y: 114 },
      rightHip: { x: centerX + 12, y: 114 },
      leftKnee: { x: centerX - 17, y: 145 },
      rightKnee: { x: centerX + 17, y: 145 },
      leftFoot: { x: centerX - 22, y: 170 },
      rightFoot: { x: centerX + 22, y: 170 },
    };

    const bones = [
      ['head', 'neck'],
      ['neck', 'leftShoulder'],
      ['neck', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftHand'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightHand'],
      ['neck', 'torso'],
      ['torso', 'leftHip'],
      ['torso', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftFoot'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightFoot'],
    ];

    context.strokeStyle = 'rgba(76, 255, 151, 0.18)';
    context.lineWidth = 8;
    context.lineCap = 'round';
    bones.forEach(([from, to]) => {
      context.beginPath();
      context.moveTo(joints[from].x, joints[from].y);
      context.lineTo(joints[to].x, joints[to].y);
      context.stroke();
    });

    context.strokeStyle = glow;
    context.lineWidth = 2.4;
    bones.forEach(([from, to]) => {
      context.beginPath();
      context.moveTo(joints[from].x, joints[from].y);
      context.lineTo(joints[to].x, joints[to].y);
      context.stroke();
    });

    Object.values(joints).forEach((joint) => {
      context.beginPath();
      context.arc(joint.x, joint.y, 5, 0, Math.PI * 2);
      context.fillStyle = 'rgba(76, 255, 151, 0.18)';
      context.fill();

      context.beginPath();
      context.arc(joint.x, joint.y, 2.4, 0, Math.PI * 2);
      context.fillStyle = ink;
      context.fill();
    });

    context.beginPath();
    context.arc(joints.head.x, joints.head.y, 11, 0, Math.PI * 2);
    context.strokeStyle = glow;
    context.lineWidth = 2.2;
    context.stroke();

    context.strokeStyle = 'rgba(76, 255, 151, 0.42)';
    context.strokeRect(18, 18, width - 36, height - 36);

    context.font = '700 10px "Barlow Semi Condensed", monospace';
    context.fillStyle = glow;
    context.fillText('TRACKING LOCK', 16, height - 16);
  }

  function drawCalibrationCamera(canvas) {
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const glow = '#4cff97';
    const glowSoft = 'rgba(76, 255, 151, 0.18)';
    const frameInsetX = width * 0.18;
    const frameInsetY = height * 0.1;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#07100d';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(76, 255, 151, 0.1)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 28) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 28) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.strokeStyle = 'rgba(76, 255, 151, 0.32)';
    context.lineWidth = 2;
    context.strokeRect(frameInsetX, frameInsetY, width - frameInsetX * 2, height - frameInsetY * 2);

    context.beginPath();
    context.moveTo(centerX, frameInsetY);
    context.lineTo(centerX, height - frameInsetY);
    context.strokeStyle = 'rgba(76, 255, 151, 0.14)';
    context.stroke();

    context.beginPath();
    context.moveTo(frameInsetX, height - frameInsetY - 28);
    context.lineTo(width - frameInsetX, height - frameInsetY - 28);
    context.stroke();

    const joints = {
      head: { x: centerX, y: centerY - 138 },
      neck: { x: centerX, y: centerY - 98 },
      leftShoulder: { x: centerX - 54, y: centerY - 78 },
      rightShoulder: { x: centerX + 54, y: centerY - 78 },
      leftElbow: { x: centerX - 86, y: centerY - 8 },
      rightElbow: { x: centerX + 86, y: centerY - 8 },
      leftHand: { x: centerX - 98, y: centerY + 66 },
      rightHand: { x: centerX + 98, y: centerY + 66 },
      torso: { x: centerX, y: centerY - 8 },
      leftHip: { x: centerX - 32, y: centerY + 48 },
      rightHip: { x: centerX + 32, y: centerY + 48 },
      leftKnee: { x: centerX - 42, y: centerY + 146 },
      rightKnee: { x: centerX + 42, y: centerY + 146 },
      leftFoot: { x: centerX - 56, y: centerY + 232 },
      rightFoot: { x: centerX + 56, y: centerY + 232 },
    };

    const bones = [
      ['head', 'neck'],
      ['neck', 'leftShoulder'],
      ['neck', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftHand'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightHand'],
      ['neck', 'torso'],
      ['torso', 'leftHip'],
      ['torso', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftFoot'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightFoot'],
    ];

    context.strokeStyle = glowSoft;
    context.lineWidth = 16;
    context.lineCap = 'round';
    bones.forEach(([from, to]) => {
      context.beginPath();
      context.moveTo(joints[from].x, joints[from].y);
      context.lineTo(joints[to].x, joints[to].y);
      context.stroke();
    });

    context.strokeStyle = glow;
    context.lineWidth = 5;
    bones.forEach(([from, to]) => {
      context.beginPath();
      context.moveTo(joints[from].x, joints[from].y);
      context.lineTo(joints[to].x, joints[to].y);
      context.stroke();
    });

    Object.values(joints).forEach((joint) => {
      context.beginPath();
      context.arc(joint.x, joint.y, 8, 0, Math.PI * 2);
      context.fillStyle = 'rgba(76, 255, 151, 0.15)';
      context.fill();

      context.beginPath();
      context.arc(joint.x, joint.y, 3.4, 0, Math.PI * 2);
      context.fillStyle = '#8dffc0';
      context.fill();
    });

    context.beginPath();
    context.arc(joints.head.x, joints.head.y, 24, 0, Math.PI * 2);
    context.strokeStyle = glow;
    context.lineWidth = 4;
    context.stroke();

    context.font = '700 14px "Barlow Semi Condensed", monospace';
    context.fillStyle = glow;
    context.fillText('TRACKING ALIGNMENT', 24, 28);
    context.fillText('BODY CENTERED', width - 168, 28);
  }

  function navigateToTarget(item) {
    const selector = item.dataset.kinectTarget;
    if (!selector) {
      return;
    }

    const target = document.querySelector(selector);
    if (!target) {
      return;
    }

    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
  }

  function initInteractiveScreen(root) {
    const trackArea = root.querySelector('[data-kinect-track-area]') || root;
    const cursor = root.querySelector('.kinect-hand-cursor');
    const targets = Array.from(root.querySelectorAll('[data-kinect-selectable]'));
    const statusNode = root.querySelector('[data-kinect-status]');

    if (!cursor || targets.length === 0) {
      return;
    }

    const prefix = statusNode ? statusNode.dataset.prefix || '' : '';
    const dwellTime = 1500;

    let activeItem = null;
    let dwellTarget = null;
    let dwellStart = 0;
    let dwellInterval = null;

    function getLabel(item) {
      return item.dataset.kinectLabel || item.textContent.trim();
    }

    function setStatus(label) {
      if (statusNode) {
        statusNode.textContent = prefix + label;
      }
    }

    function setFillWidth(item, width) {
      const fill = item.querySelector('.kinect-dwell-fill');
      if (fill) {
        fill.style.width = width;
      }
    }

    function clearDwell() {
      targets.forEach((item) => {
        item.classList.remove('kinect-hovered');
        setFillWidth(item, item === activeItem ? '100%' : '0%');
      });

      dwellTarget = null;
      dwellStart = 0;

      if (dwellInterval) {
        window.clearInterval(dwellInterval);
        dwellInterval = null;
      }
    }

    function showFeedback(item) {
      const current = item.querySelector('.kinect-selected-label');
      if (current) {
        current.remove();
      }

      const label = document.createElement('div');
      label.className = 'kinect-selected-label';
      label.textContent = getLabel(item);
      item.appendChild(label);

      window.setTimeout(() => {
        label.remove();
      }, 1100);
    }

    function activate(item, showToast) {
      if (activeItem && activeItem !== item) {
        activeItem.classList.remove('kinect-active');
        setFillWidth(activeItem, '0%');
      }

      activeItem = item;
      activeItem.classList.add('kinect-active');
      setFillWidth(activeItem, '100%');
      setStatus(getLabel(activeItem));

      if (showToast) {
        showFeedback(activeItem);
        navigateToTarget(activeItem);
      }
    }

    function startDwell(item) {
      if (item === activeItem || item === dwellTarget) {
        return;
      }

      clearDwell();
      dwellTarget = item;
      dwellStart = performance.now();
      item.classList.add('kinect-hovered');

      dwellInterval = window.setInterval(() => {
        const elapsed = performance.now() - dwellStart;
        const progress = Math.min((elapsed / dwellTime) * 100, 100);
        setFillWidth(item, progress + '%');

        if (elapsed >= dwellTime) {
          window.clearInterval(dwellInterval);
          dwellInterval = null;
          activate(item, true);
          clearDwell();
        }
      }, 16);
    }

    function onMove(event) {
      const rootBounds = root.getBoundingClientRect();
      cursor.style.left = event.clientX - rootBounds.left + 'px';
      cursor.style.top = event.clientY - rootBounds.top + 'px';
      cursor.classList.add('visible');

      const target = event.target.closest('[data-kinect-selectable]');
      if (!target) {
        clearDwell();
        return;
      }

      startDwell(target);
    }

    function onLeave() {
      cursor.classList.remove('visible');
      clearDwell();
    }

    const defaultItem = targets.find((item) => item.dataset.default === 'true') || targets[0];
    activate(defaultItem, false);

    targets.forEach((target) => {
      target.addEventListener('click', () => {
        activate(target, true);
      });
    });

    trackArea.addEventListener('mousemove', onMove);
    trackArea.addEventListener('mouseleave', onLeave);
  }

  screenSwitchers.forEach(initScreenSwitcher);
  cameraCanvases.forEach(drawStaticCamera);
  calibrationCanvases.forEach(drawCalibrationCamera);
  interactiveScreens.forEach(initInteractiveScreen);
}());
