// Panel del emprendedor: estadísticas, productos, contactos, reseñas, promociones y datos del negocio.
import { api, estado, cargarYo, cargarCategorias } from './api.js';
import { acciones, formularios, ruta, ir, nucleo } from './nucleo.js';
import { ic, esc, pesos, corto, num, hace, fechaCorta, mesN, iniciales, logo, estrellas, avisar, vacio, campo, comprimir, tarjetaCatalogo } from './ui.js';

const OCASIONES = ['Cumpleaños', 'Aniversario', 'Amor y Amistad', 'Día de la Madre', 'Día del Padre', 'Navidad', 'Halloween', 'Grados', 'Para ella', 'Para él', 'Regalo corporativo'];
const PAGOS = ['Nequi', 'Daviplata', 'Transferencia Bancolombia', 'Efectivo', 'Tarjeta', 'Llave Bre-B'];
const ENTREGAS = ['Domicilio en Ocaña', 'Recoger en el local', 'Envíos nacionales', 'Contraentrega'];
const DIAS = [['L', 'L'], ['M', 'M'], ['X', 'M'], ['J', 'J'], ['V', 'V'], ['S', 'S'], ['D', 'D']];

// Devuelve true si la ruta puede mostrarse; si no, redirige.
function permitido(sinNegocio = false) {
  const y = estado.yo;
  if (!y) { ir('#/entrar'); return false; }
  if (y.perfil.rol !== 'emprendedor') { ir('#/inicio'); return false; }
  if (!y.negocio && !sinNegocio) { ir('#/panel/negocio'); return false; }
  return true;
}

function marco(activo, html) {
  const n = estado.yo.negocio, p = estado.yo.perfil;
  const en = (r, icono, t, extra = '') => `<a href="${r}" class="${activo === r ? 'on' : ''}">${ic(icono)}<span>${t}</span>${extra}</a>`;
  return `<div class="panel"><aside class="lateral">${logo(true, '#/panel')}
    ${n ? `<a class="row g12 solo-g" style="background:rgba(255,255,255,.06);padding:12px;border-radius:18px" href="#/negocio/${n.slug}"><div class="logo-n" style="width:42px;height:42px;border-radius:12px;font-size:15px;background:var(--oro) center/cover;color:var(--ink);${n.logo_url ? `background-image:url('${esc(n.logo_url)}')` : ''}">${n.logo_url ? '' : iniciales(n.nombre)}</div>
      <div class="crece"><b style="color:var(--cream);font-size:14px">${esc(n.nombre)}</b><div class="min row g4" style="color:var(--oro)">Ver perfil público ${ic('ext', 'currentColor', 'width:11px;height:11px')}</div></div></a>` : ''}
    <nav class="col" style="gap:2px">${n ? en('#/panel', 'home', 'Resumen') + en('#/panel/radar', 'up', 'Radar de demanda', '<span class="ia-tag">IA</span>') + en('#/panel/productos', 'pkg', 'Productos') + en('#/panel/catalogos', 'book', 'Catálogos') + en('#/panel/pedidos', 'msg', 'Contactos y pedidos') + en('#/panel/resenas', 'staro', 'Reseñas') + en('#/panel/promociones', 'tag', 'Promociones') : ''}
      ${en('#/panel/negocio', 'store', 'Perfil del negocio')}<a href="#/buscar">${ic('compass')}<span>Ver Impulsa</span></a></nav>
    <div class="crece solo-g"></div>
    <div class="col g10 solo-g" style="background:var(--oro);color:var(--ink);padding:18px;border-radius:20px"><span class="chip tinta" style="color:var(--oro);align-self:flex-start">${ic('spark')}Consejo</span>
      <span class="peq">Los negocios que responden en menos de 15 minutos reciben más reseñas de 5 estrellas.</span></div>
    <div class="row g10 solo-g"><span class="avatar" style="background:var(--oro);color:var(--ink);width:38px;height:38px;font-size:13px">${iniciales(p.nombre + ' ' + p.apellido)}</span><span class="crece peq" style="color:var(--cream)">${esc(p.nombre)} ${esc(p.apellido)}</span>
      <button class="redondo" style="background:none;border-color:var(--char);width:38px;height:38px" data-a="salir" aria-label="Cerrar sesión">${ic('salir', '#E7DDD0')}</button></div>
  </aside><main class="principal">${html}</main></div>`;
}
const titulo = (t, sub, extra = '') => `<div class="row entre fin envuelve g16"><div class="col g6"><h1 class="d2" style="font-size:clamp(32px,3.6vw,44px)">${t}</h1>${sub ? `<span class="sua">${sub}</span>` : ''}</div><div class="row g10 envuelve">${extra}</div></div>`;
const nuevoBtn = `<a class="btn btn-p" href="#/panel/producto/nuevo">${ic('plus', '#fff')}Nuevo producto</a>`;
const th = (url, emoji = '📦') => `<div class="th52" style="${url ? `background-image:url('${esc(url)}')` : ''}">${url ? '' : emoji}</div>`;

