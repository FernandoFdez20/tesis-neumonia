from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.archivos import ArchivosConSesion
from app.ml.modelo_manager import inicializar_modelo

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Carga el modelo al arrancar; libera recursos al apagar."""
    inicializar_modelo()
    yield


app = FastAPI(title="Tesis Neumonia API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Las radiografías son datos clínicos: el montaje exige un JWT vigente.
# El token llega en la query (?token=) porque <img src> no manda cabeceras.
app.mount("/uploads", ArchivosConSesion(directory=str(UPLOAD_DIR)), name="uploads")
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "API de Tesis Neumonia en línea"}
