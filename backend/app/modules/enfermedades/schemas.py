from pydantic import BaseModel


class EnfermedadRead(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True
