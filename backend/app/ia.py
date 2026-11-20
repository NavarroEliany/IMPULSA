"""Inteligencia de Impulsa.

Convierte una frase como "necesito un regalo para mi novia con presupuesto de 100 mil"
en filtros de búsqueda. Funciona siempre con un intérprete propio por reglas y, si existe
GEMINI_API_KEY, usa Gemini para entender mejor la intención (con el intérprete local de respaldo).
"""
import json
import re
import unicodedata
from typing import Optional

import httpx

from .config import GEMINI_API_KEY, GEMINI_MODEL, SUPABASE_URL

OCASIONES = ["Cumpleaños", "Aniversario", "Amor y Amistad", "Día de la Madre", "Día del Padre", "Navidad",
             "Halloween", "Grados", "Para ella", "Para él", "Regalo corporativo"]

_OCASION_PALABRAS = [
    (r"cumple(anos)?", "Cumpleaños"), (r"aniversario", "Aniversario"), (r"amor y amistad|amigo secreto", "Amor y Amistad"),
    (r"dia de (la )?madre|dia de las madres", "Día de la Madre"), (r"dia del? padre", "Día del Padre"),
    (r"navidad|navideñ[oa]|naviden[oa]|nochebuena|aguinaldo|velitas", "Navidad"), (r"halloween|disfraz", "Halloween"),
    (r"grado|graduacion", "Grados"), (r"san valentin", "Aniversario"), (r"empresa|corporativ|oficina|compañeros de trabajo", "Regalo corporativo"),
]
_PARA = [
    (r"novia|esposa|mujer|prometida", "tu novia", "Para ella"), (r"novio|esposo|marido|prometido", "tu novio", "Para él"),
    (r"mama|madre|mami", "tu mamá", "Para ella"), (r"papa|padre|papi", "tu papá", "Para él"),
    (r"amiga", "una amiga", "Para ella"), (r"amigo", "un amigo", "Para él"),
    (r"abuela", "tu abuela", "Para ella"), (r"abuelo", "tu abuelo", "Para él"),
    (r"hermana", "tu hermana", "Para ella"), (r"hermano", "tu hermano", "Para él"),
    (r"hija|sobrina", "una niña", None), (r"hijo|sobrino|bebe", "un niño", None), (r"jefe|jefa|profe|profesor[a]?", "alguien del trabajo", "Regalo corporativo"),
    (r"mascota|perr[oa]|gat[oa]", "tu mascota", None),
]
_VACIAS = set("""a al algo algun alguna alguno ante aqui asi aun bien busco buscando buscar cerca como con cual cuando de del desde donde
dos el ella ellos en entre era es esa ese eso esta este esto estoy favor gusta gustan gustaria hacer hacerme hay hasta la las le les lo los
mas maximo me mi mis mucho muy necesito ni no nos o otra otro para pero por porque presupuesto pesos puedo que quien quiero quisiera se sea
ser si sin sobre solo son su sus tambien te tengo tiene toda todo tu tus un una unas uno unos y ya encanta encantan ocaña ocana mil lucas
comprar compra conseguir consigo venden vende ideas idea opciones opcion bonito bonita lindo linda bueno buena barato barata economico
economica plata dinero menos minimo tope cuesta cueste valga algun mio mia personas persona dia hoy mañana manana urgente""".split())


def _plano(t: str) -> str:
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn" or c == "̃").replace("ñ", "ñ")


def _numero(txt: str) -> int:
    return int(float(txt.replace(".", "").replace(",", ".")))


def _presupuesto(t: str):
    """Devuelve (minimo, maximo, texto_sin_montos)."""
    montos = []

    def guarda(valor: int, m: re.Match) -> str:
        antes = t[max(0, m.start() - 22):m.start()]
        es_min = bool(re.search(r"(mas de|desde|minimo|a partir de|por encima de)\s*\$?\s*$", antes))
        montos.append((valor, es_min))
        return " "

    patrones = [
        (r"(\d+(?:[.,]\d+)?)\s*(?:millon(?:es)?|palos?)\b", lambda m: int(float(m.group(1).replace(",", ".")) * 1_000_000)),
        (r"(\d{1,3}(?:[.\s]\d{3})+)", lambda m: int(re.sub(r"[.\s]", "", m.group(1)))),
        (r"(\d+(?:[.,]\d+)?)\s*(?:mil|k|lucas?|luks?)\b", lambda m: int(float(m.group(1).replace(",", ".")) * 1000)),
        (r"\$\s*(\d{4,})", lambda m: int(m.group(1))),
        (r"(?<![\w$])(\d{4,7})(?!\w)", lambda m: int(m.group(1))),
    ]
    for patron, valor in patrones:
        t = re.sub(patron, lambda m, v=valor: guarda(v(m), m), t)
    minimo = next((v for v, es_min in montos if es_min), None)
    maximo = next((v for v, es_min in montos if not es_min), None)
    return minimo, maximo, t


