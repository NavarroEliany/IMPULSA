// Registro central de acciones (clics), formularios y rutas. Cada página se inscribe aquí.
export const acciones = {};      // data-a="nombre"  -> acciones.nombre(elemento, evento)
export const formularios = {};   // data-f="nombre"  -> formularios.nombre(form, datos, evento)
export const rutas = [];         // [expresión, función(parámetros, consulta)]
export const nucleo = { repintar: () => {}, consulta: () => new URLSearchParams() };
export const ir = hash => { if (location.hash === hash) nucleo.repintar(); else location.hash = hash; };
export const ruta = (patron, fn) => rutas.push([new RegExp('^' + patron + '$'), fn]);
