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

`backend/app/ia.py` convierte la frase del cliente en filtros: palabras clave, precio mínimo y máximo, ocasión y destinatario. Trae un intérprete propio por reglas que entiende montos como "100 mil", "80k" o "1 millón". Si se define la variable `GEMINI_API_KEY`, usa Gemini para interpretar y deja las reglas como respaldo. Los filtros van a la función `buscar_productos` de Postgres, que ordena por coincidencia de texto y por afinidad con los gustos del cliente.

### Tareas programadas

Supabase ejecuta dos tareas con `pg_cron`. `generar_recordatorios` corre a diario y crea las notificaciones del calendario. `mantener_despierto` llama a `/api/salud` cada 10 minutos para que el servicio gratis de Render no se duerma.

## Cuentas de demostración

La contraseña de todas es `Impulsa2026`.

| Rol | Correo |
|---|---|
| Clienta | `laura@impulsa.demo` |
| Emprendedora (Arte de Doña Gloria) | `gloria@impulsa.demo` |

La pantalla de inicio de sesión tiene dos botones que entran con estas cuentas.

## Desplegar en Render

1. Entrar a https://render.com/deploy?repo=https://github.com/NavarroEliany/IMPULSA con la cuenta de GitHub.
2. Pulsar **Apply**. Render lee `render.yaml`, instala las dependencias y publica el servicio.

No hay variables que llenar. `GEMINI_API_KEY` es opcional y se agrega después en Environment si se quiere la interpretación con Gemini.

## Ejecutar en el computador

```bash
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload
```

Abre http://localhost:8000.

## Base de datos

Tiene 18 tablas con RLS activo. Las principales son `perfiles`, `emprendimientos`, `productos`, `pedidos`, `resenas`, `fechas_importantes`, `promociones`, `alertas_stock` y `notificaciones`. Viene con 14 emprendimientos, 54 productos, 140 reseñas y un año de contactos para que las estadísticas tengan contenido.

Las migraciones (`impulsa_01_esquema` a `impulsa_04_ajustes`) están en el historial del proyecto de Supabase, en Database → Migrations.
