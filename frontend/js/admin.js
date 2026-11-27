// Panel del administrador: cifras de la plataforma, usuarios, negocios, productos, reseñas, contenido y anuncios.
import { api, estado, entrar } from './api.js';
import { acciones, formularios, ruta, ir, nucleo } from './nucleo.js';
import { ic, esc, pesos, num, hace, mesN, iniciales, logo, estrellas, avisar, vacio, campo, formClave } from './ui.js';

function permitido() {
  if (!estado.yo) { ir('#/entrar'); return false; }
  if (estado.yo.perfil.rol !== 'admin') { ir('#/'); return false; }
  return true;
}

function marco(activo, html) {
  const p = estado.yo.perfil;
  const en = (r, icono, t) => `<a href="${r}" class="${activo === r ? 'on' : ''}">${ic(icono)}<span>${t}</span></a>`;
  return `<div class="panel"><aside class="lateral admin">${logo(true, '#/admin')}<span class="etq-admin solo-g">ADMINISTRACIÓN</span>
    <nav class="col" style="gap:2px">${en('#/admin', 'home', 'Resumen')}${en('#/admin/usuarios', 'users', 'Usuarios')}${en('#/admin/negocios', 'store', 'Negocios')}
      ${en('#/admin/productos', 'pkg', 'Productos')}${en('#/admin/resenas', 'staro', 'Reseñas')}${en('#/admin/contenido', 'sliders', 'Categorías y fechas')}
      ${en('#/admin/anuncios', 'mega', 'Anuncios')}${en('#/admin/cuenta', 'key', 'Mi cuenta')}<a href="#/">${ic('compass')}<span>Ver la página</span></a></nav>
    <div class="crece solo-g"></div>
    <div class="row g10 solo-g"><span class="avatar" style="background:#2F6FED;color:#fff;width:38px;height:38px;font-size:13px">${iniciales(p.nombre + ' ' + p.apellido)}</span>
      <span class="crece peq" style="color:var(--cream)">${esc(p.nombre)} ${esc(p.apellido)}<br><span class="min" style="color:var(--sand)">${esc(p.email)}</span></span>
      <button class="redondo" style="background:none;border-color:var(--char);width:38px;height:38px" data-a="salir" aria-label="Cerrar sesión">${ic('salir', '#E7DDD0')}</button></div>
  </aside><main class="principal">${html}</main></div>`;
}
const titulo = (t, sub, extra = '') => `<div class="row entre fin envuelve g16"><div class="col g6"><h1 class="d2" style="font-size:clamp(30px,3.4vw,42px)">${t}</h1>${sub ? `<span class="sua">${sub}</span>` : ''}</div><div class="row g10 envuelve">${extra}</div></div>`;
const chipF = (href, texto, on) => `<a class="pill ${on ? 'on' : ''}" href="${href}">${texto}</a>`;
const buscador = (base, q, ph) => `<form data-f="admin-buscar" data-base="${base}"><input name="q" value="${esc(q || '')}" placeholder="${ph}"><button class="btn btn-d btn-s">${ic('search', '#fff')}Buscar</button></form>`;
const qs = o => Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
const ROLES = { cliente: 'Cliente', emprendedor: 'Negocio', admin: 'Administrador' };

formularios['admin-buscar'] = (f, d) => {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  q.set('q', d.q.trim()); if (!d.q.trim()) q.delete('q');
  ir(f.dataset.base + (q.toString() ? '?' + q : ''));
};

