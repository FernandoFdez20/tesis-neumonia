"""HU-04: crea la tabla de desviaciones de permisos por usuario.

Es idempotente. No toca datos: solo asegura que exista la estructura.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

e = create_engine(settings.SQLALCHEMY_DATABASE_URI)
with e.connect() as c:
    existe = c.execute(text(
        "select count(*) from information_schema.tables "
        "where table_name = 'usuario_permisos_override'"
    )).scalar()

    if existe:
        print("La tabla usuario_permisos_override ya existe.")
    else:
        c.execute(text("""
            CREATE TABLE usuario_permisos_override (
                usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                permiso VARCHAR(50) NOT NULL,
                concede BOOLEAN NOT NULL DEFAULT TRUE,
                CONSTRAINT pk_usuario_permiso PRIMARY KEY (usuario_id, permiso)
            )
        """))
        c.commit()
        print("Tabla usuario_permisos_override creada.")

    filas = c.execute(text(
        "select count(*) from usuario_permisos_override"
    )).scalar()
    print("Filas actuales:", filas)