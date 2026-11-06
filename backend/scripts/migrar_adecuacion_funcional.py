r"""Conserva datos de captura y separa progreso de derivación.

Desde backend: .\venv\Scripts\python.exe -m scripts.migrar_adecuacion_funcional
Migración transaccional e idempotente. Conserva los estados históricos;
los campos de captura anteriores permanecen nulos porque no se registraron.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection

from app.core.database import engine


def migrar(conexion: Connection) -> None:
    columnas = {c["name"] for c in inspect(conexion).get_columns("atenciones_medicas")}
    definiciones = {
        "fecha_atencion": "DATE",
        "hora_atencion": "TIME",
        "motivo_consulta": "TEXT",
        "derivado_radiografia": "BOOLEAN NOT NULL DEFAULT FALSE",
    }
    for nombre, definicion in definiciones.items():
        if nombre not in columnas:
            conexion.execute(text(
                f"ALTER TABLE atenciones_medicas ADD COLUMN {nombre} {definicion}"
            ))

    if "derivado_radiografia" not in columnas:
        # Antes, cualquier examen no vacío se mostraba como derivación.
        # Mantener ese estado y los casos con diagnóstico sin inferirlo de nuevo.
        conexion.execute(text("""
            UPDATE atenciones_medicas AS a
            SET derivado_radiografia = TRUE
            WHERE COALESCE(a.examen_fisico <> '', FALSE)
               OR EXISTS (
                   SELECT 1 FROM diagnosticos AS d
                   WHERE d.atencion_medica_id = a.id
               )
        """))


if __name__ == "__main__":
    with engine.begin() as conexion:
        migrar(conexion)
    print("Migración de adecuación funcional aplicada; registros históricos conservados.")
