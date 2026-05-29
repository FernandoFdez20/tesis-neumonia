from fastapi import APIRouter
from app.modules.auth.routes import router as auth_router
from app.modules.pacientes.routes import router as pacientes_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(pacientes_router, prefix="/pacientes", tags=["pacientes"])