// ---------- radar de demanda (IA)
ruta('/panel/radar', async () => {
  if (!permitido()) return null;
  const d = await api('/panel/radar');
  const maxDia = Math.max(1, ...d.por_dia.map(x => x.n));
  const maxTop = Math.max(1, ...d.top.map(x => x.n));
  const motor = d.motor === 'gemini' ? 'Gemini' : 'IA de Impulsa';
  const fila = (x, color, extra = '') => `<div class="col g6"><div class="row entre g8 peq"><span class="neg">“${esc(x.consulta)}”</span><b>${x.n}</b></div>
    <div class="barra" style="height:8px"><i style="width:${Math.round(x.n * 100 / maxTop)}%;background:var(--${color})"></i></div>${extra}</div>`;
  return marco('#/panel/radar', `
    ${titulo(`Radar de <span class="serif">demanda.</span>`, `Lo que buscaron ${d.total.toLocaleString('es-CO')} veces los clientes en Impulsa durante los últimos 30 días`, `<span class="sello-ia">${ic('spark')}${motor}</span>`)}
    <div class="grid c4" style="gap:16px">
      <div class="card kpi oscura"><span class="peq" style="color:var(--sand)">Búsquedas en Ocaña</span><b>${d.total.toLocaleString('es-CO')}</b><span class="min" style="color:var(--sand)">${d.consultas_distintas} temas distintos</span></div>
      <div class="card kpi"><span class="peq sua">Sin resultado</span><b style="color:var(--brasa)">${d.sin_resultado}</b><span class="min sua">${d.total ? Math.round(d.sin_resultado * 100 / d.total) : 0}% no encontró lo que quería</span></div>
      <div class="card kpi"><span class="peq sua">Te encuentran por</span><b>${d.tuyas.length}</b><span class="min sua">búsquedas donde salen tus productos</span></div>
      <div class="card kpi"><span class="peq sua">En subida</span><b style="color:var(--salvia)">${d.subiendo.length}</b><span class="min sua">temas que crecieron esta semana</span></div>
    </div>
    <div class="card col g16" style="background:var(--ink);color:var(--cream);border:0">
      <div class="row g12"><span class="redondo" style="background:var(--oro);border:0;border-radius:12px;width:40px;height:40px">${ic('spark', '#16120F')}</span>
        <div class="crece"><h3 class="d4">Oportunidades que detectó la IA</h3><span class="peq" style="color:var(--sand)">Cruza lo que buscan en Ocaña con lo que vende ${esc(estado.yo.negocio.nombre)} · se actualiza cada día</span></div></div>
      ${d.oportunidades.length ? `<div class="grid c3" style="gap:12px">${d.oportunidades.map((o, i) => `<div class="oport"><span class="num-op">${i + 1}</span><b>${esc(o.titulo)}</b><span class="peq" style="color:var(--sand)">${esc(o.texto)}</span>
        <a class="btn btn-p btn-s" style="margin-top:auto;align-self:flex-start" href="${o.enlace}">${esc(o.accion)} ${ic('arrow', '#fff', 'width:14px;height:14px')}</a></div>`).join('')}</div>`
        : '<span class="peq" style="color:var(--sand)">Todavía hay pocas búsquedas para sacar conclusiones. Vuelve en unos días.</span>'}
    </div>
    <div class="card col g12"><div class="row entre envuelve"><div><h3 class="d4">Búsquedas por día</h3><span class="peq sua">En naranja, las que no encontraron nada</span></div></div>
      <div class="barras-dia">${d.por_dia.map(x => `<div class="d" title="${fechaCorta(x.dia)}: ${x.n} búsquedas, ${x.sin} sin resultado"><i style="height:${Math.round(x.n * 100 / maxDia)}%"><em style="height:${x.n ? Math.round(x.sin * 100 / x.n) : 0}%"></em></i></div>`).join('')}</div>
      <div class="row entre min sua"><span>${fechaCorta(d.por_dia[0].dia)}</span><span>Hoy</span></div></div>
    <div class="row ini g16 dos">
      <div class="card col g14 crece"><div><h3 class="d4">Lo que buscan y nadie vende</h3><span class="peq sua">Si puedes ofrecerlo, serías la primera opción en Impulsa</span></div>
        ${d.sin_oferta.length ? d.sin_oferta.map(x => fila(x, 'brasa', `<span class="min sua">Última vez ${hace(x.ultima).toLowerCase()}</span>`)).join('') : '<span class="peq sua">Por ahora todo lo que buscan tiene al menos una opción.</span>'}</div>
      <div class="col g16 crece">
        <div class="card col g14"><div><h3 class="d4">Búsquedas donde apareces</h3><span class="peq sua">Tus productos frente a los de la competencia</span></div>
          ${d.tuyas.length ? d.tuyas.map(x => `<div class="row g12"><div class="crece">${fila(x, 'salvia')}</div><span class="chip ${x.ofertas - x.tuyos > 0 ? 'borde' : 'salvia'}" style="font-size:12px;padding:5px 10px;flex:none">${x.ofertas - x.tuyos > 0 ? `${x.tuyos} tuyos · ${x.ofertas - x.tuyos} más` : 'Sin competencia'}</span></div>`).join('')
            : '<span class="peq sua">Aún no apareces en las búsquedas más comunes. Revisa el nombre y las etiquetas de tus productos.</span>'}</div>
        <div class="card col g10"><div><h3 class="d4">Subiendo esta semana</h3><span class="peq sua">Comparado con la semana anterior</span></div>
          ${d.subiendo.length ? d.subiendo.map(x => `<div class="row entre peq"><span class="neg">“${esc(x.consulta)}”</span><span class="chip salvia" style="font-size:12px;padding:5px 10px">${ic('up', 'currentColor', 'width:13px;height:13px')}${x.antes} → ${x.n}</span></div>`).join('') : '<span class="peq sua">Sin cambios fuertes esta semana.</span>'}</div>
      </div>
    </div>`);
});

