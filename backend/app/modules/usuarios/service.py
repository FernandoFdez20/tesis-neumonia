from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.permisos import (
    CATALOGO,
    CATALOGO_POR_CLAVE,
    CLAVES_VALIDAS,
    PERMISOS_CLINICOS,
    catalogo_para_rol,
    es_permiso_valido,
    permisos_base,
    resolver_permisos,
)
from app.core.security import get_password_hash
from app.modules.auth.models import TipoRol, Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.usuarios.schemas import (
    PermisoCatalogo,
    RolesCatalogoResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
    UsuariosPaginados,
)

# Etiquetas y textos que se muestran en el panel de gestión de usuarios.
CATALOGO_ROLES = {
    TipoRol.Admin: (
        "Administrador",
        "Gestiona cuentas y roles. No accede a datos clínicos.",
    ),
    TipoRol.Enfermera: (
        "Enfermería",
        "Registra pacientes, antecedentes y signos vitales, carga radiografías "
        "y consulta resultados, alertas, panel e historial.",
    ),
    TipoRol.Especialista: (
        "Especialista",
        "Todo lo de enfermería, más examen físico, derivación, validación del "
        "diagnóstico de la IA y reporte PDF.",
    ),
}


class UsuarioService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsuarioRepository(db)

    # ---------- listado ----------
    def listar(
        self,
        page: int,
        page_size: int,
        buscar: str | None = None,
        rol: TipoRol | None = None,
        estado: bool | None = None,
    ) -> UsuariosPaginados:
        usuarios, total = self.repo.listar(page, page_size, buscar, rol, estado)
        total_pages = (total + page_size - 1) // page_size if total else 0
        return UsuariosPaginados(
            items=[self._serializar(u) for u in usuarios],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def _serializar(self, usuario: Usuario) -> UsuarioResponse:
        return UsuarioResponse(
            id=usuario.id,
            username=usuario.username,
            correo=usuario.correo,
            nombre_completo=usuario.nombre_completo,
            rol=usuario.rol,
            estado=usuario.estado,
            ultimo_login=usuario.ultimo_login,
            permisos=sorted(resolver_permisos(self.db, usuario)),
            overrides=self.repo.obtener_overrides(usuario.id),
        )

    def permisos_de(self, usuario: Usuario) -> list[str]:
        """Permisos efectivos de un usuario (usado al iniciar sesión)."""
        return sorted(resolver_permisos(self.db, usuario))

    def catalogo_permisos(self, rol: TipoRol | None = None) -> list[PermisoCatalogo]:
        """Catálogo completo, marcando cuáles da el rol indicado."""
        if rol is None:
            return [
                PermisoCatalogo(
                    clave=p.clave, etiqueta=p.etiqueta, grupo=p.grupo, base=False
                )
                for p in CATALOGO
            ]
        return [PermisoCatalogo(**d) for d in catalogo_para_rol(rol)]

    @staticmethod
    def catalogo_roles() -> list[RolesCatalogoResponse]:
        """No toca la base de datos: los roles salen del enum del catálogo."""
        return [
            RolesCatalogoResponse(valor=rol, etiqueta=etiqueta, descripcion=desc)
            for rol, (etiqueta, desc) in CATALOGO_ROLES.items()
        ]

    # ---------- altas ----------
    def crear(self, datos: UsuarioCreate) -> Usuario:
        if self.repo.get_por_username(datos.username):
            raise HTTPException(
                status_code=400, detail="El nombre de usuario ya está registrado"
            )
        if self.repo.get_por_correo(datos.correo):
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

        return self.repo.crear(
            username=datos.username,
            correo=datos.correo,
            password_hash=get_password_hash(datos.password),
            nombre_completo=datos.nombre_completo,
            rol=datos.rol,
        )

    # ---------- edición ----------
    def actualizar(self, usuario_id: int, datos: UsuarioUpdate, actual: Usuario) -> Usuario:
        objetivo = self.repo.get_por_id(usuario_id)
        if not objetivo:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        cambios: dict = {}

        if datos.nombre_completo is not None:
            cambios["nombre_completo"] = datos.nombre_completo

        if datos.correo is not None and datos.correo != objetivo.correo:
            otro = self.repo.get_por_correo(datos.correo)
            if otro and otro.id != usuario_id:
                raise HTTPException(
                    status_code=400, detail="El correo ya está registrado"
                )
            cambios["correo"] = datos.correo

        # Un administrador no puede degradarse ni desactivarse a sí mismo:
        # evita quedarse sin acceso al panel por un descuido.
        if datos.rol is not None and datos.rol != objetivo.rol:
            if objetivo.id == actual.id:
                raise HTTPException(
                    status_code=400,
                    detail="No puede cambiar su propio rol",
                )
            cambios["rol"] = datos.rol

        if datos.estado is not None and datos.estado != objetivo.estado:
            if objetivo.id == actual.id:
                raise HTTPException(
                    status_code=400,
                    detail="No puede desactivar su propia cuenta",
                )
            cambios["estado"] = datos.estado

        # No dejar la instalación sin ningún administrador activo.
        pierde_admin = (
            cambios.get("rol") not in (None, TipoRol.Admin)
            or cambios.get("estado") is False
        ) and objetivo.rol == TipoRol.Admin and objetivo.estado
        if pierde_admin and self.repo.contar_activos_con_rol(
            TipoRol.Admin, excluir_id=objetivo.id
        ) == 0:
            raise HTTPException(
                status_code=400,
                detail="Debe quedar al menos un administrador activo",
            )

        if not cambios:
            return objetivo

        return self.repo.actualizar(objetivo, cambios)

    def resetear_password(
        self, usuario_id: int, password: str
    ) -> dict:
        objetivo = self.repo.get_por_id(usuario_id)
        if not objetivo:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        self.repo.cambiar_password(objetivo, get_password_hash(password))
        return {"message": f"Contraseña de {objetivo.username} actualizada"}

    # ---------- HU-04: asignación de permisos ----------

    def asignar_permisos(self, usuario_id: int, permisos: list[str]) -> UsuarioResponse:
        objetivo = self.repo.get_por_id(usuario_id)
        if not objetivo:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        desconocidas = sorted({p for p in permisos if not es_permiso_valido(p)})
        if desconocidas:
            raise HTTPException(
                status_code=400,
                detail=f"Permisos no válidos: {', '.join(desconocidas)}",
            )

        base = permisos_base(objetivo.rol)
        deseados = set(permisos)

        # El cliente manda la lista absoluta; aquí se guarda solo la
        # diferencia respecto del rol, que es lo que realmente cambia.
        overrides: dict[str, bool] = {}
        for clave in CLAVES_VALIDAS:
            tiene = clave in deseados
            por_rol = clave in base
            if tiene and not por_rol:
                overrides[clave] = True
            elif por_rol and not tiene:
                overrides[clave] = False

        # El Administrador nunca recibe datos clínicos (regla del CU).
        # Se rechaza en vez de ignorar en silencio, para que el panel no dé
        # la impresión de haber guardado algo que no tendrá efecto.
        if objetivo.rol == TipoRol.Admin:
            concedidos_clinicos = sorted(deseados & PERMISOS_CLINICOS)
            if concedidos_clinicos:
                nombres = ", ".join(
                    CATALOGO_POR_CLAVE[c].etiqueta for c in concedidos_clinicos
                )
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "El rol Administrador no puede recibir permisos clínicos "
                        f"({nombres})."
                    ),
                )
            # Las revocaciones de permisos clínicos no tienen sentido aquí:
            # ese usuario nunca los tuvo. Se descartan.
            overrides = {
                clave: concede
                for clave, concede in overrides.items()
                if not (clave in PERMISOS_CLINICOS and not concede)
            }

        self.repo.reemplazar_overrides(usuario_id, overrides)
        self.db.refresh(objetivo)
        return self._serializar(objetivo)