// ---------- resumen
ruta('/admin', async () => {
  if (!permitido()) return null;
  const d = await api('/admin/resumen'), u = d.usuarios, n = d.negocios, pr = d.productos, rs = d.resenas;
  const var30 = d.contactos_prev_30 ? Math.round((d.contactos_30 - d.contactos_prev_30) * 100 / d.contactos_prev_30) : null;
  const kpi = (t, icono, v, sub, osc) => `<div class="card kpi ${osc ? 'oscura' : ''}"><span class="row g8 peq neg ${osc ? '' : 'sua'}" ${osc ? 'style="color:var(--sand)"' : ''}>${ic(icono)}${t}</span><b>${v}</b><span class="peq ${osc ? '' : 'sua'}" ${osc ? 'style="color:var(--sand)"' : ''}>${sub}</span></div>`;
  const maxMes = Math.max(1, ...d.por_mes.map(m => m.contactos));
  const maxCat = Math.max(1, ...d.categorias.map(c => c.productos));
  const pendientes = [
    n.sin_verificar && [`${n.sin_verificar} ${n.sin_verificar === 1 ? 'negocio espera' : 'negocios esperan'} verificación`, 'Revisa sus datos y dales la insignia.', '#/admin/negocios?estado=sin_verificar', 'store'],
    rs.bajas && [`${rs.bajas} ${rs.bajas === 1 ? 'reseña' : 'reseñas'} de 1 o 2 estrellas`, 'Mira si alguna es ofensiva o falsa.', '#/admin/resenas?max=2', 'staro'],
    n.sin_productos && [`${n.sin_productos} ${n.sin_productos === 1 ? 'negocio' : 'negocios'} sin productos`, 'Escríbeles para que completen su vitrina.', '#/admin/negocios', 'pkg'],
    d.suspendidos && [`${d.suspendidos} ${d.suspendidos === 1 ? 'cuenta suspendida' : 'cuentas suspendidas'}`, 'Puedes reactivarlas desde Usuarios.', '#/admin/usuarios', 'ban'],
  ].filter(Boolean);
  return marco('#/admin', `${titulo(`Hola, ${esc(estado.yo.perfil.nombre)}.<br><span class="serif">así va Impulsa.</span>`, 'Cifras de toda la plataforma', `<a class="btn btn-p" href="#/admin/anuncios">${ic('mega', '#fff')}Enviar anuncio</a>`)}
    <div class="grid c4" style="gap:16px">
      ${kpi('Usuarios', 'users', u.total.toLocaleString('es-CO'), `${u.clientes} clientes · ${u.emprendedores} negocios · +${u.nuevos_30} este mes`, 1)}
      ${kpi('Negocios activos', 'store', n.activos, `${n.sin_verificar} sin verificar · ${n.suspendidos} suspendidos`)}
      ${kpi('Contactos por WhatsApp', 'msg', d.contactos_30.toLocaleString('es-CO'), `Últimos 30 días${var30 === null ? '' : ` · ${var30 >= 0 ? '+' : ''}${var30}% vs. mes anterior`}`)}
      ${kpi('Calificación promedio', 'staro', num(rs.promedio ?? 0), `${rs.total} reseñas · ${pr.activos} productos activos`)}
    </div>
    ${pendientes.length ? `<div class="card col g12"><h3 class="d4">Para revisar</h3><div class="grid c2" style="gap:12px">${pendientes.map(([t, s, h, i]) => `<a class="row g12" href="${h}" style="background:var(--bone);padding:14px;border-radius:16px"><span class="redondo" style="border:0;background:#fff">${ic(i)}</span><div class="crece"><b style="font-size:14px">${t}</b><div class="peq sua">${s}</div></div>${ic('chevr')}</a>`).join('')}</div></div>` : ''}
    <div class="row ini g16 dos">
      <div class="card col g20 crece"><div><h3 class="d4">Contactos a negocios por mes</h3><span class="peq sua">Clics al botón de WhatsApp en los últimos 12 meses</span></div>
        <div class="barras">${d.por_mes.map((m, i, a) => `<div class="m" title="${mesN(+m.mes.slice(5) - 1)}: ${m.contactos} contactos · ${m.registros} registros"><div class="par"><i style="height:${Math.round(m.contactos * 100 / maxMes)}%;background:var(--${i === a.length - 1 ? 'brasa' : 'char'})"></i></div><span class="min sua">${mesN(+m.mes.slice(5) - 1).slice(0, 3)}</span></div>`).join('')}</div>
        <span class="min sua">${d.busquedas_30.toLocaleString('es-CO')} búsquedas y ${d.catalogos} catálogos publicados.</span></div>
      <div class="card oscura col g12" style="width:340px;flex:none"><div><h3 class="d4">Negocios con más contactos</h3><span class="peq" style="color:var(--sand)">Últimos 30 días</span></div>
        ${d.top_negocios.length ? d.top_negocios.map((t, i) => `<a class="row g12" href="#/negocio/${t.slug}" style="background:rgba(255,255,255,.06);padding:12px;border-radius:14px"><b style="color:var(--oro);width:18px">${i + 1}</b><span class="crece">${esc(t.nombre)}</span><b>${t.contactos}</b></a>`).join('') : '<span class="peq" style="color:var(--sand)">Todavía no hay contactos este mes.</span>'}</div>
    </div>
    <div class="row ini g16 dos">
      <div class="card col g12 crece"><div><h3 class="d4">Lo que más busca la gente</h3><span class="peq sua">Te dice qué negocios hacen falta en Impulsa</span></div>
        ${d.top_busquedas.length ? `<div class="row g8 envuelve">${d.top_busquedas.map(b => `<span class="chip crema">${esc(b.consulta)} · ${b.veces}</span>`).join('')}</div>` : '<span class="peq sua">Aún no hay búsquedas registradas.</span>'}</div>
      <div class="card col g10 crece"><div><h3 class="d4">Productos por categoría</h3><span class="peq sua">Productos activos</span></div>
        ${d.categorias.slice(0, 8).map(c => `<div class="row g10 peq"><span style="width:150px" class="neg">${esc(c.emoji)} ${esc(c.nombre)}</span><div class="barra"><i style="width:${Math.round(c.productos * 100 / maxCat)}%;background:var(--brasa)"></i></div><b style="width:28px;text-align:right">${c.productos}</b></div>`).join('')}</div>
    </div>`);
});