// ---------- resumen y estadísticas
ruta('/panel', async () => {
  if (!permitido()) return null;
  const d = await api('/panel/resumen'), k = d.kpis, p = estado.yo.perfil;
  const delta = (a, b) => { if (!b) return ''; const v = Math.round((a - b) * 100 / b); return `<span class="chip ${v >= 0 ? 'salvia' : 'brasa'}" style="padding:5px 10px;font-size:12px;font-weight:600">${v >= 0 ? '+' : ''}${v}%</span>`; };
  const conv = k.visitas ? k.clics * 100 / k.visitas : 0, convPrev = k.visitas_prev ? k.clics_prev * 100 / k.visitas_prev : 0;
  const kpi = (t, icono, valor, dl, osc) => `<div class="card kpi ${osc ? 'oscura' : ''}"><div class="row entre"><span class="row g8 peq neg ${osc ? '' : 'sua'}" ${osc ? 'style="color:var(--sand)"' : ''}><span class="redondo" style="width:34px;height:34px;border-radius:10px;border:0;background:var(--${osc ? 'brasa' : 'cream'})">${ic(icono, osc ? '#fff' : 'currentColor', 'width:17px;height:17px')}</span>${t}</span>${dl}</div><b>${valor}</b><span class="min ${osc ? '' : 'sua'}" ${osc ? 'style="color:var(--sand)"' : ''}>Últimos 30 días</span></div>`;
  const maxMes = Math.max(1, ...d.ventas_por_mes.flatMap(m => [m.total, m.anterior]));
  const calor = {}; let maxCalor = 1;
  for (const c of d.heatmap) { calor[c.dia + '-' + c.franja] = c.clics; maxCalor = Math.max(maxCalor, c.clics); }
  const totalOrigen = d.origenes.reduce((s, o) => s + o.n, 0) || 1;
  const ORIGEN = { busqueda_ia: ['Búsqueda con IA', 'brasa'], para_ti: ['Recomendaciones “Para ti”', 'oro'], calendario: ['Recordatorios del calendario', 'salvia'], perfil: ['Visitas directas al perfil', 'char'], promo: ['Promociones', 'brasaD'] };
  return marco('#/panel', `
    ${titulo(`Hola, ${esc(p.nombre)}.<br><span class="serif">así va tu negocio.</span>`, '', `<span class="chip borde" style="padding:12px 16px">${ic('cal')}Últimos 30 días</span>${nuevoBtn}`)}
    <div class="grid c4" style="gap:16px">${kpi('Ventas confirmadas', 'chart', corto(k.ventas), delta(k.ventas, k.ventas_prev), 1)}${kpi('Clics a WhatsApp', 'msg', k.clics, delta(k.clics, k.clics_prev))}${kpi('Visitas al perfil', 'eye', k.visitas.toLocaleString('es-CO'), delta(k.visitas, k.visitas_prev))}${kpi('Conversión a contacto', 'up', num(conv.toFixed(1)) + '%', delta(conv, convPrev))}</div>
    <div class="row ini g16 dos">
      <div class="card col g20 crece"><div class="row entre ini envuelve g12"><div><h3 class="d4">Ventas por mes</h3><span class="peq sua">Contactos que marcaste como venta confirmada</span></div>
          <div class="row g16 min">${[['char', 'Este año'], ['sand', 'Año anterior']].map(([c, t]) => `<span class="row g6"><i style="width:10px;height:10px;border-radius:3px;background:var(--${c})"></i>${t}</span>`).join('')}</div></div>
        <div class="barras">${d.ventas_por_mes.map((m, i, a) => `<div class="m" title="${mesN(+m.mes.slice(5) - 1)}: ${pesos(m.total)}"><div class="par"><i style="height:${Math.round(m.anterior * 100 / maxMes)}%;background:var(--sand)"></i><i style="height:${Math.round(m.total * 100 / maxMes)}%;background:var(--${i === a.length - 1 ? 'brasa' : 'char'})"></i></div><span class="min ${i === a.length - 1 ? 'neg' : 'sua'}" style="text-transform:capitalize">${mesN(+m.mes.slice(5) - 1).slice(0, 3)}</span></div>`).join('')}</div>
        <span class="min sua">Promedio mensual: <b style="color:var(--ink)">${pesos(d.promedio_mensual)}</b> · el mes actual va en curso.</span></div>
      <div class="card oscura col g12" style="width:340px;flex:none"><div><h3 class="d4">Tus fechas pico</h3><span class="peq" style="color:var(--sand)">Meses en los que más vendes</span></div>
        ${d.meses_pico.length ? d.meses_pico.map(m => `<div class="row g12" style="background:rgba(255,255,255,.06);padding:12px;border-radius:16px"><span class="th52" style="width:48px;height:48px;background:var(--oro);color:var(--ink);font-size:12px;font-weight:700;text-transform:uppercase">${m.nombre.slice(0, 3)}</span><div class="crece"><b style="font-size:14px;text-transform:capitalize">${m.nombre}</b><div class="peq" style="color:var(--oro)">${corto(m.total)}${m.sobre_promedio > 0 ? ` · +${m.sobre_promedio}% sobre tu promedio` : ''}</div></div></div>`).join('') : '<span class="peq" style="color:var(--sand)">Cuando confirmes ventas, aquí verás tus mejores meses.</span>'}
        ${d.proximas_fechas.length ? `<div class="peq" style="color:var(--sand);margin-top:6px">Se acerca: ${d.proximas_fechas.map(f => `<b style="color:var(--cream)">${f.emoji} ${esc(f.nombre)}</b> (${f.dias} días)`).join(', ')}</div>` : ''}</div>
    </div>
    <div class="row ini g16 dos">
      <div class="card col g16 crece"><div><h3 class="d4">¿Qué días y a qué hora te escriben?</h3><span class="peq sua">Clics a WhatsApp de las últimas 8 semanas</span></div>
        <div class="calor"><span></span>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<span class="min sua neg centro">${x}</span>`).join('')}
          ${['Mañana', 'Mediodía', 'Tarde', 'Noche'].map((f, fi) => `<span class="min neg">${f}</span>` + [1, 2, 3, 4, 5, 6, 7].map(dia => { const v = calor[dia + '-' + fi] || 0; return `<div class="c" style="background:rgba(239,90,42,${(0.08 + 0.92 * v / maxCalor).toFixed(2)})" title="${v} clics">${v === maxCalor ? v : ''}</div>`; }).join('')).join('')}</div></div>
      <div class="card col g12 crece"><div class="row entre"><div><h3 class="d4">Productos más vendidos</h3><span class="peq sua">Últimos 30 días</span></div><a class="peq neg" style="color:var(--brasa)" href="#/panel/productos">Ver inventario →</a></div>
        ${d.top_productos.length ? d.top_productos.map(t => { const v = t.ingresos_prev ? Math.round((t.ingresos - t.ingresos_prev) * 100 / t.ingresos_prev) : null; return `<div class="row g12">${th(t.imagen)}<div class="crece"><b style="font-size:14px">${esc(t.nombre)}</b><div class="peq sua">${t.unidades} ${t.unidades === 1 ? 'unidad' : 'unidades'}</div></div><b style="font-size:14px">${corto(t.ingresos)}</b>${v == null ? '' : `<span class="chip ${v >= 0 ? 'salvia' : 'brasa'}" style="padding:5px 9px;font-size:12px;width:58px;justify-content:center">${v >= 0 ? '+' : ''}${v}%</span>`}</div>`; }).join('')
          : '<span class="sua peq">Aún no hay ventas confirmadas. Marca tus contactos como venta en “Contactos y pedidos”.</span>'}</div>
    </div>
    <div class="row ini g16 dos">
      <div class="card col g12 crece" style="background:var(--oro);border:0"><div class="row g10"><span class="redondo" style="background:var(--ink);border:0;border-radius:12px;width:38px;height:38px">${ic('spark', '#F4B73F')}</span><div class="crece"><h3 class="d4">La IA te recomienda</h3><span class="peq">Basado en tus ventas y en lo que buscan los clientes en Ocaña</span></div><a class="btn btn-d btn-s" href="#/panel/radar">${ic('up', '#fff')}Ver radar de demanda</a></div>
        ${d.consejos.map(c => `<div class="row g12 envuelve" style="background:#fff;border-radius:18px;padding:16px"><div class="crece" style="min-width:220px"><b>${esc(c.titulo)}</b><div class="peq" style="color:var(--char)">${esc(c.texto)}</div></div><a class="btn btn-d btn-s" href="${c.enlace}">${esc(c.accion)} ${ic('arrow', '#fff', 'width:14px;height:14px')}</a></div>`).join('') || '<span class="peq">Todo al día. Sigue publicando productos para recibir más recomendaciones.</span>'}</div>
      <div class="card col g12" style="width:380px;flex:none"><div><h3 class="d4">¿Cómo te encuentran?</h3><span class="peq sua">Origen de tus contactos (90 días)</span></div>
        ${d.origenes.map(o => { const [t, c] = ORIGEN[o.origen] || [o.origen, 'char'], pc = Math.round(o.n * 100 / totalOrigen); return `<div class="col g6"><div class="row entre peq"><span class="neg">${t}</span><b>${pc}%</b></div><div class="barra" style="height:10px"><i style="width:${pc}%;background:var(--${c})"></i></div></div>`; }).join('')}
        ${d.tendencias.length ? `<b class="peq" style="margin-top:6px">Lo que más se busca en Impulsa</b><div class="row g6 envuelve">${d.tendencias.slice(0, 6).map(t => `<span class="chip crema">${esc(t.consulta)} · ${t.n}</span>`).join('')}</div>` : ''}</div>
    </div>`);
});

// ---------- productos e inventario
ruta('/panel/productos', async () => {
  if (!permitido()) return null;
  const lista = await api('/panel/productos'), esperan = lista.filter(p => p.esperando > 0);
  const estadoDe = p => !p.activo ? ['Oculto', 'crema'] : p.tipo === 'servicio' ? ['Activo', 'salvia'] : p.stock === 0 ? [p.por_encargo ? 'Por encargo' : 'Agotado', p.por_encargo ? 'oro' : 'brasa'] : p.stock <= p.stock_minimo ? ['Poco stock', 'oro'] : ['Activo', 'salvia'];
  return marco('#/panel/productos', `${titulo('Mis productos', `${lista.length} productos y servicios · ${lista.filter(p => p.tipo === 'producto' && p.stock === 0 && !p.por_encargo).length} agotados`, nuevoBtn)}
    ${esperan.map(p => `<div class="row g12 envuelve" style="background:var(--brasaS);padding:18px;border-radius:20px"><span class="redondo" style="background:var(--brasa);border:0;border-radius:12px">${ic('bell', '#fff')}</span>
      <div class="crece" style="min-width:220px"><b>${p.esperando} ${p.esperando === 1 ? 'persona espera' : 'personas esperan'} tu ${esc(p.nombre)}</b><div class="peq">Pidieron “Avísame cuando vuelva”. Actualiza el stock aquí abajo y les llega la notificación al instante.</div></div></div>`).join('')}
    ${lista.length ? `<div class="card" style="padding:0;overflow:auto"><table class="tabla"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Visitas</th><th>Clics WhatsApp</th><th>Visible</th><th></th></tr></thead><tbody>
      ${lista.map(p => { const [et, col] = estadoDe(p); return `<tr><td><a class="row g12" href="#/panel/producto/${p.id}">${th(p.imagenes[0], p.tipo === 'servicio' ? '🗓️' : '📦')}<div><b>${esc(p.nombre)}</b><div class="min sua">${p.tipo === 'servicio' ? 'Servicio' : 'Producto'}${p.esperando ? ` · ${p.esperando} esperando` : ''}</div></div></a></td>
        <td><b>${pesos(p.precio)}</b></td>
        <td>${p.tipo === 'servicio' ? '<span class="sua">—</span>' : `<form class="row g6" data-f="stock"><input type="hidden" name="id" value="${p.id}"><input name="stock" type="number" min="0" value="${p.stock}" style="width:74px;height:40px;border-radius:12px;border:1px solid var(--sand);padding:0 10px" aria-label="Stock"><button class="redondo" style="width:40px;height:40px" aria-label="Guardar stock">${ic('check')}</button></form>`}</td>
        <td><span class="chip ${col}">${et}</span></td><td>${p.visitas}</td><td>${p.clics}</td>
        <td><button class="interruptor ${p.activo ? 'on' : ''}" data-a="visible" data-id="${p.id}" data-v="${p.activo ? 1 : 0}" aria-label="Visible"></button></td>
        <td><div class="row g6"><a class="redondo" style="width:38px;height:38px" href="#/panel/producto/${p.id}" aria-label="Editar">${ic('edit')}</a><button class="redondo" style="width:38px;height:38px" data-a="borrar-prod" data-id="${p.id}" aria-label="Eliminar">${ic('trash')}</button></div></td></tr>`; }).join('')}
      </tbody></table></div>` : vacio('📦', 'Publica tu primer producto', 'Sube fotos, precio y descripción. La IA empezará a recomendarlo a quienes lo buscan.', nuevoBtn)}`);
});
formularios.stock = async (f, d) => { await api('/panel/productos/' + d.id, { metodo: 'PUT', cuerpo: { stock: Math.max(0, Number(d.stock) || 0) } }); avisar('Stock actualizado'); nucleo.repintar(); };
acciones.visible = async el => { const v = el.dataset.v !== '1'; await api('/panel/productos/' + el.dataset.id, { metodo: 'PUT', cuerpo: { activo: v } }); el.dataset.v = v ? 1 : 0; el.classList.toggle('on', v); avisar(v ? 'Producto visible para los clientes' : 'Producto oculto'); };
acciones['borrar-prod'] = async el => { if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return; await api('/panel/productos/' + el.dataset.id, { metodo: 'DELETE' }); avisar('Producto eliminado'); nucleo.repintar(); };

const cajaFoto = (nombre, url = '', texto = 'Agregar foto') => `<div class="sube" style="${url ? `background-image:url('${esc(url)}')` : ''}"><input type="hidden" name="${nombre}" value="${esc(url)}">
  <input type="file" accept="image/jpeg,image/png,image/webp" data-sube aria-label="${texto}"><span class="row col g6 pista" style="${url ? 'display:none' : ''}">${ic('camera')}${texto}</span>
  <button type="button" class="quitar" data-a="quitar-foto" style="${url ? '' : 'display:none'}" aria-label="Quitar foto">${ic('x', 'currentColor', 'width:14px;height:14px')}</button></div>`;
document.addEventListener('change', async ev => {
  const inp = ev.target.closest('input[data-sube]');
  if (!inp || !inp.files[0]) return;
  const caja = inp.closest('.sube'), pista = caja.querySelector('.pista');
  pista.style.display = ''; pista.lastChild.textContent = 'Subiendo…';
  try {
    const r = await api('/panel/imagenes', { metodo: 'POST', archivo: await comprimir(inp.files[0]) });
    caja.querySelector('input[type=hidden]').value = r.url; caja.style.backgroundImage = `url('${r.url}')`;
    pista.style.display = 'none'; caja.querySelector('.quitar').style.display = '';
  } catch (e) { pista.lastChild.textContent = 'Agregar foto'; avisar(e.message, true); }
  inp.value = '';
});
acciones['quitar-foto'] = el => { const c = el.closest('.sube'); c.querySelector('input[type=hidden]').value = ''; c.style.backgroundImage = ''; el.style.display = 'none'; const p = c.querySelector('.pista'); p.style.display = ''; p.lastChild.textContent = 'Agregar foto'; };
const pills = (grupo, opciones, activas) => `<div class="row g8 envuelve">${opciones.map(o => `<button type="button" class="pill ${activas.includes(o) ? 'on' : ''}" data-a="pill" data-g="${grupo}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
const elegidas = (f, g) => [...f.querySelectorAll(`.pill.on[data-g="${g}"]`)].map(b => b.dataset.v);

ruta('/panel/producto/([^/]+)', async ([id]) => {
  if (!permitido()) return null;
  const cats = await cargarCategorias(), nuevo = id === 'nuevo';
  const p = nuevo ? { tipo: 'producto', stock: 1, stock_minimo: 2, imagenes: [], ocasiones: [], etiquetas: [], activo: true, categoria_id: estado.yo.negocio.categoria_id }
    : (await api('/panel/productos')).find(x => x.id === id);
  if (!p) { avisar('Ese producto ya no existe', true); return ir('#/panel/productos'); }
  return marco('#/panel/productos', `<a class="row g8 sua neg peq" href="#/panel/productos">${ic('back')}Mis productos</a>
    ${titulo(nuevo ? 'Nuevo producto' : 'Editar producto', 'Lo que escribas aquí es lo que la IA usa para recomendarte.')}
    <form class="col g20" data-f="producto" style="max-width:860px"><input type="hidden" name="id" value="${nuevo ? '' : p.id}">
      <div class="card col g12"><div class="row entre"><b>Fotos · hasta 4</b><span class="peq sua">La primera es la portada</span></div><div class="grid c4" style="gap:12px">${[0, 1, 2, 3].map(i => cajaFoto('img', p.imagenes[i] || '')).join('')}</div></div>
      <div class="row g16 fila-f">${campo('Nombre', 'nombre', p.nombre || '', { req: 1, ph: 'Mochila wayuu mediana' })}${campo('Tipo', 'tipo', p.tipo, { opciones: [['producto', 'Producto'], ['servicio', 'Servicio']] })}</div>
      <div class="row g16 fila-f ini">${campo('Categoría', 'categoria_id', p.categoria_id || '', { opciones: cats.map(c => [c.id, c.emoji + ' ' + c.nombre]) })}${campo('Precio', 'precio', p.precio ?? '', { tipo: 'number', req: 1, min: 0, modo: 'numeric', ph: '45000' })}${campo('Precio antes (si está en oferta)', 'precio_antes', p.precio_antes ?? '', { tipo: 'number', min: 0, modo: 'numeric' })}</div>
      ${campo('Descripción', 'descripcion', p.descripcion || '', { area: 1, req: 1, ph: 'Materiales, medidas, tiempos de entrega, qué lo hace especial…' })}
      <button type="button" class="chip oro" style="align-self:flex-start;cursor:pointer;padding:10px 14px" data-a="ia-descripcion">${ic('spark', '#C8431B')}Redactar con IA a partir de mis notas</button>
      <div class="card col g16"><b>Inventario</b><div class="row g16 fila-f">${campo('Unidades disponibles', 'stock', p.stock, { tipo: 'number', min: 0 })}${campo('Avisarme cuando queden', 'stock_minimo', p.stock_minimo, { tipo: 'number', min: 0 })}</div>
        <label class="row entre g12" style="cursor:pointer"><span><b class="peq">También por encargo</b><div class="min sua">Si se agota, los clientes igual pueden pedirlo</div></span><input type="checkbox" name="por_encargo" ${p.por_encargo ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brasa)"></label></div>
      <div class="card col g12"><div class="row g8 envuelve"><b>¿Para qué ocasiones es ideal?</b><span class="chip oro" style="font-size:12px">${ic('spark', '#C8431B')}Así apareces en los recordatorios del calendario</span></div>${pills('oca', OCASIONES, p.ocasiones)}</div>
      ${campo('Palabras clave (separadas por coma)', 'etiquetas', (p.etiquetas || []).join(', '), { ph: 'regalo, hecho a mano, personalizado', ayuda: 'Piensa en cómo lo buscaría un cliente' })}
      <label class="row g10 neg peq"><input type="checkbox" name="activo" ${p.activo ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brasa)">Visible para los clientes</label>
      <div data-error></div><div class="row g10" style="justify-content:flex-end"><a class="btn btn-g" href="#/panel/productos">Cancelar</a><button class="btn btn-p">${nuevo ? 'Publicar producto' : 'Guardar cambios'}</button></div></form>`);
});
acciones['ia-descripcion'] = async el => {
  const f = el.closest('form'), cats = estado.categorias;
  if (!f.nombre.value.trim()) throw new Error('Escribe primero el nombre del producto');
  const r = await api('/panel/ia/descripcion', { metodo: 'POST', cuerpo: { nombre: f.nombre.value, categoria: cats.find(c => String(c.id) === f.categoria_id.value)?.nombre || '', detalles: f.descripcion.value } });
  f.descripcion.value = r.descripcion; avisar(r.motor === 'gemini' ? 'Descripción redactada con IA' : 'Descripción sugerida. Ajústala a tu gusto');
};
formularios.producto = async (f, d) => {
  const cuerpo = { nombre: d.nombre.trim(), tipo: d.tipo, categoria_id: Number(d.categoria_id) || null, precio: Number(d.precio), precio_antes: d.precio_antes ? Number(d.precio_antes) : null,
    descripcion: d.descripcion.trim(), stock: Number(d.stock) || 0, stock_minimo: Number(d.stock_minimo) || 0, por_encargo: !!d.por_encargo, activo: !!d.activo,
    ocasiones: elegidas(f, 'oca'), etiquetas: d.etiquetas.split(',').map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 12),
    imagenes: [...f.querySelectorAll('input[name=img]')].map(i => i.value).filter(Boolean) };
  if (d.id) await api('/panel/productos/' + d.id, { metodo: 'PUT', cuerpo }); else await api('/panel/productos', { metodo: 'POST', cuerpo });
  avisar(d.id ? 'Cambios guardados' : '¡Producto publicado!'); ir('#/panel/productos');
};

// ---------- contactos y pedidos
ruta('/panel/pedidos', async () => {
  if (!permitido()) return null;
  const lista = await api('/panel/pedidos');
  const ORIGEN = { busqueda_ia: 'Búsqueda con IA', para_ti: 'Recomendado', calendario: 'Calendario', perfil: 'Perfil', promo: 'Promoción' };
  const EST = { contactado: ['Por confirmar', 'oro'], confirmado: ['Venta confirmada', 'salvia'], cancelado: ['No se concretó', 'crema'] };
  return marco('#/panel/pedidos', `${titulo('Contactos y pedidos', 'Cada vez que alguien toca tu botón de WhatsApp queda aquí. Marca cuáles terminaron en venta: de ahí salen tus estadísticas.')}
    ${lista.length ? `<div class="card" style="padding:0;overflow:auto"><table class="tabla"><thead><tr><th>Producto</th><th>Total</th><th>Llegó por</th><th>Cuándo</th><th>Estado</th><th></th></tr></thead><tbody>
      ${lista.map(p => `<tr><td><div class="row g12">${th(p.producto?.imagenes?.[0], '💬')}<div><b>${esc(p.producto?.nombre || 'Consulta general')}</b><div class="min sua">${p.cantidad > 1 ? p.cantidad + ' unidades' : ''}${p.nota ? ' ' + esc(p.nota) : ''}</div></div></div></td>
        <td><b>${p.total ? pesos(p.total) : '—'}</b></td><td>${ORIGEN[p.origen] || p.origen}</td><td class="sua">${hace(p.creado_en)}</td><td><span class="chip ${EST[p.estado][1]}">${EST[p.estado][0]}</span></td>
        <td><div class="row g6">${p.estado !== 'confirmado' ? `<button class="btn btn-d btn-s" data-a="pedido" data-id="${p.id}" data-e="confirmado">Fue venta</button>` : ''}${p.estado === 'contactado' ? `<button class="btn btn-g btn-s" data-a="pedido" data-id="${p.id}" data-e="cancelado">No se dio</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>` : vacio('💬', 'Aún no tienes contactos', 'Cuando un cliente toque tu botón de WhatsApp lo verás aquí.')}`);
});
acciones.pedido = async el => { await api('/panel/pedidos/' + el.dataset.id, { metodo: 'PUT', cuerpo: { estado: el.dataset.e } }); avisar(el.dataset.e === 'confirmado' ? 'Venta registrada en tus estadísticas' : 'Marcado como no concretado'); nucleo.repintar(); };

// ---------- reseñas
ruta('/panel/resenas', async () => {
  if (!permitido()) return null;
  const lista = await api('/panel/resenas'), n = estado.yo.negocio;
  return marco('#/panel/resenas', `${titulo('Reseñas', `${num(n.calificacion)} de promedio en ${n.num_resenas} reseñas. Responder genera confianza.`)}
    ${lista.length ? lista.map(r => `<div class="card col g12"><div class="row g12"><span class="avatar" style="width:40px;height:40px;background:var(--brasa);color:#fff;font-size:14px">${iniciales(r.cliente)}</span><div class="crece"><b>${esc(r.cliente)}</b><div class="min sua">${hace(r.creado_en)}${r.producto ? ' · ' + esc(r.producto) : ''}</div></div>${estrellas(r.calificacion)}</div>
      <p style="color:var(--char)">${esc(r.comentario)}</p>
      ${r.respuesta ? `<div class="peq" style="background:var(--cream);padding:12px 14px;border-radius:14px"><b>Tu respuesta:</b> ${esc(r.respuesta)}</div>`
        : `<form class="row g10 fila-f" data-f="responder"><input type="hidden" name="id" value="${r.id}"><div class="campo"><input name="texto" required maxlength="500" placeholder="Escribe una respuesta amable…"></div><button class="btn btn-d">Responder</button></form>`}</div>`).join('')
      : vacio('⭐', 'Todavía no tienes reseñas', 'Pídeles a tus clientes que opinen después de cada compra.')}`);
});
formularios.responder = async (f, d) => { await api(`/panel/resenas/${d.id}/responder`, { metodo: 'POST', cuerpo: { texto: d.texto } }); avisar('Respuesta publicada. Le avisamos al cliente'); nucleo.repintar(); };

// ---------- promociones
ruta('/panel/promociones', async () => {
  if (!permitido()) return null;
  const [lista, prods] = await Promise.all([api('/panel/promociones'), api('/panel/productos')]);
  return marco('#/panel/promociones', `${titulo('Promociones', 'Al crear una, avisamos a quienes guardaron el producto, te siguen o te compran seguido.')}
    <form class="card col g16" data-f="promo"><h3 class="d4">Nueva promoción</h3>
      <div class="row g16 fila-f">${campo('Producto', 'producto_id', '', { opciones: [['', 'Todo el negocio'], ...prods.map(p => [p.id, p.nombre])] })}${campo('Título', 'titulo', '', { req: 1, ph: '2x1 en gomitas enchiladas' })}</div>
      <div class="row g16 fila-f">${campo('Etiqueta corta', 'etiqueta', '', { req: 1, ph: '2x1, -15%, Envío gratis' })}${campo('Duración', 'dias', 7, { opciones: [[1, 'Solo hoy'], [3, '3 días'], [7, '1 semana'], [15, '15 días'], [30, '1 mes']] })}</div>
      ${campo('Detalle (opcional)', 'descripcion', '', { ph: 'Válido hasta agotar existencias' })}<div data-error></div><button class="btn btn-p" style="align-self:flex-end">${ic('tag', '#fff')}Publicar y avisar a mis clientes</button></form>
    ${lista.map(p => { const activa = p.activa && new Date(p.termina) > new Date(); return `<div class="card row g12 envuelve">${th(p.producto?.imagenes?.[0], '🏷️')}<div class="crece" style="min-width:200px"><b>${esc(p.titulo)}</b><div class="peq sua">${esc(p.producto?.nombre || 'Todo el negocio')} · ${activa ? 'termina el ' + fechaCorta(p.termina) : 'terminó el ' + fechaCorta(p.termina)}</div></div>
      <span class="chip ${activa ? 'solido' : 'crema'}">${esc(p.etiqueta)}</span><button class="redondo" data-a="borrar-promo" data-id="${p.id}" aria-label="Eliminar">${ic('trash')}</button></div>`; }).join('')}`);
});
formularios.promo = async (f, d) => { await api('/panel/promociones', { metodo: 'POST', cuerpo: { ...d, producto_id: d.producto_id || null, dias: Number(d.dias) } }); avisar('Promoción publicada. Ya avisamos a tus clientes'); nucleo.repintar(); };
acciones['borrar-promo'] = async el => { await api('/panel/promociones/' + el.dataset.id, { metodo: 'DELETE' }); avisar('Promoción eliminada'); nucleo.repintar(); };

// ---------- catálogos ya hechos (PDF, imagen o enlace de Canva, Drive…)
let modoCat = 'archivo';
ruta('/panel/catalogos', async () => {
  if (!permitido()) return null;
  const lista = await api('/panel/catalogos');
  const archivo = modoCat === 'archivo';
  return marco('#/panel/catalogos', `${titulo('Catálogos', 'Sube los catálogos que ya tienes hechos. Aparecen en tu perfil público para que los clientes los vean o descarguen.')}
    <div class="row ini g20 dos">
      <form class="card col g16" data-f="catalogo" style="width:420px;flex:none">
        <h3 class="d4">Agregar un catálogo</h3>
        <div class="seg"><button type="button" class="${archivo ? 'on' : ''}" data-a="modo-cat" data-m="archivo">${ic('upload')}Subir archivo</button><button type="button" class="${archivo ? '' : 'on'}" data-a="modo-cat" data-m="enlace">${ic('link')}Pegar enlace</button></div>
        ${campo('Nombre del catálogo', 'titulo', '', { req: 1, ph: 'Catálogo de Navidad 2026' })}
        ${archivo ? `<label class="zona-sube" id="zona-cat"><input type="file" name="archivo" accept="application/pdf,image/jpeg,image/png,image/webp" data-cat required>
            <span class="cat-ic">${ic('upload', 'var(--brasa)')}</span><b id="nombre-cat">Elige un PDF o una imagen</b><span class="min sua">Hasta 20 MB</span></label>
          <small class="sua">¿Lo hiciste en Canva? Ve a <b>Compartir → Descargar → PDF estándar</b> y súbelo aquí.</small>`
          : `${campo('Enlace del catálogo', 'url', '', { tipo: 'url', req: 1, ph: 'https://www.canva.com/design/…/view', ayuda: 'Canva: Compartir → Ver solo → Copiar enlace. También sirven Google Drive, Dropbox o tu tienda en línea.' })}`}
        <div data-error></div>
        <button class="btn btn-p">${ic('plus', '#fff')}Publicar catálogo</button>
      </form>
      <div class="col g16 crece">
        <div class="row entre"><h3 class="d4">Tus catálogos</h3><span class="sua peq">${lista.length} de 12</span></div>
        ${lista.length ? `<div class="cat-grid">${lista.map(c => tarjetaCatalogo(c, true)).join('')}</div>`
          : vacio('📚', 'Aún no tienes catálogos', 'Sube el PDF de tu catálogo o pega el enlace de Canva. Tus clientes lo verán en tu perfil junto a tus productos.')}
      </div></div>`);
});
acciones['modo-cat'] = el => { modoCat = el.dataset.m; nucleo.repintar(); };
document.addEventListener('change', ev => {
  const inp = ev.target.closest('input[data-cat]');
  if (!inp) return;
  const f = inp.files[0], zona = document.getElementById('zona-cat');
  document.getElementById('nombre-cat').textContent = f ? `${f.name} · ${(f.size / 1048576).toFixed(1).replace('.', ',')} MB` : 'Elige un PDF o una imagen';
  zona.classList.toggle('lleno', !!f);
  const t = inp.form.querySelector('[name="titulo"]');
  if (f && !t.value) t.value = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 80);
});
formularios.catalogo = async (f, d) => {
  const boton = f.querySelector('button:not([type])');
  let url = (d.url || '').trim(), tipo = 'enlace';
  if (modoCat === 'archivo') {
    let archivo = f.querySelector('input[data-cat]').files[0];
    if (!archivo) throw new Error('Elige el archivo del catálogo');
    if (archivo.size > 20 * 1048576) throw new Error('El archivo pesa más de 20 MB. Desde Canva descárgalo como «PDF estándar».');
    if (archivo.type.startsWith('image/') && archivo.size > 4 * 1048576) archivo = await comprimir(archivo, 2400);
    const antes = boton.innerHTML; boton.innerHTML = 'Subiendo…';
    try { const r = await api('/panel/catalogos/archivo', { metodo: 'POST', archivo }); url = r.url; tipo = r.tipo; }
    finally { boton.innerHTML = antes; }
  } else if (!/^https:\/\//i.test(url)) throw new Error('El enlace debe empezar por https://');
  await api('/panel/catalogos', { metodo: 'POST', cuerpo: { titulo: d.titulo.trim(), tipo, url } });
  avisar('Catálogo publicado en tu perfil');
  nucleo.repintar();
};
acciones['borrar-cat'] = async el => {
  if (!confirm('¿Quitar este catálogo de tu perfil?')) return;
  await api('/panel/catalogos/' + el.dataset.id, { metodo: 'DELETE' });
  avisar('Catálogo quitado'); nucleo.repintar();
};

// ---------- perfil del negocio (registro y edición)
ruta('/panel/negocio', async () => {
  if (!permitido(true)) return null;
  const cats = await cargarCategorias(), n = estado.yo.negocio || {}, nuevo = !n.id, p = estado.yo.perfil;
  return marco('#/panel/negocio', `${titulo(nuevo ? `Presenta tu negocio, <span class="serif">${esc(p.nombre)}.</span>` : 'Perfil del negocio', nuevo ? 'Paso 2 de 3 · Esto es lo primero que verán tus clientes.' : 'Así te ven los clientes en Impulsa.', nuevo ? '' : `<a class="btn btn-g" href="#/negocio/${n.slug}">${ic('eye')}Ver perfil público</a>`)}
    <form class="col g20" data-f="negocio" style="max-width:860px"><input type="hidden" name="nuevo" value="${nuevo ? 1 : ''}">
      <div class="card col g12"><b>Imagen de marca</b><div class="row g16 fila-f"><div style="width:150px">${cajaFoto('logo_url', n.logo_url || '', 'Logo')}</div><div class="crece">${cajaFoto('portada_url', n.portada_url || '', 'Foto de portada')}</div></div></div>
      <div class="row g16 fila-f">${campo('Nombre del emprendimiento', 'nombre', n.nombre || '', { req: 1 })}${campo('Categoría principal', 'categoria_id', n.categoria_id || '', { opciones: cats.map(c => [c.id, c.emoji + ' ' + c.nombre]) })}</div>
      ${campo('Descripción corta', 'descripcion', n.descripcion || '', { area: 1, req: 1, max: 240, ph: 'Qué vendes y qué te hace diferente' })}
      <div class="card col g16" style="background:#E6F7EC;border:1.5px solid var(--wa)"><div class="row g12"><span class="redondo" style="background:var(--wa);border:0">${ic('wa', '#fff')}</span><div class="crece"><b>WhatsApp de ventas</b><div class="peq sua">Será el botón principal de tu perfil y de cada producto.</div></div><span class="chip" style="color:var(--waD)">Obligatorio</span></div>
        ${campo('Número', 'whatsapp', (n.whatsapp || p.celular || '').replace(/^57/, ''), { tipo: 'tel', req: 1, modo: 'numeric', ph: '315 678 9012', ayuda: 'Celular colombiano de 10 dígitos' })}
        ${campo('Mensaje que verá el cliente al escribirte', 'mensaje_whatsapp', n.mensaje_whatsapp || '¡Hola! Te vi en Impulsa y me interesa {producto}. ¿Está disponible?', { area: 1, max: 200, ayuda: 'Deja {producto} donde quieras que aparezca el nombre y el precio' })}</div>
      <div class="card col g16"><b>Redes sociales</b><div class="row g16 fila-f">${campo('Instagram (usuario)', 'instagram', n.instagram || '', { ph: 'minegocio' })}${campo('TikTok (usuario)', 'tiktok', n.tiktok || '', { ph: 'minegocio' })}</div>
        <div class="row g16 fila-f">${campo('Facebook (nombre de la página)', 'facebook', n.facebook || '')}${campo('Sitio web', 'sitio_web', n.sitio_web || '')}</div></div>
      <div class="card col g16"><b>Ubicación y horario</b>
        <label class="row entre" style="cursor:pointer"><span class="peq neg">Tengo local físico</span><input type="checkbox" name="tiene_local" ${n.tiene_local === false ? '' : 'checked'} style="width:20px;height:20px;accent-color:var(--brasa)"></label>
        <div class="row g16 fila-f">${campo('Dirección', 'direccion', n.direccion || '', { ph: 'Calle 11 # 12-45' })}${campo('Barrio', 'barrio', n.barrio || p.barrio || '')}</div>
        <div class="col g8"><span class="peq neg">Días de atención</span><div class="row g8 envuelve">${DIAS.map(([v, t]) => `<button type="button" class="pill ${(n.dias_atencion || ['L', 'M', 'X', 'J', 'V', 'S']).includes(v) ? 'on' : ''}" data-a="pill" data-g="dia" data-v="${v}" style="width:auto">${t}</button>`).join('')}</div></div>
        <div class="row g16 fila-f">${campo('Abre', 'abre', String(n.abre || '08:00').slice(0, 5), { tipo: 'time' })}${campo('Cierra', 'cierra', String(n.cierra || '18:30').slice(0, 5), { tipo: 'time' })}</div></div>
      <div class="card col g16"><b>Pagos y entregas</b><span class="peq neg">Medios de pago</span>${pills('pago', PAGOS, n.medios_pago || ['Nequi', 'Efectivo'])}<span class="peq neg">Formas de entrega</span>${pills('entrega', ENTREGAS, n.formas_entrega || ['Domicilio en Ocaña'])}
        <div class="row g16 fila-f">${campo('Costo del domicilio', 'costo_domicilio', n.costo_domicilio ?? 5000, { tipo: 'number', min: 0 })}${campo('Tiempo de entrega', 'tiempo_entrega', n.tiempo_entrega || 'Mismo día', { opciones: ['Mismo día', '1 a 2 días', '3 a 5 días', 'Por encargo'].map(x => [x, x]) })}</div></div>
      <div data-error></div><button class="btn btn-p" style="align-self:flex-end">${nuevo ? 'Crear mi negocio y publicar productos' : 'Guardar cambios'} ${ic('arrow', '#fff')}</button></form>`);
});
formularios.negocio = async (f, d) => {
  const cuerpo = { nombre: d.nombre.trim(), categoria_id: Number(d.categoria_id) || null, descripcion: d.descripcion.trim(), whatsapp: d.whatsapp, mensaje_whatsapp: d.mensaje_whatsapp.trim(),
    logo_url: d.logo_url || null, portada_url: d.portada_url || null, instagram: d.instagram.replace('@', '').trim(), tiktok: d.tiktok.replace('@', '').trim(), facebook: d.facebook.trim(), sitio_web: d.sitio_web.trim(),
    tiene_local: !!d.tiene_local, direccion: d.direccion.trim(), barrio: d.barrio.trim(), dias_atencion: elegidas(f, 'dia'), abre: d.abre, cierra: d.cierra,
    medios_pago: elegidas(f, 'pago'), formas_entrega: elegidas(f, 'entrega'), costo_domicilio: Number(d.costo_domicilio) || 0, tiempo_entrega: d.tiempo_entrega };
  await api('/panel/negocio', { metodo: d.nuevo ? 'POST' : 'PUT', cuerpo });
  await cargarYo();
  avisar(d.nuevo ? '¡Tu negocio ya está en Impulsa! Ahora publica tu primer producto' : 'Cambios guardados');
  ir(d.nuevo ? '#/panel/producto/nuevo' : '#/panel/negocio');
};
