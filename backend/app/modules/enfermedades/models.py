from sqlalchemy import Column, Integer, String

from app.db.session import Base


class Enfermedad(Base):
    __tablename__ = "enfermedades"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
