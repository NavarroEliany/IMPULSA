// Impulsa · arranque, navegación y acciones comunes.
import { api, estado, cargarYo, cerrarSesion } from './api.js';
import { acciones, formularios, rutas, nucleo, ir } from './nucleo.js';
import { ic, esc, logo, avisar, abrirCapa, cerrarCapa, hace, iniciales, datosDe } from './ui.js';
import './publico.js';
import './cliente.js';
import './panel.js';
import './admin.js';
import './ia.js';
import './accesibilidad.js';

const app = document.getElementById('app');

// ---------- barras de navegación
export function navPublica() {
  return `<header class="nav">${logo()}<nav class="enlaces crece" style="justify-content:center">
    <a href="#/buscar">Explorar</a><a href="#/negocios">Emprendimientos</a><a href="#/armador">${ic('spark', '#EF5A2A', 'width:14px;height:14px;vertical-align:-2px')}<span>Armador de regalos</span></a><a href="#/registro?rol=emprendedor">Para emprendedores</a></nav>
    <a class="btn btn-g btn-s" href="#/entrar">Iniciar sesión</a><a class="btn btn-d btn-s" href="#/registro">Crear cuenta</a></header>`;
}
export function navApp(q = '') {
  const y = estado.yo, p = y.perfil, es = p.rol === 'emprendedor', ad = p.rol === 'admin', h = location.hash;
  const en = (ruta, icono, texto) => `<a href="${ruta}" class="${h.startsWith(ruta) ? 'on' : ''}">${ic(icono)}<span>${texto}</span></a>`;
  return `<header class="nav">${logo(false, ad ? '#/admin' : es ? '#/panel' : '#/inicio')}
    <form class="buscador" data-f="buscar">${ic('spark', '#F4B73F')}<input name="q" value="${esc(q)}" placeholder="Pregúntale a Impulsa: “torta para 15 personas el sábado”…" autocomplete="off"><button type="button" class="cam" data-a="foto" aria-label="Buscar con una foto" title="Buscar con una foto">${ic('camera')}</button><button aria-label="Buscar">${ic('arrow', '#fff')}</button></form>
    <nav class="enlaces tabbar">${en('#/buscar', 'compass', 'Explorar')}${ad ? en('#/admin', 'shield', 'Administración') : es ? en('#/panel', 'chart', 'Mi panel') : en('#/armador', 'gift', 'Regalos IA') + en('#/calendario', 'cal', 'Calendario') + en('#/favoritos', 'heart', 'Favoritos')}</nav>
    <button class="redondo" data-a="notis" aria-label="Notificaciones">${ic('bell')}${y.sin_leer ? `<span class="punto">${y.sin_leer}</span>` : ''}</button>
    <div style="position:relative"><button class="avatar" data-a="menu" style="${p.avatar_url ? `background-image:url('${esc(p.avatar_url)}')` : ''}">${p.avatar_url ? '' : iniciales(p.nombre + ' ' + p.apellido)}</button>
      <div class="menu oculto" id="menu"><div style="padding:10px 12px"><b>${esc(p.nombre)} ${esc(p.apellido)}</b><div class="min sua">${esc(p.email)}</div></div>
      ${ad ? `<a href="#/admin">${ic('shield')}Administración</a><a href="#/admin/cuenta">${ic('key')}Mi cuenta</a>` : es ? `<a href="#/panel">${ic('chart')}Mi panel</a><a href="#/panel/negocio">${ic('store')}Mi negocio</a>` : `<a href="#/perfil">${ic('user')}Mi perfil y gustos</a><a href="#/calendario">${ic('cal')}Mi calendario</a>`}
      <button data-a="salir">${ic('salir')}Cerrar sesión</button></div></div></header>`;
}
export const conNav = (html, q) => (estado.yo ? navApp(q) : navPublica()) + html;

// ---------- enrutador
async function pintar() {
  cerrarCapa();
  const [camino, consulta = ''] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(consulta);
  nucleo.consulta = () => q;
  for (const [exp, fn] of rutas) {
    const m = camino.match(exp);
    if (!m) continue;
    try {
      const html = await fn(m.slice(1).map(decodeURIComponent), q);
      if (html == null) return;                     // la ruta redirigió
      app.innerHTML = html;
      if (!q.get('mantener')) window.scrollTo(0, 0);
      document.dispatchEvent(new CustomEvent('pintado'));
    } catch (e) {
      app.innerHTML = conNav(`<div class="wrap" style="padding-top:80px"><div class="vacio card"><div style="font-size:44px">😕</div><h3 class="d4" style="color:var(--ink)">No pudimos cargar esta página</h3><p>${esc(e.message)}</p><button class="btn btn-p" data-a="reintentar">Reintentar</button></div></div>`);
    }
    return;
  }
  ir('#/');
}
nucleo.repintar = pintar;
acciones.reintentar = pintar;

// ---------- acciones comunes
const exigirSesion = () => { if (estado.yo) return true; avisar('Inicia sesión o crea tu cuenta para continuar'); ir('#/entrar'); return false; };

