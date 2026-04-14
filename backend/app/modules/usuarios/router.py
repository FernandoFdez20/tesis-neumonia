from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.security import create_access_token, decode_access_token
from app.db.session import get_db
from . import schemas, service

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=schemas.UsuarioRead)
def registrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    return service.create_usuario(db=db, usuario=usuario)


@router.get("/", response_model=List[schemas.UsuarioRead])
def obtener_usuarios(db: Session = Depends(get_db)):
    return service.get_usuarios(db=db)


@router.post("/login", response_model=schemas.TokenResponse)
def login_usuario(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Login simple: valida correo/password y devuelve token
    usuario = service.authenticate_usuario(
        db=db, correo=payload.correo, password=payload.password
    )

    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    access_token = create_access_token(
        {
            "sub": usuario.correo,
            "usuario_id": usuario.id,
            "rol": usuario.rol,
        }
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UsuarioRead)
def get_current_usuario(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    # Leemos token Bearer para obtener usuario logueado
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.replace("Bearer ", "", 1).strip()
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    usuario_id = payload.get("usuario_id")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Token invalido")

    usuario = service.get_usuario_by_id(db=db, usuario_id=int(usuario_id))
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario
