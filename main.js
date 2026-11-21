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

// Boutons : structure pour les animations de survol (libellé doublé, flèche)
document.querySelectorAll('.btn').forEach(btn => {
  const text = btn.textContent.trim();
  btn.innerHTML = '';
  const label = document.createElement('span'); label.className = 'btn-label';
  const t = document.createElement('span'); t.className = 't'; t.textContent = text; t.dataset.text = text;
  label.appendChild(t); btn.appendChild(label);
  btn.insertAdjacentHTML('beforeend', '<svg class="btn-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>');
  // Magnétique : le bouton suit légèrement le pointeur
  btn.addEventListener('pointermove', e => {
    if (document.documentElement.dataset.hover !== 'magnet' || e.pointerType !== 'mouse' || reduced) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
    btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
  });
  btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
});

// Sélecteur temporaire de l'animation de survol
const picker = document.getElementById('hoverPicker');
if (picker) {
  let saved = 'lift';
  try { saved = localStorage.getItem('nova-hover') || 'lift'; } catch (e) {}
  const apply = v => { document.documentElement.dataset.hover = v; };
  const input = picker.querySelector(`input[value="${saved}"]`);
  if (input) input.checked = true;
  apply(saved);
  picker.addEventListener('change', e => {
    apply(e.target.value);
    try { localStorage.setItem('nova-hover', e.target.value); } catch (err) {}
  });
  picker.addEventListener('submit', e => e.preventDefault());
}