acciones.fav = async el => {
  if (!exigirSesion()) return;
  const r = await api('/favoritos/' + el.dataset.id, { metodo: 'POST' });
  r.activo ? estado.favs.add(el.dataset.id) : estado.favs.delete(el.dataset.id);
  document.querySelectorAll(`[data-a="fav"][data-id="${el.dataset.id}"]`).forEach(b => b.classList.toggle('on', r.activo));
  avisar(r.activo ? 'Guardado en tus favoritos' : 'Quitado de favoritos');
};
acciones.alerta = async el => {
  if (!exigirSesion()) return;
  const r = await api('/alertas/' + el.dataset.id, { metodo: 'POST' });
  avisar(r.activo ? 'Listo. Te avisamos apenas vuelva a estar disponible' : 'Ya no te avisaremos de este producto');
  if (el.dataset.repinta) pintar();
};
acciones.wa = async el => {
  const v = window.open('', '_blank');   // se abre ya, antes de esperar a la API, para que el navegador no la bloquee
  try {
    const r = await api('/contactos', { metodo: 'POST', cuerpo: { producto_id: el.dataset.prod || null, emprendimiento_id: el.dataset.emp || null,
      origen: el.dataset.origen || 'perfil', cantidad: Number(el.dataset.cant || 1), nota: el.dataset.nota || null } });
    if (v) v.location = r.url; else location.href = r.url;
  } catch (e) { if (v) v.close(); avisar(e.message, true); }
};
acciones.menu = () => document.getElementById('menu')?.classList.toggle('oculto');
acciones.salir = () => { cerrarSesion(); ir('#/'); avisar('Sesión cerrada'); };
acciones.cerrar = cerrarCapa;
acciones.notis = async () => {
  const lista = await api('/notificaciones');
  const icono = { promo: 'tag', disponible: 'refresh', recordatorio: 'gift', pedido: 'msg', resena: 'staro', stock: 'bell', nuevo: 'spark' };
  abrirCapa(`<aside class="cajon"><div class="row entre" style="padding:24px 22px 14px"><h3 class="d4">Notificaciones</h3><button class="redondo" data-a="cerrar">${ic('x')}</button></div>
    <div style="overflow:auto;flex:1">${lista.length ? lista.map(n => `<a class="noti ${n.leida ? '' : 'nueva'}" href="${esc(n.enlace || '#/')}" data-a="cerrar-ir">
      <div class="th" style="${n.imagen_url ? `background-image:url('${esc(n.imagen_url)}')` : ''}">${n.imagen_url ? '' : ic(icono[n.tipo] || 'bell', '#C8431B')}</div>
      <div class="crece col g4"><div class="row g6"><b class="crece" style="font-size:14px">${esc(n.titulo)}</b>${n.leida ? '' : '<span style="width:8px;height:8px;border-radius:50%;background:var(--brasa)"></span>'}</div>
      <span class="peq" style="color:var(--char)">${esc(n.mensaje)}</span><span class="min sua">${hace(n.creado_en)}</span></div></a>`).join('')
      : '<div class="vacio"><div style="font-size:40px">🔔</div><p>Aquí verás promos de tus favoritos, recordatorios y avisos de disponibilidad.</p></div>'}</div></aside>`);
  if (estado.yo.sin_leer) { estado.yo.sin_leer = 0; document.querySelector('.punto')?.remove(); api('/notificaciones/leer', { metodo: 'POST' }).catch(() => {}); }
};
acciones['cerrar-ir'] = el => { cerrarCapa(); ir(el.getAttribute('href')); };
formularios.buscar = (f, d) => ir('#/buscar?q=' + encodeURIComponent(d.q.trim()));

// ---------- delegación de eventos
document.addEventListener('click', async ev => {
  const capa = document.getElementById('capa');
  if (ev.target === capa) return cerrarCapa();
  const el = ev.target.closest('[data-a]');
  if (!ev.target.closest('.avatar,#menu')) document.getElementById('menu')?.classList.add('oculto');
  if (!el) return;
  const fn = acciones[el.dataset.a];
  if (!fn) return;
  ev.preventDefault(); ev.stopPropagation();
  if (el.dataset.ocupado) return;
  el.dataset.ocupado = '1';
  try { await fn(el, ev); } catch (e) { avisar(e.message || 'Ocurrió un error', true); }
  delete el.dataset.ocupado;
});
document.addEventListener('submit', async ev => {
  const f = ev.target.closest('form[data-f]');
  if (!f) return;
  ev.preventDefault();
  const fn = formularios[f.dataset.f], boton = f.querySelector('button[type=submit],button:not([type])');
  if (!fn || f.dataset.ocupado) return;
  f.dataset.ocupado = '1'; if (boton) boton.disabled = true;
  f.querySelector('.error')?.remove();
  try { await fn(f, datosDe(f), ev); }
  catch (e) {
    const zona = f.querySelector('[data-error]');
    if (zona) zona.innerHTML = `<div class="error">${esc(e.message)}</div>`; else avisar(e.message, true);
  }
  delete f.dataset.ocupado; if (boton) boton.disabled = false;
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarCapa(); });
window.addEventListener('hashchange', pintar);

cargarYo().then(pintar);
