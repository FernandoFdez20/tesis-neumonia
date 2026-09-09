import enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EstadoClinico(str, enum.Enum):
    SinAtencionPendiente = "Sin atención pendiente"
    PendienteDeEvaluacion = "Pendiente de evaluación"
    DerivadoARadiografia = "Derivado a radiografía"
    DiagnosticoPendiente = "Diagnostico pendiente"
    PendienteDeValidacion = "Pendiente de validación"
    Validado = "Validado"


tipo_estado_clinico = SQLAlchemyEnum(
    EstadoClinico,
    name="tipo_estado_val",
    values_callable=lambda estados: [estado.value for estado in estados],
)


paciente_enfermedades = Table(
    "paciente_enfermedades",
    Base.metadata,
    Column(
        "paciente_id",
        Integer,
        ForeignKey("pacientes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "enfermedad_id",
        Integer,
        ForeignKey("enfermedades.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String(8), unique=True, index=True, nullable=False)
    nombres_apellidos = Column(String(150), nullable=False)
    sexo = Column(String(20), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    otros_antecedentes = Column(Text, nullable=True)
    antecedentes_familiares = Column(Text, nullable=True)
    ultima_atencion = Column(DateTime, nullable=True)
    estado_clinico = Column(
        tipo_estado_clinico,
        default=EstadoClinico.SinAtencionPendiente,
        nullable=False,
    )
    created_at = Column(DateTime, default=func.now())

    enfermedades = relationship(
        "Enfermedad",
        secondary=paciente_enfermedades,
        back_populates="pacientes",
    )


class Enfermedad(Base):
    __tablename__ = "enfermedades"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)

    pacientes = relationship(
        "Paciente",
        secondary=paciente_enfermedades,
        back_populates="enfermedades",
    )
