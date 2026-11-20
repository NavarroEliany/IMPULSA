"""Catálogo público, búsqueda con IA y contacto por WhatsApp."""
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import ia, sb
from ..config import GEMINI_API_KEY

r = APIRouter(prefix="/api", tags=["Catálogo y búsqueda"])


class Busqueda(BaseModel):
    q: str = ""
    precio_min: Optional[int] = None
    precio_max: Optional[int] = None
    categoria: Optional[str] = None
    ocasion: Optional[str] = None
    tipo: Optional[str] = None
    solo_disponibles: bool = False
    limite: int = 24


class Contacto(BaseModel):
    producto_id: Optional[str] = None
    emprendimiento_id: Optional[str] = None
    cantidad: int = 1
    origen: str = "perfil"
    nota: Optional[str] = None


@r.get("/salud", tags=["Sistema"], summary="Estado del servicio")
async def salud():
    return {"ok": True, "servicio": "impulsa", "ia": "gemini" if GEMINI_API_KEY else "local"}


@r.get("/inicio", summary="Datos de la página principal")
async def inicio(token: Optional[str] = Depends(sb.token_opcional)):
    return await sb.rpc("inicio_publico", token)


@r.get("/categorias", summary="Categorías")
async def categorias():
    return await sb.leer("categorias", order="orden")


@r.post("/buscar", summary="Búsqueda en lenguaje natural con IA")
async def buscar(d: Busqueda, token: Optional[str] = Depends(sb.token_opcional)):
    consulta = d.q.strip()[:200]
    f = await ia.interpretar(consulta) if consulta else {"palabras": "", "precio_min": None, "precio_max": None,
                                                           "ocasion": None, "para": None, "solo_disponibles": False, "motor": "local"}
    # Los filtros que el cliente mueve a mano mandan sobre lo que interpretó la IA.
    if d.precio_min is not None:
        f["precio_min"] = d.precio_min
    if d.precio_max is not None:
        f["precio_max"] = d.precio_max
    if d.ocasion:
        f["ocasion"] = d.ocasion
    f["solo_disponibles"] = bool(d.solo_disponibles or f.get("solo_disponibles"))

    async def consulta_bd(palabras: str, precio_max):
        return await sb.rpc("buscar_productos", token, p_q=palabras, p_precio_min=f["precio_min"], p_precio_max=precio_max,
                            p_categoria=d.categoria, p_ocasion=f["ocasion"], p_tipo=d.tipo,
                            p_solo_disponibles=f["solo_disponibles"], p_limite=max(1, min(d.limite, 60))) or []

    resultados = await consulta_bd(f["palabras"], f["precio_max"])
    ampliada, sin_exacto, mensaje = False, False, None
    if f["palabras"]:
        # Búsqueda por significado: entiende sinónimos y encuentra lo más parecido aunque no coincidan las palabras.
        vec = await ia.vector(f["palabras"])
        semantica = []
        if vec:
            try:
                semantica = await sb.rpc("buscar_semantico", token, p_vector=str(vec), p_precio_min=f["precio_min"],
                                         p_precio_max=f["precio_max"], p_categoria=d.categoria, p_ocasion=f["ocasion"],
                                         p_tipo=d.tipo, p_solo_disponibles=f["solo_disponibles"], p_limite=12) or []
            except HTTPException:
                semantica = []
        if resultados:
            vistos = {p["id"] for p in resultados}
            resultados += [p for p in semantica if p["id"] not in vistos and p["similitud"] >= ia.SIM_EXACTA]
        else:
            exactos = [p for p in semantica if p["similitud"] >= ia.SIM_EXACTA]
            if exactos:
                resultados = exactos
            else:
                sin_exacto = True
                parecidos = [p for p in semantica if p["similitud"] >= ia.SIM_PARECIDA][:8] or semantica[:4]
                termino = f["palabras"] if len(f["palabras"]) <= 40 else "eso"
                mensaje = (await ia.explicar_gemini(consulta, termino, parecidos)
                           or ia.mensaje_sin_exacto(termino, parecidos))
                resultados = parecidos
        if not resultados and not sin_exacto:
            # Sin vectores disponibles: se muestran las mejores opciones que cumplen el resto de filtros.
            resultados = await consulta_bd("", f["precio_max"])
            ampliada = True
        resultados = resultados[:max(1, min(d.limite, 60))]
    if resultados and not sin_exacto:
        resultados[0]["razones"] = ia.razones(resultados[0], f)
    if consulta:
        try:
            await sb.crear("busquedas", {"cliente_id": sb.uid_opcional(token), "consulta": consulta, "filtros": f,
                                         "resultados": 0 if sin_exacto else len(resultados)}, token, devolver=False)
        except HTTPException:
            pass
    return {"consulta": consulta, "filtros": f, "chips": ia.chips(f), "mensaje": mensaje or ia.mensaje(resultados, f, ampliada),
            "sin_exacto": sin_exacto, "motor": f.get("motor", "local"), "resultados": resultados}


