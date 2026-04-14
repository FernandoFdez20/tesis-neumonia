from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String(8), unique=True, nullable=False)
    nombres_apellidos = Column(String(150), nullable=False)
    sexo = Column(String(20), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    peso_kg = Column(Numeric(5, 2), nullable=True)
    otros_antecedentes = Column(Text, nullable=True)
    antecedentes_familiares = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class PacienteEnfermedad(Base):
    __tablename__ = "paciente_enfermedades"

    paciente_id = Column(
        Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), primary_key=True
    )
    enfermedad_id = Column(
        Integer, ForeignKey("enfermedades.id", ondelete="CASCADE"), primary_key=True
    )


class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(
        Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())
    imagen_url = Column(String(255), nullable=False)

    temperatura = Column(Numeric(4, 2), nullable=True)
    frecuencia_cardiaca = Column(Integer, nullable=True)
    frecuencia_respiratoria = Column(Integer, nullable=True)
    saturacion_o2 = Column(Integer, nullable=True)
    presion_arterial = Column(String(20), nullable=True)
    tiempo_evolucion_dias = Column(Integer, nullable=True)
    sintomas_principales = Column(Text, nullable=True)

    resultado_ia = Column(String(50), nullable=True)
    nivel_gravedad_ia = Column(String(20), nullable=True)
    probabilidad_ia = Column(Numeric(5, 4), nullable=True)

    estado_validacion = Column(String(20), nullable=True)
    comentario_medico = Column(Text, nullable=True)
    validado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_validacion = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now())

    paciente = relationship("Paciente")
