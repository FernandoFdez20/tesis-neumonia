from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.session import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    correo = Column(String, unique=True, index=True)
    password = Column(String)
    nombre_completo = Column(String, nullable=False)
    rol = Column(String, nullable=False)
    estado = Column(Boolean, default=True)
    ultimo_login = Column(DateTime, nullable=True)