@r.get("/productos/{producto_id}", summary="Detalle de un producto")
async def producto(producto_id: str, token: Optional[str] = Depends(sb.token_opcional)):
    d = await sb.rpc("detalle_producto", token, p_id=producto_id)
    if not d:
        raise HTTPException(404, "Producto no encontrado")
    return d


@r.get("/negocios", summary="Directorio de emprendimientos")
async def negocios(categoria: Optional[str] = None, token: Optional[str] = Depends(sb.token_opcional)):
    params = {"activo": "eq.true", "order": "verificado.desc,num_resenas.desc"}
    if categoria:
        params["categoria_slug"] = f"eq.{categoria}"
    return await sb.leer("v_emprendimientos", token, **params)


@r.get("/negocios/{slug}", summary="Perfil público de un emprendimiento")
async def negocio(slug: str, token: Optional[str] = Depends(sb.token_opcional)):
    d = await sb.rpc("detalle_emprendimiento", token, p_slug=slug)
    if not d:
        raise HTTPException(404, "Emprendimiento no encontrado")
    e = d.get("emprendimiento") or {}
    if e.get("activo") is False:
        uid = sb.uid_opcional(token)
        puede = uid and (uid == e.get("propietario_id") or await sb.rpc("es_admin", token))
        if not puede:
            raise HTTPException(404, "Este emprendimiento no está disponible en este momento")
    d["catalogos"] = await sb.leer("catalogos", token, emprendimiento_id=f"eq.{e.get('id')}", order="orden.asc,creado_en.desc")
    return d


@r.post("/contactos", summary="Registrar el clic y obtener el enlace de WhatsApp")
async def contacto(d: Contacto, token: Optional[str] = Depends(sb.token_opcional)):
    prod = None
    if d.producto_id:
        prod = await sb.uno("productos", token, id=f"eq.{d.producto_id}", select="id,nombre,precio,emprendimiento_id")
    emp_id = prod["emprendimiento_id"] if prod else d.emprendimiento_id
    if not emp_id:
        raise HTTPException(400, "Falta el emprendimiento")
    emp = await sb.uno("emprendimientos", token, id=f"eq.{emp_id}", select="id,nombre,whatsapp,mensaje_whatsapp")
    if not emp:
        raise HTTPException(404, "Emprendimiento no encontrado")
    cantidad = max(1, min(d.cantidad, 50))
    origen = d.origen if d.origen in ("busqueda_ia", "para_ti", "calendario", "perfil", "promo") else "perfil"
    await sb.crear("pedidos", {"cliente_id": sb.uid_opcional(token), "emprendimiento_id": emp_id,
                               "producto_id": prod["id"] if prod else None, "cantidad": cantidad,
                               "total": (prod["precio"] * cantidad) if prod else 0, "origen": origen,
                               "nota": (d.nota or "")[:300] or None}, token, devolver=False)
    if prod:
        detalle = f"{prod['nombre']} ({ia.pesos(prod['precio'])})" + (f" x{cantidad}" if cantidad > 1 else "")
        plantilla = emp["mensaje_whatsapp"] or "¡Hola! Te vi en Impulsa y me interesa {producto}. ¿Está disponible?"
        texto = plantilla.replace("{producto}", detalle) if "{producto}" in plantilla else f"{plantilla} {detalle}"
        if d.nota:
            texto += f" {d.nota.strip()[:300]}"
    else:
        texto = f"¡Hola, {emp['nombre']}! Los vi en Impulsa y quiero más información."
    numero = "".join(c for c in emp["whatsapp"] if c.isdigit())
    return {"url": f"https://wa.me/{numero}?text={quote(texto)}", "mensaje": texto}
