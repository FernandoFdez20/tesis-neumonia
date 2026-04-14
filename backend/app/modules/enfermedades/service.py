from sqlalchemy.orm import Session

from . import models


# Devuelve el catalogo completo de enfermedades para poblar checkboxes del formulario.
def get_enfermedades(db: Session):
    return db.query(models.Enfermedad).order_by(models.Enfermedad.nombre.asc()).all()
