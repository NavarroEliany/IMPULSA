"""Experiencia del cliente: inicio personalizado, favoritos, calendario y notificaciones."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import sb

r = APIRouter(prefix="/api", tags=["Cliente"])


class Fecha(BaseModel):
    tipo: str = "cumpleanos"
    titulo: str
    persona: Optional[str] = None
    relacion: Optional[str] = None
    fecha: str
    repetir_anual: bool = True
    regalo_idea: Optional[str] = None
    presupuesto_max: Optional[int] = None
    avisos_dias: List[int] = [7, 3]


class Resena(BaseModel):
    emprendimiento_id: str
    producto_id: Optional[str] = None
    calificacion: int = Field(ge=1, le=5)
    comentario: str = ""


async def _alternar(tabla: str, columna: str, valor: str, token: str, extra: Optional[dict] = None) -> bool:
    uid = sb.uid_de(token)
    filtros = {"cliente_id": f"eq.{uid}", columna: f"eq.{valor}"}
    if await sb.leer(tabla, token, select=columna, **filtros):
        await sb.borrar(tabla, filtros, token)
        return False
    await sb.crear(tabla, {"cliente_id": uid, columna: valor, **(extra or {})}, token, devolver=False)
    return True


@r.get("/cliente/inicio", summary="Inicio personalizado: recordatorios, promos y recomendados")
async def inicio_cliente(token: str = Depends(sb.token_requerido)):
    return await sb.rpc("inicio_cliente", token)


@r.get("/favoritos", summary="Mis productos guardados")
async def favoritos(token: str = Depends(sb.token_requerido)):
    ids = [f["producto_id"] for f in await sb.leer("favoritos", token, select="producto_id",
                                                    cliente_id=f"eq.{sb.uid_de(token)}", order="creado_en.desc")]
    if not ids:
        return []
    filas = await sb.leer("v_productos", token, id=f"in.({','.join(ids)})")
    for f in filas:
        f.pop("busqueda", None)
    return sorted(filas, key=lambda p: ids.index(p["id"]))


@r.post("/favoritos/{producto_id}", summary="Guardar o quitar de favoritos")
async def alternar_favorito(producto_id: str, token: str = Depends(sb.token_requerido)):
    return {"activo": await _alternar("favoritos", "producto_id", producto_id, token)}


@r.post("/alertas/{producto_id}", summary="Avísame cuando vuelva a estar disponible")
async def alternar_alerta(producto_id: str, token: str = Depends(sb.token_requerido)):
    return {"activo": await _alternar("alertas_stock", "producto_id", producto_id, token)}


@r.post("/seguir/{emprendimiento_id}", summary="Seguir o dejar de seguir un emprendimiento")
async def alternar_seguir(emprendimiento_id: str, token: str = Depends(sb.token_requerido)):
    return {"activo": await _alternar("seguidores", "emprendimiento_id", emprendimiento_id, token)}


@r.post("/resenas", summary="Escribir una reseña")
async def crear_resena(d: Resena, token: str = Depends(sb.token_requerido)):
    return await sb.crear("resenas", {**d.model_dump(), "comentario": d.comentario.strip()[:800],
                                      "cliente_id": sb.uid_de(token)}, token)


# ---------- calendario
@r.get("/fechas", summary="Mi calendario: fechas personales y fechas sugeridas")
async def fechas(token: str = Depends(sb.token_requerido)):
    return await sb.rpc("fechas_cliente", token)


@r.post("/fechas", summary="Agregar una fecha importante")
async def crear_fecha(d: Fecha, token: str = Depends(sb.token_requerido)):
    return await sb.crear("fechas_importantes", {**d.model_dump(), "cliente_id": sb.uid_de(token)}, token)


@r.put("/fechas/{fecha_id}", summary="Editar una fecha")
async def editar_fecha(fecha_id: str, d: Fecha, token: str = Depends(sb.token_requerido)):
    filas = await sb.cambiar("fechas_importantes", {"id": f"eq.{fecha_id}"}, d.model_dump(), token)
    if not filas:
        raise HTTPException(404, "Fecha no encontrada")
    return filas[0]


@r.delete("/fechas/{fecha_id}", summary="Eliminar una fecha")
async def borrar_fecha(fecha_id: str, token: str = Depends(sb.token_requerido)):
    await sb.borrar("fechas_importantes", {"id": f"eq.{fecha_id}"}, token)
    return {"ok": True}


@r.get("/fechas/{fecha_id}/sugerencias", summary="Ideas de regalo que la IA encontró para esa fecha")
async def sugerencias(fecha_id: str, token: str = Depends(sb.token_requerido)):
    return await sb.rpc("sugerencias_fecha", token, p_fecha=fecha_id, p_limite=6) or []


@r.post("/fechas-sugeridas/{sugerida_id}", summary="Activar o desactivar una fecha sugerida")
async def alternar_sugerida(sugerida_id: int, token: str = Depends(sb.token_requerido)):
    return {"activo": await _alternar("cliente_fechas_sugeridas", "fecha_sugerida_id", str(sugerida_id), token)}


# ---------- notificaciones
@r.get("/notificaciones", summary="Mis notificaciones")
async def notificaciones(token: str = Depends(sb.token_requerido)):
    return await sb.leer("notificaciones", token, usuario_id=f"eq.{sb.uid_de(token)}", order="creado_en.desc", limit="40")


@r.post("/notificaciones/leer", summary="Marcar todas como leídas")
async def leer_notificaciones(token: str = Depends(sb.token_requerido)):
    await sb.cambiar("notificaciones", {"usuario_id": f"eq.{sb.uid_de(token)}", "leida": "eq.false"}, {"leida": True}, token)
    return {"ok": True}
