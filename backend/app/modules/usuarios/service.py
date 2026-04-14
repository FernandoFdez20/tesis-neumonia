from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas


def get_usuarios(db: Session):
    return db.query(models.Usuario).all()


def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    # Si no viene username, tomamos la parte antes del @ del correo
    username = usuario.username or usuario.correo.split("@")[0]

    db_usuario = models.Usuario(
        username=username,
        correo=usuario.correo,
        password=usuario.password,
        nombre_completo=usuario.nombre_completo,
        rol=usuario.rol,
        estado=usuario.estado,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


def authenticate_usuario(db: Session, correo: str, password: str):
    # Validacion directa de credenciales contra PostgreSQL
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == correo).first()

    if not usuario:
        return None

    if not usuario.estado:
        return None

    if usuario.password != password:
        return None

    # Actualizamos ultimo_login al validar correctamente credenciales
    usuario.ultimo_login = datetime.utcnow()
    db.commit()
    db.refresh(usuario)

    return usuario


def get_usuario_by_id(db: Session, usuario_id: int):
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
