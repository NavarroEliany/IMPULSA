"""Cliente HTTP mínimo para Supabase (PostgREST, Auth y Storage).

El backend nunca usa la clave de servicio: reenvía el token del usuario y las políticas
RLS de la base de datos deciden qué puede leer o escribir cada quien.
"""
import base64
import json
from typing import Any, Optional

import httpx
from fastapi import Header, HTTPException

from .config import SUPABASE_KEY, SUPABASE_URL

_http: Optional[httpx.AsyncClient] = None


def http() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(timeout=25)
    return _http


def _cabeceras(token: Optional[str], extra: Optional[dict] = None) -> dict:
    h = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    elif not SUPABASE_KEY.startswith("sb_"):
        h["Authorization"] = f"Bearer {SUPABASE_KEY}"
    if extra:
        h.update(extra)
    return h


async def pedir(metodo: str, ruta: str, token: Optional[str] = None, *, params: Optional[dict] = None,
                json_: Any = None, contenido: Optional[bytes] = None, cabeceras: Optional[dict] = None) -> Any:
    try:
        r = await http().request(metodo, SUPABASE_URL + ruta, params=params, json=json_, content=contenido,
                                 headers=_cabeceras(token, cabeceras))
    except httpx.HTTPError:
        raise HTTPException(503, "No pudimos conectar con la base de datos. Intenta de nuevo.")
    if r.status_code >= 400:
        try:
            d = r.json()
        except Exception:
            d = {}
        msg = d.get("message") or d.get("msg") or d.get("error_description") or d.get("error") or "Ocurrió un error"
        if "JWT" in str(msg) or r.status_code == 401:
            raise HTTPException(401, "Tu sesión venció. Inicia sesión de nuevo.")
        if "banned" in str(msg).lower():
            raise HTTPException(403, "Tu cuenta está suspendida. Escríbenos si crees que es un error.")
        if "Invalid login credentials" in str(msg):
            raise HTTPException(400, "Correo o contraseña incorrectos")
        raise HTTPException(r.status_code if r.status_code in (400, 403, 404, 409, 422) else 502, str(msg))
    if r.status_code == 204 or not r.content:
        return None
    try:
        return r.json()
    except Exception:
        return None


async def rpc(funcion: str, token: Optional[str] = None, **params) -> Any:
    return await pedir("POST", f"/rest/v1/rpc/{funcion}", token, json_=params)


async def leer(tabla: str, token: Optional[str] = None, **params) -> list:
    return await pedir("GET", f"/rest/v1/{tabla}", token, params=params) or []


async def uno(tabla: str, token: Optional[str] = None, **params) -> Optional[dict]:
    filas = await leer(tabla, token, limit="1", **params)
    return filas[0] if filas else None


async def crear(tabla: str, datos: Any, token: Optional[str] = None, devolver: bool = True, upsert: bool = False) -> Any:
    prefer = "return=representation" if devolver else "return=minimal"
    if upsert:
        prefer += ",resolution=merge-duplicates"
    r = await pedir("POST", f"/rest/v1/{tabla}", token, json_=datos, cabeceras={"Prefer": prefer})
    if devolver and isinstance(r, list) and not isinstance(datos, list):
        return r[0] if r else None
    return r


async def cambiar(tabla: str, filtros: dict, datos: dict, token: str) -> list:
    return await pedir("PATCH", f"/rest/v1/{tabla}", token, params=filtros, json_=datos,
                       cabeceras={"Prefer": "return=representation"}) or []


async def borrar(tabla: str, filtros: dict, token: str) -> None:
    await pedir("DELETE", f"/rest/v1/{tabla}", token, params=filtros)


async def subir(bucket: str, ruta: str, datos: bytes, tipo: str, token: str) -> None:
    await pedir("POST", f"/storage/v1/object/{bucket}/{ruta}", token, contenido=datos,
                cabeceras={"Content-Type": tipo, "x-upsert": "true"})


# ---------- dependencias de autenticación
def token_opcional(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        t = authorization[7:].strip()
        return t or None
    return None


def token_requerido(authorization: Optional[str] = Header(default=None)) -> str:
    t = token_opcional(authorization)
    if not t:
        raise HTTPException(401, "Inicia sesión para continuar")
    return t


def uid_de(token: str) -> str:
    """Lee el id del usuario del token. La validez real del token la comprueba Supabase en cada consulta."""
    try:
        p = token.split(".")[1]
        p += "=" * (-len(p) % 4)
        return json.loads(base64.urlsafe_b64decode(p))["sub"]
    except Exception:
        raise HTTPException(401, "Sesión no válida")


def uid_opcional(token: Optional[str]) -> Optional[str]:
    try:
        return uid_de(token) if token else None
    except HTTPException:
        return None
