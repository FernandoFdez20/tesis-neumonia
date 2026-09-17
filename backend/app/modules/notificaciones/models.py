from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Notificacion(Base):
    """Aviso persistente de caso prioritario (Alta/Crítica).

    Se crea automáticamente al calcular prioridad Alta/Crítica y solo se
    cierra por validación de la atención (automático) o descarte explícito
    del médico (manual). No expira con el tiempo.
    """

    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    diagnostico_id = Column(
        Integer,
        ForeignKey("diagnosticos.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    prioridad = Column(String(20), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False, nullable=False)
    cerrada = Column(Boolean, default=False, nullable=False)
    motivo_cierre = Column(String(20), nullable=True)  # 'manual' | 'validacion' | 'recalculada'
    created_at = Column(TIMESTAMP, server_default=func.now())
    fecha_cierre = Column(TIMESTAMP, nullable=True)

    diagnostico = relationship("Diagnostico")
