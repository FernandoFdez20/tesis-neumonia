from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import UsuarioCreate
from app.core.security import verify_password, create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.repo = AuthRepository(db)

    def register(self, usuario_in: UsuarioCreate):
        if self.repo.get_usuario_por_username(usuario_in.username):
            raise HTTPException(
                status_code=400, detail="El nombre de usuario ya está registrado"
            )
        if self.repo.get_usuario_por_correo(usuario_in.correo):
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        return self.repo.create_usuario(usuario_in)

    def login(self, username: str, password: str):
        usuario = self.repo.get_usuario_por_username(username)
        if not usuario:
            raise HTTPException(
                status_code=401, detail="Usuario o contraseña incorrectos"
            )

        if not verify_password(password, usuario.password):
            raise HTTPException(
                status_code=401, detail="Usuario o contraseña incorrectos"
            )

        if not usuario.estado:
            raise HTTPException(status_code=400, detail="Usuario inactivo")

        self.repo.update_ultimo_login(usuario)

        access_token = create_access_token(subject=usuario.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "usuario": usuario,
        }