def interpretar_local(consulta: str) -> dict:
    t = _plano(consulta)
    minimo, maximo, sin_montos = _presupuesto(t)
    ocasion = next((o for patron, o in _OCASION_PALABRAS if re.search(rf"\b(?:{patron})", sin_montos)), None)
    para, ocasion_para = None, None
    for patron, etiqueta, oc in _PARA:
        if re.search(rf"\b(?:{patron})\b", sin_montos):
            para, ocasion_para = etiqueta, oc
            break
    palabras = [p for p in re.findall(r"[a-zñ]{3,}", sin_montos) if p not in _VACIAS]
    vistos, claves = set(), []
    for p in palabras:
        if p not in vistos:
            vistos.add(p)
            claves.append(p)
    return {
        "palabras": " ".join(claves[:8]),
        "precio_min": minimo, "precio_max": maximo,
        "ocasion": ocasion or ocasion_para, "para": para,
        "solo_disponibles": bool(re.search(r"\b(hoy|ya mismo|urgente|para ya)\b", t)),
        "motor": "local",
    }


async def interpretar_gemini(consulta: str) -> Optional[dict]:
    if not GEMINI_API_KEY:
        return None
    instruccion = (
        "Eres el buscador de Impulsa, un directorio de emprendimientos locales de Ocaña, Colombia. "
        "Extrae de la petición del cliente un JSON con estas claves: "
        '"palabras" (texto con 2 a 6 palabras clave en español de lo que se debe buscar: productos, materiales, gustos; '
        'incluye sinónimos útiles, sin precios ni relleno), "precio_min" y "precio_max" (enteros en pesos colombianos o null; '
        '"100 mil" = 100000), "ocasion" (una de: ' + ", ".join(OCASIONES) + ' o null), '
        '"para" (a quién va dirigido en segunda persona, por ejemplo "tu novia", o null), '
        '"solo_disponibles" (true si lo necesita hoy o urgente). Responde solo el JSON.\n\nPetición: ' + consulta
    )
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r = await c.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                headers={"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": instruccion}]}],
                      "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}})
        if r.status_code != 200:
            return None
        texto = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        d = json.loads(texto)
        if not isinstance(d, dict):
            return None

        def entero(v):
            return int(v) if isinstance(v, (int, float)) and v > 0 else None

        return {
            "palabras": str(d.get("palabras") or "")[:120],
            "precio_min": entero(d.get("precio_min")), "precio_max": entero(d.get("precio_max")),
            "ocasion": d.get("ocasion") if d.get("ocasion") in OCASIONES else None,
            "para": (str(d["para"])[:40] if d.get("para") else None),
            "solo_disponibles": bool(d.get("solo_disponibles")),
            "motor": "gemini",
        }
    except Exception:
        return None


async def interpretar(consulta: str) -> dict:
    local = interpretar_local(consulta)
    g = await interpretar_gemini(consulta)
    if not g:
        return local
    # Los montos detectados por reglas son fiables: se conservan si Gemini no los devolvió.
    for k in ("precio_min", "precio_max", "ocasion", "para"):
        if g.get(k) is None:
            g[k] = local.get(k)
    if not g["palabras"]:
        g["palabras"] = local["palabras"]
    return g


_vec_http: Optional[httpx.AsyncClient] = None


async def vector(texto: str) -> Optional[list]:
    """Vector semántico de la consulta con el modelo gte-small que corre en Supabase (sin claves ni cupo diario)."""
    global _vec_http
    if not texto.strip():
        return None
    if _vec_http is None:
        _vec_http = httpx.AsyncClient(timeout=10)
    try:
        r = await _vec_http.post(f"{SUPABASE_URL}/functions/v1/ia-impulsa", json={"textos": [texto[:300]]})
        if r.status_code == 200:
            v = r.json().get("vectores") or []
            return v[0] if v else None
    except Exception:
        pass
    return None


