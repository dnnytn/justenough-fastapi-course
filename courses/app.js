'use strict';

// ── Element refs ──────────────────────────────────────────
const html       = document.documentElement;
const layout     = document.getElementById('layout');
const tocNav     = document.getElementById('toc-nav');
const tocToggle  = document.getElementById('toc-toggle');
const themeBtn   = document.getElementById('theme-btn');
const faDown     = document.getElementById('fa-down');
const faUp       = document.getElementById('fa-up');
const prevBtn    = document.getElementById('snav-prev');
const nextBtn    = document.getElementById('snav-next');
const slideCur   = document.getElementById('slide-cur');
const slideTotal = document.getElementById('slide-total');
const dotsWrap   = document.getElementById('snav-dots');

const sections = [...document.querySelectorAll('.section[id]')];
const quizzes  = [...document.querySelectorAll('.quiz')];
const tocLinks = [...document.querySelectorAll('.toc-list a')];

// ── Slide navigation ──────────────────────────────────────
let curIdx = 0;

function goTo(newIdx, back = false) {
  if (newIdx < 0 || newIdx >= sections.length || newIdx === curIdx) return;

  // Outgoing: remove state from current section + quiz
  sections[curIdx].classList.remove('active', 'going-back');
  if (quizzes[curIdx]) quizzes[curIdx].classList.remove('active', 'going-back');

  // Incoming: animate the target section + quiz
  if (back) {
    sections[newIdx].classList.add('going-back');
    if (quizzes[newIdx]) quizzes[newIdx].classList.add('going-back');
  }
  sections[newIdx].classList.add('active');
  if (quizzes[newIdx]) quizzes[newIdx].classList.add('active');

  curIdx = newIdx;
  updateNav();
  window.scrollTo({ top: 0, behavior: 'instant' });
  history.replaceState(null, '', '#' + sections[newIdx].id);
}

function updateNav() {
  prevBtn.disabled = curIdx === 0;
  nextBtn.disabled = curIdx === sections.length - 1;
  slideCur.textContent = curIdx + 1;

  dotsWrap.querySelectorAll('.snav-dot').forEach((d, i) =>
    d.classList.toggle('active', i === curIdx));

  tocLinks.forEach((a, i) =>
    a.classList.toggle('active', i === curIdx));
}

// Build progress dots
sections.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'snav-dot';
  dot.setAttribute('aria-label', `Go to section ${i + 1}`);
  dot.addEventListener('click', () => goTo(i, i < curIdx));
  dotsWrap.appendChild(dot);
});

slideTotal.textContent = sections.length;

// Prev / Next buttons
prevBtn.addEventListener('click', () => goTo(curIdx - 1, true));
nextBtn.addEventListener('click', () => goTo(curIdx + 1, false));

// TOC link clicks
tocLinks.forEach((a, i) => {
  a.addEventListener('click', e => {
    e.preventDefault();
    goTo(i, i < curIdx);
    if (isMobile()) setMobileOpen(false);
  });
});

// Keyboard navigation (arrow keys, skip if focus is on a control)
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(curIdx + 1, false);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(curIdx - 1, true);
});

// Touch swipe
let touchStartX = null;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', e => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) < 50) return;
  if (dx < 0) goTo(curIdx + 1, false);
  else         goTo(curIdx - 1, true);
});

// Restore from URL hash on load, then initialise
function restoreSlide() {
  const hash     = location.hash.slice(1);
  const hashIdx  = sections.findIndex(s => s.id === hash);
  curIdx = hashIdx >= 0 ? hashIdx : 0;
  sections[curIdx].classList.add('active');
  if (quizzes[curIdx]) quizzes[curIdx].classList.add('active');
  updateNav();
}

// ── TOC sidebar ───────────────────────────────────────────
function isMobile() { return window.innerWidth <= 640; }

function setCollapsed(collapsed) {
  layout.classList.toggle('toc-collapsed', collapsed);
  tocToggle.setAttribute('aria-expanded', String(!collapsed));
  tocToggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  try { localStorage.setItem('tocCollapsed', collapsed ? '1' : '0'); } catch (e) {}
}

function setMobileOpen(open) {
  tocNav.classList.toggle('mobile-open', open);
  tocToggle.setAttribute('aria-expanded', String(open));
  tocToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

tocToggle.addEventListener('click', () => {
  if (isMobile()) {
    setMobileOpen(!tocNav.classList.contains('mobile-open'));
  } else {
    setCollapsed(!layout.classList.contains('toc-collapsed'));
  }
});

if (!isMobile() && localStorage.getItem('tocCollapsed') === '1') setCollapsed(true);

// ── Theme ─────────────────────────────────────────────────
function setTheme(t) {
  html.setAttribute('data-theme', t);
  themeBtn.textContent = t === 'dark' ? '☀' : '☾';
  themeBtn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`);
  try { localStorage.setItem('theme', t); } catch (e) {}
}

themeBtn.addEventListener('click', () =>
  setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

const savedTheme = localStorage.getItem('theme');
if (savedTheme) setTheme(savedTheme);

// ── Font adjuster ─────────────────────────────────────────
const FA_LEVELS = ['sm', '', 'lg', 'xl'];
let faIdx = 1;

function setFs(idx) {
  faIdx = Math.max(0, Math.min(idx, FA_LEVELS.length - 1));
  const val = FA_LEVELS[faIdx];
  if (val) html.setAttribute('data-fs', val);
  else     html.removeAttribute('data-fs');
  faDown.disabled = faIdx === 0;
  faUp.disabled   = faIdx === FA_LEVELS.length - 1;
  try { localStorage.setItem('fs', faIdx); } catch (e) {}
}

faDown.addEventListener('click', () => setFs(faIdx - 1));
faUp.addEventListener('click',   () => setFs(faIdx + 1));

const savedFs = parseInt(localStorage.getItem('fs') ?? '1', 10);
setFs(isNaN(savedFs) ? 1 : savedFs);

// ── Copy buttons ──────────────────────────────────────────
document.querySelectorAll('pre').forEach(pre => {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'copy';
  btn.setAttribute('aria-label', 'Copy code');
  btn.addEventListener('click', () => {
    const code = pre.querySelector('code');
    navigator.clipboard.writeText((code || pre).innerText).then(() => {
      btn.textContent = 'copied!';
      setTimeout(() => { btn.textContent = 'copy'; }, 2000);
    }).catch(() => {
      const range = document.createRange();
      range.selectNodeContents(code || pre);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  });
  pre.appendChild(btn);
});

// ── Quiz ──────────────────────────────────────────────────
document.querySelectorAll('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', function () {
    if (this.disabled) return;
    const q = this.closest('.quiz-q');
    q.querySelectorAll('.quiz-opt').forEach(o => {
      o.disabled = true;
      if (o.dataset.correct === 'true') {
        o.classList.add(o === this ? 'correct' : 'reveal');
      } else if (o === this) {
        o.classList.add('wrong');
      }
    });
  });
});

// ── Init ──────────────────────────────────────────────────
restoreSlide();
