// Menú de accesibilidad: tamaño de texto, contraste, color, lectura y movimiento.
// Las preferencias se guardan en el navegador y se aplican como clases sobre <html>.
const CLAVE = 'impulsa_accesibilidad';
const TAMANOS = [1, 1.12, 1.25, 1.4];
const OPCIONES = [
  ['contraste', 'Alto contraste', 'Textos más oscuros y bordes marcados', '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor"/>'],
  ['grises', 'Escala de grises', 'Quita los colores de la página', '<path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"/>'],
  ['legible', 'Letra fácil de leer', 'Tipografía simple y más espacio entre letras', '<path d="M4 19 10 5l6 14M6.5 14h7M18 10v9M21 13a3 3 0 0 0-6 0v3a3 3 0 0 0 6 0"/>'],
  ['enlaces', 'Resaltar enlaces', 'Subraya todo lo que se puede tocar', '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'],
  ['quieto', 'Detener animaciones', 'Sin movimiento ni transiciones', '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'],
  ['cursor', 'Cursor grande', 'Puntero más fácil de ubicar', '<path d="m5 3 14 7-6 2-2 6Z"/>'],
  ['guia', 'Guía de lectura', 'Una línea sigue el puntero para no perder el renglón', '<path d="M3 12h18M6 7h12M6 17h12"/>'],
];
const ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.6" r="1.9" fill="currentColor" stroke="none"/><path d="M4 8.6c5.2 1.5 10.8 1.5 16 0M12 9.7V15M12 15l-3.4 6M12 15l3.4 6"/></svg>';

let prefs = { tam: 0 };
try { prefs = { tam: 0, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }; } catch { /* sin preferencias guardadas */ }
if (!('quieto' in prefs) && matchMedia('(prefers-reduced-motion: reduce)').matches) prefs.quieto = true;

const raiz = document.documentElement;
function aplicar() {
  for (const [id] of OPCIONES) raiz.classList.toggle('a11y-' + id, !!prefs[id]);
  raiz.style.setProperty('--a11y-zoom', TAMANOS[prefs.tam] || 1);
  try { localStorage.setItem(CLAVE, JSON.stringify(prefs)); } catch { /* modo privado */ }
}

const caja = document.createElement('div');
caja.id = 'a11y';
caja.innerHTML = `
  <button id="a11y-btn" type="button" aria-label="Opciones de accesibilidad" aria-expanded="false" aria-controls="a11y-panel" title="Accesibilidad">${ICONO}</button>
  <section id="a11y-panel" role="dialog" aria-label="Opciones de accesibilidad" hidden>
    <header><h2>Accesibilidad</h2><button type="button" id="a11y-cerrar" aria-label="Cerrar opciones de accesibilidad">✕</button></header>
    <div class="a11y-tam"><span id="a11y-tam-t">Tamaño del texto</span>
      <div role="group" aria-labelledby="a11y-tam-t"><button type="button" data-tam="-1" aria-label="Reducir texto">A−</button><output id="a11y-pct" aria-live="polite">100%</output><button type="button" data-tam="1" aria-label="Aumentar texto">A+</button></div></div>
    <div class="a11y-lista">${OPCIONES.map(([id, nombre, ayuda, dibujo]) => `<button type="button" data-op="${id}" aria-pressed="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${dibujo}</svg>
      <span><b>${nombre}</b><small>${ayuda}</small></span><i aria-hidden="true"></i></button>`).join('')}</div>
    <button type="button" id="a11y-reset">Restablecer todo</button>
  </section>`;
const guia = document.createElement('div');
guia.id = 'a11y-guia';
guia.setAttribute('aria-hidden', 'true');

const salto = document.createElement('a');
salto.id = 'a11y-salto';
salto.href = '#app';
salto.textContent = 'Saltar al contenido';
salto.addEventListener('click', ev => { ev.preventDefault(); const app = document.getElementById('app'); app.setAttribute('tabindex', '-1'); app.focus(); });

document.body.prepend(salto);
document.body.append(caja, guia);

const boton = caja.querySelector('#a11y-btn'), panel = caja.querySelector('#a11y-panel');
function pintar() {
  caja.querySelectorAll('[data-op]').forEach(b => b.setAttribute('aria-pressed', String(!!prefs[b.dataset.op])));
  caja.querySelector('#a11y-pct').textContent = Math.round((TAMANOS[prefs.tam] || 1) * 100) + '%';
  caja.querySelector('[data-tam="-1"]').disabled = prefs.tam <= 0;
  caja.querySelector('[data-tam="1"]').disabled = prefs.tam >= TAMANOS.length - 1;
  const activas = OPCIONES.filter(([id]) => prefs[id]).length + (prefs.tam ? 1 : 0);
  boton.classList.toggle('activo', activas > 0);
}
function abrir(si) {
  panel.hidden = !si;
  boton.setAttribute('aria-expanded', String(si));
  if (si) caja.querySelector('#a11y-cerrar').focus(); else boton.focus();
}

caja.addEventListener('click', ev => {
  ev.stopPropagation();
  const b = ev.target.closest('button');
  if (!b) return;
  if (b === boton) return abrir(panel.hidden);
  if (b.id === 'a11y-cerrar') return abrir(false);
  if (b.id === 'a11y-reset') prefs = { tam: 0, quieto: false };
  else if (b.dataset.op) prefs[b.dataset.op] = !prefs[b.dataset.op];
  else if (b.dataset.tam) prefs.tam = Math.max(0, Math.min(TAMANOS.length - 1, prefs.tam + Number(b.dataset.tam)));
  aplicar(); pintar();
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !panel.hidden) abrir(false); });
document.addEventListener('click', () => { if (!panel.hidden) { panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('mousemove', ev => { if (prefs.guia) guia.style.top = ev.clientY + 'px'; }, { passive: true });

// Cada vez que la app pinta una pantalla: las fotos decorativas no se anuncian y el foco vuelve al inicio.
document.addEventListener('pintado', () => {
  document.querySelectorAll('#app svg.ic').forEach(s => s.setAttribute('aria-hidden', 'true'));
  document.querySelectorAll('#app input:not([aria-label]), #app select:not([aria-label]), #app textarea:not([aria-label])').forEach(c => {
    const etq = c.closest('.campo')?.querySelector('label')?.textContent || c.placeholder;
    if (etq) c.setAttribute('aria-label', etq.replace('*', '').trim());
  });
});

aplicar(); pintar();
