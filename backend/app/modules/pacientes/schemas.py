from datetime import date, datetime
from math import ceil
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.pacientes.models import EstadoClinico


class EnfermedadResponse(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)


class PacienteBase(BaseModel):
    dni: str = Field(min_length=8, max_length=8)
    nombres_apellidos: str = Field(min_length=3, max_length=150)
    sexo: str = Field(min_length=1, max_length=20)
    fecha_nacimiento: date
    otros_antecedentes: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    estado_clinico: EstadoClinico = EstadoClinico.SinAtencionPendiente
    enfermedad_ids: list[int] = Field(default_factory=list)

    @field_validator("dni", mode="before")
    @classmethod
    def validar_dni(cls, dni: str) -> str:
        dni_limpio = str(dni).strip()
        if not dni_limpio.isdigit():
            raise ValueError("El DNI debe contener solo números")
        return dni_limpio

    @field_validator("nombres_apellidos", "sexo", mode="before")
    @classmethod
    def limpiar_texto_requerido(cls, valor: str) -> str:
        valor_limpio = str(valor).strip()
        if not valor_limpio:
            raise ValueError("El campo no puede estar vacío")
        return valor_limpio

    @field_validator("otros_antecedentes", "antecedentes_familiares", mode="before")
    @classmethod
    def limpiar_texto_opcional(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None

        valor_limpio = str(valor).strip()
        return valor_limpio or None

    @field_validator("fecha_nacimiento")
    @classmethod
    def validar_paciente_adulto(cls, fecha_nacimiento: date) -> date:
        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year - (
            (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day)
        )

        if edad < 18:
            raise ValueError("El paciente debe ser adulto")

        return fecha_nacimiento


class PacienteCreate(PacienteBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "dni": "70451298",
                "nombres_apellidos": "Fernando Fernandez",
                "sexo": "Masculino",
                "fecha_nacimiento": "1998-05-20",
            }
        }
    )


class PacienteUpdate(BaseModel):
    dni: Optional[str] = Field(default=None, min_length=8, max_length=8)
    nombres_apellidos: Optional[str] = Field(default=None, min_length=3, max_length=150)
    sexo: Optional[str] = Field(default=None, min_length=1, max_length=20)
    fecha_nacimiento: Optional[date] = None
    otros_antecedentes: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    estado_clinico: Optional[EstadoClinico] = None
    enfermedad_ids: Optional[list[int]] = None

    @field_validator("dni", mode="before")
    @classmethod
    def validar_dni(cls, dni: Optional[str]) -> Optional[str]:
        if dni is None:
            return None

        dni_limpio = str(dni).strip()
        if not dni_limpio.isdigit():
            raise ValueError("El DNI debe contener solo números")
        return dni_limpio

    @field_validator("nombres_apellidos", "sexo", mode="before")
    @classmethod
    def limpiar_texto_requerido(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None

        valor_limpio = str(valor).strip()
        if not valor_limpio:
            raise ValueError("El campo no puede estar vacío")
        return valor_limpio

    @field_validator("otros_antecedentes", "antecedentes_familiares", mode="before")
    @classmethod
    def limpiar_texto_opcional(cls, valor: Optional[str]) -> Optional[str]:
        if valor is None:
            return None

        valor_limpio = str(valor).strip()
        return valor_limpio or None

    @field_validator("fecha_nacimiento")
    @classmethod
    def validar_paciente_adulto(cls, fecha_nacimiento: Optional[date]) -> Optional[date]:
        if fecha_nacimiento is None:
            return None

        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year - (
            (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day)
        )

        if edad < 18:
            raise ValueError("El paciente debe ser adulto")

        return fecha_nacimiento


class PacienteResponse(BaseModel):
    id: int
    dni: str
    nombres_apellidos: str
    sexo: str
    fecha_nacimiento: date
    otros_antecedentes: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    ultima_atencion: Optional[datetime] = None
    estado_clinico: EstadoClinico
    created_at: datetime
    enfermedades: list[EnfermedadResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PacientesPaginados(BaseModel):
    items: list[PacienteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def crear(
        cls,
        items: list[PacienteResponse],
        total: int,
        page: int,
        page_size: int,
    ) -> "PacientesPaginados":
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total else 0,
        )
