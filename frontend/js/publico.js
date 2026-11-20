// Páginas públicas: portada, inicio de sesión, registro y gustos.
import { api, estado, entrar, actualizarYo, cargarCategorias } from './api.js';
import { acciones, formularios, ruta, ir } from './nucleo.js';
import { ic, esc, pesos, num, logo, tarjetaProducto, tarjetaNegocio, campo, avisar, mini, fondo } from './ui.js';
import { navPublica } from './app.js';

const IMG = 'https://jiwzobnrcztxthtiydin.supabase.co/storage/v1/object/public/impulsa/seed/';
const destino = () => !estado.yo ? '#/' : estado.yo.perfil.rol === 'admin' ? '#/admin' : estado.yo.perfil.rol === 'emprendedor' ? (estado.yo.negocio ? '#/panel' : '#/panel/negocio')
  : (estado.yo.perfil.onboarding_completo ? '#/inicio' : '#/gustos');

const pie = () => `<footer class="pie"><div class="wrap col g48"><div class="row entre ini envuelve g32">
  <div class="col g16">${logo(true)}<span style="font-family:var(--fs);font-style:italic;font-size:24px">Lo que buscas, hecho cerca de ti.</span></div>
  <div class="row ini g48 envuelve">
    <div><b style="color:var(--cream);display:block;margin-bottom:8px">Explorar</b><a href="#/buscar">Productos</a><a href="#/buscar?tipo=servicio">Servicios</a><a href="#/negocios">Emprendimientos</a></div>
    <div><b style="color:var(--cream);display:block;margin-bottom:8px">Emprendedores</b><a href="#/registro?rol=emprendedor">Registrar negocio</a><a href="#/entrar">Entrar a mi panel</a></div>
    <div><b style="color:var(--cream);display:block;margin-bottom:8px">Impulsa</b><a href="/api/docs" target="_blank">API</a><a href="#/entrar">Iniciar sesión</a></div>
  </div></div><span class="peq" style="opacity:.7">© 2026 Impulsa · Hecho con orgullo en Ocaña, Norte de Santander</span></div></footer>`;

