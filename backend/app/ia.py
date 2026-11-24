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


# --- Gemini -------------------------------------------------------------------------------
# Plan gratis: cupo por minuto y por día (se reinicia a medianoche del Pacífico, 3 a. m. en Colombia).
# Si Google responde que se acabó el cupo, se deja de llamar hasta el reinicio y todo sigue con la IA local.
_gemini_pausa_hasta = 0.0
# Flash-Lite responde más rápido y tiene más cupo gratis; si está saturado se prueba con los demás.
_MODELOS = list(dict.fromkeys([GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"]))
gemini_ultimo_error: Optional[str] = None   # para diagnóstico en /api/salud (nunca incluye la clave)
_cache: dict = {}
CACHE_SEG = 24 * 3600


def cache_leer(clave: str):
    """Respuestas de Gemini guardadas 24 horas: si 50 personas buscan lo mismo, se gasta una sola consulta."""
    import time
    v = _cache.get(clave)
    if not v:
        return None
    if v[1] < time.time():
        _cache.pop(clave, None)
        return None
    return v[0]


def cache_guardar(clave: str, valor) -> None:
    import time
    if len(_cache) > 2000:
        ahora = time.time()
        for k in [k for k, v in _cache.items() if v[1] < ahora] or list(_cache)[:500]:
            _cache.pop(k, None)
    _cache[clave] = (valor, time.time() + CACHE_SEG)


def _siguiente_reinicio() -> float:
    import time
    ahora = time.time()
    # Medianoche del Pacífico = 08:00 UTC (07:00 en horario de verano); se usa 08:00 para no quedarse corto.
    dia = 86400
    reinicio = (ahora // dia) * dia + 8 * 3600
    return reinicio if reinicio > ahora else reinicio + dia


def gemini_disponible() -> bool:
    import time
    return bool(GEMINI_API_KEY) and time.time() >= _gemini_pausa_hasta


async def _gemini(texto: str, *, json_: bool = False, temperatura: float = 0.2, max_tokens: int = 256,
                  timeout: float = 10, imagen: Optional[tuple] = None) -> Optional[str]:
    global _gemini_pausa_hasta, gemini_ultimo_error
    if not gemini_disponible():
        return None
    import time
    # Los modelos Flash recientes "piensan" antes de responder y ese razonamiento gasta tokens de salida:
    # se deja margen para que la respuesta no salga vacía.
    config = {"temperature": temperatura, "maxOutputTokens": max_tokens + 2048}
    if json_:
        config["responseMimeType"] = "application/json"
    try:
        cuerpo = {"contents": [{"parts": ([{"inline_data": {"mime_type": imagen[0], "data": imagen[1]}}] if imagen else [])
                                + [{"text": texto}]}], "generationConfig": config}
        r, errores = None, []
        async with httpx.AsyncClient(timeout=timeout) as c:
            # Si el modelo principal está saturado (503) o falla, se prueba con los de respaldo.
            for modelo in _MODELOS:
                try:
                    r = await c.post(f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
                                     headers={"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}, json=cuerpo)
                except httpx.TimeoutException:
                    errores.append(f"{modelo}: tardó demasiado")
                    r = None
                    continue
                if r.status_code not in (500, 502, 503, 504, 404):
                    break
                errores.append(f"{modelo}: HTTP {r.status_code}")
        if errores:
            gemini_ultimo_error = " · ".join(errores)
        if r is None:
            return None
        if r.status_code == 429:
            por_dia = "PerDay" in r.text or "per day" in r.text.lower()
            _gemini_pausa_hasta = _siguiente_reinicio() if por_dia else time.time() + 60
            gemini_ultimo_error = "HTTP 429: sin cupo " + ("por hoy" if por_dia else "por este minuto")
            return None
        if r.status_code != 200:
            try:
                msg = r.json().get("error", {}).get("message", "")
            except Exception:
                msg = r.text
            gemini_ultimo_error = " · ".join(errores + [f"HTTP {r.status_code}: {msg[:160]}"])
            return None
        partes = r.json()["candidates"][0]["content"].get("parts") or []
        texto = "".join(p.get("text", "") for p in partes if not p.get("thought")).strip()
        gemini_ultimo_error = " · ".join(errores) or None
        if json_ and texto.startswith("```"):
            texto = texto.strip("`").removeprefix("json").strip()
        return texto or None
    except Exception as e:
        gemini_ultimo_error = f"{type(e).__name__}: {str(e)[:200]}"
        return None


async def interpretar_gemini(consulta: str) -> Optional[dict]:
    if not GEMINI_API_KEY:
        return None
    clave = "interpretar:" + consulta.strip().lower()
    guardado = cache_leer(clave)
    if guardado:
        return dict(guardado)
    instruccion = (
        "Eres el buscador de Impulsa, un directorio de emprendimientos locales de Ocaña, Colombia. "
        "Extrae de la petición del cliente un JSON con estas claves: "
        '"palabras" (texto con 2 a 6 palabras clave en español de lo que se debe buscar: productos, materiales, gustos; '
        'incluye sinónimos útiles, sin precios ni relleno), "precio_min" y "precio_max" (enteros en pesos colombianos o null; '
        '"100 mil" = 100000), "ocasion" (una de: ' + ", ".join(OCASIONES) + ' o null), '
        '"para" (a quién va dirigido en segunda persona, por ejemplo "tu novia", o null), '
        '"solo_disponibles" (true si lo necesita hoy o urgente). Responde solo el JSON.\n\nPetición: ' + consulta
    )
    texto = await _gemini(instruccion, json_=True, temperatura=0.1)
    if not texto:
        return None
    try:
        d = json.loads(texto)
    except Exception:
        return None
    if not isinstance(d, dict):
        return None

    def entero(v):
        return int(v) if isinstance(v, (int, float)) and v > 0 else None

    res = {
        "palabras": str(d.get("palabras") or "")[:120],
        "precio_min": entero(d.get("precio_min")), "precio_max": entero(d.get("precio_max")),
        "ocasion": d.get("ocasion") if d.get("ocasion") in OCASIONES else None,
        "para": (str(d["para"])[:40] if d.get("para") else None),
        "solo_disponibles": bool(d.get("solo_disponibles")),
        "motor": "gemini",
    }
    cache_guardar(clave, res)
    return dict(res)


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


# Umbrales de similitud del modelo gte-small (coseno), calibrados con el catálogo de Impulsa.
# El modelo es pequeño y en español tiene ruido: por eso la coincidencia exacta la decide la búsqueda por
# palabras, y los vectores solo proponen "lo más parecido" cuando no hay nada exacto.
SIM_EXTRA = 0.88      # se suma a resultados que ya coinciden por palabras
SIM_MINIMA = 0.83     # por debajo de esto no se considera parecido
SIM_MARGEN = 0.025    # distancia máxima frente al más parecido


_GENERICAS = set("""regalo regalos detalle detalles sorpresa cosa cosas producto productos servicio servicios
personalizado personalizada especial original rico rica sabroso sabrosa grande pequeño pequeno""".split())


def terminos_faltantes(palabras: str, resultados: list) -> list:
    """Palabras de la búsqueda que no aparecen en ningún resultado (ej. "pescado" en "pescado frito")."""
    if not palabras or not resultados:
        return []
    textos = [_plano(" ".join([p.get("nombre") or "", p.get("descripcion") or "", " ".join(p.get("etiquetas") or []),
                               p.get("categoria") or ""])) for p in resultados[:12]]
    faltan = []
    for w in _plano(palabras).split():
        if len(w) < 4 or w in _GENERICAS or any(re.fullmatch(pt, w) for pt, *_ in _PARA) \
                or any(re.match(pt, w) for pt, _ in _OCASION_PALABRAS):
            continue
        raiz = w[:5] if len(w) > 5 else w.rstrip("s")
        if not any(re.search(rf"\b{re.escape(raiz)}", t) for t in textos):
            faltan.append(w)
    return faltan


# Familias de categorías: si la consulta es claramente de comida, ropa, tecnología…, las alternativas
# parecidas se buscan solo dentro de esa familia (evita que "tacos" proponga una taza).
_FAMILIAS = [
    (r"taco|burrito|nacho|quesadilla|pescad|marisc|camaron|ceviche|sopa|pasta|lasana|espagueti|pollo|carne|cerdo|"
     r"comida|almuerzo|desayuno|cena|arroz|frit|asad|hamburgues|perro caliente|pizza|sandwich|sanduche|wrap|ensalada|"
     r"crepe|waffle|mondongo|sancocho|bandeja|chorizo|morcilla|tamal|arepa|empanad|pan\b|panes|panader|torta|ponque|postre|"
     r"helad|dulce|galleta|chocolate|fruta|jugo|bebida|gaseosa|cafe|te\b|aromatica|licor|vino|cerveza|ron\b|whisky|tequila",
     {"comidas-rapidas", "comida", "comida-tipica", "panaderia", "reposteria", "heladeria", "frutas-mercado",
      "dulces-snacks", "cafe", "cervezas-licores"}),
    (r"computador|portatil|laptop|tablet|celular|telefono|iphone|samsung|xiaomi|audifono|cargador|parlante|"
     r"camara|consola|videojuego|televisor|tv|mouse|teclado|impresora|reloj inteligente|smartwatch",
     {"tecnologia"}),
    (r"camisa|camiseta|pantalon|jean|vestido|falda|blusa|chaqueta|buzo|saco|ropa|pijama|gorra|bolso|cartera|"
     r"zapato|tenis|sandalia|bota|calzado|correa|cinturon",
     {"ropa-accesorios", "calzado", "artesanias"}),
    (r"decoraci|adorno|vela|cojin|cuadro|matera|planta|jarron|florero|arbol de navidad|pesebre|guirnalda",
     {"hogar-deco", "artesanias", "plantas", "regalos-flores", "eventos", "peluches-tejidos"}),
    (r"clase|curso|tutor|profesor",
     {"deportes", "papeleria", "bienestar"}),
    (r"perfume|colonia|maquillaje|labial|crema|shampoo|unas|manicure|pedicure|cejas|pestanas|cabello|corte|barba",
     {"belleza", "barberia", "bienestar"}),
]


def familia_de(palabras: str) -> Optional[set]:
    t = _plano(palabras)
    for patron, cats in _FAMILIAS:
        if re.search(rf"\b(?:{patron})", t):
            return cats
    return None


def filtrar_parecidos(semantica: list, palabras: str = "") -> list:
    """Sin Gemini: se queda con lo más parecido y con lo de su misma categoría que esté cerca en similitud."""
    fam = familia_de(palabras) if palabras else None
    if fam:
        semantica = [p for p in semantica if p.get("categoria_slug") in fam]
    if not semantica or semantica[0]["similitud"] < SIM_MINIMA:
        return []
    top = semantica[0]
    out = [top]
    for p in semantica[1:]:
        if len(out) >= 4:
            break
        cerca = p["similitud"] >= top["similitud"] - SIM_MARGEN and p["similitud"] >= SIM_MINIMA
        if cerca and p.get("categoria_id") == top.get("categoria_id"):
            out.append(p)
    return out


async def elegir_parecidos_gemini(consulta: str, termino: str, candidatos: list) -> Optional[tuple]:
    """Con Gemini: de los candidatos por vectores elige los que de verdad se parecen a lo que pidió el cliente
    y redacta el aviso. Devuelve (lista_elegida, mensaje) o None si Gemini no está disponible."""
    if not candidatos or not gemini_disponible():
        return None
    lista = "\n".join(f"{i}. {p['nombre']} | {p.get('categoria') or ''} | {p['emprendimiento']} | {pesos(p['precio'])}"
                      for i, p in enumerate(candidatos[:10]))
    t = await _gemini(
        "Eres el buscador de Impulsa, directorio de emprendimientos de Ocaña, Colombia. "
        f"El cliente buscó: \"{consulta}\". En el catálogo no hay nada exacto. Estos son candidatos parecidos:\n{lista}\n\n"
        'Responde solo un JSON con "indices": lista con los números de los candidatos que sí sirven como alternativa '
        "real a lo que pidió (máximo 4, del más útil al menos útil; lista vacía si ninguno tiene relación), y "
        '"mensaje": máximo 2 frases cortas en español colombiano, sin emojis, que digan que por ahora no hay '
        f"{termino} y recomienden la mejor alternativa elegida diciendo por qué (o que no hay nada parecido). "
        "No inventes productos.", json_=True, temperatura=0.2, max_tokens=200)
    if not t:
        return None
    try:
        d = json.loads(t)
        idx = [int(i) for i in d.get("indices", []) if 0 <= int(i) < min(10, len(candidatos))]
        msg = str(d.get("mensaje") or "").strip()[:320]
    except Exception:
        return None
    elegidos = [candidatos[i] for i in dict.fromkeys(idx)][:4]
    return elegidos, (msg or None)


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
        return (f"Por ahora no hay {termino} en Impulsa ni algo parecido. Prueba con otras palabras "
                "o revisa las categorías.")
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
    texto = await _gemini(
        "Escribe la descripción de un producto para un marketplace de emprendedores de Ocaña, Colombia. "
        "Máximo 280 caracteres, tono cálido y concreto, sin emojis ni exageraciones, sin inventar datos. "
        f"Producto: {nombre}. Categoría: {categoria}. Notas del vendedor: {base or 'ninguna'}.",
        temperatura=0.6, max_tokens=200, timeout=15)
    if texto:
        return {"descripcion": texto[:400], "motor": "gemini"}
    partes = [f"{nombre}, hecho por un emprendimiento local de Ocaña."]
    if base:
        partes.append(base[0].upper() + base[1:].rstrip(".") + ".")
    partes.append("Escríbenos por WhatsApp para pedirlo o personalizarlo.")
    return {"descripcion": " ".join(partes), "motor": "local"}


# --- Buscar con una foto ----------------------------------------------------------------------
async def mirar_foto(mime: str, datos_b64: str, categorias: list, texto_extra: str = "") -> Optional[dict]:
    """Gemini mira la foto y la convierte en una búsqueda. Devuelve None si Gemini no está disponible."""
    import hashlib
    clave = "foto:" + hashlib.sha1((datos_b64[:4000] + datos_b64[-4000:] + texto_extra).encode()).hexdigest()
    guardado = cache_leer(clave)
    if guardado:
        return dict(guardado)
    t = await _gemini(
        "Eres el buscador de Impulsa, directorio de emprendimientos de Ocaña, Colombia. El cliente subió esta foto "
        "porque quiere comprar algo así o contratar ese servicio en Ocaña"
        + (f" y agregó: \"{texto_extra[:150]}\"" if texto_extra else "") + ". Responde solo un JSON con: "
        '"veo" (una frase corta en español que describa lo que se ve y que sirva para comprarlo, ej. '
        '"Torta de dos pisos con flores rosadas y dorado"), '
        '"busqueda" (2 a 5 palabras clave en español para buscarlo en un catálogo, sin colores salvo que sean clave), '
        f'"categoria" (el slug más cercano de esta lista o null: {", ".join(categorias)}), '
        '"ocasion" (una de: ' + ", ".join(OCASIONES) + ' o null), '
        '"detalles" (lista de 2 o 3 rasgos que el cliente le puede pedir al emprendedor, ej. "dos pisos", "flores naturales"). '
        'Si la foto no muestra nada que se pueda comprar, responde {"veo": null}.',
        json_=True, temperatura=0.2, max_tokens=300, timeout=20, imagen=(mime, datos_b64))
    if not t:
        return None
    try:
        d = json.loads(t)
    except Exception:
        return None
    if not isinstance(d, dict):
        return None
    res = {"veo": (str(d.get("veo"))[:160] if d.get("veo") else None),
           "busqueda": str(d.get("busqueda") or "")[:80],
           "categoria": d.get("categoria") if d.get("categoria") in categorias else None,
           "ocasion": d.get("ocasion") if d.get("ocasion") in OCASIONES else None,
           "detalles": [str(x)[:60] for x in (d.get("detalles") or [])][:3]}
    cache_guardar(clave, res)
    return res


# --- Armador de regalos -----------------------------------------------------------------------
def armar_combos(candidatos: list, presupuesto: int, max_combos: int = 3) -> list:
    """Combina productos de distintos negocios y categorías sin pasarse del presupuesto.
    Las sumas las hace el código; la IA solo pone nombre y explicación a cada combo."""
    from itertools import combinations
    vistos, pool = set(), []
    for p in sorted(candidatos, key=lambda x: -x.get("_puntaje", 0)):
        if p["id"] in vistos or p.get("agotado") or p["precio"] > presupuesto or p["precio"] <= 0:
            continue
        vistos.add(p["id"])
        pool.append(p)
    pool = pool[:26]
    if not pool:
        return []
    opciones = []
    for n in (1, 2, 3):
        for grupo in combinations(pool, n):
            total = sum(p["precio"] for p in grupo)
            if total > presupuesto:
                continue
            if len({p["emprendimiento_id"] for p in grupo}) < n or len({p.get("categoria_id") for p in grupo}) < n:
                continue
            uso = total / presupuesto
            if n == 1 and uso < 0.55:
                continue
            calidad = sum(p.get("_puntaje", 50) for p in grupo) / n
            opciones.append({"items": list(grupo), "total": total, "uso": uso, "n": n,
                             "puntaje": calidad + 30 * min(uso, 1) + (6 if n == 3 else 3 if n == 2 else 0)})
    if not opciones:
        return []
    elegidos = []

    def tomar(filtro, tipo):
        for o in sorted([o for o in opciones if filtro(o)], key=lambda o: -o["puntaje"]):
            ids = {p["id"] for p in o["items"]}
            if all(len(ids & {p["id"] for p in e["items"]}) == 0 for e in elegidos):
                o["tipo"] = tipo
                elegidos.append(o)
                return

    tomar(lambda o: o["n"] >= 2 and o["uso"] >= 0.7, "completo")
    tomar(lambda o: o["n"] <= 2 and o["uso"] >= 0.6 and max(p["precio"] for p in o["items"]) >= 0.45 * presupuesto, "especial")
    antes = len(elegidos)
    tomar(lambda o: o["n"] >= 2 and o["uso"] <= 0.7, "ahorro")
    if len(elegidos) == antes:
        tomar(lambda o: o["uso"] <= 0.7, "ahorro")
    while len(elegidos) < max_combos:
        antes = len(elegidos)
        tomar(lambda o: True, "otra")
        if len(elegidos) == antes:
            break
    for o in elegidos:
        o["sobra"] = presupuesto - o["total"]
    return elegidos[:max_combos]


_NOMBRES_COMBO = {"completo": "El combo completo", "especial": "El detalle especial", "ahorro": "Bonito y te sobra",
                  "otra": "Otra idea"}


_TARJETAS = {
    "Cumpleaños": ["Feliz cumpleaños. Que este año te traiga todo lo bonito que les das a los demás.",
                   "Otro año más de ti, y qué suerte tenerte cerca. ¡Feliz cumpleaños!",
                   "Que hoy celebres a lo grande. Te lo mereces todo."],
    "Día de la Madre": ["Gracias por todo, mamá. Este detalle es apenas una parte de lo que te quiero.",
                        "Para la mujer que me enseñó casi todo. Feliz día, mamá.",
                        "Hoy y siempre, gracias por tanto amor. Feliz día."],
    "Día del Padre": ["Feliz día, papá. Gracias por estar siempre.", "Para el mejor maestro que tuve. Feliz día.",
                      "Gracias por cada consejo y cada sacrificio. Feliz día, papá."],
    "Aniversario": ["Otro año contigo y lo volvería a escoger todo.", "Contigo los días buenos son mejores. Feliz aniversario.",
                    "Gracias por cada día a mi lado. Por muchos más."],
    "Amor y Amistad": ["Gracias por estar. La vida es mejor con gente como tú.", "Para alguien que hace mis días más bonitos.",
                       "Un detalle pequeño para alguien que vale muchísimo."],
    "Navidad": ["Feliz Navidad. Que la pases rodeado de los que quieres.", "Que esta Navidad te llene de paz y buenos momentos.",
                "Un detalle con cariño para cerrar el año juntos."],
    "Grados": ["Lo lograste. Orgullo total, y esto apenas empieza.", "Todo el esfuerzo valió la pena. ¡Felicitaciones!",
               "Hoy celebramos lo que lograste. Lo mejor está por venir."],
}


def textos_combos_local(combos: list, ocasion: Optional[str], para: Optional[str]) -> list:
    quien = para or "esa persona"
    out = []
    for i, c in enumerate(combos):
        nombres = [p["nombre"][:1].lower() + p["nombre"][1:] for p in c["items"]]
        negocios = len({p["emprendimiento_id"] for p in c["items"]})
        if len(nombres) == 1:
            por_que = f"Un solo detalle bien escogido: {nombres[0]} de {c['items'][0]['emprendimiento']}"
        else:
            lista = ", ".join(nombres[:-1]) + " y " + nombres[-1]
            por_que = f"Junta {lista}" + (f", de {negocios} emprendimientos de Ocaña" if negocios > 1 else "")
        por_que += f". Suma {pesos(c['total'])}" + (f" y te sobran {pesos(c['sobra'])}." if c["sobra"] >= 1000 else ", justo en tu presupuesto.")
        variantes = _TARJETAS.get(ocasion or "") or [f"Para {quien}, con mucho cariño.", f"Un detalle hecho en Ocaña para {quien}.",
                                                     "Porque te lo mereces. Con cariño."]
        out.append({"nombre": _NOMBRES_COMBO.get(c["tipo"], "Otra idea"), "por_que": por_que, "tarjeta": variantes[i % len(variantes)]})
    return out


async def textos_combos(combos: list, ocasion: Optional[str], para: Optional[str], gustos: str, presupuesto: int) -> tuple:
    """Con Gemini: nombre creativo, por qué funciona y mensaje para la tarjeta de cada combo."""
    base = textos_combos_local(combos, ocasion, para)
    if not combos or not gemini_disponible():
        return base, "local"
    import hashlib
    ids = "|".join(",".join(sorted(p["id"] for p in c["items"])) for c in combos)
    clave = "combos:" + hashlib.sha1(f"{ids}{ocasion}{para}{gustos}".encode()).hexdigest()
    guardado = cache_leer(clave)
    if guardado:
        return guardado, "gemini"
    lista = "\n".join(f"Combo {i + 1} (total {pesos(c['total'])}, sobran {pesos(c['sobra'])}): "
                      + "; ".join(f"{p['nombre']} de {p['emprendimiento']} ({pesos(p['precio'])})" for p in c["items"])
                      for i, c in enumerate(combos))
    t = await _gemini(
        "Eres el asesor de regalos de Impulsa, directorio de emprendimientos de Ocaña, Colombia. "
        f"El cliente quiere un regalo{' para ' + para if para else ''}{' por ' + ocasion if ocasion else ''}, "
        f"presupuesto {pesos(presupuesto)}{', gustos: ' + gustos if gustos else ''}. Estos combos ya están armados:\n{lista}\n\n"
        'Responde solo un JSON con "combos": una lista con un objeto por combo, en el mismo orden, con '
        '"nombre" (2 a 4 palabras creativas, sin emojis), "por_que" (1 o 2 frases cortas en español colombiano que expliquen '
        'por qué ese combo le sirve a esa persona) y "tarjeta" (mensaje cálido de máximo 20 palabras para escribir en la tarjeta '
        "del regalo). No cambies productos ni precios.", json_=True, temperatura=0.7, max_tokens=700, timeout=15)
    try:
        d = json.loads(t or "")
        lista_g = d.get("combos") if isinstance(d, dict) else None
        if not isinstance(lista_g, list) or len(lista_g) < len(combos):
            return base, "local"
        out = []
        for b, g in zip(base, lista_g):
            out.append({"nombre": str(g.get("nombre") or b["nombre"])[:40],
                        "por_que": str(g.get("por_que") or b["por_que"])[:280],
                        "tarjeta": str(g.get("tarjeta") or b["tarjeta"])[:160]})
        cache_guardar(clave, out)
        return out, "gemini"
    except Exception:
        return base, "local"


# --- Radar de demanda ------------------------------------------------------------------------
def radar_local(r: dict, negocio: dict) -> list:
    ops = []
    cat = negocio.get("categoria_slug")
    # Sin Gemini: solo se recomienda lo que no sea claramente de otro rubro (a una artesana no le sirve "tacos").
    afines = [s for s in (r.get("sin_oferta") or [])
              if not (familia_de(s["consulta"]) and cat and cat not in familia_de(s["consulta"]))]
    for s in afines[:2]:
        ops.append({"titulo": f"{s['n']} {'persona buscó' if s['n'] == 1 else 'personas buscaron'} “{s['consulta']}” y nadie lo vende",
                    "texto": "Si puedes ofrecerlo, publícalo aunque sea por encargo: serías la única opción en Impulsa.",
                    "accion": "Publicar producto", "enlace": "#/panel/producto/nuevo"})
    for s in (r.get("tuyas") or [])[:2]:
        if s.get("tuyos", 0) == 0:
            continue
        comp = s.get("ofertas", 0) - s.get("tuyos", 0)
        ops.append({"titulo": f"“{s['consulta']}” te trae clientes",
                    "texto": f"Se buscó {s['n']} veces y tienes {s['tuyos']} producto{'s' if s['tuyos'] != 1 else ''} que aparece"
                             f"{'n' if s['tuyos'] != 1 else ''}" + (f"; compites con {comp} más." if comp > 0 else ", sin competencia.")
                             + " Una promoción ahí puede convertir esas visitas en ventas.",
                    "accion": "Crear promoción", "enlace": "#/panel/promociones"})
    for s in (r.get("subiendo") or [])[:1]:
        ops.append({"titulo": f"Sube la demanda de “{s['consulta']}”",
                    "texto": f"Esta semana se buscó {s['n']} veces, contra {s['antes']} la semana pasada. Usa esas palabras en "
                             "el nombre y las etiquetas de tus productos.",
                    "accion": "Editar productos", "enlace": "#/panel/productos"})
    return ops[:4]


async def radar_oportunidades(r: dict, negocio: dict) -> tuple:
    base = radar_local(r, negocio)
    if not gemini_disponible():
        return base, "local"
    import datetime
    clave = f"radar:{negocio['id']}:{datetime.date.today().isoformat()}"
    guardado = cache_leer(clave)
    if guardado:
        return guardado, "gemini"
    fmt = lambda xs, extra="": "; ".join(f"“{x['consulta']}” ({x['n']} veces{extra and ', ' + extra.format(**x)})" for x in xs[:8]) or "ninguna"
    t = await _gemini(
        "Eres el asesor de negocios de Impulsa, directorio de emprendimientos de Ocaña, Colombia. "
        f"Negocio: {negocio['nombre']} ({negocio.get('categoria') or ''}): {negocio.get('descripcion') or ''}. "
        f"Búsquedas de los últimos 30 días en Impulsa que no encontraron nada: {fmt(r.get('sin_oferta') or [])}. "
        f"Búsquedas donde aparecen sus productos: {fmt(r.get('tuyas') or [], '{tuyos} suyos y {ofertas} en total')}. "
        f"Búsquedas que suben esta semana: {fmt(r.get('subiendo') or [])}. "
        'Responde solo un JSON con "oportunidades": lista de 3 objetos con "titulo" (máximo 9 palabras, con la cifra o la '
        'búsqueda concreta), "texto" (1 o 2 frases con una acción concreta y realista para ESTE negocio; si una demanda no '
        'tiene relación con lo que vende, no la recomiendes), "accion" (una de: "Publicar producto", "Crear promoción", '
        '"Editar productos"). En español colombiano, sin emojis, sin inventar cifras.',
        json_=True, temperatura=0.5, max_tokens=600, timeout=15)
    enlaces = {"Publicar producto": "#/panel/producto/nuevo", "Crear promoción": "#/panel/promociones",
               "Editar productos": "#/panel/productos"}
    try:
        d = json.loads(t or "")
        ops = [{"titulo": str(o["titulo"])[:90], "texto": str(o["texto"])[:300],
                "accion": o.get("accion") if o.get("accion") in enlaces else "Editar productos",
                "enlace": enlaces.get(o.get("accion"), "#/panel/productos")} for o in d["oportunidades"][:4]]
        if not ops:
            return base, "local"
        cache_guardar(clave, ops)
        return ops, "gemini"
    except Exception:
        return base, "local"


async def modelos_gemini() -> list:
    """Modelos que la clave puede usar para generar texto (diagnóstico)."""
    if not GEMINI_API_KEY:
        return []
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
                        headers={"x-goog-api-key": GEMINI_API_KEY})
    if r.status_code != 200:
        return [f"HTTP {r.status_code}"]
    return [m["name"].removeprefix("models/") for m in r.json().get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])]
