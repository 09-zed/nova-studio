const nav = document.getElementById('nav');
// Loader puis entrée du hero (le seul moment orchestré)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let started = false;
function start() {
  if (started) return; started = true;
  document.getElementById('loader').classList.add('done');
  document.documentElement.classList.add('ready');
}
addEventListener('load', () => setTimeout(start, reduced ? 0 : 250));
setTimeout(start, 2500); // filet de sécurité si une ressource traîne

// Menu mobile
const menuBtn = document.getElementById('menuBtn');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
  // Fermeture au clavier : instantanée (jamais d'animation sur une action clavier)
  nav.classList.add('instant'); setMenu(false); menuBtn.focus();
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove('instant')));
});

// Nav au scroll + lien actif
const links = [...document.querySelectorAll('.nav nav a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href')));
addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 20);
  let cur = -1;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
  links.forEach((a, i) => a.classList.toggle('active', i === cur));
}, { passive: true });

// Compteurs
const fmt = (n, dec) => n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function count(el) {
  const target = parseFloat(el.dataset.count), suffix = (el.dataset.suffix || '').replace(' ', '\u00a0');
  const dec = (el.dataset.count.split('.')[1] || '').length;
  if (reduced) { el.textContent = fmt(target, dec) + suffix; return; }
  const t0 = performance.now(), dur = 1200;
  const step = t => {
    const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * e, dec) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// Les chiffres comptent une seule fois quand la grille arrive à l'écran (valeurs finales déjà dans le HTML)
const stats = document.querySelector('.stats');
if (stats) new IntersectionObserver((es, o) => es.forEach(e => {
  if (!e.isIntersecting) return;
  stats.querySelectorAll('[data-count]').forEach(count); o.disconnect();
}), { threshold: 0.3 }).observe(stats);

// Tête qui surgit du bord quand la zone d'appel arrive
const peek = document.querySelector('.peek');
if (peek) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { peek.classList.add('in'); o.disconnect(); } }), { threshold: .6 }).observe(document.querySelector('.call'));

// Carrousel vidéos
const track = document.querySelector('.track');
const items = [...track.children];
const dots = document.querySelector('.dots');
items.forEach(() => dots.appendChild(document.createElement('i')));
const updateDots = () => {
  const i = Math.round(track.scrollLeft / (items[0].offsetWidth + 22));
  [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
};
track.addEventListener('scroll', updateDots, { passive: true });
updateDots();
document.querySelectorAll('.arrow').forEach(b => b.addEventListener('click', () =>
  track.scrollBy({ left: +b.dataset.dir * (items[0].offsetWidth + 22), behavior: reduced ? 'auto' : 'smooth' })));

// FAQ : une seule réponse ouverte à la fois
const faqs = document.querySelectorAll('.chat details');
faqs.forEach(d => d.addEventListener('toggle', () => { if (d.open) faqs.forEach(o => o !== d && (o.open = false)); }));

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
