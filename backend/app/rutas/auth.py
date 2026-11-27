"""Registro, inicio de sesión y perfil."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import sb

r = APIRouter(prefix="/api/auth", tags=["Cuenta"])


class Registro(BaseModel):
    email: str
    password: str = Field(min_length=8)
    rol: str = "cliente"
    nombre: str
    apellido: str = ""
    celular: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None


class Login(BaseModel):
    email: str
    password: str


class Refresco(BaseModel):
    refresh_token: str


class CambioClave(BaseModel):
    actual: str
    nueva: str


# Cuentas que usan los botones "Entrar como cliente / emprendedora" de la pantalla de inicio de sesión.
# Si alguien les cambia la contraseña, los botones dejan de funcionar para todos.
DEMO_COMPARTIDAS = {"laura@impulsa.demo", "gloria@impulsa.demo"}


class Recuperar(BaseModel):
    email: str


class NuevaClave(BaseModel):
    email: str
    codigo: str = Field(min_length=6, max_length=10)
    password: str = Field(min_length=8)


class Perfil(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    celular: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    avatar_url: Optional[str] = None
    avisos: Optional[dict] = None


class Gustos(BaseModel):
    categorias: List[int] = []
    compra_para: List[str] = []
    presupuesto_min: Optional[int] = None
    presupuesto_max: Optional[int] = None


async def datos_de_sesion(token: str) -> dict:
    uid = sb.uid_de(token)
    perfil = await sb.uno("perfiles", token, id=f"eq.{uid}")
    negocio = None
    if perfil and perfil["rol"] == "emprendedor":
        negocio = await sb.uno("v_emprendimientos", token, propietario_id=f"eq.{uid}")
    gustos = await sb.leer("gustos_cliente", token, select="categoria_id", cliente_id=f"eq.{uid}")
    nuevas = await sb.leer("notificaciones", token, select="id", usuario_id=f"eq.{uid}", leida="eq.false", limit="50")
    return {"perfil": perfil, "negocio": negocio, "gustos": [g["categoria_id"] for g in gustos], "sin_leer": len(nuevas)}


async def _entrar(email: str, password: str) -> dict:
    s = await sb.pedir("POST", "/auth/v1/token", params={"grant_type": "password"},
                       json_={"email": email.strip().lower(), "password": password})
    return {"access_token": s["access_token"], "refresh_token": s["refresh_token"], "expires_in": s.get("expires_in", 3600),
            **await datos_de_sesion(s["access_token"])}


@r.post("/registro", summary="Crear cuenta de cliente o emprendedor")
async def registro(d: Registro):
    await sb.rpc("registrar_usuario", p_email=d.email, p_password=d.password, p_rol=d.rol, p_nombre=d.nombre,
                 p_apellido=d.apellido, p_celular=d.celular,
                 p_datos={"fecha_nacimiento": d.fecha_nacimiento or "", "barrio": d.barrio or "", "ciudad": d.ciudad or ""})
    return await _entrar(d.email, d.password)


@r.post("/login", summary="Iniciar sesión")
async def login(d: Login):
    return await _entrar(d.email, d.password)


@r.post("/refresh", summary="Renovar la sesión")
async def refresh(d: Refresco):
    s = await sb.pedir("POST", "/auth/v1/token", params={"grant_type": "refresh_token"}, json_={"refresh_token": d.refresh_token})
    return {"access_token": s["access_token"], "refresh_token": s["refresh_token"], "expires_in": s.get("expires_in", 3600)}


@r.post("/recuperar", summary="Enviar al correo un código para cambiar la contraseña")
async def recuperar(d: Recuperar):
    email = d.email.strip().lower()
    if email.endswith("@impulsa.demo"):
        return {"ok": True, "demo": True}
    # Supabase responde igual exista o no la cuenta, así nadie puede averiguar qué correos están registrados.
    await sb.pedir("POST", "/auth/v1/recover", json_={"email": email})
    return {"ok": True}


@r.post("/nueva-clave", summary="Cambiar la contraseña con el código recibido por correo")
async def nueva_clave(d: NuevaClave):
    email = d.email.strip().lower()
    try:
        s = await sb.pedir("POST", "/auth/v1/verify", json_={"type": "recovery", "email": email, "token": d.codigo.strip()})
    except HTTPException as e:
        if e.status_code in (400, 401, 403, 422):
            raise HTTPException(400, "El código no es válido o ya venció. Pide uno nuevo.")
        raise
    token = s["access_token"]
    await sb.pedir("PUT", "/auth/v1/user", token, json_={"password": d.password})
    return await _entrar(email, d.password)


@r.put("/clave", summary="Cambiar mi contraseña (pide la actual)")
async def cambiar_clave(d: CambioClave, token: str = Depends(sb.token_requerido)):
    if len(d.nueva) < 8:
        raise HTTPException(400, "La contraseña nueva debe tener mínimo 8 caracteres")
    if d.nueva == d.actual:
        raise HTTPException(400, "La contraseña nueva debe ser distinta de la actual")
    perfil = await sb.uno("perfiles", token, id=f"eq.{sb.uid_de(token)}", select="email")
    if not perfil:
        raise HTTPException(401, "Inicia sesión de nuevo")
    try:
        await _entrar(perfil["email"], d.actual)
    except HTTPException:
        raise HTTPException(400, "La contraseña actual no es correcta. No se cambió nada.")
    if perfil["email"].lower() in DEMO_COMPARTIDAS:
        raise HTTPException(403, "Esta es una cuenta de demostración compartida: su contraseña no se puede cambiar "
                                 "para que el botón de demostración siga funcionando. Prueba con tu propia cuenta.")
    await sb.pedir("PUT", "/auth/v1/user", token, json_={"password": d.nueva})
    return await _entrar(perfil["email"], d.nueva)


@r.get("/yo", summary="Mi perfil, mi negocio y mis gustos")
async def yo(token: str = Depends(sb.token_requerido)):
    return await datos_de_sesion(token)


@r.put("/perfil", summary="Actualizar mis datos")
async def actualizar_perfil(d: Perfil, token: str = Depends(sb.token_requerido)):
    cambios = {k: v for k, v in d.model_dump().items() if v is not None}
    if cambios:
        await sb.cambiar("perfiles", {"id": f"eq.{sb.uid_de(token)}"}, cambios, token)
    return await datos_de_sesion(token)


@r.put("/gustos", summary="Guardar mis gustos (la IA los usa para recomendar)")
async def guardar_gustos(d: Gustos, token: str = Depends(sb.token_requerido)):
    uid = sb.uid_de(token)
    await sb.borrar("gustos_cliente", {"cliente_id": f"eq.{uid}"}, token)
    if d.categorias:
        await sb.crear("gustos_cliente", [{"cliente_id": uid, "categoria_id": c} for c in set(d.categorias)], token, devolver=False)
    cambios = {"compra_para": d.compra_para, "onboarding_completo": True}
    if d.presupuesto_min is not None:
        cambios["presupuesto_min"] = d.presupuesto_min
    if d.presupuesto_max is not None:
        cambios["presupuesto_max"] = d.presupuesto_max
    await sb.cambiar("perfiles", {"id": f"eq.{uid}"}, cambios, token)
    return await datos_de_sesion(token)
