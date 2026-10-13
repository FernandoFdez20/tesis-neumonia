"""Migración HU-03: reduce el enum `tipo_rol` a los 3 roles del HU.

Antes ('Admin','Médico','Especialista','Enfermera','Técnico')
Ahora ('Admin','Enfermera','Especialista')

Es idempotente: si ya quedó en 3 valores, no hace nada.
PostgreSQL no permite quitar valores de un enum, así que se crea un tipo
nuevo, se castea la columna y recién ahí se borra el viejo (sin CASCADE,
para no arrastrar nada por accidente).
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

NUEVOS = ["Admin", "Enfermera", "Especialista"]
TIPO_NUEVO = "tipo_rol_hu03"


def leer_enum(c):
    return [
        r[0]
        for r in c.execute(
            text("select enumlabel from pg_enum e join pg_type t "
                 "on t.oid = e.enumtypid where t.typname = 'tipo_rol' "
                 "order by e.enumsortorder")
        )
    ]


e = create_engine(settings.SQLALCHEMY_DATABASE_URI)
with e.connect() as c:
    actuales = leer_enum(c)
    print("ENUM actual:", actuales)

    if sorted(actuales) == sorted(NUEVOS):
        print("Ya está en los 3 roles del HU. No hace falta migrar.")
    else:
        # 1. Nadie puede quedarse apuntando a un valor que desaparecerá.
        en_uso = [
            r[0]
            for r in c.execute(
                text("select distinct rol::text from usuarios "
                     "where rol::text <> all(:ok)"), {"ok": NUEVOS}
            )
        ]
        if en_uso:
            raise SystemExit(
                f"ABORTA: hay usuarios con roles a eliminar {en_uso}. "
                "Reasígnalos antes de migrar."
            )

        c.execute(text("ALTER TABLE usuarios ALTER COLUMN rol DROP DEFAULT"))

        # 2. Tipo nuevo + casteo de la columna (los valores válidos ya caben).
        c.execute(text(f"DROP TYPE IF EXISTS {TIPO_NUEVO}"))
        c.execute(
            text(f"CREATE TYPE {TIPO_NUEVO} AS ENUM (:a, :b, :c)").bindparams(
                a=NUEVOS[0], b=NUEVOS[1], c=NUEVOS[2]
            )
        )
        c.execute(
            text(f"ALTER TABLE usuarios ALTER COLUMN rol TYPE {TIPO_NUEVO} "
                 "USING rol::text::" + TIPO_NUEVO)
        )

        # 3. Ya sin dependencias, se retira el tipo viejo y se renombra.
        c.execute(text("DROP TYPE tipo_rol"))
        c.execute(text(f"ALTER TYPE {TIPO_NUEVO} RENAME TO tipo_rol"))
        c.execute(
            text("ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'Enfermera'")
        )
        c.commit()
        print("ENUM migrado.")

    print("ENUM final:  ", leer_enum(c))
    print("Usuarios:    ", c.execute(
        text("select rol::text, count(*) from usuarios group by 1")).fetchall())