// ---------- usuarios
ruta('/admin/usuarios', async (_, q) => {
  if (!permitido()) return null;
  const rol = q.get('rol') || '', busca = q.get('q') || '';
  const lista = await api('/admin/usuarios?' + qs({ q: busca, rol }));
  const yo = estado.yo.perfil.id;
  return marco('#/admin/usuarios', `${titulo('Usuarios', 'Clientes, negocios y administradores registrados')}
    <div class="filtros-a">${buscador('#/admin/usuarios', busca, 'Nombre o correo')}
      ${chipF('#/admin/usuarios?' + qs({ q: busca }), 'Todos', !rol)}${Object.entries(ROLES).map(([k, t]) => chipF('#/admin/usuarios?' + qs({ q: busca, rol: k }), t, rol === k)).join('')}</div>
    ${lista.length ? `<div class="card" style="padding:0;overflow:auto"><table class="tabla"><thead><tr><th>Usuario</th><th>Rol</th><th>Negocio</th><th>Registro</th><th>Último acceso</th><th>Contactos</th><th>Estado</th><th></th></tr></thead><tbody>
      ${lista.map(u => `<tr><td><div class="row g10"><span class="avatar" style="width:38px;height:38px;font-size:13px;background:var(--cream);color:var(--ink)">${iniciales(u.nombre + ' ' + u.apellido)}</span><div><b>${esc(u.nombre)} ${esc(u.apellido)}</b><div class="min sua">${esc(u.email)}${u.celular ? ' · ' + esc(u.celular) : ''}</div></div></div></td>
        <td>${u.id === yo ? `<span class="chip tinta">${ROLES[u.rol]}</span>` : `<select data-a-cambio="rol" data-id="${u.id}" aria-label="Rol">${Object.entries(ROLES).map(([k, t]) => `<option value="${k}" ${u.rol === k ? 'selected' : ''}>${t}</option>`).join('')}</select>`}</td>
        <td>${u.negocio ? `<a class="neg" style="color:var(--brasa)" href="#/negocio/${u.negocio.slug}">${esc(u.negocio.nombre)}</a>` : '<span class="sua">—</span>'}</td>
        <td class="peq">${hace(u.creado_en)}</td><td class="peq">${u.ultimo_acceso ? hace(u.ultimo_acceso) : '<span class="sua">Nunca</span>'}</td><td>${u.contactos}</td>
        <td><span class="estado-u ${u.suspendido ? 'off' : ''}"><i></i>${u.suspendido ? 'Suspendido' : 'Activo'}</span></td>
        <td>${u.id === yo ? '<span class="min sua">Tú</span>' : `<button class="btn btn-g btn-s" data-a="adm-suspender" data-id="${u.id}" data-s="${u.suspendido ? 0 : 1}" data-n="${esc(u.nombre)}">${u.suspendido ? ic('refresh') + 'Reactivar' : ic('ban') + 'Suspender'}</button>`}</td></tr>`).join('')}
      </tbody></table></div><span class="min sua">Mostrando ${lista.length} usuarios. Suspender a alguien le cierra la sesión, le impide entrar y oculta su negocio.</span>`
      : vacio('🔎', 'Sin resultados', 'No hay usuarios que coincidan con la búsqueda.')}`);
});
acciones['adm-suspender'] = async el => {
  const s = el.dataset.s === '1';
  if (!confirm(s ? `¿Suspender la cuenta de ${el.dataset.n}? No podrá iniciar sesión y su negocio dejará de verse.` : `¿Reactivar la cuenta de ${el.dataset.n}?`)) return;
  await api('/admin/usuarios/' + el.dataset.id, { metodo: 'PUT', cuerpo: { suspendido: s } });
  avisar(s ? 'Cuenta suspendida' : 'Cuenta reactivada'); nucleo.repintar();
};
document.addEventListener('change', async ev => {
  const sel = ev.target.closest('select[data-a-cambio="rol"]');
  if (!sel) return;
  const nuevo = sel.value;
  if (!confirm(nuevo === 'admin' ? 'Esta persona podrá administrar toda la plataforma. ¿Continuar?' : `¿Cambiar el rol a ${ROLES[nuevo]}?`)) { nucleo.repintar(); return; }
  try { await api('/admin/usuarios/' + sel.dataset.id, { metodo: 'PUT', cuerpo: { rol: nuevo } }); avisar('Rol actualizado'); }
  catch (e) { avisar(e.message, true); nucleo.repintar(); }
});

