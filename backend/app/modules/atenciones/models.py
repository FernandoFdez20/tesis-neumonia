import enum
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EstadoAtencion(str, enum.Enum):
    Finalizada = "Finalizada"
    EnProceso = "En proceso"


tipo_estado_atencion = SQLAlchemyEnum(
    EstadoAtencion,
    name="estado_atencion",
    values_callable=lambda estados: [estado.value for estado in estados],
)


class AtencionMedica(Base):
    __tablename__ = "atenciones_medicas"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(
        Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_registro = Column(DateTime, default=func.now())

    temperatura = Column(Numeric(4, 2), nullable=True)
    frecuencia_cardiaca = Column(Integer, nullable=True)
    frecuencia_respiratoria = Column(Integer, nullable=True)
    saturacion_o2 = Column(Integer, nullable=True)
    presion_arterial = Column(String(20), nullable=True)
    tiempo_evolucion_dias = Column(Integer, nullable=True)
    sintomas_principales = Column(Text, nullable=True)
    examen_fisico = Column(Text, nullable=True)

    estado = Column(
        tipo_estado_atencion,
        default=EstadoAtencion.EnProceso,
        nullable=False,
    )

    # Si necesitas relationships
    # paciente = relationship("Paciente", back_populates="atenciones")
    # usuario = relationship("Usuario")
