from sqlalchemy.orm import Session
from app.modules.auth.models import Usuario
from app.modules.auth.schemas import UsuarioCreate
from app.core.security import get_password_hash


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_usuario_por_username(self, username: str) -> Usuario:
        return self.db.query(Usuario).filter(Usuario.username == username).first()

    def get_usuario_por_correo(self, correo: str) -> Usuario:
        return self.db.query(Usuario).filter(Usuario.correo == correo).first()

    def create_usuario(self, usuario_in: UsuarioCreate) -> Usuario:
        db_usuario = Usuario(
            username=usuario_in.username,
            correo=usuario_in.correo,
            password=get_password_hash(usuario_in.password),
            nombre_completo=usuario_in.nombre_completo,
            rol=usuario_in.rol,
        )
        self.db.add(db_usuario)
        self.db.commit()
        self.db.refresh(db_usuario)
        return db_usuario

    def update_ultimo_login(self, usuario: Usuario):
        from sqlalchemy.sql import func

        usuario.ultimo_login = func.now()
        self.db.commit()
        self.db.refresh(usuario)