# Umbrales de similitud del modelo gte-small (coseno). Calibrados con el catálogo de Impulsa.
SIM_EXACTA = 0.86
SIM_PARECIDA = 0.80


async def explicar_gemini(consulta: str, termino: str, parecidos: list) -> Optional[str]:
    """Con Gemini, redacta el aviso de "no hay, pero lo más parecido es…". Sin clave devuelve None."""
    if not GEMINI_API_KEY or not parecidos:
        return None
    lista = "; ".join(f"{p['nombre']} de {p['emprendimiento']} ({pesos(p['precio'])})" for p in parecidos[:4])
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                headers={"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text":
                    "Eres el buscador de Impulsa, directorio de emprendimientos de Ocaña, Colombia. "
                    f"El cliente buscó: \"{consulta}\". No hay ningún producto exacto de eso. "
                    f"Los más parecidos del catálogo son: {lista}. "
                    "En máximo 2 frases cortas, en español colombiano y sin emojis: dile que por ahora no hay "
                    f"{termino} y recomiéndale la opción más útil de la lista explicando en pocas palabras por qué. "
                    "No inventes productos que no estén en la lista."}]}],
                      "generationConfig": {"temperature": 0.4, "maxOutputTokens": 120}})
        if r.status_code == 200:
            t = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            return t[:300] or None
    except Exception:
        pass
    return None


def pesos(n) -> str:
    return "$" + f"{int(n):,}".replace(",", ".")


def chips(f: dict) -> list:
    c = []
    if f.get("para"):
        c.append(f"Para: {f['para']}")
    if f.get("palabras"):
        c.append(f"Busca: {f['palabras']}")
    if f.get("precio_max"):
        c.append(f"Hasta {pesos(f['precio_max'])}")
    if f.get("precio_min"):
        c.append(f"Desde {pesos(f['precio_min'])}")
    if f.get("ocasion") and not f["ocasion"].startswith("Para "):
        c.append(f"Ocasión: {f['ocasion']}")
    if f.get("solo_disponibles"):
        c.append("Disponible hoy")
    return c


def razones(p: dict, f: dict) -> list:
    r = []
    if f.get("precio_max") and p["precio"] <= f["precio_max"]:
        dif = f["precio_max"] - p["precio"]
        r.append(f"{pesos(dif)} por debajo de tu tope" if dif >= 1000 else "Justo en tu presupuesto")
    if f.get("ocasion") and f["ocasion"] in (p.get("ocasiones") or []):
        r.append(f"Ideal para: {f['ocasion']}")
    if p.get("calificacion") and float(p["calificacion"]) >= 4.5:
        r.append(f"{str(p['calificacion']).replace('.', ',')} de calificación en {p['num_resenas']} reseñas")
    if p.get("promo"):
        r.append(f"Tiene promoción: {p['promo']}")
    if not p.get("agotado") and p.get("tipo") == "producto":
        r.append("Disponible ahora" if p.get("stock", 0) > 0 else "Lo hacen por encargo")
    return r[:3]


def mensaje_sin_exacto(termino: str, parecidos: list) -> str:
    if not parecidos:
        return f"Por ahora no hay {termino} en Impulsa. Prueba con otras palabras o revisa las categorías."
    m = parecidos[0]
    txt = f"Por ahora no hay {termino} en Impulsa. Lo que más se parece es {m['nombre']} de {m['emprendimiento']} ({pesos(m['precio'])})"
    otros = [p["nombre"][:1].lower() + p["nombre"][1:] for p in parecidos[1:3]]
    if otros:
        txt += ". También puedes mirar " + " o ".join(otros)
    return txt + "."


