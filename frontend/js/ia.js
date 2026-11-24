// Funciones de IA a la vista: buscar con una foto y armador de regalos con presupuesto.
import { api, estado } from './api.js';
import { acciones, formularios, ruta, ir } from './nucleo.js';
import { ic, esc, pesos, foto, avisar, abrirCapa, cerrarCapa, comprimir, vacio } from './ui.js';
import { conNav } from './app.js';

export const OCASIONES = ['Cumpleaños', 'Aniversario', 'Amor y Amistad', 'Día de la Madre', 'Día del Padre', 'Navidad', 'Grados', 'Regalo corporativo'];
export const sello = (motor, claro = false) => `<span class="sello-ia ${claro ? 'claro' : ''}" title="${motor === 'gemini' ? 'Respuesta generada con Gemini' : 'IA de Impulsa (modelo semántico local)'}">${ic('spark')}${motor === 'gemini' ? 'Gemini' : 'IA de Impulsa'}</span>`;

// ---------- buscar con una foto
export const botonFoto = (claro = false) => `<button type="button" class="cam ${claro ? 'claro' : ''}" data-a="foto" aria-label="Buscar con una foto" title="Buscar con una foto">${ic('camera')}</button>`;

const leerComoDataUrl = archivo => new Promise((ok, mal) => {
  const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(new Error('No se pudo leer la foto')); r.readAsDataURL(archivo);
});

acciones.foto = () => {
  const entrada = document.createElement('input');
  entrada.type = 'file'; entrada.accept = 'image/*';
  entrada.onchange = async () => {
    const archivo = entrada.files?.[0];
    if (!archivo) return;
    let url;
    try { url = await leerComoDataUrl(await comprimir(archivo, 900)); }
    catch (e) { return avisar(e.message, true); }
    abrirCapa(`<div class="escaner"><div class="marco-foto"><img src="${url}" alt="Tu foto"><i class="haz"></i></div>
      <div class="col g8 centro"><span class="sello-ia claro" style="align-self:center">${ic('spark')}Visión con IA</span>
      <h3 class="d4" id="esc-t">La IA está mirando tu foto…</h3><p class="peq" style="color:var(--sand)">Reconoce qué es y lo busca entre los emprendimientos de Ocaña.</p></div></div>`);
    const pasos = ['La IA está mirando tu foto…', 'Reconociendo forma, material y estilo…', 'Buscando lo más parecido en Ocaña…'];
    let i = 0; const t = setInterval(() => { const el = document.getElementById('esc-t'); if (el) el.textContent = pasos[++i % pasos.length]; }, 1600);
    try {
      const r = await api('/buscar/foto', { metodo: 'POST', cuerpo: { imagen: url } });
      estado.fotoBusqueda = { ...r, vista: url };
      cerrarCapa();
      ir('#/buscar?foto=' + Date.now());
    } catch (e) {
      cerrarCapa();
      avisar(e.message, true);
    } finally { clearInterval(t); }
  };
  entrada.click();
};

// Bloque que se muestra arriba de los resultados cuando la búsqueda vino de una foto.
export const bloqueFoto = r => `<div class="row g16 ini envuelve" style="background:rgba(255,255,255,.06);border-radius:22px;padding:14px">
  <img src="${r.vista}" alt="Tu foto" style="width:96px;height:96px;object-fit:cover;border-radius:16px;flex:none">
  <div class="col g6 crece" style="min-width:min(200px,100%)"><span class="peq" style="color:var(--oro)">La IA vio en tu foto:</span><b style="font-size:18px">${esc(r.foto.veo)}</b>
    ${r.foto.detalles?.length ? `<span class="peq" style="color:var(--sand)">Pídele al emprendedor: ${r.foto.detalles.map(esc).join(' · ')}</span>` : ''}</div></div>`;

