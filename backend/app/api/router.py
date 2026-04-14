from fastapi import APIRouter
from app.modules.usuarios.router import router as usuarios_router
from app.modules.enfermedades.router import router as enfermedades_router
from app.modules.diagnosticos.router import router as diagnosticos_router

api_router = APIRouter()
api_router.include_router(usuarios_router)
api_router.include_router(enfermedades_router)
api_router.include_router(diagnosticos_router)
