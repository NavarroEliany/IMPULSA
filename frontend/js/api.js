// Comunicación con la API de Impulsa y manejo de la sesión.
const CLAVE = 'impulsa_sesion';
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch { return null; } };
export const estado = { sesion: leer(), yo: null, favs: new Set(), categorias: [] };

function guardar(s) {
  estado.sesion = s;
  try { s ? localStorage.setItem(CLAVE, JSON.stringify(s)) : localStorage.removeItem(CLAVE); } catch { /* modo privado */ }
}

export function cerrarSesion() { guardar(null); estado.yo = null; estado.favs = new Set(); }

async function refrescar() {
  try {
    const r = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: estado.sesion.refresh_token }) });
    if (!r.ok) return false;
    guardar(await r.json());
    return true;
  } catch { return false; }
}

export async function api(ruta, { metodo = 'GET', cuerpo, archivo } = {}, reintento = true) {
  const h = {};
  if (estado.sesion) h.Authorization = 'Bearer ' + estado.sesion.access_token;
  let body;
  if (archivo) { body = new FormData(); body.append('archivo', archivo, archivo.name || 'foto.jpg'); }
  else if (cuerpo !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(cuerpo); }
  let r;
  try { r = await fetch('/api' + ruta, { method: metodo, headers: h, body }); }
  catch { throw new Error('Sin conexión. Revisa tu internet e intenta de nuevo.'); }
  if (r.status === 401 && estado.sesion && reintento) {
    if (await refrescar()) return api(ruta, { metodo, cuerpo, archivo }, false);
    cerrarSesion(); location.hash = '#/entrar';
    throw new Error('Tu sesión venció. Inicia sesión de nuevo.');
  }
  const d = await r.json().catch(() => null);
  if (!r.ok) {
    let m = d && d.detail;
    if (Array.isArray(m)) m = 'Revisa los datos: ' + m.map(x => (x.loc || []).slice(-1)[0]).join(', ');
    throw new Error(m || 'Ocurrió un error. Intenta de nuevo.');
  }
  return d;
}

function aplicar(d) { estado.yo = { perfil: d.perfil, negocio: d.negocio, gustos: d.gustos || [], sin_leer: d.sin_leer || 0 }; }

export async function entrar(ruta, datos, metodo = 'POST') {
  const d = await api(ruta, { metodo, cuerpo: datos });
  guardar({ access_token: d.access_token, refresh_token: d.refresh_token });
  aplicar(d);
  await cargarFavs();
  return estado.yo;
}

export async function cargarYo() {
  if (!estado.sesion) return null;
  try { aplicar(await api('/auth/yo')); await cargarFavs(); } catch { cerrarSesion(); }
  return estado.yo;
}

export function actualizarYo(d) { aplicar(d); }

async function cargarFavs() {
  if (estado.yo?.perfil?.rol !== 'cliente') return;
  try { estado.favs = new Set((await api('/favoritos')).map(p => p.id)); } catch { /* sin favoritos */ }
}

export async function cargarCategorias() {
  if (!estado.categorias.length) estado.categorias = await api('/categorias');
  return estado.categorias;
}
