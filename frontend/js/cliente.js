// Experiencia del cliente: inicio, búsqueda con IA, negocios, productos, calendario y perfil.
import { api, estado, actualizarYo, cargarCategorias } from './api.js';
import { acciones, formularios, ruta, ir, nucleo } from './nucleo.js';
import { ic, esc, pesos, num, fecha, fechaCorta, hace, enDias, mesN, iniciales, foto, fondo, mini, estrellas, tarjetaProducto, tarjetaNegocio,
  avisar, abrirCapa, cerrarCapa, vacio, campo, tarjetaCatalogo } from './ui.js';
import { conNav } from './app.js';
import { formularioGustos, pie } from './publico.js';

const cab = (kick, titulo, extra = '') => `<div class="cab" style="margin-bottom:24px"><div class="col g8">${kick ? `<span class="kick">${kick}</span>` : ''}<h2 class="d3">${titulo}</h2></div>${extra}</div>`;
const botonWa = (texto, datos, clase = '') => `<button class="btn btn-wa ${clase}" data-a="wa" ${datos}>${ic('wa', '#fff')}${texto}</button>`;

// ---------- inicio personalizado
ruta('/inicio', async () => {
  if (!estado.yo) return ir('#/entrar');
  if (estado.yo.perfil.rol === 'emprendedor') return ir('#/panel');
  const d = await api('/cliente/inicio'), p = estado.yo.perfil, h = new Date().getHours();
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const m = [];
  if (d.proxima_fecha) {
    const f = d.proxima_fecha;
    m.push(`<div class="momento" style="background:var(--brasa);color:#fff"><div class="row entre"><span class="chip brasa" style="background:#fff">${ic('gift')}Recordatorio</span><b class="peq">${enDias(f.dias).toLowerCase()}</b></div>
      <h3 class="d3" style="font-size:28px">${esc(f.titulo)}</h3><span class="peq">${fecha(f.proxima)}${f.regalo_idea ? ` · idea: ${esc(f.regalo_idea)}` : ''}${f.presupuesto_max ? ` · hasta ${pesos(f.presupuesto_max)}` : ''}</span>
      <div class="col g8">${(f.sugerencias || []).slice(0, 2).map(s => `<a class="mini" href="#/producto/${s.id}?o=calendario">${mini(s.imagen, s.categoria_emoji, s.id)}<div class="crece"><b style="font-size:14px">${esc(s.nombre)}</b><div class="min sua">${esc(s.emprendimiento)}</div></div><b style="font-family:var(--fd);color:var(--brasa)">${pesos(s.precio)}</b></a>`).join('')}</div>
      <a class="neg peq" href="#/calendario?f=${f.id}" style="margin-top:auto">Ver todas las opciones que encontró la IA →</a></div>`);
  }
  const rep = (d.reposicion || [])[0];
  if (rep) m.push(`<div class="momento" style="background:#fff;border:1px solid var(--line)"><div class="row entre"><span class="chip salvia">${ic('refresh')}Volvió a estar disponible</span></div>
    <a href="#/producto/${rep.id}">${foto(rep, 'style="aspect-ratio:16/9"')}</a><h3 class="d4">${esc(rep.nombre)}</h3><span class="peq sua">${esc(rep.emprendimiento)} · pediste que te avisáramos</span>
    <div class="row g10" style="margin-top:auto">${botonWa('Pedir por WhatsApp', `data-prod="${rep.id}" data-origen="para_ti"`, 'crece')}<b class="precio" style="font-size:18px">${pesos(rep.precio)}</b></div></div>`);
  const pro = (d.promos || [])[0];
  if (pro) m.push(`<div class="momento" style="background:var(--oro)"><div class="row entre"><span class="chip tinta" style="color:var(--oro)">${ic('tag')}Promo para ti</span><b class="peq">Hasta el ${fechaCorta(pro.promo_termina)}</b></div>
    <a href="#/producto/${pro.id}?o=promo" style="position:relative">${foto(pro, 'style="aspect-ratio:16/9"')}<span class="chip solido" style="position:absolute;top:12px;right:12px;font-family:var(--fd);font-size:18px;font-weight:700">${esc(pro.promo)}</span></a>
    <h3 class="d4">${esc(pro.promo_titulo || pro.nombre)}</h3><span class="peq" style="color:var(--char)">${esc(pro.emprendimiento)} · ${esc(pro.nombre)}</span>
    <a class="btn btn-d" href="#/producto/${pro.id}?o=promo" style="margin-top:auto">Ver promoción</a></div>`);
  if (!d.proxima_fecha) m.push(`<div class="momento" style="background:var(--ink);color:var(--cream)"><span class="chip orof" style="color:var(--ink);align-self:flex-start">${ic('cal')}Calendario</span>
    <h3 class="d3" style="font-size:28px">Que no se te pase ninguna fecha.</h3><span class="peq" style="color:var(--sand)">Agrega cumpleaños y aniversarios: te avisamos a tiempo y la IA busca el regalo por ti.</span>
    <a class="btn btn-p" href="#/calendario?nuevo=1" style="margin-top:auto">Agregar una fecha</a></div>`);
  const fr = d.frecuente;
  return conNav(`<main class="wrap pag">
    <section class="row fin g24 envuelve"><div class="col g4 crece" style="min-width:300px"><span class="peq sua neg" style="text-transform:capitalize">${hoy} · ${esc(p.barrio || 'Ocaña')}</span>
      <h1 class="d2" style="font-size:clamp(36px,4.6vw,56px)">${h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}, ${esc(p.nombre)}.<br><span class="serif">esto te va a encantar hoy.</span></h1></div>
      <div class="col g16" style="background:var(--ink);border-radius:30px;padding:26px;width:600px;max-width:100%">
        <span class="row g8 peq neg" style="color:var(--oro)">${ic('spark')}Tu asistente Impulsa</span>
        <form class="barra-ia" data-f="buscar" style="box-shadow:none;border:0;border-radius:18px;padding:7px 7px 7px 18px"><input name="q" required placeholder="¿Qué necesitas? Escríbelo como se lo dirías a un amigo…" style="font-size:15px" autocomplete="off"><button class="btn btn-p btn-s" style="border-radius:13px;padding:12px 16px">Buscar ${ic('arrow', '#fff')}</button></form>
        <div class="row g8 envuelve">${[d.proxima_fecha?.regalo_idea ? `Regalo para ${d.proxima_fecha.persona || 'esa fecha'}: ${d.proxima_fecha.regalo_idea}` : 'Regalo de cumpleaños hasta 60 mil', 'Gomitas enchiladas', 'Uñas este sábado'].map(t => `<a class="chip" style="background:rgba(255,255,255,.1);color:var(--cream)" href="#/buscar?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div></div></section>
    <section>${cab('Para ti, hoy', 'Tus momentos')}<div class="grid c3">${m.slice(0, 3).join('')}</div></section>
    <section>${cab('Recomendado por la IA', `Elegido para ti, <span class="serif" style="font-size:1.15em">${esc(p.nombre)}</span>`,
      `<div class="row g8 envuelve"><span class="peq sua">Basado en:</span>${(d.gustos || []).slice(0, 3).map(g => `<span class="chip borde">${esc(g)}</span>`).join('') || '<a class="chip borde" href="#/perfil">Cuéntanos tus gustos</a>'}</div>`)}
      <div class="grid c4">${d.recomendados.map(x => tarjetaProducto(x, 'para_ti')).join('')}</div></section>
    ${fr ? `<section class="card row g32 envuelve" style="border-radius:30px;padding:28px"><div class="col g16" style="width:320px;max-width:100%"><span class="kick" style="font-size:11px">Porque compras seguido aquí</span>
      <a class="row g12" href="#/negocio/${fr.emprendimiento.slug}"><div class="logo-n" style="background:var(--brasaS);color:var(--brasaD)">${iniciales(fr.emprendimiento.nombre)}</div><div><h3 class="d4">${esc(fr.emprendimiento.nombre)}</h3><span class="peq sua">${fr.compras} pedidos · el último ${hace(fr.ultima).toLowerCase()}</span></div></a>
      ${fr.favorito ? `<div style="background:var(--cream);border-radius:14px;padding:12px"><b style="font-size:14px">${esc(fr.favorito)}</b><div class="min sua">lo que más pides</div></div>` : ''}
      <div class="row g8">${botonWa('Repetir pedido', `data-prod="${fr.productos?.[0]?.id || ''}" data-emp="${fr.emprendimiento.id}" data-origen="para_ti"`)}<a class="btn btn-g" href="#/negocio/${fr.emprendimiento.slug}">Ver tienda</a></div></div>
      <div class="grid c3 crece" style="min-width:280px">${(fr.productos || []).map(x => `<a class="col g8" href="#/producto/${x.id}?o=para_ti">${foto(x, 'style="aspect-ratio:4/3"')}<b style="font-size:14px">${esc(x.nombre)}</b><b style="font-family:var(--fd);font-size:17px">${pesos(x.precio)}</b></a>`).join('')}</div></section>` : ''}
    ${d.servicios?.length ? `<section>${cab('Servicios cerca de ti', 'Agenda sin llamar a nadie', `<a class="neg" style="color:var(--brasa)" href="#/buscar?tipo=servicio">Ver todos los servicios →</a>`)}
      <div class="grid c3">${d.servicios.map(s => `<a class="card row g16" style="padding:12px" href="#/producto/${s.id}?o=para_ti"><div class="th52" style="width:104px;height:104px;border-radius:16px;font-size:40px;${fondo(s.imagen, '', s.id)}">${s.imagen ? '' : esc(s.categoria_emoji || '✨')}</div>
        <div class="col g6 crece"><b>${esc(s.nombre)}</b><span class="peq sua">${esc(s.emprendimiento)} · ${esc(s.emp_barrio || '')}</span><span class="est">${ic('star', '#F4B73F')}${num(s.calificacion)}<span class="sua" style="font-weight:400">· desde ${pesos(s.precio)}</span></span></div></a>`).join('')}</div></section>` : ''}
  </main>`);
});

// ---------- búsqueda con IA y exploración
const OCASIONES = ['Cumpleaños', 'Aniversario', 'Amor y Amistad', 'Día de la Madre', 'Día del Padre', 'Navidad', 'Halloween', 'Grados', 'Para ella', 'Para él', 'Regalo corporativo'];
ruta('/buscar', async (_, q) => {
  const texto = (q.get('q') || '').trim(), cats = await cargarCategorias();
  const f = { max: q.get('max'), cat: q.get('cat'), tipo: q.get('tipo'), oca: q.get('oca'), disp: q.get('disp') };
  const r = await api('/buscar', { metodo: 'POST', cuerpo: { q: texto, precio_max: f.max ? Number(f.max) : null, categoria: f.cat || null, tipo: f.tipo || null,
    ocasion: f.oca || null, solo_disponibles: !!f.disp, limite: 36 } });
  const res = r.resultados, mejor = texto && res[0], resto = mejor ? res.slice(1) : res, catSel = cats.find(c => c.slug === f.cat);
  const sel = (nombre, valor, ops) => `<div class="campo"><select name="${nombre}" style="height:46px">${ops.map(([v, t]) => `<option value="${v}" ${String(v) === String(valor || '') ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
  return conNav(`<main class="wrap pag" style="gap:32px">
    ${texto ? `<section class="entendi"><div class="col g16">
        <span class="row g8 peq neg" style="color:var(--oro)">${ic('spark')}Esto es lo que entendí${r.motor === 'gemini' ? ' · Gemini' : ''}</span>
        <div class="row g8 envuelve">${r.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
        <p style="font-family:var(--fs);font-style:italic;font-size:clamp(22px,2.4vw,28px);line-height:1.25">${esc(r.mensaje)}</p>
        <div class="row g8 envuelve"><span class="peq" style="color:var(--sand)">Afinar:</span>${[['Más económico', texto + ' económico hasta ' + Math.round((r.filtros.precio_max || 80000) * 0.6 / 1000) + ' mil'], ['Que llegue hoy', texto + ' hoy'], ['Algo personalizado', texto + ' personalizado']].map(([t, v]) => `<a class="chip" style="background:#fff;color:var(--ink)" href="#/buscar?q=${encodeURIComponent(v)}">${t}</a>`).join('')}</div></div>
      ${mejor ? `<div class="mejor"><a href="#/producto/${mejor.id}?o=busqueda_ia" style="position:relative">${foto(mejor, 'style="border-radius:0;height:100%;aspect-ratio:auto;min-height:220px"')}<span class="chip orof" style="position:absolute;top:12px;left:12px;font-weight:600">${ic('spark')}Mejor opción</span></a>
        <div class="col g10" style="padding:22px"><span class="min sua neg">${esc(mejor.emprendimiento)}${mejor.emp_barrio ? ' · ' + esc(mejor.emp_barrio) : ''}</span><a href="#/producto/${mejor.id}?o=busqueda_ia"><h3 class="d4">${esc(mejor.nombre)}</h3></a>
        <div class="row g10"><b class="precio" style="font-size:24px;color:var(--brasa)">${pesos(mejor.precio)}</b>${mejor.num_resenas ? `<span class="est">${ic('star', '#F4B73F')}${num(mejor.calificacion)} (${mejor.num_resenas})</span>` : ''}</div>
        ${(mejor.razones || []).map(z => `<span class="row g8 peq">${ic('check', '#3E7B5E', 'width:15px;height:15px')}${esc(z)}</span>`).join('')}
        <div class="row g8" style="margin-top:auto">${botonWa('Pedir por WhatsApp', `data-prod="${mejor.id}" data-origen="busqueda_ia"`, 'crece')}<button class="redondo fav ${estado.favs.has(mejor.id) ? 'on' : ''}" data-a="fav" data-id="${mejor.id}">${ic('heart')}</button></div></div></div>` : '<div></div>'}</section>`
      : `<section class="col g16"><h1 class="d2">${catSel ? catSel.emoji + ' ' + esc(catSel.nombre) : f.tipo === 'servicio' ? 'Servicios en Ocaña' : 'Explora lo que hacen <span class="serif" style="font-size:1.1em">en tu ciudad.</span>'}</h1>
        <div class="row g8 envuelve"><a class="pill ${!f.cat ? 'on' : ''}" href="#/buscar${f.tipo ? '?tipo=' + f.tipo : ''}">Todo</a>${cats.map(c => `<a class="pill ${f.cat === c.slug ? 'on' : ''}" href="#/buscar?cat=${c.slug}">${c.emoji} ${esc(c.nombre)}</a>`).join('')}</div></section>`}
    <section class="row ini g24">
      <form class="filtros card" data-f="filtros" data-auto><input type="hidden" name="q" value="${esc(texto)}">
        <div class="row entre"><b class="row g8">${ic('sliders')}Filtros</b><a class="peq neg" style="color:var(--brasa)" href="#/buscar${texto ? '?q=' + encodeURIComponent(texto) : ''}">Limpiar</a></div>
        <div class="col g8"><b class="peq">Precio máximo</b>${sel('max', f.max, [['', 'Sin tope'], [20000, 'Hasta $20.000'], [50000, 'Hasta $50.000'], [80000, 'Hasta $80.000'], [100000, 'Hasta $100.000'], [150000, 'Hasta $150.000'], [300000, 'Hasta $300.000']])}</div>
        <div class="col g8"><b class="peq">Categoría</b>${sel('cat', f.cat, [['', 'Todas'], ...cats.map(c => [c.slug, c.emoji + ' ' + c.nombre])])}</div>
        <div class="col g8"><b class="peq">Ocasión</b>${sel('oca', f.oca, [['', 'Cualquiera'], ...OCASIONES.map(o => [o, o])])}</div>
        <div class="col g8"><b class="peq">Tipo</b>${sel('tipo', f.tipo, [['', 'Productos y servicios'], ['producto', 'Solo productos'], ['servicio', 'Solo servicios']])}</div>
        <label class="row entre peq neg" style="cursor:pointer">Solo disponibles<input type="checkbox" name="disp" value="1" ${f.disp ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--brasa)"></label>
      </form>
      <div class="col g20 crece"><div class="row g8" style="align-items:baseline"><h2 class="d4" style="font-size:26px">${res.length} ${res.length === 1 ? 'resultado' : 'resultados'}</h2>${estado.yo ? '<span class="peq sua">ordenados por qué tanto encajan contigo</span>' : ''}</div>
        ${resto.length ? `<div class="grid c3">${resto.map(p => tarjetaProducto(p, texto ? 'busqueda_ia' : 'perfil')).join('')}</div>`
          : res.length ? '' : vacio('🔎', 'No encontramos resultados', 'Prueba con otras palabras, quita filtros o sube un poco el presupuesto.', '<a class="btn btn-p" href="#/buscar">Ver todo</a>')}</div>
    </section></main>`, texto);
});
formularios.filtros = (f, d) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(d)) if (v) p.set(k, v);
  p.set('mantener', '1');
  ir('#/buscar?' + p.toString());
};
document.addEventListener('change', ev => { const f = ev.target.closest('form[data-auto]'); if (f) f.requestSubmit(); });

ruta('/negocios', async (_, q) => {
  const cats = await cargarCategorias(), cat = q.get('cat'), lista = await api('/negocios' + (cat ? '?categoria=' + cat : ''));
  return conNav(`<main class="wrap pag" style="gap:28px"><div class="col g16"><span class="kick">Directorio</span><h1 class="d2">Emprendimientos de <span class="serif" style="font-size:1.1em">Ocaña.</span></h1>
    <div class="row g8 envuelve"><a class="pill ${!cat ? 'on' : ''}" href="#/negocios">Todos</a>${cats.map(c => `<a class="pill ${cat === c.slug ? 'on' : ''}" href="#/negocios?cat=${c.slug}">${c.emoji} ${esc(c.nombre)}</a>`).join('')}</div></div>
    ${lista.length ? `<div class="grid c3">${lista.map(tarjetaNegocio).join('')}</div>` : vacio('🏪', 'Aún no hay negocios en esta categoría', '¿Tienes uno? Regístralo gratis y sé el primero.', '<a class="btn btn-p" href="#/registro?rol=emprendedor">Registrar mi negocio</a>')}</main>`) + (estado.yo ? '' : pie());
});

// ---------- perfil público del emprendimiento
const DIAS = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };
const tarjetaResena = r => `<div class="resena"><div class="row g12"><span class="avatar" style="width:40px;height:40px;background:var(--brasa);color:#fff;font-size:14px">${iniciales(r.cliente)}</span>
  <div class="crece"><b style="font-size:14px">${esc(r.cliente)}</b><div class="min sua">${hace(r.creado_en)}${r.producto ? ' · compró: ' + esc(r.producto) : ''}</div></div>${estrellas(r.calificacion)}</div>
  ${r.comentario ? `<p style="color:var(--char);font-size:14px;line-height:1.55">${esc(r.comentario)}</p>` : ''}
  ${r.respuesta ? `<div class="row g10 ini peq" style="background:#fff;border-radius:14px;padding:12px 14px">${ic('vfy', '#EF5A2A', 'width:16px;height:16px;margin-top:2px')}<span><b>Respuesta del negocio:</b> ${esc(r.respuesta)}</span></div>` : ''}</div>`;

ruta('/negocio/([^/]+)', async ([slug]) => {
  const d = await api('/negocios/' + encodeURIComponent(slug)), e = d.emprendimiento, total = e.num_resenas || 0;
  const fila = (icono, t, x) => `<div class="row g12 ini"><span class="redondo" style="width:36px;height:36px;border-radius:10px;background:var(--cream);border:0">${ic(icono, 'currentColor', 'width:17px;height:17px')}</span><div class="crece"><b style="font-size:14px">${t}</b><div class="peq sua">${x}</div></div></div>`;
  const red = (url, icono, n) => url ? `<a class="redondo" style="border:0" target="_blank" rel="noopener" href="${esc(url)}" aria-label="${n}">${ic(icono)}</a>` : '';
  const esCliente = estado.yo?.perfil.rol === 'cliente';
  return conNav(`<main class="wrap pag" style="gap:28px;padding-top:12px">
    <section class="portada-n" style="background-image:linear-gradient(180deg,rgba(22,18,15,0) 25%,rgba(22,18,15,.86))${e.portada_url ? `,url('${esc(e.portada_url)}')` : ''};${e.portada_url ? '' : 'background-color:#' + esc(e.color || '16120F')}">
      <div class="row fin g20 envuelve"><div class="logo-n" style="width:108px;height:108px;border-radius:30px;font-size:38px;border:4px solid #fff;${e.logo_url ? `background-image:url('${esc(e.logo_url)}')` : 'background:#' + esc(e.color || '16120F')}">${e.logo_url ? '' : iniciales(e.nombre)}</div>
        <div class="col g8"><div class="row g10"><h1 class="d2">${esc(e.nombre)}</h1>${e.verificado ? ic('vfy', '#F4B73F', 'width:26px;height:26px') : ''}</div>
          <div class="row g12 envuelve"><span class="neg">${esc(e.categoria || '')} · ${esc(e.barrio || '')}, Ocaña</span>${total ? `<span class="est" style="font-size:15px">${ic('star', '#F4B73F')}${num(e.calificacion)} · ${total} reseñas</span>` : ''}</div>
          <div class="row g8 envuelve"><span class="chip" style="${e.abierto_ahora ? 'background:var(--salvia);color:#fff' : 'color:var(--ink)'}">${e.abierto_ahora ? 'Abierto' : 'Cerrado'} · ${String(e.abre).slice(0, 5)} a ${String(e.cierra).slice(0, 5)}</span>${e.desde_anio ? `<span class="chip" style="color:var(--ink)">Desde ${e.desde_anio}</span>` : ''}</div></div></div>
      <div class="col g10" style="width:300px;max-width:100%">${botonWa('Escribir por WhatsApp', `data-emp="${e.id}"`, 'btn-b')}
        <div class="row g8" style="color:var(--ink)"><button class="btn btn-g btn-s crece" data-a="seguir" data-id="${e.id}">${d.sigo ? ic('check') + 'Siguiendo' : ic('plus') + 'Seguir'}</button>
          ${red(e.instagram && 'https://instagram.com/' + e.instagram, 'ig', 'Instagram')}${red(e.tiktok && 'https://tiktok.com/@' + e.tiktok, 'tt', 'TikTok')}${red(e.facebook && 'https://facebook.com/search/top?q=' + encodeURIComponent(e.facebook), 'fb', 'Facebook')}</div></div>
    </section>
    <section class="row ini g24 dos">
      <div class="col g24 crece">
        ${d.catalogos?.length ? `<div class="col g16"><div class="row entre envuelve g12"><h2 class="d3" style="font-size:28px">Catálogos</h2><span class="sua">Míralos o descárgalos</span></div>
          <div class="cat-grid">${d.catalogos.map(c => tarjetaCatalogo(c)).join('')}</div></div>` : ''}
        <div class="row entre envuelve g12"><h2 class="d3" style="font-size:28px">Productos y servicios</h2><span class="sua">${d.productos.length} publicados</span></div>
        ${d.productos.length ? `<div class="grid c3">${d.productos.map(p => tarjetaProducto(p)).join('')}</div>` : vacio('📦', 'Aún no hay productos', 'Este emprendimiento está preparando su vitrina. Escríbele por WhatsApp.')}
        <div class="card col g20" id="resenas" style="border-radius:28px;padding:28px"><h2 class="d4" style="font-size:26px">Lo que dicen los clientes</h2>
          ${total ? `<div class="row g32 envuelve"><div class="col g6 centro" style="align-items:center;width:150px"><b style="font-family:var(--fd);font-size:60px;font-weight:800;letter-spacing:-.04em;line-height:1">${num(e.calificacion)}</b>${estrellas(e.calificacion, 16)}<span class="peq sua">${total} reseñas</span></div>
            <div class="col g8 crece" style="min-width:220px">${[5, 4, 3, 2, 1].map(n => `<div class="row g12 peq"><b>${n}</b><div class="barra"><i style="width:${Math.round((d.distribucion[n] || 0) * 100 / total)}%"></i></div><span class="sua" style="width:34px;text-align:right">${Math.round((d.distribucion[n] || 0) * 100 / total)}%</span></div>`).join('')}</div></div>` : '<p class="sua">Todavía no tiene reseñas. ¡Sé la primera persona en opinar!</p>'}
          ${esCliente ? `<form class="col g12" data-f="resena" style="background:var(--bone);border-radius:20px;padding:20px"><input type="hidden" name="emprendimiento_id" value="${e.id}"><b>Cuéntanos cómo te fue</b>
            <div class="row g16 fila-f ini">${campo('Calificación', 'calificacion', 5, { opciones: [[5, '★★★★★ Excelente'], [4, '★★★★ Muy bueno'], [3, '★★★ Normal'], [2, '★★ Regular'], [1, '★ Malo']] })}
              ${campo('¿Qué compraste?', 'producto_id', '', { opciones: [['', 'Prefiero no decir'], ...d.productos.map(p => [p.id, p.nombre])] })}</div>
            ${campo('Tu opinión', 'comentario', '', { area: 1, req: 1, ph: 'La atención, la calidad, el tiempo de entrega…' })}<button class="btn btn-d" style="align-self:flex-end">Publicar reseña</button></form>` : ''}
          ${d.resenas.map(tarjetaResena).join('')}</div>
      </div>
      <aside class="col g16" style="width:380px;flex:none">
        <div class="card col g16"><h3 class="d4">Información</h3><p style="color:var(--char);font-size:14px;line-height:1.55">${esc(e.descripcion)}</p>
          ${fila('clock', 'Horario', `${(e.dias_atencion || []).map(x => DIAS[x]).join(', ')} · ${String(e.abre).slice(0, 5)} a ${String(e.cierra).slice(0, 5)}`)}
          ${e.tiene_local && e.direccion ? fila('pin', 'Dirección', `${esc(e.direccion)} · ${esc(e.barrio || '')}`) : fila('pin', 'Zona', 'Vende en línea · ' + esc(e.barrio || 'Ocaña'))}
          ${fila('card', 'Medios de pago', (e.medios_pago || []).map(esc).join(' · '))}
          ${fila('truck', 'Entregas', `${(e.formas_entrega || []).map(esc).join(' · ')}${e.costo_domicilio ? ' · domicilio ' + pesos(e.costo_domicilio) : ''}${e.tiempo_entrega ? ' · ' + esc(e.tiempo_entrega) : ''}`)}</div>
        <div class="card oscura col g12"><h3 class="d4">¿Tienes una pregunta?</h3><span class="peq" style="color:var(--sand)">Escríbele directo. El pago y la entrega los acuerdas con el negocio, sin comisiones.</span>${botonWa('Abrir WhatsApp', `data-emp="${e.id}"`, 'btn-b')}</div>
      </aside></section></main>`);
});
acciones.seguir = async el => {
  if (!estado.yo) { avisar('Inicia sesión para seguir emprendimientos'); return ir('#/entrar'); }
  const r = await api('/seguir/' + el.dataset.id, { metodo: 'POST' });
  el.innerHTML = r.activo ? ic('check') + 'Siguiendo' : ic('plus') + 'Seguir';
  avisar(r.activo ? 'Te avisaremos de sus promociones' : 'Dejaste de seguir este negocio');
};
formularios.resena = async (f, d) => {
  await api('/resenas', { metodo: 'POST', cuerpo: { ...d, calificacion: Number(d.calificacion), producto_id: d.producto_id || null } });
  avisar('¡Gracias! Tu reseña ya está publicada'); nucleo.repintar();
};

// ---------- detalle de producto
ruta('/producto/([^/]+)', async ([id], q) => {
  const d = await api('/productos/' + id), p = d.producto, e = d.emprendimiento, origen = q.get('o') || 'perfil', serv = p.tipo === 'servicio';
  const fotos = p.imagenes?.length ? p.imagenes : [null];
  const fs = d.fecha_sugerida;
  return conNav(`<main class="wrap pag" style="gap:40px;padding-top:12px">
    <div class="row g8 peq sua envuelve"><a href="#/">Inicio</a>${ic('chevr', 'currentColor', 'width:14px;height:14px')}<a href="#/buscar?cat=${p.categoria_slug}">${esc(p.categoria || 'Productos')}</a>${ic('chevr', 'currentColor', 'width:14px;height:14px')}<b style="color:var(--ink)">${esc(p.nombre)}</b></div>
    <section class="row ini g48 dos">
      <div class="row ini g12" style="width:52%">${fotos.length > 1 ? `<div class="col g10">${fotos.map((u, i) => `<button data-a="ver-foto" data-u="${esc(u)}" class="th52" style="width:76px;height:76px;border-radius:16px;background-image:url('${esc(u)}');${i ? '' : 'outline:2px solid var(--brasa)'}"></button>`).join('')}</div>` : ''}
        <div class="crece" style="position:relative" id="foto-principal">${foto(p, 'style="border-radius:30px;aspect-ratio:1/1"')}
          ${p.match && estado.yo ? `<span class="chip" style="position:absolute;top:16px;left:16px;font-weight:600">${ic('spark', '#F4B73F')}${p.match}% para ti</span>` : ''}
          <button class="redondo fav ${d.es_favorito ? 'on' : ''}" style="position:absolute;top:16px;right:16px" data-a="fav" data-id="${p.id}">${ic('heart')}</button></div></div>
      <div class="col g20 crece">
        <a class="card row g12" style="padding:12px;border-radius:18px" href="#/negocio/${e.slug}"><div class="logo-n" style="width:44px;height:44px;font-size:15px;${e.logo_url ? `background-image:url('${esc(e.logo_url)}')` : 'background:#' + esc(e.color || '16120F')}">${e.logo_url ? '' : iniciales(e.nombre)}</div>
          <div class="crece"><div class="row g6"><b>${esc(e.nombre)}</b>${e.verificado ? ic('vfy', '#EF5A2A', 'width:14px;height:14px') : ''}</div><span class="peq sua">${esc(e.categoria || '')} · ${esc(e.barrio || 'Ocaña')}</span></div><span class="peq neg" style="color:var(--brasa)">Ver tienda →</span></a>
        <div class="col g10"><h1 class="d2">${esc(p.nombre)}</h1>${e.num_resenas ? `<div class="row g10">${estrellas(e.calificacion, 16)}<span class="neg peq">${num(e.calificacion)} · ${e.num_resenas} reseñas del negocio</span></div>` : ''}</div>
        <div class="row g12 envuelve"><b class="precio" style="font-size:40px;font-weight:800">${serv ? '<span style="font-size:16px;font-weight:500;font-family:var(--fb)" class="sua">desde </span>' : ''}${pesos(p.precio)}</b>${p.precio_antes ? `<span class="antes" style="font-size:18px">${pesos(p.precio_antes)}</span>` : ''}
          ${p.promo ? `<span class="chip solido">${esc(p.promo)} · hasta el ${fechaCorta(p.promo_termina)}</span>` : ''}
          ${serv ? '<span class="chip salvia">Servicio con cita</span>' : p.agotado ? '<span class="chip brasa">Agotado</span>' : p.stock > 0 && p.stock <= 5 ? `<span class="chip brasa">Quedan ${p.stock}</span>` : p.stock > 0 ? '<span class="chip salvia">Disponible</span>' : ''}
          ${p.por_encargo ? '<span class="chip crema">También por encargo</span>' : ''}</div>
        <p style="font-size:16px;color:var(--char);line-height:1.6">${esc(p.descripcion)}</p>
        ${p.agotado ? `<div class="card col g12" style="background:var(--brasaS);border:0"><b>Este producto está agotado por ahora</b><span class="peq">Activa el aviso y te notificamos apenas el negocio reponga unidades.</span>
            <button class="btn btn-p" data-a="alerta" data-id="${p.id}" data-repinta="1">${ic('bell', '#fff')}${d.tiene_alerta ? 'Aviso activado · quitar' : 'Avísame cuando vuelva'}</button></div>`
          : `<div class="row g12 fila-f ini"><div class="campo"><label>${serv ? '¿Para cuándo lo quieres?' : 'Personalización o nota (opcional)'}</label><input id="nota" maxlength="200" placeholder="${serv ? 'Sábado en la mañana' : 'Color, nombre, dedicatoria…'}"></div>
            ${serv ? '' : `<div class="campo" style="flex:none;width:120px"><label>Cantidad</label><input id="cant" type="number" min="1" max="20" value="1"></div>`}</div>
          <div class="col g10">${`<button class="btn btn-wa btn-b" style="padding:17px" data-a="wa-prod" data-prod="${p.id}" data-origen="${esc(origen)}">${ic('wa', '#fff')}${serv ? 'Agendar' : 'Pedir'} por WhatsApp · ${pesos(p.precio)}</button>`}
            <span class="peq sua">Se abre WhatsApp con el mensaje listo para ${esc(e.nombre)}. El pago y la entrega los acuerdas directo con el negocio.</span></div>`}
        <div class="row g10 fila-f"><button class="btn btn-g crece" data-a="fav" data-id="${p.id}">${ic('heart')}Guardar</button>
          <button class="btn btn-g crece" data-a="fecha-nueva" data-idea="${esc(p.nombre)}" data-pres="${p.precio}">${ic('cal')}Agregar a mi calendario</button></div>
        ${fs ? `<a class="row g12" style="background:var(--oroS);padding:16px;border-radius:20px" href="#/calendario?f=${fs.id}"><span class="redondo" style="border-radius:12px;border:0">${ic('gift', '#C8431B')}</span>
          <div class="crece"><b class="row g6" style="font-size:14px">${ic('spark', '#C8431B', 'width:13px;height:13px')}Ideal para: ${esc(fs.titulo)}</b><span class="peq">${fecha(fs.fecha)}${fs.presupuesto_max ? ' · dentro de tu presupuesto de ' + pesos(fs.presupuesto_max) : ''}</span></div></a>` : ''}
        <div class="card col g12" style="padding:18px;border-radius:20px">
          ${[['truck', (e.formas_entrega || ['Entrega a convenir'])[0] + (e.costo_domicilio ? ' · ' + pesos(e.costo_domicilio) : ''), e.tiempo_entrega || 'A convenir'], ['pin', e.tiene_local && e.direccion ? 'Recoger en ' + (e.barrio || 'el local') : 'Vende en línea', e.direccion || 'Ocaña'], ['card', 'Pagas directo al negocio', (e.medios_pago || []).join(', ')]]
            .map(([i, a, b]) => `<div class="row g12"><span class="redondo" style="width:36px;height:36px;border-radius:10px;background:var(--cream);border:0">${ic(i, 'currentColor', 'width:17px;height:17px')}</span><div><b style="font-size:14px">${esc(a)}</b><div class="peq sua">${esc(b)}</div></div></div>`).join('')}</div>
        ${p.ocasiones?.length ? `<div class="row g8 envuelve"><span class="peq sua">Ideal para:</span>${p.ocasiones.map(o => `<a class="chip borde" href="#/buscar?oca=${encodeURIComponent(o)}">${esc(o)}</a>`).join('')}</div>` : ''}
      </div></section>
    ${d.resenas.length ? `<section>${cab('', 'Opiniones del negocio', `<a class="neg" style="color:var(--brasa)" href="#/negocio/${e.slug}">Ver todas →</a>`)}<div class="grid c2">${d.resenas.slice(0, 2).map(tarjetaResena).join('')}</div></section>` : ''}
    ${d.relacionados.length ? `<section>${cab('', 'También te puede gustar')}<div class="grid c4">${d.relacionados.map(x => tarjetaProducto(x, origen)).join('')}</div></section>` : ''}
  </main>`);
});
acciones['wa-prod'] = el => {
  el.dataset.nota = document.getElementById('nota')?.value.trim() || '';
  el.dataset.cant = document.getElementById('cant')?.value || 1;
  return acciones.wa(el);
};
acciones['ver-foto'] = el => {
  document.querySelector('#foto-principal .foto img').src = el.dataset.u;
  el.parentElement.querySelectorAll('button').forEach(b => b.style.outline = b === el ? '2px solid var(--brasa)' : '');
};

// ---------- favoritos
ruta('/favoritos', async () => {
  if (!estado.yo) return ir('#/entrar');
  const lista = await api('/favoritos');
  return conNav(`<main class="wrap pag" style="gap:28px"><div class="col g8"><span class="kick">Guardados</span><h1 class="d2">Tus <span class="serif" style="font-size:1.1em">favoritos.</span></h1><p class="sua">Te avisamos cuando alguno tenga promoción.</p></div>
    ${lista.length ? `<div class="grid c4">${lista.map(p => tarjetaProducto(p, 'para_ti')).join('')}</div>` : vacio('💛', 'Aún no guardas nada', 'Toca el corazón de un producto para guardarlo aquí y enterarte de sus promos.', '<a class="btn btn-p" href="#/buscar">Explorar productos</a>')}</main>`);
});

// ---------- calendario
const TIPOS = [['cumpleanos', '🎂 Cumpleaños'], ['aniversario', '💞 Aniversario'], ['compra', '🧳 Viaje o compra futura'], ['especial', '⭐ Fecha especial'], ['otro', 'Otro']];
const AVISOS = [[7, '1 semana antes'], [3, '3 días antes'], [1, '1 día antes'], [0, 'El mismo día']];
let fechasCache = null;

ruta('/calendario', async (_, q) => {
  if (!estado.yo) return ir('#/entrar');
  const d = fechasCache = await api('/fechas'), ahora = new Date();
  const [anio, mes] = (q.get('m') || `${ahora.getFullYear()}-${ahora.getMonth() + 1}`).split('-').map(Number);
  const primero = new Date(anio, mes - 1, 1), dias = new Date(anio, mes, 0).getDate(), desfase = (primero.getDay() + 6) % 7;
  const sel = d.personales.find(f => f.id === q.get('f')) || d.personales.find(f => f.dias >= 0) || null;
  const eventos = dia => {
    const out = [];
    for (const f of d.personales) { const [a, m, dd] = (f.repetir_anual ? f.fecha : f.proxima).split('-').map(Number); if (m === mes && dd === dia && (f.repetir_anual || a === anio)) out.push(`<a class="ev ${f.tipo === 'compra' ? 'compra' : ''}" href="#/calendario?m=${anio}-${mes}&f=${f.id}&mantener=1" title="${esc(f.titulo)}">${esc(f.titulo)}</a>`); }
    for (const s of d.sugeridas) if (s.activa && s.mes === mes && s.dia === dia) out.push(`<a class="ev sug" href="#/buscar?q=${encodeURIComponent(s.nombre)}" title="${esc(s.nombre)}">${s.emoji} ${esc(s.nombre)}</a>`);
    return out.join('');
  };
  const celdas = [];
  for (let i = 0; i < desfase; i++) celdas.push('<div class="dia fuera"></div>');
  for (let dia = 1; dia <= dias; dia++) {
    const esHoy = anio === ahora.getFullYear() && mes === ahora.getMonth() + 1 && dia === ahora.getDate();
    const esSel = sel && (() => { const [a, m, dd] = sel.proxima.split('-').map(Number); return a === anio && m === mes && dd === dia; })();
    celdas.push(`<div class="dia ${esHoy ? 'hoy' : ''} ${esSel ? 'sel' : ''}"><b>${dia}</b>${eventos(dia)}</div>`);
  }
  const mover = n => { const x = new Date(anio, mes - 1 + n, 1); return `#/calendario?m=${x.getFullYear()}-${x.getMonth() + 1}&mantener=1`; };
  let sug = [];
  if (sel) { try { sug = await api(`/fechas/${sel.id}/sugerencias`); } catch { /* sin sugerencias */ } }
  if (q.get('nuevo')) setTimeout(() => acciones['fecha-nueva'](document.body), 50);
  return conNav(`<main class="wrap pag" style="gap:28px">
    <div class="row entre fin envuelve g16"><h1 class="d2">Mi calendario<br><span class="serif">de fechas que importan.</span></h1><button class="btn btn-p" data-a="fecha-nueva">${ic('plus', '#fff')}Agregar fecha</button></div>
    <section class="row ini g24 dos">
      <div class="card col g16 crece" style="border-radius:30px">
        <div class="row entre envuelve g12"><div class="row g12"><a class="redondo" href="${mover(-1)}" style="width:38px;height:38px">${ic('chevl')}</a><a class="redondo" href="${mover(1)}" style="width:38px;height:38px">${ic('chevr')}</a><h2 class="d4" style="font-size:26px;text-transform:capitalize">${mesN(mes - 1)} ${anio}</h2></div>
          <div class="row g16 min">${[['brasa', 'Personal'], ['oro', 'Sugerida por Impulsa'], ['salvia', 'Compra planificada']].map(([c, t]) => `<span class="row g6"><i style="width:10px;height:10px;border-radius:50%;background:var(--${c})"></i>${t}</span>`).join('')}</div></div>
        <div class="cal min sua neg">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<span>${x}</span>`).join('')}</div>
        <div class="cal">${celdas.join('')}</div>
        ${d.personales.length ? `<div class="col g8"><b>Todas tus fechas</b>${d.personales.map(f => `<a class="row g12" style="padding:10px;border-radius:14px;${sel?.id === f.id ? 'background:var(--brasaS)' : ''}" href="#/calendario?f=${f.id}&mantener=1"><span class="chip ${f.dias <= 14 ? 'solido' : 'crema'}" style="width:92px;justify-content:center">${fechaCorta(f.proxima)}</span><b class="crece" style="font-size:14px">${esc(f.titulo)}</b><span class="peq sua">${enDias(f.dias)}</span></a>`).join('')}</div>` : ''}
      </div>
      <aside class="col g16" style="width:420px;flex:none">
        ${sel ? `<div class="card oscura col g16" style="border-radius:28px"><div class="row entre"><span class="chip solido">${ic('gift')}${enDias(sel.dias)}</span><span class="peq" style="color:var(--sand)">${fecha(sel.proxima, true)}</span></div>
          <h3 class="d3" style="font-size:28px">${esc(sel.titulo)}</h3>
          <span class="peq" style="color:var(--sand)">${[sel.relacion, sel.regalo_idea && 'idea: ' + sel.regalo_idea, sel.presupuesto_max && 'hasta ' + pesos(sel.presupuesto_max)].filter(Boolean).map(esc).join(' · ') || 'Sin detalles todavía'}</span>
          <div class="row g8 envuelve">${sel.avisos_dias.map(n => `<span class="chip orof" style="color:var(--ink)">${ic('bell')}${AVISOS.find(a => a[0] === n)?.[1] || n + ' días antes'}</span>`).join('')}</div>
          <span class="row g8 peq neg" style="color:var(--oro)">${ic('spark')}${sug.length ? `La IA encontró ${sug.length} ${sug.length === 1 ? 'opción' : 'opciones'}` : 'Aún no hay opciones dentro de ese presupuesto'}</span>
          ${sug.slice(0, 4).map(s => `<div class="mini"><a class="row g12 crece" href="#/producto/${s.id}?o=calendario">${mini(s.imagen, s.categoria_emoji, s.id)}<div class="crece"><b style="font-size:14px">${esc(s.nombre)}</b><div class="min sua">${esc(s.emprendimiento)}</div><b style="font-family:var(--fd);color:var(--brasa)">${pesos(s.precio)}</b></div></a>
            <button class="redondo" style="background:var(--wa);border:0;width:40px;height:40px" data-a="wa" data-prod="${s.id}" data-origen="calendario" aria-label="WhatsApp">${ic('wa', '#fff')}</button></div>`).join('')}
          <div class="row g8"><button class="btn btn-g btn-s crece" style="color:var(--ink)" data-a="fecha-editar" data-id="${sel.id}">${ic('edit')}Editar</button><button class="btn btn-s" style="color:var(--sand)" data-a="fecha-borrar" data-id="${sel.id}">${ic('trash')}Eliminar</button></div></div>`
          : `<div class="card oscura col g12" style="border-radius:28px"><h3 class="d4">Agrega tu primera fecha</h3><span class="peq" style="color:var(--sand)">Un cumpleaños, un aniversario o una compra que tengas pensada. Te avisamos a tiempo con opciones de emprendedores locales.</span><button class="btn btn-p" data-a="fecha-nueva">Agregar fecha</button></div>`}
        <div class="card col g12" style="border-radius:28px"><div><h3 class="d4" style="font-size:20px">Fechas sugeridas</h3><span class="peq sua">Actívalas y te llegan ideas de regalo una semana antes.</span></div>
          ${d.sugeridas.map(s => `<div class="row g12"><span class="chip ${s.activa ? 'oro' : 'crema'}" style="width:74px;justify-content:center;font-weight:600">${fechaCorta(s.proxima)}</span><span class="crece neg" style="font-size:14px;${s.activa ? '' : 'color:var(--stone)'}">${s.emoji} ${esc(s.nombre)}</span><button class="interruptor ${s.activa ? 'on' : ''}" data-a="sugerida" data-id="${s.id}" aria-label="Activar"></button></div>`).join('')}</div>
      </aside></section></main>`);
});
acciones.sugerida = async el => { const r = await api('/fechas-sugeridas/' + el.dataset.id, { metodo: 'POST' }); el.classList.toggle('on', r.activo); avisar(r.activo ? 'Te avisaremos una semana antes' : 'Fecha desactivada'); };
acciones['fecha-borrar'] = async el => { if (!confirm('¿Eliminar esta fecha de tu calendario?')) return; await api('/fechas/' + el.dataset.id, { metodo: 'DELETE' }); avisar('Fecha eliminada'); ir('#/calendario'); };
function modalFecha(f = {}) {
  abrirCapa(`<form class="modal" data-f="fecha"><input type="hidden" name="id" value="${f.id || ''}">
    <div class="row entre ini"><div><h2 class="d3" style="font-size:30px">${f.id ? 'Editar fecha' : 'Agregar una fecha'}</h2><span class="peq sua">Te avisamos a tiempo y la IA busca el regalo por ti.</span></div><button type="button" class="redondo" data-a="cerrar">${ic('x')}</button></div>
    <div class="row g12 fila-f">${campo('¿Qué celebras?', 'tipo', f.tipo || 'cumpleanos', { opciones: TIPOS })}${campo('Fecha', 'fecha', f.fecha || '', { tipo: 'date', req: 1 })}</div>
    ${campo('Título', 'titulo', f.titulo || '', { req: 1, ph: 'Cumpleaños de Andrés' })}
    <div class="row g12 fila-f">${campo('¿De quién? (opcional)', 'persona', f.persona || '', { ph: 'Andrés' })}${campo('Relación', 'relacion', f.relacion || '', { opciones: [['', 'Sin especificar'], ...['Pareja', 'Amigo', 'Amiga', 'Mamá', 'Papá', 'Hijo/a', 'Familiar', 'Compañero/a'].map(x => [x, x])] })}</div>
    <div class="row g12 fila-f">${campo('¿Qué quieres regalar o comprar?', 'regalo_idea', f.regalo_idea || '', { ph: 'Un peluche', ayuda: 'Si no sabes, déjalo vacío y la IA te sugiere' })}
      ${campo('Presupuesto', 'presupuesto_max', f.presupuesto_max || '', { opciones: [['', 'Sin tope'], ...[30000, 50000, 70000, 100000, 150000, 250000].map(v => [v, 'Hasta ' + pesos(v)]), ...(f.presupuesto_max && ![30000, 50000, 70000, 100000, 150000, 250000].includes(f.presupuesto_max) ? [[f.presupuesto_max, 'Hasta ' + pesos(f.presupuesto_max)]] : [])] })}</div>
    <div class="col g10"><b class="peq">¿Cuándo te avisamos?</b><div class="row g8 envuelve">${AVISOS.map(([n, t]) => `<button type="button" class="pill ${(f.avisos_dias || [7, 3]).includes(n) ? 'on' : ''}" data-a="pill" data-g="aviso" data-v="${n}">${t}</button>`).join('')}</div></div>
    <label class="row g10 peq neg"><input type="checkbox" name="repetir_anual" ${f.repetir_anual === false ? '' : 'checked'} style="width:18px;height:18px;accent-color:var(--brasa)">Repetir cada año</label>
    <div data-error></div><div class="row g10" style="justify-content:flex-end"><button type="button" class="btn btn-g" data-a="cerrar">Cancelar</button><button class="btn btn-p">Guardar fecha</button></div></form>`);
}
acciones['fecha-nueva'] = el => {
  if (!estado.yo) { avisar('Inicia sesión para usar tu calendario'); return ir('#/entrar'); }
  modalFecha({ regalo_idea: el.dataset?.idea || '', presupuesto_max: el.dataset?.pres ? Math.ceil(Number(el.dataset.pres) / 10000) * 10000 : '' });
};
acciones['fecha-editar'] = el => modalFecha(fechasCache.personales.find(f => f.id === el.dataset.id));
formularios.fecha = async (f, d) => {
  const cuerpo = { tipo: d.tipo, titulo: d.titulo.trim(), persona: d.persona || null, relacion: d.relacion || null, fecha: d.fecha, repetir_anual: !!d.repetir_anual && d.tipo !== 'compra',
    regalo_idea: d.regalo_idea.trim() || null, presupuesto_max: d.presupuesto_max ? Number(d.presupuesto_max) : null,
    avisos_dias: [...f.querySelectorAll('.pill.on[data-g="aviso"]')].map(b => Number(b.dataset.v)) };
  const r = d.id ? await api('/fechas/' + d.id, { metodo: 'PUT', cuerpo }) : await api('/fechas', { metodo: 'POST', cuerpo });
  cerrarCapa(); avisar('Fecha guardada. Te avisaremos a tiempo');
  ir('#/calendario?f=' + r.id);
};

// ---------- perfil
ruta('/perfil', async () => {
  if (!estado.yo) return ir('#/entrar');
  const p = estado.yo.perfil;
  return conNav(`<main class="wrap pag" style="gap:28px;max-width:900px"><h1 class="d2">Mi perfil <span class="serif">y gustos.</span></h1>
    <form class="card col g16" data-f="perfil"><h3 class="d4">Mis datos</h3>
      <div class="row g16 fila-f">${campo('Nombre', 'nombre', p.nombre, { req: 1 })}${campo('Apellido', 'apellido', p.apellido)}</div>
      <div class="row g16 fila-f">${campo('Celular (WhatsApp)', 'celular', p.celular || '', { tipo: 'tel' })}${campo('Barrio', 'barrio', p.barrio || '')}</div>
      <div data-error></div><button class="btn btn-d" style="align-self:flex-end">Guardar datos</button></form>
    ${p.rol === 'cliente' ? `<form class="card col g24" data-f="gustos"><h3 class="d4">Mis gustos</h3>${await formularioGustos()}<div data-error></div><button class="btn btn-p" style="align-self:flex-end">Guardar gustos</button></form>` : ''}
    <button class="btn btn-g" style="align-self:flex-start" data-a="salir">${ic('salir')}Cerrar sesión</button></main>`);
});
formularios.perfil = async (f, d) => { actualizarYo(await api('/auth/perfil', { metodo: 'PUT', cuerpo: d })); avisar('Datos guardados'); nucleo.repintar(); };
