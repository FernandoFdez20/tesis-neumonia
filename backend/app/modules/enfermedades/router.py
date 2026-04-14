from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from . import schemas, service

router = APIRouter(prefix="/enfermedades", tags=["Enfermedades"])


@router.get("/", response_model=List[schemas.EnfermedadRead])
def obtener_enfermedades(db: Session = Depends(get_db)):
    # Ruta publica de solo lectura para consumir el catalogo desde frontend.
    return service.get_enfermedades(db=db)
