const nav = document.getElementById('nav');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Images introuvables : on masque l'image ; les avatars reçoivent une initiale à la place
const FALLBACK_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#141c5c"/><text x="20" y="26" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#d8ff3c" text-anchor="middle">N</text></svg>');
function onImgFail(img) {
  if (img.matches('.avatar, .head') && !img.src.startsWith('data:')) { img.src = FALLBACK_AVATAR; return; }
  img.classList.add('img-fail');
}
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => onImgFail(img));
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) onImgFail(img);
});

// Entrée de la bannière (le seul moment orchestré) : dès que les polices sont prêtes, sans écran de chargement
let started = false;
function start() { if (!started) { started = true; document.documentElement.classList.add('ready'); } }
(document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
setTimeout(start, 600); // filet de sécurité si une police traîne

// Menu mobile
const menuBtn = document.getElementById('menuBtn');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  if (open) nav.classList.remove('is-hidden');
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
  // Fermeture au clavier : instantanée (jamais d'animation sur une action clavier)
  nav.classList.add('instant'); setMenu(false); menuBtn.focus();
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('instant')));
});

// Barre de navigation : remonte hors de l'écran quand on descend, revient dès qu'on remonte
const links = [...document.querySelectorAll('.nav nav a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href')));
let lastY = scrollY, ticking = false;
function onScroll() {
  const y = scrollY, delta = y - lastY;
  nav.classList.toggle('scrolled', y > 20);
  const keepVisible = y < 120 || nav.classList.contains('open') || nav.contains(document.activeElement);
  if (keepVisible || delta < -6) nav.classList.remove('is-hidden');
  else if (delta > 6) nav.classList.add('is-hidden');
  if (Math.abs(delta) > 6 || keepVisible) lastY = y;
  let cur = -1;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
  links.forEach((a, i) => a.classList.toggle('active', i === cur));
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

// Tête qui surgit du bord quand la zone d'appel arrive
const peek = document.querySelector('.peek');
const call = document.querySelector('.call');
if (peek && call) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { peek.classList.add('in'); o.disconnect(); } }), { threshold: .6 }).observe(call);

// Blocs sans contenu : on les masque plutôt que d'afficher un titre au-dessus du vide
const stats = document.querySelector('.stats');
if (stats && !stats.children.length) stats.classList.add('is-empty');
const chatItems = document.querySelectorAll('.chat details');
if (!chatItems.length) document.getElementById('faq')?.classList.add('is-empty');

// Carrousel vidéos
const carousel = document.getElementById('carousel');
const track = carousel?.querySelector('.track');
const items = track ? [...track.children] : [];
if (!items.length) {
  carousel?.classList.add('is-empty');
  document.querySelector('.videos-title')?.classList.add('is-empty');
} else {
  if (items.length < 2) carousel.classList.add('single');
  const step = () => items[0].offsetWidth + 22;
  const dots = carousel.querySelector('.dots');
  items.forEach(() => dots.appendChild(document.createElement('i')));
  const updateDots = () => {
    const i = Math.round(track.scrollLeft / step());
    [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
  };
  track.addEventListener('scroll', updateDots, { passive: true });
  updateDots();
  carousel.querySelectorAll('.arrow').forEach(b => b.addEventListener('click', () =>
    track.scrollBy({ left: +b.dataset.dir * step(), behavior: reduced ? 'auto' : 'smooth' })));
}

// FAQ : une seule réponse ouverte à la fois
chatItems.forEach(d => d.addEventListener('toggle', () => { if (d.open) chatItems.forEach(o => o !== d && (o.open = false)); }));

// Boutons : le remplissage part du point d'entrée de la souris et se referme vers le point de sortie
function setOrigin(btn, e) {
  const r = btn.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
  btn.style.setProperty('--x', x.toFixed(1) + 'px');
  btn.style.setProperty('--y', y.toFixed(1) + 'px');
  btn.style.setProperty('--r', Math.ceil(radius) + 1 + 'px');
}
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setOrigin(btn, e); });
  btn.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setOrigin(btn, e); });
});