// ---------- negocios
ruta('/admin/negocios', async (_, q) => {
  if (!permitido()) return null;
  const est = q.get('estado') || '', busca = q.get('q') || '';
  const lista = await api('/admin/negocios?' + qs({ q: busca, estado: est }));
  return marco('#/admin/negocios', `${titulo('Negocios', 'Verifica emprendimientos reales y suspende los que incumplan las normas')}
    <div class="filtros-a">${buscador('#/admin/negocios', busca, 'Nombre del negocio o correo')}
      ${[['', 'Todos'], ['sin_verificar', 'Sin verificar'], ['verificados', 'Verificados'], ['suspendidos', 'Suspendidos']].map(([k, t]) => chipF('#/admin/negocios?' + qs({ q: busca, estado: k }), t, est === k)).join('')}</div>
    ${lista.length ? `<div class="card" style="padding:0;overflow:auto"><table class="tabla"><thead><tr><th>Negocio</th><th>Dueño</th><th>Productos</th><th>Reseñas</th><th>Contactos 30 d</th><th>Verificado</th><th>Visible</th><th></th></tr></thead><tbody>
      ${lista.map(n => `<tr><td><div class="row g10"><div class="th52" style="width:44px;height:44px;font-size:14px;font-weight:700;${n.logo_url ? `background-image:url('${esc(n.logo_url)}')` : 'background:var(--ink);color:var(--oro)'}">${n.logo_url ? '' : iniciales(n.nombre)}</div><div><b>${esc(n.nombre)}</b><div class="min sua">${esc(n.categoria || 'Sin categoría')} · ${esc(n.barrio || 'Ocaña')}</div></div></div></td>
        <td class="peq">${esc(n.propietario || '')}<div class="min sua">${esc(n.email || '')}</div></td>
        <td>${n.productos}${n.catalogos ? `<div class="min sua">${n.catalogos} catálogos</div>` : ''}</td>
        <td>${n.resenas ? `<span class="row g4">${ic('star', '#F4B73F', 'width:14px;height:14px')}${num(n.calificacion)} <span class="sua">(${n.resenas})</span></span>` : '<span class="sua">—</span>'}</td>
        <td>${n.contactos_30}</td>
        <td><button class="interruptor ${n.verificado ? 'on' : ''}" data-a="adm-neg" data-id="${n.id}" data-campo="verificado" data-v="${n.verificado ? 1 : 0}" aria-label="Verificado"></button></td>
        <td><button class="interruptor ${n.activo ? 'on' : ''}" data-a="adm-neg" data-id="${n.id}" data-campo="activo" data-v="${n.activo ? 1 : 0}" aria-label="Visible"></button></td>
        <td><div class="row g6"><a class="redondo" style="width:38px;height:38px" href="#/negocio/${n.slug}" aria-label="Ver perfil">${ic('eye')}</a>${n.whatsapp ? `<a class="redondo" style="width:38px;height:38px" target="_blank" rel="noopener" href="https://wa.me/${esc(n.whatsapp)}" aria-label="Escribirle">${ic('wa')}</a>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div><span class="min sua">Un negocio no visible desaparece de búsquedas, recomendaciones y del directorio. Su dueño todavía puede entrar a su panel.</span>`
      : vacio('🏪', 'Sin resultados', 'No hay negocios con ese filtro.')}`);
});
acciones['adm-neg'] = async el => {
  const v = el.dataset.v !== '1', campoN = el.dataset.campo;
  if (campoN === 'activo' && !v && !confirm('¿Ocultar este negocio de toda la plataforma?')) return;
  await api('/admin/negocios/' + el.dataset.id, { metodo: 'PUT', cuerpo: { [campoN]: v } });
  el.dataset.v = v ? 1 : 0; el.classList.toggle('on', v);
  avisar(campoN === 'verificado' ? (v ? 'Negocio verificado. Le avisamos al dueño' : 'Verificación quitada') : (v ? 'Negocio visible de nuevo' : 'Negocio oculto'));
};

// ---------- productos
ruta('/admin/productos', async (_, q) => {
  if (!permitido()) return null;
  const busca = q.get('q') || '';
  const lista = await api('/admin/productos?' + qs({ q: busca }));
  return marco('#/admin/productos', `${titulo('Productos', 'Destaca los mejores en la portada y oculta los que no cumplan las normas')}
    <div class="filtros-a">${buscador('#/admin/productos', busca, 'Producto o negocio')}</div>
    ${lista.length ? `<div class="card" style="padding:0;overflow:auto"><table class="tabla"><thead><tr><th>Producto</th><th>Negocio</th><th>Precio</th><th>Stock</th><th>Destacado</th><th>Visible</th></tr></thead><tbody>
      ${lista.map(p => `<tr><td><div class="row g10"><div class="th52" style="width:44px;height:44px;${p.imagen ? `background-image:url('${esc(p.imagen)}')` : ''}">${p.imagen ? '' : '📦'}</div><div><b>${esc(p.nombre)}</b><div class="min sua">${esc(p.categoria || '')} · ${hace(p.creado_en)}</div></div></div></td>
        <td><a class="peq neg" style="color:var(--brasa)" href="#/negocio/${p.slug}">${esc(p.negocio)}</a></td><td><b>${pesos(p.precio)}</b></td><td>${p.stock}</td>
        <td><button class="interruptor ${p.destacado ? 'on' : ''}" data-a="adm-prod" data-id="${p.id}" data-campo="destacado" data-v="${p.destacado ? 1 : 0}" aria-label="Destacado"></button></td>
        <td><button class="interruptor ${p.activo ? 'on' : ''}" data-a="adm-prod" data-id="${p.id}" data-campo="activo" data-v="${p.activo ? 1 : 0}" aria-label="Visible"></button></td></tr>`).join('')}
      </tbody></table></div><span class="min sua">Los productos destacados salen primero en la portada y llevan la etiqueta «Destacado».</span>`
      : vacio('📦', 'Sin resultados', 'No hay productos que coincidan.')}`);
});
acciones['adm-prod'] = async el => {
  const v = el.dataset.v !== '1', campoN = el.dataset.campo;
  await api('/admin/productos/' + el.dataset.id, { metodo: 'PUT', cuerpo: { [campoN]: v } });
  el.dataset.v = v ? 1 : 0; el.classList.toggle('on', v);
  avisar(campoN === 'destacado' ? (v ? 'Producto destacado' : 'Ya no está destacado') : (v ? 'Producto visible' : 'Producto oculto'));
};

// ---------- reseñas
ruta('/admin/resenas', async (_, q) => {
  if (!permitido()) return null;
  const max = Number(q.get('max') || 5);
  const lista = await api('/admin/resenas?max=' + max);
  return marco('#/admin/resenas', `${titulo('Reseñas', 'Elimina las reseñas ofensivas, falsas o que no tienen que ver con el negocio')}
    <div class="filtros-a">${chipF('#/admin/resenas', 'Todas', max === 5)}${chipF('#/admin/resenas?max=2', '1 y 2 estrellas', max === 2)}${chipF('#/admin/resenas?max=3', '3 estrellas o menos', max === 3)}</div>
    ${lista.length ? `<div class="col g12">${lista.map(r => `<div class="card col g10"><div class="row g12 envuelve"><div class="crece"><b>${esc(r.cliente || 'Cliente')}</b> <span class="min sua">${esc(r.email || '')}</span><div class="peq sua">sobre <a class="neg" style="color:var(--brasa)" href="#/negocio/${r.slug}">${esc(r.negocio)}</a> · ${hace(r.creado_en)}</div></div>${estrellas(r.calificacion, 15)}
        <button class="btn btn-g btn-s" data-a="adm-borrar-resena" data-id="${r.id}">${ic('trash')}Eliminar</button></div>
        <p style="font-size:15px">${esc(r.comentario || '')}</p>${r.respuesta ? `<div class="peq" style="background:var(--bone);padding:12px 14px;border-radius:14px"><b>Respuesta del negocio:</b> ${esc(r.respuesta)}</div>` : ''}</div>`).join('')}</div>`
      : vacio('⭐', 'Nada por revisar', max < 5 ? 'No hay reseñas con esa calificación.' : 'Todavía no hay reseñas.')}`);
});
acciones['adm-borrar-resena'] = async el => {
  if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return;
  await api('/admin/resenas/' + el.dataset.id, { metodo: 'DELETE' });
  avisar('Reseña eliminada'); nucleo.repintar();
};

// ---------- categorías y fechas sugeridas
ruta('/admin/contenido', async () => {
  if (!permitido()) return null;
  const [cats, fechas] = await Promise.all([api('/categorias'), api('/admin/fechas')]);
  estado.categorias = cats;
  const tipoSel = (v = 'producto') => `<select name="tipo" aria-label="Tipo"><option value="producto" ${v === 'producto' ? 'selected' : ''}>Productos</option><option value="servicio" ${v === 'servicio' ? 'selected' : ''}>Servicios</option></select>`;
  const filaCat = (c = {}) => `<form class="fila-ed" data-f="adm-cat"><input type="hidden" name="id" value="${c.id || ''}">
    <input name="emoji" value="${esc(c.emoji || '✨')}" style="width:58px;text-align:center" aria-label="Emoji"><input name="nombre" value="${esc(c.nombre || '')}" placeholder="Nueva categoría" required style="flex:1;min-width:min(160px,100%)" aria-label="Nombre">
    ${tipoSel(c.tipo)}<input name="orden" type="number" value="${c.orden ?? ''}" placeholder="Orden" style="width:84px" aria-label="Orden">
    <button class="btn btn-d btn-s">${c.id ? 'Guardar' : ic('plus', '#fff') + 'Agregar'}</button>${c.id ? `<button type="button" class="redondo" style="width:40px;height:40px" data-a="adm-borrar-cat" data-id="${c.id}" aria-label="Borrar">${ic('trash')}</button>` : ''}</form>`;
  const filaFecha = (f = {}) => `<form class="fila-ed" data-f="adm-fecha"><input type="hidden" name="id" value="${f.id || ''}">
    <input name="emoji" value="${esc(f.emoji || '🎁')}" style="width:58px;text-align:center" aria-label="Emoji"><input name="nombre" value="${esc(f.nombre || '')}" placeholder="Nueva fecha" required style="flex:1;min-width:min(150px,100%)" aria-label="Nombre">
    <input name="dia" type="number" min="1" max="31" value="${f.dia || ''}" placeholder="Día" required style="width:72px" aria-label="Día">
    <select name="mes" aria-label="Mes">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${f.mes === i + 1 ? 'selected' : ''}>${mesN(i)}</option>`).join('')}</select>
    <input name="ocasion" value="${esc(f.ocasion || '')}" placeholder="Ocasión (ej. Navidad)" style="width:170px" aria-label="Ocasión">
    <button class="btn btn-d btn-s">${f.id ? 'Guardar' : ic('plus', '#fff') + 'Agregar'}</button>${f.id ? `<button type="button" class="redondo" style="width:40px;height:40px" data-a="adm-borrar-fecha" data-id="${f.id}" aria-label="Borrar">${ic('trash')}</button>` : ''}</form>`;
  return marco('#/admin/contenido', `${titulo('Categorías y fechas', 'Lo que ven clientes y negocios al registrarse, buscar y armar su calendario')}
    <div class="card col"><div class="row entre" style="margin-bottom:8px"><div><h3 class="d4">Categorías</h3><span class="peq sua">El orden define cómo aparecen en la portada. Solo se borran las que no tienen negocios ni productos.</span></div></div>
      ${filaCat()}${cats.map(filaCat).join('')}</div>
    <div class="card col"><div style="margin-bottom:8px"><h3 class="d4">Fechas comerciales sugeridas</h3><span class="peq sua">Aparecen en el calendario de cada cliente. La «ocasión» conecta la fecha con los productos marcados para ella.</span></div>
      ${filaFecha()}${fechas.map(filaFecha).join('')}</div>`);
});
formularios['adm-cat'] = async (f, d) => {
  const cuerpo = { nombre: d.nombre.trim(), emoji: d.emoji.trim() || '✨', tipo: d.tipo, orden: d.orden === '' ? null : Number(d.orden) };
  await api('/admin/categorias' + (d.id ? '/' + d.id : ''), { metodo: d.id ? 'PUT' : 'POST', cuerpo });
  estado.categorias = []; avisar(d.id ? 'Categoría guardada' : 'Categoría creada'); nucleo.repintar();
};
acciones['adm-borrar-cat'] = async el => {
  if (!confirm('¿Borrar esta categoría?')) return;
  await api('/admin/categorias/' + el.dataset.id, { metodo: 'DELETE' }); estado.categorias = []; avisar('Categoría borrada'); nucleo.repintar();
};
formularios['adm-fecha'] = async (f, d) => {
  const cuerpo = { nombre: d.nombre.trim(), emoji: d.emoji.trim() || '🎁', dia: Number(d.dia), mes: Number(d.mes), ocasion: d.ocasion.trim(), descripcion: '' };
  await api('/admin/fechas' + (d.id ? '/' + d.id : ''), { metodo: d.id ? 'PUT' : 'POST', cuerpo });
  avisar(d.id ? 'Fecha guardada' : 'Fecha agregada'); nucleo.repintar();
};
acciones['adm-borrar-fecha'] = async el => {
  if (!confirm('¿Borrar esta fecha sugerida?')) return;
  await api('/admin/fechas/' + el.dataset.id, { metodo: 'DELETE' }); avisar('Fecha borrada'); nucleo.repintar();
};

// ---------- anuncios
ruta('/admin/anuncios', async () => {
  if (!permitido()) return null;
  return marco('#/admin/anuncios', `${titulo('Anuncios', 'Envía una notificación que llega a la campanita de los usuarios')}
    <form class="card col g16" data-f="adm-anuncio" style="max-width:720px">
      ${campo('¿A quién?', 'rol', '', { opciones: [['', 'A todos (clientes y negocios)'], ['cliente', 'Solo a los clientes'], ['emprendedor', 'Solo a los negocios']] })}
      ${campo('Título', 'titulo', '', { req: 1, ph: 'Llegó la temporada de Navidad' })}
      ${campo('Mensaje', 'mensaje', '', { area: 1, req: 1, max: 300, ph: 'Activa tu calendario y te recordamos los regalos a tiempo.' })}
      ${campo('Enlace (opcional)', 'enlace', '', { ph: '#/calendario', ayuda: 'A dónde lleva la notificación al tocarla. Ej.: #/calendario, #/buscar?q=navidad o #/panel/promociones' })}
      <div data-error></div><button class="btn btn-p" style="align-self:flex-start">${ic('mega', '#fff')}Enviar anuncio</button></form>`);
});
formularios['adm-anuncio'] = async (f, d) => {
  const quien = d.rol === 'cliente' ? 'todos los clientes' : d.rol === 'emprendedor' ? 'todos los negocios' : 'todos los usuarios';
  if (!confirm(`Se enviará a ${quien}. ¿Continuar?`)) return;
  const r = await api('/admin/anuncios', { metodo: 'POST', cuerpo: { titulo: d.titulo.trim(), mensaje: d.mensaje.trim(), rol: d.rol || null, enlace: d.enlace.trim() || null } });
  avisar(`Anuncio enviado a ${r.enviadas} personas`); f.reset();
};

// ---------- mi cuenta
ruta('/admin/cuenta', async () => {
  if (!permitido()) return null;
  const p = estado.yo.perfil;
  return marco('#/admin/cuenta', `${titulo('Mi cuenta', esc(p.email))}
    ${formClave()}
    <div class="card col g8" style="max-width:560px"><h3 class="d4">Otros administradores</h3><span class="peq sua">Para darle acceso a alguien de tu equipo, pídele que cree su cuenta en Impulsa y luego cámbiale el rol a «Administrador» en <a class="neg" style="color:var(--brasa)" href="#/admin/usuarios">Usuarios</a>.</span></div>`);
});
