"""Panel del emprendedor: negocio, productos, pedidos, reseñas, promociones y estadísticas."""
import uuid
from typing import List, Optional

import re

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from .. import ia, sb
from ..config import BUCKET, SUPABASE_URL

r = APIRouter(prefix="/api/panel", tags=["Panel del emprendedor"])

_MESES = ia._MESES


class Negocio(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[int] = None
    subcategorias: Optional[List[str]] = None
    logo_url: Optional[str] = None
    portada_url: Optional[str] = None
    tiene_local: Optional[bool] = None
    direccion: Optional[str] = None
    barrio: Optional[str] = None
    dias_atencion: Optional[List[str]] = None
    abre: Optional[str] = None
    cierra: Optional[str] = None
    whatsapp: Optional[str] = None
    mensaje_whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    tiktok: Optional[str] = None
    facebook: Optional[str] = None
    sitio_web: Optional[str] = None
    medios_pago: Optional[List[str]] = None
    formas_entrega: Optional[List[str]] = None
    costo_domicilio: Optional[int] = None
    tiempo_entrega: Optional[str] = None


class Producto(BaseModel):
    nombre: str
    descripcion: str = ""
    tipo: str = "producto"
    categoria_id: Optional[int] = None
    precio: int = Field(ge=0)
    precio_antes: Optional[int] = None
    stock: int = Field(default=0, ge=0)
    stock_minimo: int = 2
    por_encargo: bool = False
    ocasiones: List[str] = []
    etiquetas: List[str] = []
    imagenes: List[str] = []
    activo: bool = True


class Catalogo(BaseModel):
    titulo: str = Field(min_length=2, max_length=80)
    tipo: str = Field(pattern="^(pdf|imagen|enlace)$")
    url: str = Field(pattern="^https://", max_length=600)


class CambioProducto(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    categoria_id: Optional[int] = None
    precio: Optional[int] = None
    precio_antes: Optional[int] = None
    stock: Optional[int] = None
    stock_minimo: Optional[int] = None
    por_encargo: Optional[bool] = None
    ocasiones: Optional[List[str]] = None
    etiquetas: Optional[List[str]] = None
    imagenes: Optional[List[str]] = None
    activo: Optional[bool] = None


class Estado(BaseModel):
    estado: str


class Respuesta(BaseModel):
    texto: str


class Promo(BaseModel):
    producto_id: Optional[str] = None
    titulo: str
    descripcion: Optional[str] = None
    etiqueta: str = "Promo"
    dias: int = Field(default=7, ge=1, le=60)


class IdeaDescripcion(BaseModel):
    nombre: str
    categoria: str = ""
    detalles: str = ""


async def mi_negocio(token: str) -> dict:
    n = await sb.uno("emprendimientos", token, propietario_id=f"eq.{sb.uid_de(token)}", order="creado_en")
    if not n:
        raise HTTPException(404, "Aún no has registrado tu emprendimiento")
    return n


def _numero_wa(v: str) -> str:
    n = "".join(c for c in v if c.isdigit())
    if len(n) == 10:
        n = "57" + n
    if len(n) < 11:
        raise HTTPException(400, "Escribe un número de WhatsApp válido")
    return n


@r.get("/negocio", summary="Mi emprendimiento")
async def ver_negocio(token: str = Depends(sb.token_requerido)):
    return await sb.uno("v_emprendimientos", token, propietario_id=f"eq.{sb.uid_de(token)}")


@r.post("/negocio", summary="Registrar mi emprendimiento")
async def crear_negocio(d: Negocio, token: str = Depends(sb.token_requerido)):
    uid = sb.uid_de(token)
    if await sb.uno("emprendimientos", token, propietario_id=f"eq.{uid}", select="id"):
        raise HTTPException(409, "Ya tienes un emprendimiento registrado")
    if not d.nombre or not d.whatsapp:
        raise HTTPException(400, "El nombre y el WhatsApp son obligatorios")
    datos = {k: v for k, v in d.model_dump().items() if v is not None}
    datos["whatsapp"] = _numero_wa(d.whatsapp)
    datos["propietario_id"] = uid
    return await sb.crear("emprendimientos", datos, token)


@r.put("/negocio", summary="Editar mi emprendimiento")
async def editar_negocio(d: Negocio, token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    datos = d.model_dump(exclude_unset=True)
    for obligatorio in ("nombre", "whatsapp", "descripcion", "mensaje_whatsapp"):
        if obligatorio in datos and not datos[obligatorio]:
            datos.pop(obligatorio)
    if "whatsapp" in datos:
        datos["whatsapp"] = _numero_wa(datos["whatsapp"])
    if datos:
        await sb.cambiar("emprendimientos", {"id": f"eq.{n['id']}"}, datos, token)
    return await sb.uno("v_emprendimientos", token, id=f"eq.{n['id']}")


@r.get("/resumen", summary="Estadísticas: ventas, fechas pico, horarios, productos top y consejos de la IA")
async def resumen(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    d = await sb.rpc("panel_resumen", token, p_emp=n["id"])
    d["tendencias"] = await sb.rpc("tendencias_busqueda", token) or []
    # Meses fuertes del último año, comparados con el promedio.
    meses = d.get("ventas_por_mes") or []
    con_ventas = [m["total"] for m in meses if m["total"]]
    promedio = (sum(con_ventas) / len(con_ventas)) if con_ventas else 0
    picos = sorted(meses[:-1], key=lambda m: m["total"], reverse=True)[:4]
    d["meses_pico"] = [{"mes": m["mes"], "nombre": _MESES[int(m["mes"][5:7])], "total": m["total"],
                        "sobre_promedio": round((m["total"] / promedio - 1) * 100) if promedio else 0}
                       for m in picos if m["total"] > 0]
    sugeridas = (await sb.rpc("fechas_cliente", token) or {}).get("sugeridas") or []
    proximas = [f for f in sugeridas if 0 <= f["dias"] <= 45]
    d["proximas_fechas"] = proximas[:3]
    d["consejos"] = ia.consejos(d, proximas)
    d["negocio"] = n
    return d


# ---------- productos
@r.get("/productos", summary="Mi inventario")
async def productos(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    filas = await sb.leer("productos", token, emprendimiento_id=f"eq.{n['id']}", order="creado_en.desc",
                          select="id,nombre,descripcion,tipo,categoria_id,precio,precio_antes,stock,stock_minimo,por_encargo,"
                                 "ocasiones,etiquetas,imagenes,activo,destacado,creado_en")
    visitas = await sb.leer("visitas", token, select="producto_id", emprendimiento_id=f"eq.{n['id']}",
                            producto_id="not.is.null", order="creado_en.desc", limit="5000")
    clics = await sb.leer("pedidos", token, select="producto_id", emprendimiento_id=f"eq.{n['id']}",
                          producto_id="not.is.null", order="creado_en.desc", limit="5000")
    esperando = await sb.leer("alertas_stock", token, select="producto_id", notificado="eq.false")
    for f in filas:
        f["visitas"] = sum(1 for v in visitas if v["producto_id"] == f["id"])
        f["clics"] = sum(1 for c in clics if c["producto_id"] == f["id"])
        f["esperando"] = sum(1 for e in esperando if e["producto_id"] == f["id"])
    return filas


@r.post("/productos", summary="Publicar un producto o servicio")
async def crear_producto(d: Producto, token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    datos = d.model_dump()
    datos["emprendimiento_id"] = n["id"]
    datos["categoria_id"] = d.categoria_id or n.get("categoria_id")
    return await sb.crear("productos", datos, token)


@r.put("/productos/{producto_id}", summary="Editar un producto (al reponer stock se avisa a quienes lo esperaban)")
async def editar_producto(producto_id: str, d: CambioProducto, token: str = Depends(sb.token_requerido)):
    datos = d.model_dump(exclude_unset=True)
    if not datos:
        raise HTTPException(400, "No hay cambios")
    filas = await sb.cambiar("productos", {"id": f"eq.{producto_id}"}, datos, token)
    if not filas:
        raise HTTPException(404, "Producto no encontrado")
    filas[0].pop("busqueda", None)
    return filas[0]


@r.delete("/productos/{producto_id}", summary="Eliminar un producto")
async def borrar_producto(producto_id: str, token: str = Depends(sb.token_requerido)):
    await sb.borrar("productos", {"id": f"eq.{producto_id}"}, token)
    return {"ok": True}


# ---------- contactos y pedidos
@r.get("/pedidos", summary="Contactos recibidos por WhatsApp")
async def pedidos(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    return await sb.leer("pedidos", token, emprendimiento_id=f"eq.{n['id']}", order="creado_en.desc", limit="60",
                         select="id,cantidad,total,origen,estado,nota,creado_en,producto:productos(id,nombre,imagenes)")


@r.put("/pedidos/{pedido_id}", summary="Confirmar un contacto como venta o cancelarlo")
async def cambiar_pedido(pedido_id: str, d: Estado, token: str = Depends(sb.token_requerido)):
    if d.estado not in ("contactado", "confirmado", "cancelado"):
        raise HTTPException(400, "Estado no válido")
    filas = await sb.cambiar("pedidos", {"id": f"eq.{pedido_id}"}, {"estado": d.estado}, token)
    if not filas:
        raise HTTPException(404, "Pedido no encontrado")
    return filas[0]


# ---------- reseñas
@r.get("/resenas", summary="Reseñas de mi negocio")
async def resenas(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    return await sb.rpc("resenas_de", token, p_emp=n["id"], p_prod=None, p_limite=50)


@r.post("/resenas/{resena_id}/responder", summary="Responder una reseña")
async def responder(resena_id: str, d: Respuesta, token: str = Depends(sb.token_requerido)):
    await sb.rpc("responder_resena", token, p_id=resena_id, p_texto=d.texto.strip()[:600])
    return {"ok": True}


# ---------- promociones
@r.get("/promociones", summary="Mis promociones")
async def promociones(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    return await sb.leer("promociones", token, emprendimiento_id=f"eq.{n['id']}", order="creado_en.desc",
                         select="*,producto:productos(id,nombre,imagenes)")


@r.post("/promociones", summary="Crear una promoción (notifica a clientes frecuentes y a quienes guardaron el producto)")
async def crear_promo(d: Promo, token: str = Depends(sb.token_requerido)):
    from datetime import datetime, timedelta, timezone
    n = await mi_negocio(token)
    return await sb.crear("promociones", {
        "emprendimiento_id": n["id"], "producto_id": d.producto_id, "titulo": d.titulo.strip()[:80],
        "descripcion": (d.descripcion or "").strip()[:200] or None, "etiqueta": d.etiqueta.strip()[:14] or "Promo",
        "termina": (datetime.now(timezone.utc) + timedelta(days=d.dias)).isoformat()}, token)


@r.delete("/promociones/{promo_id}", summary="Terminar una promoción")
async def borrar_promo(promo_id: str, token: str = Depends(sb.token_requerido)):
    await sb.borrar("promociones", {"id": f"eq.{promo_id}"}, token)
    return {"ok": True}


# ---------- fotos e IA
_TIPOS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@r.post("/imagenes", summary="Subir una foto (logo, portada o producto)")
async def subir_imagen(archivo: UploadFile = File(...), token: str = Depends(sb.token_requerido)):
    if archivo.content_type not in _TIPOS:
        raise HTTPException(400, "Sube una imagen JPG, PNG o WebP")
    datos = await archivo.read()
    if len(datos) > 5 * 1024 * 1024:
        raise HTTPException(400, "La imagen pesa más de 5 MB")
    ruta = f"{sb.uid_de(token)}/{uuid.uuid4().hex}.{_TIPOS[archivo.content_type]}"
    await sb.subir(BUCKET, ruta, datos, archivo.content_type, token)
    return {"url": f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{ruta}"}


@r.get("/radar", summary="Radar de demanda: lo que buscan en Ocaña, lo que nadie vende y oportunidades detectadas por la IA")
async def radar(dias: int = 30, token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    d = await sb.rpc("radar_demanda", token, p_emp=n["id"], p_dias=max(7, min(dias, 90)))
    neg = await sb.uno("v_emprendimientos", token, id=f"eq.{n['id']}") or n
    d["oportunidades"], d["motor"] = await ia.radar_oportunidades(d, neg)
    return d


@r.post("/ia/descripcion", summary="Redactar la descripción de un producto con IA")
async def descripcion_ia(d: IdeaDescripcion, token: str = Depends(sb.token_requerido)):
    return await ia.redactar_descripcion(d.nombre.strip()[:120], d.categoria[:60], d.detalles[:400])


# ---------- catálogos (PDF, imagen o enlace de Canva, Drive, etc.)
_CATALOGO = {"application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@r.get("/catalogos", summary="Mis catálogos")
async def mis_catalogos(token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    return await sb.leer("catalogos", token, emprendimiento_id=f"eq.{n['id']}", order="orden.asc,creado_en.desc")


@r.post("/catalogos/archivo", summary="Subir el archivo de un catálogo (PDF o imagen, hasta 20 MB)")
async def subir_catalogo(archivo: UploadFile = File(...), token: str = Depends(sb.token_requerido)):
    await mi_negocio(token)
    tipo = archivo.content_type
    datos = await archivo.read()
    if tipo not in _CATALOGO and datos[:5] == b"%PDF-":
        tipo = "application/pdf"
    if tipo not in _CATALOGO:
        raise HTTPException(400, "Sube un PDF o una imagen (JPG, PNG o WebP)")
    if tipo == "application/pdf" and datos[:5] != b"%PDF-":
        raise HTTPException(400, "Ese archivo no es un PDF válido")
    if len(datos) > 20 * 1024 * 1024:
        raise HTTPException(400, "El archivo pesa más de 20 MB. Desde Canva puedes descargarlo como «PDF estándar» para que pese menos.")
    ruta = f"{sb.uid_de(token)}/catalogos/{uuid.uuid4().hex}.{_CATALOGO[tipo]}"
    await sb.subir(BUCKET, ruta, datos, tipo, token)
    return {"url": f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{ruta}",
            "tipo": "pdf" if tipo == "application/pdf" else "imagen", "peso": len(datos)}


@r.post("/catalogos", summary="Publicar un catálogo (la IA lo lee y vuelve buscables sus productos)")
async def crear_catalogo(d: Catalogo, tareas: BackgroundTasks, token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    ya = await sb.leer("catalogos", token, select="id", emprendimiento_id=f"eq.{n['id']}")
    if len(ya) >= 12:
        raise HTTPException(400, "Puedes tener hasta 12 catálogos. Borra uno viejo para subir otro.")
    c = await sb.crear("catalogos", {"emprendimiento_id": n["id"], "titulo": d.titulo.strip(), "tipo": d.tipo,
                                     "url": d.url.strip(), "orden": len(ya), "estado": "leyendo"}, token)
    c = c[0] if isinstance(c, list) else c
    tareas.add_task(procesar_catalogo, c, n, token)
    return c


@r.post("/catalogos/{catalogo_id}/leer", summary="Volver a leer un catálogo con la IA")
async def releer_catalogo(catalogo_id: str, tareas: BackgroundTasks, token: str = Depends(sb.token_requerido)):
    n = await mi_negocio(token)
    c = await sb.uno("catalogos", token, id=f"eq.{catalogo_id}", emprendimiento_id=f"eq.{n['id']}")
    if not c:
        raise HTTPException(404, "No encontramos ese catálogo")
    await sb.cambiar("catalogos", {"id": f"eq.{catalogo_id}"}, {"estado": "leyendo", "nota": None}, token)
    tareas.add_task(procesar_catalogo, c, n, token)
    return {"ok": True}


def _enlace_descargable(url: str) -> str:
    """Los enlaces de Google Drive se cambian por su descarga directa; el resto se intenta tal cual."""
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?.*id=)([\w-]{10,})", url)
    return f"https://drive.google.com/uc?export=download&id={m.group(1)}" if m else url


async def _descargar_catalogo(c: dict) -> tuple:
    async with httpx.AsyncClient(timeout=40, follow_redirects=True) as h:
        r = await h.get(_enlace_descargable(c["url"]), headers={"User-Agent": "Impulsa/1.0"})
    if r.status_code != 200:
        return None, None
    datos = r.content
    if datos[:5] == b"%PDF-":
        return datos, "application/pdf"
    tipo = r.headers.get("content-type", "").split(";")[0].strip().lower()
    if tipo in ("image/jpeg", "image/png", "image/webp"):
        return datos, tipo
    return None, None


async def procesar_catalogo(c: dict, negocio: dict, token: str) -> None:
    """Lee el catálogo y publica cada producto encontrado, enlazado a la página del catálogo donde aparece.
    Así entran a la búsqueda por palabras y por significado como cualquier otro producto."""
    estado = {"estado": "no_se_pudo", "encontrados": 0, "nota": None}
    try:
        datos, mime = await _descargar_catalogo(c)
        if not datos:
            estado["nota"] = ("No pudimos abrir el archivo de este enlace. Si es de Canva o Instagram, descárgalo como PDF "
                              "y súbelo en «Subir archivo» para que la IA pueda leerlo.")
        elif len(datos) > 20 * 1024 * 1024:
            estado["nota"] = "El archivo pesa más de 20 MB. Descárgalo como «PDF estándar» y vuelve a subirlo."
        else:
            cats = await sb.leer("categorias", None, select="id,slug")
            por_slug = {x["slug"]: x["id"] for x in cats}
            items, motor, nota = await ia.leer_catalogo(datos, mime, negocio.get("nombre", ""), list(por_slug))
            estado["nota"] = nota
            if items:
                await sb.borrar("productos", {"catalogo_id": f"eq.{c['id']}"}, token)
                filas = [{"emprendimiento_id": negocio["id"], "catalogo_id": c["id"], "catalogo_pagina": it["pagina"],
                          "nombre": it["nombre"],
                          "descripcion": it["descripcion"] or f"Aparece en el catálogo «{c['titulo']}»",
                          "tipo": it["tipo"], "categoria_id": por_slug.get(it["categoria"]) or negocio.get("categoria_id"),
                          "precio": it["precio"], "stock": 10, "stock_minimo": 0, "etiquetas": it["etiquetas"],
                          "activo": True} for it in items]
                await sb.crear("productos", filas, token, devolver=False)
                estado.update(estado="listo", encontrados=len(filas))
            elif motor is not None:
                estado["estado"] = "sin_productos"
    except Exception as e:  # noqa: BLE001 - el emprendedor ve el aviso y puede volver a intentarlo
        estado["nota"] = f"Algo falló al leer el catálogo ({type(e).__name__}). Vuelve a intentarlo."
    from datetime import datetime, timezone
    estado["leido_en"] = datetime.now(timezone.utc).isoformat()
    try:
        await sb.cambiar("catalogos", {"id": f"eq.{c['id']}"}, estado, token)
    except Exception:
        pass


@r.delete("/catalogos/{catalogo_id}", summary="Quitar un catálogo")
async def borrar_catalogo(catalogo_id: str, token: str = Depends(sb.token_requerido)):
    await sb.borrar("catalogos", {"id": f"eq.{catalogo_id}"}, token)
    return {"ok": True}