// ---------- armador de regalos
const PARA = ['Mi mamá', 'Mi papá', 'Mi pareja', 'Una amiga', 'Un amigo', 'Un niño', 'Mi jefe o compañero'];
const PRESUPUESTOS = [50000, 80000, 120000, 200000, 350000];

ruta('/armador', async (_, q) => {
  const v = { presupuesto: Number(q.get('p')) || 120000, ocasion: q.get('o') || '', para: q.get('para') || '', gustos: q.get('g') || '', semilla: Number(q.get('s')) || 0 };
  const listo = q.has('p');
  let r = null;
  if (listo) r = await api('/armador', { metodo: 'POST', cuerpo: { ...v, para: v.para ? v.para.replace(/^Mi |^Una |^Un /, 'tu ').toLowerCase() : null, ocasion: v.ocasion || null } });
  const chip = (nombre, valor, actual, txt = valor) => `<label class="pill ${String(actual) === String(valor) ? 'on' : ''}"><input type="radio" name="${nombre}" value="${esc(valor)}" ${String(actual) === String(valor) ? 'checked' : ''} hidden>${esc(txt)}</label>`;
  return conNav(`<main class="wrap pag" style="gap:32px">
    <section class="armador">
      <div class="col g16"><span class="sello-ia claro">${ic('spark')}Armador de regalos con IA</span>
        <h1 class="d2">Dime tu presupuesto.<br><span class="serif" style="color:var(--oro)">yo armo el regalo.</span></h1>
        <p style="color:var(--sand);max-width:460px">La IA combina productos de varios emprendimientos de Ocaña, hace las cuentas para que no te pases y te escribe el mensaje de la tarjeta.</p></div>
      <form class="col g16 arm-form" data-f="armador">
        <div class="col g8"><b class="peq">¿Cuánto quieres gastar?</b>
          <div class="row g12"><input type="range" name="presupuesto" min="30000" max="500000" step="5000" value="${v.presupuesto}" oninput="this.nextElementSibling.textContent='$'+Number(this.value).toLocaleString('es-CO')" class="crece"><b class="precio-arm">${pesos(v.presupuesto)}</b></div>
          <div class="row g6 envuelve">${PRESUPUESTOS.map(p => `<button type="button" class="chip borde" data-a="arm-p" data-v="${p}">${pesos(p)}</button>`).join('')}</div></div>
        <div class="col g8"><b class="peq">¿Para quién es?</b><div class="row g6 envuelve">${PARA.map(p => chip('para', p, v.para)).join('')}</div></div>
        <div class="col g8"><b class="peq">¿Qué se celebra?</b><div class="row g6 envuelve">${chip('ocasion', '', v.ocasion, 'Sin ocasión')}${OCASIONES.map(o => chip('ocasion', o, v.ocasion)).join('')}</div></div>
        <div class="campo"><label>¿Qué le gusta? <span class="sua">(opcional)</span></label><input name="gustos" value="${esc(v.gustos)}" placeholder="Le encanta el café, las plantas y lo artesanal" maxlength="160"></div>
        <button class="btn btn-p">${ic('spark', '#fff')}${listo ? 'Volver a armar' : 'Armar mi regalo'}</button>
      </form>
    </section>
    ${r ? `<section class="col g20">
      <div class="row entre envuelve g12"><div class="col g6"><h2 class="d3">${r.combos.length ? `${r.combos.length} ${r.combos.length === 1 ? 'idea' : 'ideas'} para ${pesos(r.presupuesto)}` : 'No alcancé a armar un combo'}</h2>
        <span class="peq sua">${esc(r.mensaje)}</span></div>
        <div class="row g10">${sello(r.motor)}${r.combos.length ? `<a class="btn btn-g btn-s" href="${location.hash.replace(/&s=\d+/, '')}&s=${(v.semilla || 0) + 1}">${ic('refresh')}Otras ideas</a>` : ''}</div></div>
      ${r.combos.length ? `<div class="grid c3">${r.combos.map(c => `<article class="combo card">
        <div class="row entre"><span class="kick">${c.items.length} ${c.items.length === 1 ? 'producto' : 'productos'}</span>${c.sobra >= 1000 ? `<span class="chip salvia">Te sobran ${pesos(c.sobra)}</span>` : '<span class="chip orof" style="color:var(--ink)">Justo en tu presupuesto</span>'}</div>
        <h3 class="d4">${esc(c.nombre)}</h3>
        <div class="col g10">${c.items.map(p => `<div class="row g12"><a href="#/producto/${p.id}?o=busqueda_ia" style="width:64px;flex:none">${foto(p, 'style="aspect-ratio:1;border-radius:14px"')}</a>
          <div class="crece" style="min-width:0"><a href="#/producto/${p.id}?o=busqueda_ia"><b style="font-size:14px">${esc(p.nombre)}</b></a><div class="min sua">${esc(p.emprendimiento)}</div></div>
          <div class="col fin g4"><b style="font-family:var(--fd)">${pesos(p.precio)}</b><button class="wa-mini" data-a="wa" data-prod="${p.id}" data-origen="busqueda_ia" aria-label="Pedir por WhatsApp">${ic('wa', '#fff')}</button></div></div>`).join('')}</div>
        <div class="row entre total-arm"><span>Total</span><b>${pesos(c.total)}</b></div>
        <p class="peq" style="color:var(--char)">${ic('spark', '#EF5A2A', 'width:13px;height:13px;vertical-align:-2px')} ${esc(c.por_que)}</p>
        <div class="tarjeta-msg"><span class="min sua">Mensaje para la tarjeta</span><p>“${esc(c.tarjeta)}”</p>
          <button class="chip borde" data-a="copiar" data-t="${esc(c.tarjeta)}">${ic('file')}Copiar mensaje</button></div>
      </article>`).join('')}</div>` : vacio('🎁', 'Sube un poco el presupuesto', 'Con ese valor no encontré dos productos de negocios distintos que combinen. Prueba con otro presupuesto o quita los gustos.')}
    </section>` : `<section class="grid c3">${[['camera', 'Busca con una foto', 'Toma una foto de lo que te gustó y la IA te dice quién lo hace en Ocaña.', 'foto'],
      ['gift', 'Arma un regalo', 'Combina productos de varios negocios sin pasarte de tu presupuesto.', ''], ['msg', 'Mensaje listo', 'La IA te escribe lo que puedes poner en la tarjeta.', '']]
      .map(([i, t, x, a]) => `<div class="card col g10" style="padding:24px"><span class="redondo" style="background:var(--oroS);border:0">${ic(i)}</span><b class="d4" style="font-size:19px">${t}</b><span class="peq sua">${x}</span>${a ? `<button class="btn btn-g btn-s" style="align-self:flex-start" data-a="${a}">${ic('camera')}Probar ahora</button>` : ''}</div>`).join('')}</section>`}
  </main>`);
});

formularios.armador = (f, d) => {
  const p = new URLSearchParams({ p: d.presupuesto });
  if (d.para) p.set('para', d.para);
  if (d.ocasion) p.set('o', d.ocasion);
  if (d.gustos?.trim()) p.set('g', d.gustos.trim());
  ir('#/armador?' + p.toString());
};
acciones['arm-p'] = el => {
  const r = el.closest('form').querySelector('[name=presupuesto]');
  r.value = el.dataset.v; r.dispatchEvent(new Event('input'));
};
acciones.copiar = async el => {
  try { await navigator.clipboard.writeText(el.dataset.t); avisar('Mensaje copiado'); }
  catch { avisar('No se pudo copiar. Selecciónalo y cópialo a mano.', true); }
};
document.addEventListener('change', ev => {
  if (ev.target.matches('.arm-form input[type=radio]')) {
    ev.target.closest('.row').querySelectorAll('.pill').forEach(x => x.classList.toggle('on', x.contains(ev.target)));
  }
});
