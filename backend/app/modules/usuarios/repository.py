from typing import Optional

from sqlalchemy.orm import Session

from app.modules.auth.models import TipoRol, Usuario
from app.modules.usuarios.models import UsuarioPermisoOverride


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_por_id(self, usuario_id: int) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.id == usuario_id).first()

    def get_por_username(self, username: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.username == username).first()

    def get_por_correo(self, correo: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.correo == correo).first()

    def listar(
        self,
        page: int,
        page_size: int,
        buscar: Optional[str] = None,
        rol: Optional[TipoRol] = None,
        estado: Optional[bool] = None,
    ) -> tuple[list[Usuario], int]:
        """Listado paginado con filtros. Devuelve (usuarios, total)."""
        q = self.db.query(Usuario)

        if buscar:
            patron = f"%{buscar.strip()}%"
            q = q.filter(
                (Usuario.nombre_completo.ilike(patron))
                | (Usuario.username.ilike(patron))
                | (Usuario.correo.ilike(patron))
            )
        if rol is not None:
            q = q.filter(Usuario.rol == rol)
        if estado is not None:
            q = q.filter(Usuario.estado.is_(estado))

        total = q.count()
        usuarios = (
            q.order_by(Usuario.estado.desc(), Usuario.nombre_completo.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return usuarios, total

    def contar_activos_con_rol(self, rol: TipoRol, excluir_id: int) -> int:
        return (
            self.db.query(Usuario)
            .filter(Usuario.rol == rol, Usuario.estado.is_(True), Usuario.id != excluir_id)
            .count()
        )

    def crear(
        self,
        username: str,
        correo: str,
        password_hash: str,
        nombre_completo: str,
        rol: TipoRol,
    ) -> Usuario:
        usuario = Usuario(
            username=username,
            correo=correo,
            password=password_hash,
            nombre_completo=nombre_completo,
            rol=rol,
        )
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def actualizar(self, usuario: Usuario, cambios: dict) -> Usuario:
        for campo, valor in cambios.items():
            setattr(usuario, campo, valor)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def cambiar_password(self, usuario: Usuario, password_hash: str) -> Usuario:
        usuario.password = password_hash
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    # ---------- HU-04: desviaciones de permisos ----------

    def obtener_overrides(self, usuario_id: int) -> dict[str, bool]:
        """Mapa permiso -> concede de las filas existentes del usuario."""
        filas = (
            self.db.query(UsuarioPermisoOverride)
            .filter(UsuarioPermisoOverride.usuario_id == usuario_id)
            .all()
        )
        return {f.permiso: f.concede for f in filas}

    def reemplazar_overrides(self, usuario_id: int, overrides: dict[str, bool]):
        """Deja la tabla de desviaciones exactamente como indica `overrides`."""
        self.db.query(UsuarioPermisoOverride).filter(
            UsuarioPermisoOverride.usuario_id == usuario_id
        ).delete()
        for permiso, concede in overrides.items():
            self.db.add(
                UsuarioPermisoOverride(
                    usuario_id=usuario_id, permiso=permiso, concede=concede
                )
            )
        self.db.commit()