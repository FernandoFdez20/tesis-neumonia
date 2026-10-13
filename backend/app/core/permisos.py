"""HU-04 — Catálogo de permisos y resolución de permisos efectivos.

El control de acceso tiene dos capas:

1. El **rol** aporta una base de permisos (definida aquí, no en la BD, para
   que el catálogo sea auditable desde el código).
2. Cada usuario puede **conceder** o **revocar** permisos puntuales, que se
   guardan como desviaciones en la tabla `usuario_permisos_override`.

    permisos efectivos = (base del rol + concedidos) - revocados

Regla del CU que se mantiene absoluta: el rol **Admin** nunca accede a datos
clínicos, aunque se le concedan permisos clínicos.
"""
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.modules.auth.models import TipoRol, Usuario

# Separador de los grupos en la interfaz de administración.
GRUPO_ADMIN = "Administración"
GRUPO_CLINICO = "Datos clínicos"
GRUPO_ASISTENCIAL = "Atención del paciente"


@dataclass(frozen=True)
class Permiso:
    clave: str
    etiqueta: str
    grupo: str
    #: Rol (de Admin) que lo otorga por defecto.
    roles_base: tuple[TipoRol, ...]


def _p(clave, etiqueta, grupo, roles_base) -> Permiso:
    return Permiso(clave=clave, etiqueta=etiqueta, grupo=grupo, roles_base=roles_base)


# Los tres conjuntos del caso de uso: Enfermería (operativo), Especialista
# (lo anterior + examen físico, derivación, validación y PDF) y Admin
# (gestión de cuentas, sin datos clínicos).
CATALOGO: tuple[Permiso, ...] = (
    _p("dashboard.ver", "Ver el panel principal", GRUPO_ASISTENCIAL,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("pacientes.ver", "Consultar el directorio de pacientes", GRUPO_CLINICO,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("pacientes.registrar", "Registrar pacientes y antecedentes", GRUPO_CLINICO,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("atenciones.ver", "Consultar atenciones médicas", GRUPO_CLINICO,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("atenciones.registrar", "Registrar signos vitales y abrir atención",
       GRUPO_ASISTENCIAL, (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("atenciones.examen_fisico", "Registrar examen físico y derivación",
       GRUPO_ASISTENCIAL, (TipoRol.Especialista,)),
    _p("radiografias.cargar", "Cargar radiografías AP/PA", GRUPO_ASISTENCIAL,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("resultados.ver", "Consultar el resultado del modelo", GRUPO_CLINICO,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("diagnostico.validar", "Validar el diagnóstico de la IA", GRUPO_CLINICO,
       (TipoRol.Especialista,)),
    _p("reporte.pdf", "Generar el reporte PDF", GRUPO_CLINICO,
       (TipoRol.Especialista,)),
    _p("historial.ver", "Consultar el historial clínico por paciente", GRUPO_CLINICO,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("alertas.ver", "Ver el panel de alertas de casos prioritarios", GRUPO_ASISTENCIAL,
       (TipoRol.Enfermera, TipoRol.Especialista)),
    _p("usuarios.gestionar", "Gestionar cuentas, roles y permisos", GRUPO_ADMIN,
       (TipoRol.Admin,)),
)

CLAVES_VALIDAS = frozenset(p.clave for p in CATALOGO)

CATALOGO_POR_CLAVE = {p.clave: p for p in CATALOGO}


def es_permiso_valido(clave: str) -> bool:
    return clave in CLAVES_VALIDAS


def permisos_base(rol: TipoRol) -> set[str]:
    """Permisos que otorga el rol por defecto."""
    return {p.clave for p in CATALOGO if rol in p.roles_base}


# El Admin gestiona cuentas; el resto de permisos son clínicos o asistenciales.
PERMISOS_CLINICOS = frozenset(
    p.clave for p in CATALOGO if p.grupo in (GRUPO_CLINICO, GRUPO_ASISTENCIAL)
)


def resolver_permisos(db: Session, usuario: Usuario) -> set[str]:
    """Permisos efectivos del usuario: base del rol + concedidos - revocados."""
    from app.modules.usuarios.models import UsuarioPermisoOverride

    efectivos = permisos_base(usuario.rol)

    filas = (
        db.query(UsuarioPermisoOverride)
        .filter(UsuarioPermisoOverride.usuario_id == usuario.id)
        .all()
    )
    for fila in filas:
        if not es_permiso_valido(fila.permiso):
            # Una clave que ya no existe en el catálogo se ignora.
            continue
        if fila.concede:
            efectivos.add(fila.permiso)
        else:
            efectivos.discard(fila.permiso)

    # Regla del CU: el Administrador nunca accede a datos clínicos.
    if usuario.rol == TipoRol.Admin:
        efectivos -= PERMISOS_CLINICOS

    return efectivos


def catalogo_para_rol(rol: TipoRol) -> list[dict]:
    """Catálogo serializable para el selector del panel de administración."""
    return [
        {
            "clave": p.clave,
            "etiqueta": p.etiqueta,
            "grupo": p.grupo,
            "base": rol in p.roles_base,
        }
        for p in CATALOGO
    ]