from fastapi import APIRouter
from app.modules.usuarios.router import router as usuarios_router

api_router = APIRouter()
api_router.include_router(usuarios_router)
