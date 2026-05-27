from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from pydantic import ValidationError
from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.models import Usuario
from app.modules.auth.schemas import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


def get_usuario_actual(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Usuario:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=403,
            detail="No se pudieron validar las credenciales",
        )
    usuario = db.query(Usuario).filter(Usuario.id == token_data.sub).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not usuario.estado:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return usuario
