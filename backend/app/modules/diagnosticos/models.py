import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DECIMAL, Text,
    ForeignKey, TIMESTAMP, Enum as SQLAlchemyEnum, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.modules.pacientes.models import tipo_estado_clinico


class NivelGravedad(str, enum.Enum):
    Baja = "Baja"
    Moderada = "Moderada"
    Alta = "Alta"
    Critica = "Crítica"


tipo_gravedad = SQLAlchemyEnum(
    NivelGravedad,
    name="tipo_gravedad",
    values_callable=lambda niveles: [nivel.value for nivel in niveles],
)


class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id = Column(Integer, primary_key=True, index=True)
    atencion_medica_id = Column(
        Integer, ForeignKey("atenciones_medicas.id", ondelete="CASCADE"),
        unique=True, nullable=False
    )

    # Resultados IA Consolidado
    enfermo = Column(Boolean, default=False)
    # nivel_gravedad_ia = Column(
    #     SQLAlchemyEnum("Leve", "Moderado", "Grave", "Crítica", "Normal",
    #                    name="tipo_gravedad"),
    #     nullable=True
    # )

    # Desglose de confianza global (Reservados para Etapa 2)
    # confianza_clinica = Column(DECIMAL(5, 2), nullable=True)
    # confianza_riesgo = Column(DECIMAL(5, 2), nullable=True)
    # hallazgos_json = Column(JSONB, nullable=True)

    # Priorización Dinámica
    prioridad_final = Column(tipo_gravedad, nullable=True)
    prioridad_detalle = Column(JSONB, nullable=True)

    # Imagen de mayor probabilidad IA
    imagen_referencia_id = Column(Integer, ForeignKey(
        "diagnostico_imagenes.id", ondelete="SET NULL"), nullable=True)

    # Validación médica
    estado_validacion = Column(tipo_estado_clinico, nullable=True)
    clasificacion_medico = Column(String(50), nullable=True)
    diagnostico_final_medico = Column(Boolean, nullable=True)
    concordancia_ia = Column(String(20), nullable=True)
    diagnostico_descripcion = Column(Text, nullable=True)
    validado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_validacion = Column(TIMESTAMP, nullable=True)
    updated_at = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relaciones
    imagenes = relationship(
        "DiagnosticoImagen",
        back_populates="diagnostico",
        foreign_keys="[DiagnosticoImagen.diagnostico_id]",
        cascade="all, delete-orphan"
    )

    imagen_referencia = relationship(
        "DiagnosticoImagen",
        foreign_keys="[Diagnostico.imagen_referencia_id]"
    )


class DiagnosticoImagen(Base):
    __tablename__ = "diagnostico_imagenes"

    id = Column(Integer, primary_key=True, index=True)
    diagnostico_id = Column(
        Integer, ForeignKey("diagnosticos.id", ondelete="CASCADE"),
        nullable=False
    )
    imagen_url = Column(String(255), nullable=False)
    orden = Column(Integer, nullable=False, default=1)
    tipo_vista = Column(String(10), nullable=True)  # 'AP' | 'PA'

    # Resultados independientes por imagen
    probabilidad_ia = Column(DECIMAL(5, 4), nullable=True)
    confianza_radiografica = Column(DECIMAL(5, 2), nullable=True)
    hallazgo_positivo = Column(Boolean, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())

    diagnostico = relationship(
        "Diagnostico",
        back_populates="imagenes",
        foreign_keys="[DiagnosticoImagen.diagnostico_id]"
    )
