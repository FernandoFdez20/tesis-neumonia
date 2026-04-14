from sqlalchemy import Column, Integer, String, Boolean
from app.db.session import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    correo = Column(String, unique=True, index=True)
    password = Column(String)
    estado = Column(Boolean, default=True)
