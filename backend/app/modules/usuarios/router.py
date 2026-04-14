from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from . import schemas, service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=schemas.UsuarioRead)
def registrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    return service.create_usuario(db=db, usuario=usuario)


@router.get("/", response_model=List[schemas.UsuarioRead])
def obtener_usuarios(db: Session = Depends(get_db)):
    return service.get_usuarios(db=db)
