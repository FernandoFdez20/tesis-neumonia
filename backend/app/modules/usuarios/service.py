from sqlalchemy.orm import Session
from . import models, schemas


def get_usuarios(db: Session):
    return db.query(models.Usuario).all()


def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    db_usuario = models.Usuario(
        nombre=usuario.nombre,
        correo=usuario.correo,
        password=usuario.password,
        estado=usuario.estado,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario
