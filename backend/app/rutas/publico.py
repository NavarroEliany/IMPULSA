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


class BusquedaFoto(BaseModel):
    imagen: str                      # data URL o base64 (JPEG, PNG o WebP, máximo ~2 MB)
    texto: str = ""                  # lo que el cliente quiera agregar: "pero en azul", "para 20 personas"


class Armador(BaseModel):
    presupuesto: int
    ocasion: Optional[str] = None
    para: Optional[str] = None
    gustos: str = ""
    semilla: int = 0                 # para pedir "otras ideas" con el mismo presupuesto


class Contacto(BaseModel):
    producto_id: Optional[str] = None
    emprendimiento_id: Optional[str] = None
    cantidad: int = 1
    origen: str = "perfil"
    nota: Optional[str] = None


@r.get("/salud", tags=["Sistema"], summary="Estado del servicio")
async def salud():
    estado_gemini = "activo" if ia.gemini_disponible() else ("sin cupo por hoy" if GEMINI_API_KEY else "sin clave")
    return {"ok": True, "servicio": "impulsa", "ia": "gemini" if ia.gemini_disponible() else "local",
            "busqueda_semantica": "gte-small (Supabase)", "gemini": estado_gemini, "modelo": ia.GEMINI_MODEL,
            "gemini_ultimo_error": ia.gemini_ultimo_error}


@r.get("/salud/gemini", summary="Prueba una consulta corta a Gemini (diagnóstico)")
async def salud_gemini(modelos: bool = False):
    if modelos:
        return {"modelos": await ia.modelos_gemini()}
    t = await ia._gemini("Responde solo con la palabra: listo", max_tokens=20)
    return {"respuesta": t, "error": ia.gemini_ultimo_error, "modelos_en_orden": ia._MODELOS}


@r.get("/inicio", summary="Datos de la página principal")
async def inicio(token: Optional[str] = Depends(sb.token_opcional)):
    return await sb.rpc("inicio_publico", token)


@r.get("/categorias", summary="Categorías")
async def categorias():
    return await sb.leer("categorias", order="orden")


@r.post("/buscar", summary="Búsqueda en lenguaje natural con IA")
async def buscar(d: Busqueda, token: Optional[str] = Depends(sb.token_opcional)):
    return await _buscar(d, token)


