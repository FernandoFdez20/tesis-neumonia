from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.schemas import UsuarioCreate, UsuarioResponse, Token
from app.modules.auth.service import AuthService
from app.api.deps import get_usuario_actual
from app.modules.auth.models import Usuario

router = APIRouter()


@router.post(
    "/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED
)
def register(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register(usuario_in)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    return auth_service.login(username=form_data.username, password=form_data.password)


@router.post("/logout")
def logout(usuario_actual: Usuario = Depends(get_usuario_actual)):
    # Los tokens JWT son stateless. Para un logout real se puede implementar en cliente eliminando el token.
    return {"message": "Cierre de sesión exitoso"}


@router.get("/me", response_model=UsuarioResponse)
def get_me(usuario_actual: Usuario = Depends(get_usuario_actual)):
    return usuario_actual
