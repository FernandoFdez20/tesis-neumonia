"""HU-04 — Desviaciones de permisos respecto al rol.

Solo se guardan las diferencias: lo que el rol ya otorga no necesita fila.
`concede = True` suma el permiso, `concede = False` lo quita.
"""
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from app.core.database import Base


class UsuarioPermisoOverride(Base):
    __tablename__ = "usuario_permisos_override"

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    )
    permiso = Column(String(50), primary_key=True)
    concede = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("usuario_id", "permiso", name="uq_usuario_permiso"),
    )