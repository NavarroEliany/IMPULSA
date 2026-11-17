// Piezas de interfaz compartidas: íconos, tarjetas, formatos y capas.
import { estado } from './api.js';

const L = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>', gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>', back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', check: '<path d="M20 6 9 17l-5-5"/>', user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  down: '<path d="m6 9 6 6 6-6"/>', store: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M4 9v11h16V9M9 20v-6h6v6"/>', bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>', plus: '<path d="M5 12h14M12 5v14"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>', refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  tag: '<path d="M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevl: '<path d="m15 18-6-6 6-6"/>', chevr: '<path d="m9 18 6-6-6-6"/>', home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  pkg: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>', ig: '<rect width="20" height="20" x="2" y="2" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  tt: '<path d="M9 12a4 4 0 1 0 4 4V2a5 5 0 0 0 5 5"/>', fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  up: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M8 13h8M8 17h5"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6"/>', key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', staro: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
};
const F = {
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  spark: '<path d="M12 1C12.9 7.6 16.4 11.1 23 12 16.4 12.9 12.9 16.4 12 23 11.1 16.4 7.6 12.9 1 12 7.6 11.1 11.1 7.6 12 1Z"/>',
  vfy: '<path d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3.1 2.6-1.9 1-3 3.2.1z"/>',
  wa: '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42Z"/>',
};
export const ic = (n, color = 'currentColor', estilo = '') => F[n]
  ? `<svg class="ic" viewBox="0 0 24 24" fill="${color}" style="${estilo}">${F[n]}</svg>`
  : `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="${estilo}">${L[n] || ''}</svg>`;

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pesos = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
export const corto = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',') + ' M' : pesos(n);
export const num = n => String(n ?? 0).replace('.', ',');
export const iniciales = s => String(s || '?').replace(/\b(de|del|la|el|y|&)\b/gi, '').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const mesN = i => MESES[i];
export const fecha = (iso, conAnio = false) => { const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number); return `${d} de ${MESES[m - 1]}${conAnio ? ' de ' + a : ''}`; };
export const fechaCorta = iso => { const [, m, d] = String(iso).slice(0, 10).split('-').map(Number); return `${d} ${MESES[m - 1].slice(0, 3)}`; };
export function hace(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `Hace ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `Hace ${Math.round(s / 3600)} h`;
  if (s < 172800) return 'Ayer';
  if (s < 2592000) return `Hace ${Math.round(s / 86400)} días`;
  return fecha(iso, true);
}
export const enDias = d => d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`;

export const isotipo = '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="19" fill="#EF5A2A"/><rect x="26" y="32" width="12" height="23" rx="6" fill="#fff"/><path d="M32 8C33 14.5 35.5 17 42 18 35.5 19 33 21.5 32 28 31 21.5 28.5 19 22 18 28.5 17 31 14.5 32 8Z" fill="#F4B73F"/></svg>';
export const logo = (claro = false, href = '#/') => `<a class="logo ${claro ? 'claro' : ''}" href="${href}" aria-label="Impulsa">${isotipo}<span class="w">ımpulsa${ic('spark', claro ? '#F4B73F' : '#EF5A2A')}</span></a>`;

const TONOS = [['#F6D9C4', '#E9A27C'], ['#F7E3B5', '#E9B04F'], ['#DCE9DF', '#8FB8A0'], ['#EADFD3', '#B79C84'], ['#F3D2CF', '#D98A86'], ['#D9E2EC', '#8FA6BF']];
const tono = id => TONOS[(String(id || '').charCodeAt(0) + String(id || '').charCodeAt(1) || 0) % TONOS.length];
// Foto del producto o, si no tiene, un fondo cálido con el emoji de su categoría.
export function foto(p, extra = '') {
  if (p.imagen) return `<div class="foto" ${extra}><img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy"></div>`;
  const [a, b] = tono(p.id);
  return `<div class="foto ph" style="--c1:${a};--c2:${b}" ${extra}><span>${esc(p.categoria_emoji || '✨')}</span></div>`;
}
export const fondo = (url, emoji, id) => url ? `background-image:url('${esc(url)}')` : `background:linear-gradient(140deg,${tono(id)[0]},${tono(id)[1]})`;
export const mini = (url, emoji, id) => `<div class="th" style="${fondo(url, emoji, id)}">${url ? '' : esc(emoji || '✨')}</div>`;

export const estrellas = (n, tam = 14) => `<span class="row" style="gap:2px">${[1, 2, 3, 4, 5].map(i => ic('star', i <= Math.round(n) ? '#F4B73F' : '#E7DDD0', `width:${tam}px;height:${tam}px`)).join('')}</span>`;

export function tarjetaProducto(p, origen = 'perfil') {
  const tag = p.promo ? `<span class="tag promo">${esc(p.promo)}</span>`
    : p.match && estado.yo ? `<span class="tag">${ic('spark', '#F4B73F')}${p.match}% para ti</span>` : p.destacado ? `<span class="tag">${ic('spark', '#F4B73F')}Destacado</span>` : '';
  const velo = p.agotado ? `<div class="velo"><span class="chip">Agotado</span><button class="chip solido" data-a="alerta" data-id="${p.id}">${ic('bell')}Avísame cuando vuelva</button></div>` : '';
  return `<a class="prod" href="#/producto/${p.id}?o=${origen}">
    ${tag}<button class="fav ${estado.favs.has(p.id) ? 'on' : ''}" data-a="fav" data-id="${p.id}" aria-label="Guardar">${ic('heart')}</button>
    ${foto(p).replace('</div>', velo + '</div>')}
    <div class="cuerpo">
      <span class="neg-n">${esc(p.emprendimiento)}${p.emp_verificado ? ic('vfy', '#EF5A2A', 'width:12px;height:12px') : ''}</span>
      <h4>${esc(p.nombre)}</h4>
      <div class="row entre" style="margin-top:auto"><span class="precio">${pesos(p.precio)}${p.precio_antes ? `<span class="antes">${pesos(p.precio_antes)}</span>` : ''}</span>
      ${p.num_resenas ? `<span class="est">${ic('star', '#F4B73F')}${num(p.calificacion)}<span class="sua" style="font-weight:400">(${p.num_resenas})</span></span>` : ''}</div>
    </div></a>`;
}

export function tarjetaNegocio(e) {
  return `<div class="emp">
    <a class="portada" href="#/negocio/${e.slug}" style="${fondo(e.portada_url, e.categoria_emoji, e.id)}">${e.portada_url ? '' : esc(e.categoria_emoji || '')}
      <span class="chip ${e.abierto_ahora ? 'salvia' : ''}" style="${e.abierto_ahora ? 'background:#fff' : ''}">${e.abierto_ahora ? '● Abierto ahora' : 'Cerrado ahora'}</span></a>
    <div class="cuerpo">
      <a class="row g12" href="#/negocio/${e.slug}"><div class="logo-n" style="${e.logo_url ? `background-image:url('${esc(e.logo_url)}')` : `background:#${esc(e.color || '16120F')}`}">${e.logo_url ? '' : iniciales(e.nombre)}</div>
        <div class="crece"><div class="row g6"><h3 class="d4" style="font-size:20px">${esc(e.nombre)}</h3>${e.verificado ? ic('vfy', '#EF5A2A', 'width:16px;height:16px') : ''}</div>
        <div class="peq sua">${esc(e.categoria || '')} · ${esc(e.barrio || 'Ocaña')}</div></div></a>
      <div class="row g8 peq">${e.num_resenas ? `<span class="est">${ic('star', '#F4B73F')}${num(e.calificacion)}</span><span class="sua">· ${e.num_resenas} reseñas ·</span>` : ''}<span class="sua">${e.num_productos} productos</span></div>
      <p class="peq" style="color:var(--char);flex:1">${esc(e.descripcion)}</p>
      <div class="row g8"><button class="btn btn-wa crece" data-a="wa" data-emp="${e.id}">${ic('wa', '#fff')}WhatsApp</button>
        ${e.instagram ? `<a class="redondo" target="_blank" rel="noopener" href="https://instagram.com/${esc(e.instagram)}" aria-label="Instagram">${ic('ig')}</a>` : ''}
        ${e.tiktok ? `<a class="redondo" target="_blank" rel="noopener" href="https://tiktok.com/@${esc(e.tiktok)}" aria-label="TikTok">${ic('tt')}</a>` : ''}</div>
    </div></div>`;
}

// Catálogo de un negocio: PDF, imagen o enlace (Canva, Google Drive, etc.).
const ORIGEN_CAT = [[/canva\.(com|link)/, 'Canva'], [/drive\.google|docs\.google/, 'Google Drive'], [/dropbox/, 'Dropbox'], [/onedrive|sharepoint|1drv/, 'OneDrive'], [/instagram/, 'Instagram'], [/wa\.me|whatsapp/, 'WhatsApp']];
export function tipoCatalogo(c) {
  if (c.tipo === 'pdf') return ['PDF', 'file'];
  if (c.tipo === 'imagen') return ['Imagen', 'camera'];
  const o = ORIGEN_CAT.find(([re]) => re.test(c.url));
  let host = ''; try { host = new URL(c.url).hostname.replace('www.', ''); } catch { /* enlace raro */ }
  return [o ? o[1] : host || 'Enlace', 'link'];
}
export function tarjetaCatalogo(c, borrar = false) {
  const [etq, icono] = tipoCatalogo(c);
  const vista = c.tipo === 'imagen' ? `style="background-image:url('${esc(c.url)}')"` : '';
  return `<div class="cat-card"><a class="cat-vista ${c.tipo}" href="${esc(c.url)}" target="_blank" rel="noopener" ${vista} aria-label="Abrir ${esc(c.titulo)}">
      ${c.tipo === 'imagen' ? '' : `<span class="cat-ic">${ic(icono, 'currentColor')}</span><b>${esc(etq)}</b>`}</a>
    <div class="row g8" style="padding:14px 16px"><div class="crece"><b style="font-size:15px">${esc(c.titulo)}</b><div class="min sua">${esc(etq)} · ${hace(c.creado_en)}</div></div>
      ${borrar ? `<button class="redondo" style="width:36px;height:36px" data-a="borrar-cat" data-id="${c.id}" aria-label="Quitar catálogo">${ic('trash')}</button>`
        : `<a class="btn btn-g btn-s" href="${esc(c.url)}" target="_blank" rel="noopener">${ic('ext')}Ver</a>`}</div></div>`;
}

export function avisar(texto, mal = false) {
  const d = document.createElement('div');
  d.className = 'aviso' + (mal ? ' mal' : '');
  d.innerHTML = (mal ? '' : ic('check', '#F4B73F')) + esc(texto);
  document.getElementById('avisos').appendChild(d);
  setTimeout(() => d.remove(), 3800);
}
export function abrirCapa(html) { const c = document.getElementById('capa'); c.innerHTML = html; document.body.style.overflow = 'hidden'; return c; }
export function cerrarCapa() { document.getElementById('capa').innerHTML = ''; document.body.style.overflow = ''; }
export const esqueleto = (n = 4, alto = 300) => `<div class="grid c4">${Array.from({ length: n }, () => `<div class="esq" style="min-height:${alto}px"></div>`).join('')}</div>`;
export const vacio = (emoji, titulo, texto, boton = '') => `<div class="vacio card"><div style="font-size:44px">${emoji}</div><h3 class="d4" style="color:var(--ink)">${titulo}</h3><p style="max-width:380px">${texto}</p>${boton}</div>`;
export const campo = (etq, nombre, valor = '', o = {}) => `<div class="campo"><label>${etq}${o.req ? ' <b>*</b>' : ''}</label>
  ${o.area ? `<textarea name="${nombre}" ${o.req ? 'required' : ''} placeholder="${esc(o.ph || '')}" maxlength="${o.max || 600}">${esc(valor)}</textarea>`
    : o.opciones ? `<select name="${nombre}" ${o.req ? 'required' : ''}>${o.opciones.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(valor) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`
      : `<input name="${nombre}" type="${o.tipo || 'text'}" value="${esc(valor)}" ${o.req ? 'required' : ''} placeholder="${esc(o.ph || '')}" ${o.min != null ? `min="${o.min}"` : ''} ${o.minlength ? `minlength="${o.minlength}"` : ''} ${o.auto ? `autocomplete="${o.auto}"` : ''} ${o.modo ? `inputmode="${o.modo}"` : ''}>`}
  ${o.ayuda ? `<small>${o.ayuda}</small>` : ''}</div>`;
export const datosDe = form => Object.fromEntries(new FormData(form).entries());

// Reduce la foto en el navegador antes de subirla: ahorra datos y espacio.
export function comprimir(archivo, lado = 1280) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? ok(new File([b], 'foto.jpg', { type: 'image/jpeg' })) : mal(new Error('No se pudo leer la imagen')), 'image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => mal(new Error('Ese archivo no es una imagen válida'));
    img.src = URL.createObjectURL(archivo);
  });
}
