"""Impulsa · API (FastAPI). También sirve el frontend, así todo vive en una sola URL."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from . import sb
from .config import URL_PUBLICA
from .rutas import auth, cliente, panel, publico


@asynccontextmanager
async def ciclo(app: FastAPI):
    if URL_PUBLICA:
        try:  # Supabase hace ping a esta URL cada 10 minutos para que el plan gratis no se duerma.
            await sb.rpc("registrar_backend", p_url=URL_PUBLICA)
        except Exception:
            pass
    yield
    if sb._http is not None:
        await sb._http.aclose()


app = FastAPI(title="Impulsa API", version="1.0.0", lifespan=ciclo, docs_url="/api/docs", openapi_url="/api/openapi.json",
              description="API de Impulsa: emprendedores y consumidores de Ocaña en un solo lugar.")
app.add_middleware(GZipMiddleware, minimum_size=800)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

for modulo in (publico, auth, cliente, panel):
    app.include_router(modulo.r)

FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
if FRONTEND.exists():
    app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
