from fastapi import APIRouter
from app.modules.auth.routes import router as auth_router
from app.modules.pacientes.routes import router as pacientes_router
from app.modules.atenciones.routes import router as atenciones_router
from app.modules.diagnosticos.routes import router as diagnosticos_router
from app.modules.notificaciones.routes import router as notificaciones_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(pacientes_router, prefix="/pacientes", tags=["pacientes"])
api_router.include_router(atenciones_router, prefix="/atenciones", tags=["atenciones"])
api_router.include_router(diagnosticos_router, prefix="/diagnosticos", tags=["diagnosticos"])
api_router.include_router(notificaciones_router, prefix="/notificaciones", tags=["notificaciones"])
