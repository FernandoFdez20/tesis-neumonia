from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.router import api_router
from app.db.session import engine, Base
from app.modules.usuarios import models  # <-- Actualizado al dominio en español
from app.modules.enfermedades import models as enfermedades_models  # noqa: F401
from app.modules.diagnosticos import models as diagnosticos_models  # noqa: F401

app = FastAPI(title="Tesis API - Diagnóstico de Neumonía")

# Carpeta por defecto para archivos subidos (radiografias).
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Permitimos el frontend local durante desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(localhost|127\\.0\\.0\\.1):\\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "API de Tesis funcionando (PostgreSQL)"}
