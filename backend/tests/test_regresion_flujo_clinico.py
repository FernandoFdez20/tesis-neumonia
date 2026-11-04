"""Regresión HTTP real sobre PostgreSQL en un esquema transaccional aislado.

Ejecutar desde backend: python -m unittest discover -s tests -v
Requiere la BD configurada, los pesos locales y una imagen RSNA de prueba.
El rollback elimina el esquema completo y los archivos usan un directorio temporal.
"""
import asyncio
import csv
import json
import os
from pathlib import Path
import tempfile
import unittest
from uuid import uuid4
from unittest.mock import patch
from urllib.parse import urlencode, urlsplit
from types import SimpleNamespace

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.router import api_router
from app.core.database import Base, engine, get_db
from app.core.security import get_password_hash
from app.ml.modelo_manager import inicializar_modelo
from app.modules.auth.models import TipoRol, Usuario


class ClienteASGI:
    """Ejecuta peticiones contra la app sin servidor ni dependencias adicionales."""
    def __init__(self, app):
        self.app = app

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def request(self, metodo, ruta, **datos):
        url = urlsplit(ruta)
        cabeceras = dict(datos.get("headers", {}))
        cuerpo = b""
        if "json" in datos:
            cuerpo = json.dumps(datos["json"]).encode()
            cabeceras["Content-Type"] = "application/json"
        elif "data" in datos:
            cuerpo = urlencode(datos["data"]).encode()
            cabeceras["Content-Type"] = "application/x-www-form-urlencoded"
        elif "files" in datos:
            borde = uuid4().hex
            partes = []
            for campo, (nombre, contenido, tipo) in datos["files"].items():
                partes.append((f'--{borde}\r\nContent-Disposition: form-data; name="{campo}"; '
                               f'filename="{nombre}"\r\nContent-Type: {tipo}\r\n\r\n').encode()
                              + contenido + b"\r\n")
            cuerpo = b"".join(partes) + f"--{borde}--\r\n".encode()
            cabeceras["Content-Type"] = f"multipart/form-data; boundary={borde}"
        cabeceras["Content-Length"] = str(len(cuerpo))
        mensajes = []

        async def ejecutar():
            async def recibir():
                return {"type": "http.request", "body": cuerpo, "more_body": False}

            async def enviar(mensaje):
                mensajes.append(mensaje)

            await self.app({
                "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
                "method": metodo, "scheme": "http", "path": url.path,
                "raw_path": url.path.encode(), "query_string": url.query.encode(),
                "root_path": "", "server": ("testserver", 80), "client": ("127.0.0.1", 1),
                "headers": [(k.lower().encode(), v.encode()) for k, v in cabeceras.items()],
            }, recibir, enviar)

        asyncio.run(ejecutar())
        contenido = b"".join(m.get("body", b"") for m in mensajes if m["type"] == "http.response.body")
        return SimpleNamespace(
            status_code=next(m["status"] for m in mensajes if m["type"] == "http.response.start"),
            text=contenido.decode(), json=lambda: json.loads(contenido),
        )