// ---------- portada
ruta('/', async () => {
  if (estado.yo) return ir(destino());
  const d = await api('/inicio');
  const s = d.stats, navidad = Math.ceil((new Date(new Date().getFullYear(), 11, 24) - Date.now()) / 864e5);
  const ideas = (d.destacados || []).slice(0, 3);
  return navPublica() + `
  <section class="wrap hero">
    <div class="col g24 ini">
      <span class="chip borde">${ic('spark', '#F4B73F')}Busca con inteligencia artificial</span>
      <h1 class="d1">Lo que buscas,<br><span class="serif" style="font-size:1.12em">hecho cerca de ti.</span></h1>
      <p style="font-size:19px;color:var(--char);max-width:560px;line-height:1.55">Impulsa reúne en un solo lugar a los emprendedores de Ocaña. Dile a la IA lo que necesitas, con tus palabras y tu presupuesto, y te mostramos quién lo tiene.</p>
      <form class="barra-ia" data-f="buscar" style="width:100%">${ic('spark', '#F4B73F', 'width:22px;height:22px')}
        <input name="q" placeholder="Necesito un regalo para mi novia, máximo $100.000" autocomplete="off" required>
        <button class="btn btn-p" style="border-radius:16px">Buscar con IA ${ic('arrow', '#fff')}</button></form>
      <div class="row g8 envuelve"><span class="peq sua">Prueba:</span>
        ${['Uñas acrílicas cerca de mí', 'Torta para 15 personas', 'Detalle de amor y amistad hasta 50 mil'].map(t => `<a class="chip borde" href="#/buscar?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div>
      <div class="row g12"><div class="row">${[['MG', 'brasa'], ['JL', 'ink'], ['AR', 'oro'], ['SC', 'salvia']].map(([t, c], i) => `<span class="avatar" style="width:38px;height:38px;font-size:13px;background:var(--${c});color:${c === 'oro' ? 'var(--ink)' : '#fff'};border:3px solid var(--cream);margin-left:${i ? -10 : 0}px">${t}</span>`).join('')}</div>
        <span class="peq neg" style="color:var(--char)">${s.emprendimientos} emprendimientos y ${s.productos} productos y servicios de Ocaña</span></div>
    </div>
    <div class="compo">
      <div class="grande" style="background-image:url('${IMG}emprendedora.jpg')"></div>
      <div class="flota col g12" style="left:0;bottom:60px;width:min(330px,62%)">
        <div class="row g8 peq neg">${ic('spark', '#F4B73F')}Ideas que encontró la IA</div>
        ${ideas.map(p => `<a class="row g12" href="#/producto/${p.id}">${mini(p.imagen, p.categoria_emoji, p.id)}<div class="crece"><div class="peq neg">${esc(p.nombre)}</div><b style="font-family:var(--fd);color:var(--brasa)">${pesos(p.precio)}</b></div></a>`).join('')}
      </div>
      <div class="flota row g12" style="right:12px;top:28px;width:min(300px,78%)"><span class="redondo" style="background:var(--wa);border:0">${ic('wa', '#fff')}</span>
        <div><div class="peq neg">Arte de Doña Gloria</div><div class="peq sua">¡Hola! Sí la tenemos, ¿te la envío hoy?</div></div></div>
      <div class="flota row g8 peq neg" style="right:24px;bottom:8px;background:var(--ink);color:var(--cream);border-radius:999px;padding:12px 18px">${ic('gift', '#F4B73F')}Cumpleaños de Andrés en 3 días</div>
    </div>
  </section>
  <section class="cifras"><div class="wrap">
    <div><b>${s.emprendimientos}</b>emprendimientos locales</div><div><b>${s.categorias}</b>categorías y servicios</div>
    <div><b>${num(s.calificacion)}</b>calificación promedio</div><div><b>0%</b>comisión: el pago es directo</div></div></section>

  <section class="wrap sec" style="padding-bottom:24px">
    <div class="cab"><div class="col g10"><span class="kick">Explora</span><h2 class="d2">¿Qué estás buscando hoy?</h2></div><a class="neg" style="color:var(--brasa)" href="#/buscar">Ver todo →</a></div>
    <div class="grid c6">${d.categorias.slice(0, 12).map(c => `<a class="cat" href="#/buscar?cat=${c.slug}" style="${c.imagen_url ? `background-image:url('${esc(c.imagen_url)}')` : ''}">
      ${c.imagen_url ? '' : `<span class="emo">${c.emoji}</span>`}<b style="font-family:var(--fd);font-size:20px;letter-spacing:-.02em">${esc(c.nombre)}</b><span class="peq" style="opacity:.85">${c.total} ${c.tipo === 'servicio' ? 'servicios' : 'productos'}</span></a>`).join('')}</div>
  </section>

  <section class="wrap sec">
    <div class="col g10" style="margin-bottom:32px"><span class="kick">Así funciona</span><h2 class="d2">Una IA que <span class="serif" style="font-size:1.15em">te entiende.</span></h2></div>
    <div class="col g16">
      <div class="bento">
        <div style="background:#fff;border:1px solid var(--line)"><span class="min sua" style="letter-spacing:.1em">BÚSQUEDA INTELIGENTE</span><h3 class="d3">Pídelo como se lo dirías a un amigo.</h3>
          <div style="background:var(--ink);color:var(--cream);padding:16px 20px;border-radius:20px;max-width:520px">“Necesito un regalo para mi novia, le encantan las flores y tengo 100 mil”</div>
          <div class="row g8 envuelve"><span class="peq sua neg">La IA entendió:</span>${['Para: tu novia', 'Busca: flores', 'Hasta $100.000'].map(t => `<span class="chip oro">${ic('spark')}${t}</span>`).join('')}</div></div>
        <div style="background:var(--oro)"><span class="min" style="letter-spacing:.1em;opacity:.6">PERSONALIZADO</span><h3 class="d3">Te conoce mejor cada día.</h3>
          <div class="row g8 envuelve">${['Dulces picantes', 'Plantas', 'Café de origen', 'Arte local'].map(t => `<span class="chip">${t}</span>`).join('')}</div>
          <div class="mini" style="padding:14px">${mini(IMG + 'gomitas.jpg')}<div><b style="font-size:14px">2x1 en gomitas enchiladas</b><div class="min sua">Dulces Ocaña · porque las compras seguido</div></div></div></div>
      </div>
      <div class="bento inv">
        <div style="background:var(--brasa);color:#fff"><span class="min" style="letter-spacing:.1em;opacity:.75">CALENDARIO</span><h3 class="d3">Nunca olvides una fecha.</h3>
          ${[['24', 'NOV', 'Cumpleaños de Andrés', 'Quiere: un peluche'], ['07', 'DIC', 'Día de velitas', 'Sugerido por Impulsa'], ['24', 'DIC', 'Navidad', 'Ideas listas para ti']].map(([a, b, t, x]) => `<div class="row g12" style="background:rgba(255,255,255,.14);padding:12px;border-radius:16px">
            <div class="col centro" style="background:#fff;color:var(--brasa);border-radius:12px;width:54px;padding:6px 0;line-height:1.1"><b style="font-family:var(--fd);font-size:20px">${a}</b><span style="font-size:10px;font-weight:600;letter-spacing:.06em">${b}</span></div>
            <div><b>${t}</b><div class="peq" style="opacity:.85">${x}</div></div></div>`).join('')}</div>
        <div style="background:var(--ink);color:var(--cream);flex-direction:row;flex-wrap:wrap;gap:32px">
          <div class="col g20 crece ini" style="min-width:260px"><span class="min" style="letter-spacing:.1em;color:var(--oro)">CONTACTO DIRECTO</span><h3 class="d3">Y cierras el trato por WhatsApp.</h3>
            <p style="color:var(--sand);line-height:1.55">Sin intermediarios ni comisiones. Cada emprendimiento tiene su botón de WhatsApp, Instagram, TikTok y Facebook a un toque.</p>
            <a class="btn btn-wa" href="#/negocios">${ic('wa', '#fff')}Ver emprendimientos</a></div>
          <div class="col g10" style="background:var(--noche);padding:20px;border-radius:24px;min-width:280px">
            <div class="burbuja" style="background:var(--waD);align-self:flex-end">Hola, te vi en Impulsa. ¿Tienes el osito tejido disponible?</div>
            <div class="burbuja" style="background:var(--char)">¡Hola! Sí, tengo 3. ¿Te lo envío hoy mismo?</div>
            <div class="burbuja" style="background:var(--waD);align-self:flex-end">Sí por favor, a San Agustín.</div></div></div>
      </div>
    </div>
  </section>

  <section class="wrap sec" style="padding-top:8px">
    <div class="cab"><div class="col g10"><span class="kick">Destacados</span><h2 class="d2">Emprendimientos que la gente ama</h2></div><a class="btn btn-g" href="#/negocios">Ver todos</a></div>
    <div class="grid c3">${d.emprendimientos.slice(0, 3).map(tarjetaNegocio).join('')}</div>
  </section>

  ${d.temporada?.length ? `<section class="wrap" style="padding-bottom:72px"><div class="row g32 envuelve caja-temp" style="background:var(--brasa);color:#fff">
    <div class="col g20 crece ini" style="min-width:280px"><span class="chip brasa" style="background:#fff">${ic('gift')}Temporada navideña</span>
      <h2 class="d2">Navidad está a ${navidad} días.</h2><p style="opacity:.92;line-height:1.55;max-width:380px">Activa tu calendario y te avisamos con ideas de regalo de emprendedores de tu ciudad, según tu presupuesto.</p>
      <a class="btn btn-d" href="#/registro">Activar recordatorios</a></div>
    <div class="grid c3" style="flex:2;min-width:300px;color:var(--ink)">${d.temporada.map(p => tarjetaProducto(p)).join('')}</div></div></section>` : ''}

  <section class="wrap" style="padding-bottom:96px"><div class="row g48 envuelve caja-cta" style="background:var(--ink);color:var(--cream)">
    <div class="col g24 crece ini" style="min-width:300px"><span class="chip orof" style="color:var(--ink)">${ic('store')}Para emprendedores</span>
      <h2 class="d2">Tu emprendimiento merece <span class="serif" style="color:var(--oro);font-size:1.1em">más que tus seguidores.</span></h2>
      ${['Vitrina profesional con fotos, precios, ubicación y redes', 'Estadísticas: qué vendes más, qué días y en qué fechas', 'La IA te recomienda a clientes que ya buscan lo que haces'].map(t => `<div class="row g12"><span class="redondo" style="width:26px;height:26px;background:var(--brasa);border:0">${ic('check', '#fff', 'width:14px;height:14px')}</span>${t}</div>`).join('')}
      <a class="btn btn-p" href="#/registro?rol=emprendedor">Registrar mi emprendimiento gratis</a></div>
    <div class="col g16" style="background:var(--bone);color:var(--ink);border-radius:28px;padding:28px;width:440px;max-width:100%">
      <div class="row entre"><span class="peq sua neg">Ventas de noviembre</span><span class="chip salvia">${ic('up')}+32% vs octubre</span></div><b style="font-family:var(--fd);font-size:44px;letter-spacing:-.03em;line-height:1">$4.280.000</b>
      <div class="row fin g8" style="height:140px">${[40, 62, 48, 80, 70, 96, 130, 58, 66, 90, 110, 140].map((v, i) => `<i style="flex:1;height:${v}px;border-radius:6px;background:var(--${i === 11 ? 'brasa' : 'sand'})"></i>`).join('')}</div>
      <div class="row g10">${[['Sábado', 'tu mejor día'], ['Mochila', 'más vendido'], ['412', 'clics a WhatsApp']].map(([a, b]) => `<div class="crece" style="background:#fff;border-radius:14px;padding:12px"><b style="font-size:14px">${a}</b><div class="min sua">${b}</div></div>`).join('')}</div></div>
  </div></section>` + pie();
});

// ---------- inicio de sesión
const ladoFoto = (cita, autor) => `<aside class="lado foto-l" style="background-image:linear-gradient(180deg,rgba(22,18,15,.1) 30%,rgba(22,18,15,.88)),url('${IMG}flores.jpg')">${logo(true)}
  <div class="col g16"><p style="font-family:var(--fs);font-style:italic;font-size:38px;line-height:1.15">${cita}</p><span class="peq">${autor}</span></div></aside>`;

ruta('/entrar', async () => {
  if (estado.yo) return ir(destino());
  return `<div class="auth">${ladoFoto('“Encontré el regalo de aniversario en 2 minutos y lo pedí por WhatsApp.”', 'Laura M. · clienta de Impulsa')}
  <form class="forma" data-f="login" style="max-width:640px">
    <div class="col g10"><h1 class="d2">Hola de nuevo</h1><p class="sua" style="font-size:16px">Entra para ver tus recomendaciones, recordatorios y favoritos.</p></div>
    ${campo('Correo electrónico', 'email', '', { tipo: 'email', req: 1, auto: 'email', ph: 'tucorreo@ejemplo.com' })}
    ${campo('Contraseña', 'password', '', { tipo: 'password', req: 1, auto: 'current-password', ph: '••••••••' })}
    <div class="row entre"><span></span><a class="peq neg" style="color:var(--brasa)" href="#/recuperar">¿Olvidaste tu contraseña?</a></div>
    <div data-error></div>
    <button class="btn btn-p btn-b">Iniciar sesión</button>
    <div class="row g12"><i class="crece" style="height:1px;background:var(--sand)"></i><span class="peq sua">o prueba con una cuenta de demostración</span><i class="crece" style="height:1px;background:var(--sand)"></i></div>
    <div class="demos"><button type="button" class="btn btn-g" data-a="demo" data-u="laura">${ic('bag')}<span>Entrar como cliente</span></button><button type="button" class="btn btn-g" data-a="demo" data-u="gloria">${ic('store')}<span>Entrar como negocio / emprendimiento</span></button></div>
    <p class="centro sua">¿Aún no tienes cuenta? <a class="neg" style="color:var(--brasa)" href="#/registro">Créala gratis</a></p>
  </form></div>`;
});
formularios.login = async (f, d) => { await entrar('/auth/login', d); ir(destino()); };
acciones.demo = async el => { await entrar('/auth/login', { email: el.dataset.u + '@impulsa.demo', password: 'Impulsa2026' }); ir(destino()); };

// ---------- recuperar contraseña
ruta('/recuperar', async (_, q) => {
  if (estado.yo) return ir(destino());
  const email = q.get('email') || '';
  const paso2 = q.get('paso') === '2';
  const lado = ladoFoto('“Se me olvidó la clave y en un minuto ya estaba de vuelta.”', 'Camila R. · clienta de Impulsa');
  if (!paso2) return `<div class="auth">${lado}
  <form class="forma" data-f="recuperar" style="max-width:640px">
    <a class="row g8 peq neg sua" href="#/entrar">${ic('back')}Volver a iniciar sesión</a>
    <div class="col g10"><h1 class="d2">Recupera tu contraseña</h1><p class="sua" style="font-size:16px">Escribe el correo con el que te registraste. Te enviamos un código de 6 dígitos para crear una contraseña nueva.</p></div>
    ${campo('Correo electrónico', 'email', email, { tipo: 'email', req: 1, auto: 'email', ph: 'tucorreo@ejemplo.com' })}
    <div data-error></div>
    <button class="btn btn-p btn-b">Enviarme el código</button>
    <p class="centro sua peq">Las cuentas de demostración no usan este paso.</p>
  </form></div>`;
  return `<div class="auth">${lado}
  <form class="forma" data-f="nuevaClave" style="max-width:640px">
    <a class="row g8 peq neg sua" href="#/recuperar?email=${encodeURIComponent(email)}">${ic('back')}Pedir otro código</a>
    <div class="col g10"><h1 class="d2">Revisa tu correo</h1><p class="sua" style="font-size:16px">Enviamos un código a <b style="color:var(--ink)">${esc(email)}</b>. Si no lo ves, mira en la carpeta de spam. Vence en una hora.</p></div>
    <input type="hidden" name="email" value="${esc(email)}">
    ${campo('Código de 6 dígitos', 'codigo', '', { req: 1, modo: 'numeric', ph: '123456', auto: 'one-time-code', minlength: 6 })}
    ${campo('Contraseña nueva', 'password', '', { tipo: 'password', req: 1, minlength: 8, auto: 'new-password', ph: 'Mínimo 8 caracteres' })}
    ${campo('Repite la contraseña', 'password2', '', { tipo: 'password', req: 1, minlength: 8, auto: 'new-password', ph: '••••••••' })}
    <div data-error></div>
    <button class="btn btn-p btn-b">Cambiar contraseña y entrar</button>
  </form></div>`;
});
formularios.recuperar = async (f, d) => {
  const r = await api('/auth/recuperar', { metodo: 'POST', cuerpo: { email: d.email } });
  if (r.demo) throw new Error('Las cuentas de demostración entran con el botón de la pantalla anterior.');
  avisar('Si el correo está registrado, el código va en camino');
  ir('#/recuperar?paso=2&email=' + encodeURIComponent(d.email.trim()));
};
formularios.nuevaClave = async (f, d) => {
  if (d.password !== d.password2) throw new Error('Las contraseñas no coinciden');
  await entrar('/auth/nueva-clave', { email: d.email, codigo: d.codigo.trim(), password: d.password });
  avisar('Contraseña cambiada. Bienvenido de nuevo');
  ir(destino());
};

// ---------- registro
const pasos = (lista, activo, titulo) => `<aside class="lado">${logo(true)}<div class="col g8"><span class="min" style="letter-spacing:.1em;color:var(--oro)">${titulo}</span>
  ${lista.map(([t, s], i) => `<div class="paso ${i === activo ? 'on' : i < activo ? 'ok' : ''}"><i>${i < activo ? '✓' : i + 1}</i><div><b style="color:var(--cream)">${t}</b><div class="peq" style="opacity:.7">${s}</div></div></div>`).join('')}</div>
  <div style="background:rgba(255,255,255,.06);border-radius:22px;padding:24px;font-family:var(--fs);font-style:italic;font-size:23px;line-height:1.25">“Por fin mis clientes me encuentran sin tener que seguirme en todas las redes.”<div class="peq" style="font-family:var(--fb);font-style:normal;margin-top:12px;opacity:.8">Gloria · Arte de Doña Gloria</div></div></aside>`;
const PASOS_C = [['Tu cuenta', 'Cliente o emprendedor'], ['Tus gustos', 'La IA aprende de ti'], ['¡Listo!', 'Recomendaciones a tu medida']];
const PASOS_E = [['Tu cuenta', 'Datos del responsable'], ['Tu negocio', 'Cómo te verán los clientes'], ['Tus productos', 'Publica y empieza a vender']];

ruta('/registro', async (_, q) => {
  if (estado.yo) return ir(destino());
  const rol = q.get('rol') === 'emprendedor' ? 'emprendedor' : 'cliente', emp = rol === 'emprendedor';
  const op = (r, icono, t, x, lista) => `<a class="opcion ${rol === r ? 'on' : ''}" href="#/registro?rol=${r}&mantener=1"><div class="row g10"><span class="redondo" style="border-radius:12px;background:var(--${rol === r ? 'brasaS' : 'cream'});border:0">${ic(icono, rol === r ? '#C8431B' : 'currentColor')}</span><b class="d4 crece">${t}</b>
    <span class="redondo" style="width:24px;height:24px;${rol === r ? 'background:var(--brasa);border:0' : ''}">${rol === r ? ic('check', '#fff', 'width:14px;height:14px') : ''}</span></div>
    <span class="peq sua">${x}</span>${lista.map(l => `<span class="row g8 peq">${ic('check', '#3E7B5E', 'width:15px;height:15px')}${l}</span>`).join('')}</a>`;
  return `<div class="auth">${pasos(emp ? PASOS_E : PASOS_C, 0, emp ? 'REGISTRA TU EMPRENDIMIENTO' : 'CREA TU CUENTA')}
  <form class="forma" data-f="registro"><input type="hidden" name="rol" value="${rol}">
    <div class="col g10"><span class="kick">Paso 1 de 3</span><h1 class="d2">¿Cómo vas a usar Impulsa?</h1></div>
    <div class="grid c2">${op('cliente', 'bag', 'Soy cliente', 'Busco productos y servicios de emprendedores de mi ciudad.', ['Búsqueda con IA a tu medida', 'Calendario de fechas y regalos', 'Avisos de promos y disponibilidad'])}
      ${op('emprendedor', 'store', 'Tengo un negocio', 'Quiero mostrar lo que vendo y llegar a más clientes.', ['Vitrina con fotos, precios y redes', 'Botón directo a tu WhatsApp', 'Estadísticas de ventas e IA'])}</div>
    <div class="row g16 fila-f">${campo('Nombre', 'nombre', '', { req: 1, auto: 'given-name' })}${campo('Apellido', 'apellido', '', { req: 1, auto: 'family-name' })}</div>
    ${campo('Correo electrónico', 'email', '', { tipo: 'email', req: 1, auto: 'email' })}
    <div class="row g16 fila-f ini">${campo('Celular (WhatsApp)', 'celular', '', { tipo: 'tel', req: 1, modo: 'numeric', ph: '300 123 4567', ayuda: emp ? 'Para avisarte de contactos y reseñas' : 'Para avisos de promos y recordatorios' })}
      ${emp ? campo('Barrio', 'barrio', '', { ph: 'Centro' }) : campo('Fecha de nacimiento', 'fecha_nacimiento', '', { tipo: 'date', ayuda: 'Opcional' })}</div>
    <div class="row g16 fila-f ini">${emp ? '' : campo('Barrio', 'barrio', '', { ph: 'Santa Clara' })}${campo('Contraseña', 'password', '', { tipo: 'password', req: 1, minlength: 8, auto: 'new-password', ayuda: 'Mínimo 8 caracteres' })}</div>
    <label class="row g10 peq"><input type="checkbox" required style="width:18px;height:18px;accent-color:var(--brasa)">Acepto los Términos y la Política de tratamiento de datos (Ley 1581 de 2012)</label>
    <div data-error></div>
    <div class="row entre envuelve g16"><span class="sua">¿Ya tienes cuenta? <a class="neg" style="color:var(--brasa)" href="#/entrar">Inicia sesión</a></span>
      <button class="btn btn-p">Crear mi cuenta ${ic('arrow', '#fff')}</button></div>
  </form></div>`;
});
formularios.registro = async (f, d) => {
  d.celular = d.celular.replace(/\D/g, '');
  if (d.celular.length < 10) throw new Error('Escribe un celular de 10 dígitos');
  await entrar('/auth/registro', d);
  avisar('¡Bienvenido a Impulsa!');
  ir(destino());
};

// ---------- gustos (onboarding del cliente y edición desde el perfil)
const PARA = ['Para mí', 'Pareja', 'Mamá / papá', 'Amigos', 'Hijos', 'Compañeros de trabajo'];
const TOPES = [[20000, '$20.000'], [50000, '$50.000'], [80000, '$80.000'], [120000, '$120.000'], [200000, '$200.000'], [500000, '$500.000 o más']];
export async function formularioGustos() {
  const cats = await cargarCategorias(), y = estado.yo, p = y.perfil;
  return `<div class="col g12"><b>Categorías que te gustan</b><div class="row g8 envuelve">${cats.map(c => `<button type="button" class="pill ${y.gustos.includes(c.id) ? 'on' : ''}" data-a="pill" data-g="cat" data-v="${c.id}">${c.emoji} ${esc(c.nombre)}</button>`).join('')}</div></div>
    <div class="col g12"><b>¿Para quién sueles comprar?</b><div class="row g8 envuelve">${PARA.map(t => `<button type="button" class="pill ${(p.compra_para || []).includes(t) ? 'on' : ''}" data-a="pill" data-g="para" data-v="${t}">${t}</button>`).join('')}</div></div>
    <div class="card col g12"><b>Presupuesto habitual por compra</b><div class="row g16 fila-f">
      ${campo('Desde', 'presupuesto_min', p.presupuesto_min ?? 20000, { opciones: [[10000, '$10.000'], ...TOPES.slice(0, 4)] })}${campo('Hasta', 'presupuesto_max', p.presupuesto_max ?? 120000, { opciones: TOPES })}</div></div>
    <div class="row g12" style="background:var(--oroS);padding:16px;border-radius:18px">${ic('spark', '#C8431B')}<span class="peq crece">También aprendemos de lo que compras y guardas. Puedes cambiar tus gustos cuando quieras desde tu perfil.</span></div>`;
}
acciones.pill = el => el.classList.toggle('on');
formularios.gustos = async (f, d) => {
  const sel = g => [...f.querySelectorAll(`.pill.on[data-g="${g}"]`)].map(b => b.dataset.v);
  const cats = sel('cat').map(Number);
  if (cats.length < 3) throw new Error('Elige al menos 3 categorías para que la IA te conozca');
  actualizarYo(await api('/auth/gustos', { metodo: 'PUT', cuerpo: { categorias: cats, compra_para: sel('para'),
    presupuesto_min: Number(d.presupuesto_min), presupuesto_max: Math.max(Number(d.presupuesto_max), Number(d.presupuesto_min)) } }));
  avisar('Gustos guardados. Tus recomendaciones ya están listas');
  ir('#/inicio');
};
ruta('/gustos', async () => {
  if (!estado.yo) return ir('#/entrar');
  return `<div class="auth">${pasos(PASOS_C, 1, 'CREA TU CUENTA')}<form class="forma" data-f="gustos">
    <div class="col g10"><span class="kick">Paso 2 de 3</span><h1 class="d2">¿Qué te <span class="serif" style="font-size:1.15em">encanta?</span></h1>
      <p class="sua" style="font-size:16px">Elige al menos 3. Con esto la IA arma tus recomendaciones desde el primer día.</p></div>
    ${await formularioGustos()}<div data-error></div>
    <div class="row entre"><a class="neg sua" href="#/inicio">Omitir por ahora</a><button class="btn btn-p">Guardar y continuar ${ic('arrow', '#fff')}</button></div></form></div>`;
});
export { pie, destino };
