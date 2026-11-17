"""Administración de la plataforma. Cada función de la base valida que quien llama tenga rol admin."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .. import sb

r = APIRouter(prefix="/api/admin", tags=["Administración"])


class EstadoUsuario(BaseModel):
    suspendido: Optional[bool] = None
    rol: Optional[str] = Field(default=None, pattern="^(cliente|emprendedor|admin)$")


class EstadoNegocio(BaseModel):
    verificado: Optional[bool] = None
    activo: Optional[bool] = None


class EstadoProducto(BaseModel):
    activo: Optional[bool] = None
    destacado: Optional[bool] = None


class Categoria(BaseModel):
    nombre: str = Field(min_length=2, max_length=40)
    emoji: str = Field(default="✨", max_length=8)
    tipo: str = Field(default="producto", pattern="^(producto|servicio)$")
    orden: Optional[int] = None


class Fecha(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    mes: int = Field(ge=1, le=12)
    dia: int = Field(ge=1, le=31)
    emoji: str = Field(default="🎁", max_length=8)
    descripcion: str = Field(default="", max_length=160)
    ocasion: str = Field(default="", max_length=40)


class Anuncio(BaseModel):
    titulo: str = Field(min_length=3, max_length=90)
    mensaje: str = Field(min_length=3, max_length=300)
    rol: Optional[str] = Field(default=None, pattern="^(cliente|emprendedor)$")
    enlace: Optional[str] = Field(default=None, max_length=200)


@r.get("/resumen", summary="Cifras generales de la plataforma")
async def resumen(token: str = Depends(sb.token_requerido)):
    return await sb.rpc("admin_resumen", token)


@r.get("/usuarios", summary="Buscar usuarios")
async def usuarios(q: Optional[str] = None, rol: Optional[str] = None, desde: int = 0, token: str = Depends(sb.token_requerido)):
    return await sb.rpc("admin_usuarios", token, p_q=(q or "").strip() or None, p_rol=rol or None, p_limite=60, p_desde=desde)


@r.put("/usuarios/{uid}", summary="Suspender, reactivar o cambiar el rol de un usuario")
async def usuario(uid: str, d: EstadoUsuario, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_usuario", token, p_id=uid, p_suspender=d.suspendido, p_rol=d.rol)
    return {"ok": True}


@r.get("/negocios", summary="Emprendimientos con sus cifras")
async def negocios(q: Optional[str] = None, estado: Optional[str] = None, token: str = Depends(sb.token_requerido)):
    return await sb.rpc("admin_negocios", token, p_q=(q or "").strip() or None, p_estado=estado or None)


@r.put("/negocios/{emp_id}", summary="Verificar, suspender o reactivar un emprendimiento")
async def negocio(emp_id: str, d: EstadoNegocio, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_negocio", token, p_id=emp_id, p_verificado=d.verificado, p_activo=d.activo)
    return {"ok": True}


@r.get("/productos", summary="Productos de todos los emprendimientos")
async def productos(q: Optional[str] = None, token: str = Depends(sb.token_requerido)):
    return await sb.rpc("admin_productos", token, p_q=(q or "").strip() or None, p_limite=80)


@r.put("/productos/{prod_id}", summary="Ocultar, mostrar o destacar un producto")
async def producto(prod_id: str, d: EstadoProducto, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_producto", token, p_id=prod_id, p_activo=d.activo, p_destacado=d.destacado)
    return {"ok": True}


@r.get("/resenas", summary="Reseñas para moderar")
async def resenas(max: int = 5, token: str = Depends(sb.token_requerido)):
    return await sb.rpc("admin_resenas", token, p_max=max, p_limite=100)


@r.delete("/resenas/{resena_id}", summary="Eliminar una reseña ofensiva o falsa")
async def borrar_resena(resena_id: str, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_borrar_resena", token, p_id=resena_id)
    return {"ok": True}


@r.post("/categorias", summary="Crear una categoría")
async def crear_categoria(d: Categoria, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_categoria", token, p_id=None, p_nombre=d.nombre, p_emoji=d.emoji, p_tipo=d.tipo, p_orden=d.orden)
    return {"ok": True}


@r.put("/categorias/{cat_id}", summary="Editar una categoría")
async def editar_categoria(cat_id: int, d: Categoria, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_categoria", token, p_id=cat_id, p_nombre=d.nombre, p_emoji=d.emoji, p_tipo=d.tipo, p_orden=d.orden)
    return {"ok": True}


@r.delete("/categorias/{cat_id}", summary="Borrar una categoría vacía")
async def borrar_categoria(cat_id: int, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_borrar_categoria", token, p_id=cat_id)
    return {"ok": True}


@r.get("/fechas", summary="Fechas comerciales sugeridas")
async def fechas(token: str = Depends(sb.token_requerido)):
    return await sb.leer("fechas_sugeridas", token, order="mes,dia")


@r.post("/fechas", summary="Crear una fecha sugerida")
async def crear_fecha(d: Fecha, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_fecha", token, p_id=None, p_nombre=d.nombre, p_mes=d.mes, p_dia=d.dia, p_emoji=d.emoji,
                 p_descripcion=d.descripcion, p_ocasion=d.ocasion or None)
    return {"ok": True}


@r.put("/fechas/{fecha_id}", summary="Editar una fecha sugerida")
async def editar_fecha(fecha_id: int, d: Fecha, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_fecha", token, p_id=fecha_id, p_nombre=d.nombre, p_mes=d.mes, p_dia=d.dia, p_emoji=d.emoji,
                 p_descripcion=d.descripcion, p_ocasion=d.ocasion or None)
    return {"ok": True}


@r.delete("/fechas/{fecha_id}", summary="Borrar una fecha sugerida")
async def borrar_fecha(fecha_id: int, token: str = Depends(sb.token_requerido)):
    await sb.rpc("admin_borrar_fecha", token, p_id=fecha_id)
    return {"ok": True}


@r.post("/anuncios", summary="Enviar una notificación a todos los clientes, emprendedores o ambos")
async def anunciar(d: Anuncio, token: str = Depends(sb.token_requerido)):
    n = await sb.rpc("admin_anunciar", token, p_titulo=d.titulo, p_mensaje=d.mensaje, p_rol=d.rol, p_enlace=d.enlace)
    return {"enviadas": n}
