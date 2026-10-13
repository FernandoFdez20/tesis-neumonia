from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TipoRol(str, enum.Enum):
    # HU-03: los 3 roles del caso de uso. Debe coincidir con el enum `tipo_rol`
    # de PostgreSQL (ver bd.sql y backend/scripts/migrar_rol_hu03.py).
    Admin = "Admin"
    Enfermera = "Enfermera"
    Especialista = "Especialista"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    correo = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    rol = Column(SQLAlchemyEnum(TipoRol, name="tipo_rol"), nullable=False)
    estado = Column(Boolean, default=True)
    ultimo_login = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
