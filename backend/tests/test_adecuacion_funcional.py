"""Regresión de persistencia, progreso, derivación y categorías sobre PostgreSQL.

Ejecutar desde backend: python -m unittest discover -s tests -v
Cada prueba usa un esquema transaccional que se elimina mediante rollback.
"""
import unittest
from uuid import uuid4

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.router import api_router
from app.core.database import Base, engine, get_db
from app.core.security import get_password_hash
from app.modules.auth.models import TipoRol, Usuario
from app.modules.atenciones.models import AtencionMedica
from app.modules.diagnosticos.models import Diagnostico, NivelGravedad
from app.modules.pacientes.models import EstadoClinico
from scripts.migrar_adecuacion_funcional import migrar
from test_regresion_flujo_clinico import ClienteASGI


class AdecuacionFuncional(unittest.TestCase):
    def setUp(self):
        self.conexion = engine.connect()
        self.transaccion = self.conexion.begin()
        self.addCleanup(self.conexion.close)
        self.addCleanup(self.transaccion.rollback)
        self.esquema = f"prueba_adecuacion_{uuid4().hex}"
        self.conexion.execute(text(f'CREATE SCHEMA "{self.esquema}"'))
        self.conexion.execute(text(f'SET LOCAL search_path TO "{self.esquema}"'))
        Base.metadata.create_all(bind=self.conexion, checkfirst=False)
        self.db = Session(bind=self.conexion, join_transaction_mode="create_savepoint")
        self.addCleanup(self.db.close)
        clave = uuid4().hex
        for rol in TipoRol:
            self.db.add(Usuario(
                username=rol.value, correo=f"{rol.value.lower()}@example.com",
                nombre_completo=f"Prueba {rol.value}", rol=rol,
                password=get_password_hash(clave), estado=True,
            ))
        self.db.commit()
        app = FastAPI()
        app.include_router(api_router, prefix="/api/v1")

        def sesion_prueba():
            yield self.db

        app.dependency_overrides[get_db] = sesion_prueba
        self.cliente = ClienteASGI(app)
        self.sesiones = {}
        for rol in TipoRol:
            respuesta = self.cliente.request("POST", "/api/v1/auth/login", data={
                "username": rol.value, "password": clave,
            })
            self.assertEqual(respuesta.status_code, 200)
            self.sesiones[rol.value] = {"Authorization": f"Bearer {respuesta.json()['access_token']}"}
        self.paciente = self.peticion("POST", "/pacientes/", esperado=201, json={
            "dni": "12345678", "nombres_apellidos": "Paciente Adecuación Prueba",
            "sexo": "Femenino", "fecha_nacimiento": "1990-02-03",
        })
        self.datos = {
            "paciente_id": self.paciente["id"], "fecha_atencion": "2026-10-21",
            "hora_atencion": "08:17", "motivo_consulta": "Dificultad respiratoria al caminar",
            "temperatura": 37.5, "frecuencia_cardiaca": 88, "frecuencia_respiratoria": 22,
            "saturacion_o2": 96, "presion_arterial": "120/80", "tiempo_evolucion_dias": 5,
            "sintomas_principales": "Tos seca | Obs: Reevaluar evolución", "confusion": False,
        }

    def peticion(self, metodo, ruta, esperado=200, rol="Especialista", **datos):
        respuesta = self.cliente.request(
            metodo, "/api/v1" + ruta, headers=self.sesiones[rol], **datos
        )
        self.assertEqual(respuesta.status_code, esperado, respuesta.text[:600])
        return respuesta.json()

    def crear_atencion(self):
        return self.peticion("POST", "/atenciones/", esperado=201, rol="Enfermera", json=self.datos)

    def recuperadas(self, aid):
        # Obliga a releer de PostgreSQL; no basta la instancia en memoria.
        self.db.expunge_all()
        return [
            self.peticion("GET", f"/atenciones/{aid}"),
            next(a for a in self.peticion("GET", "/atenciones/") if a["id"] == aid),
            next(a for a in self.peticion("GET", f"/atenciones/paciente/{self.paciente['id']}")
                 if a["id"] == aid),
        ]

    def comprobar_estado(self, aid, examen, derivado, estado):
        for atencion in self.recuperadas(aid):
            self.assertEqual(atencion["examen_fisico"], examen)
            self.assertEqual(atencion["derivado_radiografia"], derivado)
            self.assertEqual(atencion["paciente_estado_clinico"], estado)
            self.assertEqual(atencion["estado"], "En proceso")

    def test_conserva_todos_los_datos_en_alta_detalle_listado_e_historial(self):
        creada = self.crear_atencion()
        for atencion in [creada, *self.recuperadas(creada["id"])]:
            for campo, valor in self.datos.items():
                esperado = "08:17:00" if campo == "hora_atencion" else valor
                self.assertEqual(atencion[campo], esperado, campo)
            self.assertEqual(atencion["fecha_registro"], creada["fecha_registro"])
            self.assertNotEqual(atencion["fecha_registro"][:10], self.datos["fecha_atencion"])
            self.assertEqual(atencion["crb65_puntaje"], 0)
            self.assertEqual(atencion["crb65_gravedad"], "Leve")
            self.assertFalse(atencion["derivado_radiografia"])

    def test_guardar_reabrir_derivar_y_guardar_sin_revertir_derivacion(self):
        aid = self.crear_atencion()["id"]
        for examen in ("Borrador inicial de evaluación", "", "Crepitantes en base derecha"):
            respuesta = self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
                "accion": "guardar_progreso", "examen_fisico": examen,
            })
            self.assertEqual(respuesta["paciente_estado_clinico"], "Pendiente de evaluación")
            self.comprobar_estado(aid, examen, False, "Pendiente de evaluación")
        examen = "Examen completo para solicitar radiografía"
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
            "accion": "derivar_radiografia", "examen_fisico": examen,
        })
        self.comprobar_estado(aid, examen, True, "Derivado a radiografía")
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
            "accion": "guardar_progreso", "examen_fisico": "Ampliación del examen físico",
        })
        self.comprobar_estado(aid, "Ampliación del examen físico", True, "Derivado a radiografía")

    def test_acciones_invalidas_y_permisos_no_cambian_evaluacion(self):
        aid = self.crear_atencion()["id"]
        for accion, examen, esperado in (
            ("accion_inexistente", "Examen completo", 422),
            ("derivar_radiografia", "   ", 400),
            ("derivar_radiografia", "Breve", 400),
        ):
            self.peticion("PATCH", f"/atenciones/{aid}/evaluar", esperado=esperado,
                          json={"accion": accion, "examen_fisico": examen})
        for rol in ("Admin", "Enfermera"):
            self.peticion("PATCH", f"/atenciones/{aid}/evaluar", esperado=403, rol=rol,
                          json={"accion": "guardar_progreso", "examen_fisico": "Notas sin permiso"})
        self.comprobar_estado(aid, None, False, "Pendiente de evaluación")

    def test_compatibilidad_con_clientes_sin_campos_nuevos(self):
        datos = {k: v for k, v in self.datos.items()
                 if k not in {"fecha_atencion", "hora_atencion", "motivo_consulta"}}
        creada = self.peticion("POST", "/atenciones/", esperado=201, json=datos)
        for atencion in self.recuperadas(creada["id"]):
            self.assertIsNone(atencion["fecha_atencion"])
            self.assertIsNone(atencion["hora_atencion"])
            self.assertIsNone(atencion["motivo_consulta"])
            self.assertEqual(atencion["sintomas_principales"], datos["sintomas_principales"])

    def test_prioridades_pendientes_conservan_baja_y_excluyen_validados(self):
        aid = self.crear_atencion()["id"]
        diagnostico = Diagnostico(atencion_medica_id=aid, prioridad_final=NivelGravedad.Baja,
                                 estado_validacion=EstadoClinico.PendienteDeValidacion)
        self.db.add(diagnostico)
        self.db.commit()
        esperado = {"Baja": 1, "Moderada": 0, "Alta": 0, "Crítica": 0}
        self.assertEqual(self.peticion("GET", "/diagnosticos/prioridades/pendientes")["conteos"], esperado)
        did = diagnostico.id
        self.peticion("PATCH", f"/diagnosticos/{did}/validar", json={
            "clasificacion_medico": "Sano", "diagnostico_descripcion": "Validación de prueba",
        })
        self.assertEqual(self.peticion("GET", "/diagnosticos/prioridades/pendientes")["conteos"],
                         {k: 0 for k in esperado})
        self.assertEqual(self.peticion("GET", f"/atenciones/{aid}")["paciente_estado_clinico"], "Validado")

    def test_migracion_conserva_datos_y_estados_y_no_deriva_borradores_al_repetirse(self):
        aid = self.crear_atencion()["id"]
        self.db.query(AtencionMedica).filter_by(id=aid).update({"examen_fisico": "Examen histórico"})
        self.db.commit()
        self.db.expunge_all()
        self.conexion.execute(text("ALTER TABLE atenciones_medicas DROP COLUMN derivado_radiografia"))
        migrar(self.conexion)
        self.assertTrue(self.conexion.execute(text(
            "SELECT derivado_radiografia FROM atenciones_medicas WHERE id = :id"
        ), {"id": aid}).scalar_one())
        self.conexion.execute(text(
            "UPDATE atenciones_medicas SET derivado_radiografia = FALSE WHERE id = :id"
        ), {"id": aid})
        migrar(self.conexion)
        for atencion in self.recuperadas(aid):
            self.assertFalse(atencion["derivado_radiografia"])
            self.assertEqual(atencion["paciente_estado_clinico"], "Pendiente de evaluación")
            self.assertEqual(atencion["motivo_consulta"], self.datos["motivo_consulta"])
            self.assertEqual(atencion["fecha_atencion"], self.datos["fecha_atencion"])
            self.assertEqual(atencion["hora_atencion"], "08:17:00")

    def test_migracion_agrega_campos_ausentes_sin_inventar_datos_historicos(self):
        aid = self.crear_atencion()["id"]
        self.db.commit()
        self.db.expunge_all()
        for campo in ("fecha_atencion", "hora_atencion", "motivo_consulta", "derivado_radiografia"):
            self.conexion.execute(text(f"ALTER TABLE atenciones_medicas DROP COLUMN {campo}"))
        migrar(self.conexion)
        migrar(self.conexion)
        for atencion in self.recuperadas(aid):
            self.assertIsNone(atencion["fecha_atencion"])
            self.assertIsNone(atencion["hora_atencion"])
            self.assertIsNone(atencion["motivo_consulta"])
            self.assertFalse(atencion["derivado_radiografia"])
            self.assertEqual(atencion["sintomas_principales"], self.datos["sintomas_principales"])
            self.assertEqual(atencion["paciente_estado_clinico"], "Pendiente de evaluación")
