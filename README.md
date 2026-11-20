# Impulsa

Plataforma web que reúne a los emprendedores de Ocaña y a quienes les compran. El cliente escribe lo que necesita con sus palabras ("regalo para mi novia, máximo 100 mil") y el buscador le muestra qué emprendimiento lo tiene. El pago y el envío se acuerdan por WhatsApp con el negocio.

## Qué hace

Para el cliente:

- Búsqueda en lenguaje natural con presupuesto, ocasión y destinatario.
- Recomendaciones según los gustos que marcó al registrarse y lo que ha pedido antes.
- Calendario de fechas importantes con ideas de regalo y recordatorios.
- Favoritos, reseñas, aviso cuando un producto agotado vuelve y notificación de promociones.

Para el emprendedor:

- Perfil del negocio con WhatsApp, Instagram, TikTok, Facebook, horario, medios de pago y entregas.
- Inventario de productos y servicios con fotos, stock y ocasiones.
- Estadísticas: ventas por mes, meses pico, días y horas en que le escriben, productos más pedidos y origen de los contactos.
- Promociones, respuesta a reseñas y consejos calculados con sus propios datos.
- Catálogos ya hechos: sube un PDF o una imagen (hasta 20 MB) o pega el enlace de Canva, Google Drive o Dropbox. Se muestran en su perfil público.

Para el administrador (`#/admin`):

- Resumen de la plataforma: usuarios, negocios, contactos por mes, negocios con más contactos, lo que más busca la gente y pendientes por revisar.
- Usuarios: buscar, cambiar el rol (cliente, negocio o administrador) y suspender o reactivar cuentas. Una cuenta suspendida no puede entrar y su negocio se oculta.
- Negocios: verificar (la insignia) y ocultar o volver a mostrar.
- Productos: destacar en la portada u ocultar.
- Reseñas: filtrar las de pocas estrellas y eliminar las ofensivas o falsas.
- Categorías y fechas comerciales sugeridas del calendario.
- Anuncios: una notificación a todos los clientes, a todos los negocios o a ambos.

## Cómo está armado

| Parte | Tecnología | Carpeta |
|---|---|---|
| Frontend | HTML, CSS y JavaScript en módulos, sin paso de compilación | `frontend/` |
| Backend | Python 3.12 con FastAPI | `backend/` |
| Base de datos, cuentas y fotos | Supabase (Postgres, Auth, Storage) | proyecto `Impulsa` en Supabase |
| Despliegue | Render, plan gratis | `render.yaml` |

FastAPI sirve la API en `/api` y también los archivos del frontend, así que todo queda en una sola dirección. La documentación interactiva de la API está en `/api/docs`.

El backend no guarda la clave de servicio de Supabase. Reenvía el token de cada usuario y las políticas RLS de Postgres deciden qué puede leer o escribir. La clave que aparece en `backend/app/config.py` es la clave pública (publishable), hecha para ir en clientes.

Las cuentas se crean ya confirmadas con la función `registrar_usuario`, por eso el registro no pide activar nada por correo.

### Búsqueda

La búsqueda trabaja en tres capas:

1. **Interpretar la frase.** `backend/app/ia.py` saca palabras clave, precio mínimo y máximo, ocasión y destinatario. Trae un intérprete propio por reglas que entiende montos como "100 mil", "80k" o "1 millón". Si existe `GEMINI_API_KEY`, este paso lo hace Gemini y las reglas quedan de respaldo.
2. **Buscar por palabras.** La función `buscar_productos` de Postgres ordena por coincidencia de texto (sin tildes y con errores de escritura) y por afinidad con los gustos del cliente.
3. **Buscar por significado.** Cada producto tiene un vector de 384 números que calcula el modelo gte-small dentro de la Edge Function `ia-impulsa` de Supabase (sin claves ni cupo diario). Un `pg_cron` revisa cada minuto si hay productos nuevos o editados sin vector y los calcula. La consulta del cliente también se convierte en vector y `buscar_semantico` devuelve lo más parecido.

Si no hay nada exacto, la respuesta lo dice ("Por ahora no hay sushi en Impulsa. Lo que más se parece es…") y muestra las alternativas. Con Gemini activo, Gemini elige cuáles alternativas tienen sentido y redacta el aviso.

**Cupo de Gemini.** El plan gratis tiene límite por minuto y por día, y el cupo diario se reinicia a medianoche del Pacífico (3 a. m. en Colombia). Si Google responde que se acabó, el backend deja de llamarlo hasta el reinicio y todo sigue funcionando con las capas 1 a 3 locales. Las interpretaciones de frases repetidas se guardan en memoria para no gastar cupo. `/api/salud` muestra si Gemini está activo, sin clave o sin cupo.

### Tareas programadas

Supabase ejecuta dos tareas con `pg_cron`. `generar_recordatorios` corre a diario y crea las notificaciones del calendario. `mantener_despierto` llama a `/api/salud` cada 10 minutos para que el servicio gratis de Render no se duerma.

## Cuentas de demostración

La contraseña de todas es `Impulsa2026`.

| Rol | Correo |
|---|---|
| Clienta | `laura@impulsa.demo` |
| Emprendedora (Arte de Doña Gloria) | `gloria@impulsa.demo` |

La pantalla de inicio de sesión tiene dos botones que entran con estas cuentas.

La cuenta de administrador es `admin@impulsa.demo` y su contraseña no está en el repositorio. Nadie puede volverse administrador por su cuenta: el rol solo lo cambia otro administrador desde `#/admin/usuarios`, y la base de datos rechaza cualquier intento de cambiarse el rol, autoverificarse o reactivar un negocio suspendido.

## Desplegar en Render

1. Entrar a https://render.com/deploy?repo=https://github.com/NavarroEliany/IMPULSA con la cuenta de GitHub.
2. Pulsar **Apply**. Render lee `render.yaml`, instala las dependencias y publica el servicio.

No hay variables que llenar. `GEMINI_API_KEY` es opcional: se crea gratis en Google AI Studio y se agrega en Render, en Environment. `GEMINI_MODEL` permite cambiar el modelo (por defecto `gemini-flash-latest`).

## Ejecutar en el computador

```bash
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload
```

Abre http://localhost:8000.

## Base de datos

Tiene 19 tablas con RLS activo. Las principales son `perfiles`, `emprendimientos`, `productos`, `pedidos`, `resenas`, `fechas_importantes`, `promociones`, `alertas_stock` y `notificaciones`. Viene con 14 emprendimientos, 54 productos, 140 reseñas y un año de contactos para que las estadísticas tengan contenido.

Las migraciones (`impulsa_01_esquema` a `impulsa_06_corregir_proteccion_roles`) están en el historial del proyecto de Supabase, en Database → Migrations.