class RegresionFlujoClinico(unittest.TestCase):
    def test_flujo_con_inferencia_y_permisos(self):
        raiz = Path(__file__).resolve().parents[2]
        dataset = Path(os.getenv("RSNA_DATASET_DIR", str(
            Path.home() / "Downloads" / "rsna-pneumonia-detection-challenge"
        ))) / "stage_2_train_images"
        with (raiz / "modelo/splits/test.csv").open(encoding="utf-8") as archivo:
            casos = list(csv.DictReader(archivo))
        muestras = {
            etiqueta: next((dataset / f"{r['patientId']}.dcm" for r in casos
                            if r["etiqueta"] == etiqueta
                            and (dataset / f"{r['patientId']}.dcm").is_file()), None)
            for etiqueta in ("0", "1")
        }
        if not all(muestras.values()):
            self.skipTest("Faltan imágenes RSNA locales; configurar RSNA_DATASET_DIR")
        inicializar_modelo()
        app = FastAPI()
        app.include_router(api_router, prefix="/api/v1")

        with tempfile.TemporaryDirectory(prefix="regresion_neumonia_") as temporal:
            with engine.connect() as conexion:
                transaccion = conexion.begin()
                try:
                    esquema = f"prueba_ux_{uuid4().hex}"
                    conexion.execute(text(f'CREATE SCHEMA "{esquema}"'))
                    conexion.execute(text(f'SET LOCAL search_path TO "{esquema}"'))
                    Base.metadata.create_all(bind=conexion, checkfirst=False)
                    with Session(bind=conexion, join_transaction_mode="create_savepoint") as db:
                        clave = uuid4().hex
                        for rol in TipoRol:
                            db.add(Usuario(username=rol.value, correo=f"{rol.value.lower()}@example.com",
                                           nombre_completo=f"Prueba {rol.value}", rol=rol,
                                           password=get_password_hash(clave), estado=True))
                        db.commit()

                        def sesion_prueba():
                            yield db

                        app.dependency_overrides[get_db] = sesion_prueba
                        with patch("app.modules.diagnosticos.service.UPLOAD_DIR",
                                   Path(temporal) / "uploads/radiografias"):
                            with ClienteASGI(app) as cliente:
                                def peticion(metodo, ruta, rol=None, esperado=200, **datos):
                                    cabeceras = sesiones.get(rol, {}) if rol else {}
                                    respuesta = cliente.request(metodo, "/api/v1" + ruta,
                                                                headers=cabeceras, **datos)
                                    self.assertEqual(respuesta.status_code, esperado,
                                                     f"{metodo} {ruta}: {respuesta.text[:300]}")
                                    return respuesta.json()

                                sesiones = {}
                                peticion("GET", "/pacientes/", esperado=401)
                                peticion("POST", "/auth/login", esperado=401,
                                         data={"username": "Especialista", "password": "incorrecta"})
                                for rol in TipoRol:
                                    token = peticion("POST", "/auth/login", data={
                                        "username": rol.value, "password": clave
                                    })["access_token"]
                                    sesiones[rol.value] = {"Authorization": f"Bearer {token}"}
                                    peticion("GET", "/auth/me", rol.value)
                                peticion("GET", "/pacientes/", "Admin", esperado=403)
                                peticion("GET", "/usuarios/", "Enfermera", esperado=403)
                                peticion("GET", "/usuarios/", "Admin")

                                paciente = {"dni": "12345678", "nombres_apellidos": "Paciente Prueba UX",
                                            "sexo": "Femenino", "fecha_nacimiento": "1950-01-01"}
                                peticion("POST", "/pacientes/", "Enfermera", esperado=422,
                                         json={**paciente, "fecha_nacimiento": "2020-01-01"})
                                creado = peticion("POST", "/pacientes/", "Enfermera", esperado=201,
                                                 json=paciente)
                                self.assertIsNone(creado["ultima_atencion"])
                                peticion("POST", "/pacientes/", "Enfermera", esperado=400, json=paciente)
                                for etiqueta, muestra in muestras.items():
                                    atencion = peticion("POST", "/atenciones/", "Enfermera", esperado=201,
                                        json={"paciente_id": creado["id"], "temperatura": 38,
                                              "frecuencia_cardiaca": 100, "frecuencia_respiratoria": 32,
                                              "saturacion_o2": 90, "presion_arterial": "85/55",
                                              "tiempo_evolucion_dias": 3, "confusion": True,
                                              "sintomas_principales": "Caso sintético de regresión"})
                                    aid = atencion["id"]
                                    peticion("POST", "/atenciones/", "Enfermera", esperado=400,
                                             json={"paciente_id": creado["id"]})
                                    detalle = peticion("GET", f"/atenciones/{aid}", "Especialista")
                                    self.assertEqual(detalle["presion_arterial"], "85/55")
                                    self.assertEqual(detalle["paciente_estado_clinico"], "Pendiente de evaluación")
                                    self.assertEqual(detalle["crb65_puntaje"], 4)
                                    evaluacion = {"examen_fisico": "Examen sintético para regresión",
                                                  "accion": "derivar_radiografia"}
                                    peticion("PATCH", f"/atenciones/{aid}/evaluar", "Enfermera",
                                             esperado=403, json=evaluacion)
                                    derivada = peticion("PATCH", f"/atenciones/{aid}/evaluar",
                                                       "Especialista", json=evaluacion)
                                    self.assertEqual(derivada["paciente_estado_clinico"], "Derivado a radiografía")
                                    diagnostico = peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias",
                                        "Enfermera", files={"archivo_ap": ("prueba.dcm", muestra.read_bytes(),
                                                                          "application/dicom")})
                                    self.assertEqual(diagnostico["estado_validacion"], "Pendiente de validación")
                                    self.assertIsNotNone(diagnostico["imagenes"][0]["probabilidad_ia"])
                                    esperado = "Crítica" if diagnostico["enfermo"] else "Alta"
                                    self.assertEqual(diagnostico["prioridad_final"], esperado)
                                    did = diagnostico["id"]
                                    peticion("GET", f"/diagnosticos/atenciones/{aid}/diagnostico", "Especialista")
                                    avisos = peticion("GET", "/notificaciones/pendientes", "Especialista")
                                    self.assertTrue(any(n["diagnostico_id"] == did for n in avisos))
                                    validacion = {"clasificacion_medico": "Neumonía" if etiqueta == "1" else "Sano",
                                                  "diagnostico_descripcion": "Validación sintética de regresión"}
                                    peticion("PATCH", f"/diagnosticos/{did}/validar", "Enfermera",
                                             esperado=403, json=validacion)
                                    final = peticion("PATCH", f"/diagnosticos/{did}/validar", "Especialista", json=validacion)
                                    self.assertEqual(final["estado_validacion"], "Validado")
                                    self.assertEqual(final["enfermo"], diagnostico["enfermo"])
                                    peticion("PATCH", f"/diagnosticos/{did}/validar", "Especialista",
                                             esperado=400, json=validacion)
                                    cerrado = peticion("GET", f"/atenciones/{aid}", "Especialista")
                                    self.assertEqual(cerrado["estado"], "Finalizada")
                                    datos = peticion("GET", f"/pacientes/{creado['id']}", "Especialista")
                                    self.assertFalse(datos["en_atencion"])
                                    self.assertIsNotNone(datos["ultima_atencion"])
                                    listado = peticion("GET", "/pacientes/", "Especialista")
                                    self.assertEqual(listado["items"][0]["ultima_atencion"], datos["ultima_atencion"])
                                    avisos = peticion("GET", "/notificaciones/pendientes", "Especialista")
                                    self.assertFalse(any(n["diagnostico_id"] == did for n in avisos))
                                historial = peticion("GET", f"/atenciones/paciente/{creado['id']}", "Especialista")
                                self.assertEqual(len(historial), 2)
                                self.assertTrue(all(a["presion_arterial"] == "85/55" for a in historial))
                finally:
                    app.dependency_overrides.clear()
                    transaccion.rollback()
