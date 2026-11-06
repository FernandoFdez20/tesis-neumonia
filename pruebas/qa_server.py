"""Servidor de evaluación con código original y PostgreSQL aislado."""
import json
from pathlib import Path
import re
import secrets
from uuid import uuid4
from contextlib import asynccontextmanager
import sys
import hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine as original_engine, get_db
from app.api.router import api_router
from app.core.security import get_password_hash
from app.modules.auth.models import Usuario, TipoRol
import app.modules.diagnosticos.service as diagnosis
import app.core.archivos as files_module
from app.ml.modelo_manager import inicializar_modelo

def fingerprint():
    with original_engine.connect() as c:
        names = c.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
        )).scalars().all()
        records = {}
        for name in names:
            assert re.fullmatch(r"[a-z_]+", name)
            rows = c.execute(text(f'SELECT to_jsonb(t)::text FROM public."{name}" t')).scalars().all()
            records[name] = {"count": len(rows), "sha256": hashlib.sha256("\n".join(sorted(rows)).encode()).hexdigest()}
        return records

schema = "qa_informe_" + uuid4().hex
assert re.fullmatch(r"qa_informe_[a-f0-9]{32}", schema)
before = fingerprint()
(OUT / "database_baseline.json").write_text(json.dumps(before, indent=2), encoding="utf-8")
with original_engine.begin() as c:
    c.execute(text(f'CREATE SCHEMA "{schema}"'))
test_engine = create_engine(original_engine.url, connect_args={"options": f"-csearch_path={schema}"})
Base.metadata.create_all(bind=test_engine, checkfirst=False)
TestSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)
password = secrets.token_urlsafe(24)
with TestSession() as db:
    for username, role, active in [
        ("qa_admin", TipoRol.Admin, True),
        ("qa_enfermera", TipoRol.Enfermera, True),
        ("qa_especialista", TipoRol.Especialista, True),
        ("qa_inactivo", TipoRol.Enfermera, False),
    ]:
        db.add(Usuario(username=username, correo=username+"@example.com",
                       password=get_password_hash(password),
                       nombre_completo="Evaluación " + role.value,
                       rol=role, estado=active))
    db.commit()

config = {"schema": schema, "password": password, "port": 8093, "frontend_port": 5193}
(OUT / "private_config.json").write_text(json.dumps(config), encoding="utf-8")
upload_root = OUT / "uploads"
(upload_root / "radiografias").mkdir(parents=True, exist_ok=True)
diagnosis.UPLOAD_DIR = upload_root / "radiografias"
files_module.SessionLocal = TestSession

def isolated_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app):
    inicializar_modelo()
    yield
    test_engine.dispose()

app = FastAPI(title="Evaluación aislada de Tesis Neumonía", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.dependency_overrides[get_db] = isolated_db
app.mount("/uploads", files_module.ArchivosConSesion(directory=str(upload_root)), name="uploads")
app.include_router(api_router, prefix="/api/v1")
@app.get("/")
def root():
    return {"message": "API de Tesis Neumonia en línea"}

if __name__ == "__main__":
    import uvicorn
    print("Esquema de evaluación creado; datos originales conservados.", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8093, log_level="warning", access_log=False)