async def _buscar(d: Busqueda, token: Optional[str], f: Optional[dict] = None, registrar: Optional[str] = None):
    consulta = d.q.strip()[:200]
    if f is None:
        f = await ia.interpretar(consulta) if consulta else {"palabras": "", "precio_min": None, "precio_max": None,
                                                               "ocasion": None, "para": None, "solo_disponibles": False,
                                                               "motor": "local"}
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
        # Lo que el cliente escribió con sus palabras (Gemini agrega sinónimos y eso no debe contar).
        nucleo = ia.interpretar_local(consulta)["palabras"] if consulta else f["palabras"]
        faltan = ia.terminos_faltantes(nucleo, resultados)
        significativas = [w for w in ia.terminos_faltantes(nucleo, [{"nombre": ""}])] or nucleo.split()
        if resultados and faltan and len(faltan) >= len(significativas):
            # Ninguna palabra importante aparece: lo encontrado por palabras es ruido.
            resultados = []
        termino = nucleo if len(nucleo) <= 40 else "eso"
        if resultados and faltan:
            # Coincide solo en parte: la IA elige entre lo encontrado y lo parecido, y avisa qué no hay.
            sin_exacto = True
            candidatos = resultados + [p for p in semantica if p["id"] not in {x["id"] for x in resultados}]
            g = await ia.elegir_parecidos_gemini(consulta, " ni ".join(faltan), candidatos)
            if g and g[0]:
                resultados, mensaje = g
                f["motor"] = "gemini"
            else:
                mensaje = (f"Aún nadie vende {' ni '.join(faltan)} dentro de Impulsa. Lo más cercano es {resultados[0]['nombre']} "
                           f"de {resultados[0]['emprendimiento']} ({ia.pesos(resultados[0]['precio'])}).")
        elif resultados:
            cat = resultados[0].get("categoria_id")
            vistos = {p["id"] for p in resultados}
            resultados += [p for p in semantica if p["id"] not in vistos and p["similitud"] >= ia.SIM_EXTRA
                           and p.get("categoria_id") == cat]
        elif semantica:
            sin_exacto = True
            g = await ia.elegir_parecidos_gemini(consulta, termino, semantica)
            if g:
                resultados, mensaje = g
                f["motor"] = "gemini"
            if not resultados:
                # Si Gemini no eligió ninguno (o no respondió), se muestran los parecidos del mismo rubro.
                resultados = ia.filtrar_parecidos(semantica, nucleo)
            mensaje = mensaje or ia.mensaje_sin_exacto(termino, resultados)
        if not resultados and not sin_exacto:
            # Sin vectores disponibles: se muestran las mejores opciones que cumplen el resto de filtros.
            resultados = await consulta_bd("", f["precio_max"])
            ampliada = True
        resultados = resultados[:max(1, min(d.limite, 60))]
    if resultados and not sin_exacto:
        resultados[0]["razones"] = ia.razones(resultados[0], f)
    if consulta:
        try:
            await sb.crear("busquedas", {"cliente_id": sb.uid_opcional(token), "consulta": registrar or consulta, "filtros": f,
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


# ---------- buscar con una foto
_MIMES = {"image/jpeg", "image/png", "image/webp"}


@r.post("/buscar/foto", summary="Buscar con una foto: la IA mira la imagen y encuentra lo más parecido en Ocaña")
async def buscar_foto(d: BusquedaFoto, token: Optional[str] = Depends(sb.token_opcional)):
    datos, mime = d.imagen.strip(), "image/jpeg"
    if datos.startswith("data:"):
        cab, _, datos = datos.partition(",")
        mime = cab[5:].split(";")[0] or mime
    if mime not in _MIMES:
        raise HTTPException(400, "Sube una foto en JPG, PNG o WebP")
    if len(datos) > 2_800_000:
        raise HTTPException(400, "La foto es muy pesada. Prueba con una más pequeña.")
    if not ia.gemini_disponible():
        raise HTTPException(503, "La búsqueda por foto usa a Gemini y en este momento no está disponible. "
                                 "Escribe lo que buscas y la IA local te ayuda.")
    cats = [c["slug"] for c in await sb.leer("categorias", select="slug", order="orden")]
    vio = await ia.mirar_foto(mime, datos, cats, d.texto.strip()[:150])
    if not vio:
        raise HTTPException(503, "No pudimos analizar la foto ahora. Intenta en un momento o escribe lo que buscas.")
    if not vio.get("veo"):
        raise HTTPException(422, "No reconocimos algo que se pueda comprar en esa foto. Prueba con otra más clara.")
    consulta = " ".join(x for x in [vio["busqueda"], d.texto.strip()[:80]] if x)
    f = ia.interpretar_local(consulta)      # la foto ya gastó su consulta de Gemini
    f["palabras"] = vio["busqueda"] or f["palabras"]
    f["ocasion"] = f.get("ocasion") or vio.get("ocasion")
    f["motor"] = "gemini"
    res = await _buscar(Busqueda(q=consulta, limite=24), token, f=f, registrar=vio["busqueda"])
    if not res["resultados"] and vio.get("categoria"):
        res = await _buscar(Busqueda(q="", categoria=vio["categoria"], limite=24), token, f=dict(f, palabras=""))
        res["consulta"] = consulta
        res["sin_exacto"] = True
        res["mensaje"] = (f"Aún nadie vende {vio['busqueda'] or 'eso'} dentro de Impulsa. "
                          "Te muestro lo más parecido que hay en la misma categoría.")
    res["foto"] = vio
    return res


# ---------- armador de regalos
@r.post("/armador", summary="Arma combos de regalo con productos de varios negocios sin pasarse del presupuesto")
async def armador(d: Armador, token: Optional[str] = Depends(sb.token_opcional)):
    presupuesto = max(10000, min(d.presupuesto, 5_000_000))
    ocasion = d.ocasion if d.ocasion in ia.OCASIONES else None
    para, gustos = (d.para or "").strip()[:40] or None, d.gustos.strip()[:160]

    async def pedir(q: str, oca: Optional[str], limite: int = 40):
        return await sb.rpc("buscar_productos", token, p_q=q, p_precio_min=None, p_precio_max=presupuesto,
                            p_categoria=None, p_ocasion=oca, p_tipo=None, p_solo_disponibles=True, p_limite=limite) or []

    texto = " ".join(x for x in [gustos, para or ""] if x)
    pool: dict = {}

    def sumar(lista, base):
        for p in lista:
            q = pool.setdefault(p["id"], dict(p, _puntaje=0))
            q["_puntaje"] = max(q["_puntaje"], base + (p.get("match") or 50) * 0.6
                                + (15 if ocasion and ocasion in (p.get("ocasiones") or []) else 0)
                                + min(p.get("calificacion") or 0, 5) * 2)

    if texto:
        sumar(await pedir(texto, None), 25)
        vec = await ia.vector(texto)
        if vec:
            try:
                sem = await sb.rpc("buscar_semantico", token, p_vector=str(vec), p_precio_max=presupuesto,
                                   p_solo_disponibles=True, p_limite=30) or []
                sumar([dict(p, match=round(p["similitud"] * 100)) for p in sem if p["similitud"] >= ia.SIM_MINIMA], 10)
            except HTTPException:
                pass
    if ocasion:
        sumar(await pedir("", ocasion), 15)
    if len(pool) < 12:
        sumar(await pedir("", None, 60), 0)
    # Solo productos (no servicios caros que se coman el presupuesto), salvo que pidan un servicio.
    candidatos = [p for p in pool.values() if p.get("tipo") == "producto" or p["precio"] <= presupuesto * 0.7]
    if d.semilla:
        import random
        rnd = random.Random(d.semilla)
        for p in candidatos:
            p["_puntaje"] += rnd.uniform(0, 25)
    combos = ia.armar_combos(candidatos, presupuesto)
    textos, motor = await ia.textos_combos(combos, ocasion, para, gustos, presupuesto)
    for c, t in zip(combos, textos):
        c.update(t)
        for p in c["items"]:
            p.pop("_puntaje", None)
        c.pop("puntaje", None)
    return {"presupuesto": presupuesto, "ocasion": ocasion, "para": para, "gustos": gustos, "motor": motor,
            "combos": combos,
            "mensaje": ("Armé estas opciones con productos de distintos emprendimientos de Ocaña. Las sumas ya están hechas: "
                        "ninguna se pasa de tu presupuesto." if combos else
                        "No alcancé a armar un combo con ese presupuesto. Prueba subiéndolo un poco o quitando gustos.")}
