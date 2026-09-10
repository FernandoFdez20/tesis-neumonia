from sqlalchemy.orm import Session
from app.modules.diagnosticos.models import Diagnostico, DiagnosticoImagen
from typing import Optional, List


class DiagnosticoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_por_atencion(self, atencion_medica_id: int) -> Optional[Diagnostico]:
        return (
            self.db.query(Diagnostico)
            .filter(Diagnostico.atencion_medica_id == atencion_medica_id)
            .first()
        )

    def get_por_id(self, diagnostico_id: int) -> Optional[Diagnostico]:
        return (
            self.db.query(Diagnostico)
            .filter(Diagnostico.id == diagnostico_id)
            .first()
        )

    def crear_diagnostico(self, atencion_medica_id: int) -> Diagnostico:
        diagnostico = Diagnostico(atencion_medica_id=atencion_medica_id)
        self.db.add(diagnostico)
        self.db.flush()  # para obtener el id antes de commit
        return diagnostico

    def agregar_imagen(
        self,
        diagnostico_id: int,
        imagen_url: str,
        orden: int,
        tipo_vista: Optional[str],
        probabilidad_ia: Optional[float] = None,
        confianza_radiografica: Optional[float] = None,
        hallazgo_positivo: Optional[bool] = None
    ) -> DiagnosticoImagen:
        img = DiagnosticoImagen(
            diagnostico_id=diagnostico_id,
            imagen_url=imagen_url,
            orden=orden,
            tipo_vista=tipo_vista,
            probabilidad_ia=probabilidad_ia,
            confianza_radiografica=confianza_radiografica,
            hallazgo_positivo=hallazgo_positivo
        )
        self.db.add(img)
        return img

    def limpiar_imagenes(self, diagnostico_id: int):
        self.db.query(DiagnosticoImagen).filter(
            DiagnosticoImagen.diagnostico_id == diagnostico_id
        ).delete()
        self.db.flush()

    def commit(self):
        self.db.commit()

    def refresh(self, obj):
        self.db.refresh(obj)
