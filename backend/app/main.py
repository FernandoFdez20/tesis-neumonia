from fastapi import FastAPI
from app.api.router import api_router
from app.db.session import engine, Base
from app.modules.usuarios import models  # <-- Actualizado al dominio en español

app = FastAPI(title="Tesis API - Diagnóstico de Neumonía")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "API de Tesis funcionando (PostgreSQL)"}