def mensaje(resultados: list, f: dict, ampliada: bool) -> str:
    if not resultados:
        return "No encontré algo exacto todavía. Prueba con otras palabras o sube un poco el presupuesto."
    n = len(resultados)
    negocios = len({p["emprendimiento_id"] for p in resultados})
    mejor = resultados[0]
    inicio = "No vi coincidencias exactas, pero esto se le acerca. " if ampliada else ""
    txt = (f"{inicio}Encontré {n} {'opción' if n == 1 else 'opciones'} en {negocios} "
           f"{'emprendimiento' if negocios == 1 else 'emprendimientos'}. ")
    txt += f"Mi favorita es {mejor['nombre']} de {mejor['emprendimiento']}"
    rz = razones(mejor, f)
    if rz:
        txt += ": " + rz[0].lower()
        if len(rz) > 1:
            txt += " y " + rz[1].lower()
    return txt + "."


_DIAS = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"]
_FRANJAS = ["en la mañana", "al mediodía", "en la tarde", "en la noche"]
_MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def consejos(resumen: dict, proximas: list) -> list:
    """Recomendaciones para el emprendedor a partir de sus propios datos."""
    c = []
    for e in resumen.get("esperando") or []:
        c.append({"titulo": f"{e['personas']} {'persona espera' if e['personas'] == 1 else 'personas esperan'} tu {e['nombre']}",
                  "texto": "Pidieron que les avisáramos cuando vuelva. Actualiza el stock y les llega la notificación al instante.",
                  "accion": "Actualizar stock", "enlace": "#/panel/productos"})
    k = resumen.get("kpis") or {}
    if k.get("pendientes"):
        c.append({"titulo": f"Tienes {k['pendientes']} contactos sin confirmar",
                  "texto": "Marca cuáles terminaron en venta para que tus estadísticas y recomendaciones sean exactas.",
                  "accion": "Revisar contactos", "enlace": "#/panel/pedidos"})
    if proximas:
        f = proximas[0]
        c.append({"titulo": f"Prepárate para {f['nombre']}",
                  "texto": f"Faltan {f['dias']} días. Marca tus productos con esa ocasión y crea una promoción: así apareces en los recordatorios de los clientes.",
                  "accion": "Crear promoción", "enlace": "#/panel/promociones"})
    calor = resumen.get("heatmap") or []
    if calor:
        m = max(calor, key=lambda x: x["clics"])
        total = sum(x["clics"] for x in calor) or 1
        c.append({"titulo": f"Te escriben más los {_DIAS[m['dia']]} {_FRANJAS[m['franja']]}",
                  "texto": f"Ahí llega el {round(m['clics'] * 100 / total)}% de tus mensajes. Responde rápido en ese horario o programa una promo.",
                  "accion": "Crear promoción", "enlace": "#/panel/promociones"})
    bajos = [s for s in (resumen.get("stock_bajo") or []) if s["stock"] > 0]
    if bajos:
        s = bajos[0]
        c.append({"titulo": f"{s['nombre']} está por agotarse",
                  "texto": f"Te {'queda 1 unidad' if s['stock'] == 1 else 'quedan ' + str(s['stock']) + ' unidades'}. Reabastece o actívalo por encargo para no perder clientes.",
                  "accion": "Ver inventario", "enlace": "#/panel/productos"})
    tend = resumen.get("tendencias") or []
    if tend:
        c.append({"titulo": f"En Ocaña están buscando “{tend[0]['consulta']}”",
                  "texto": "Usa esas palabras en el nombre y las etiquetas de tus productos para aparecer en más búsquedas.",
                  "accion": "Editar productos", "enlace": "#/panel/productos"})
    return c[:4]


async def redactar_descripcion(nombre: str, categoria: str, detalles: str) -> dict:
    base = (detalles or "").strip()
    if GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                    headers={"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text":
                        "Escribe la descripción de un producto para un marketplace de emprendedores de Ocaña, Colombia. "
                        "Máximo 280 caracteres, tono cálido y concreto, sin emojis ni exageraciones, sin inventar datos. "
                        f"Producto: {nombre}. Categoría: {categoria}. Notas del vendedor: {base or 'ninguna'}."}]}],
                          "generationConfig": {"temperature": 0.6}})
            if r.status_code == 200:
                texto = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {"descripcion": texto[:400], "motor": "gemini"}
        except Exception:
            pass
    partes = [f"{nombre}, hecho por un emprendimiento local de Ocaña."]
    if base:
        partes.append(base[0].upper() + base[1:].rstrip(".") + ".")
    partes.append("Escríbenos por WhatsApp para pedirlo o personalizarlo.")
    return {"descripcion": " ".join(partes), "motor": "local"}
