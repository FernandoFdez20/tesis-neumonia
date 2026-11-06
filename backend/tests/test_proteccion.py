"""Escenarios adversos HTTP/BD aislada; no modifica datos de demostración."""
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from app.core.archivos import _usuario_activo, ArchivosConSesion
from app.modules.auth.models import Usuario, TipoRol
from app.modules.usuarios.models import UsuarioPermisoOverride
from app.modules.diagnosticos.models import Diagnostico
from app.modules.pacientes.models import EstadoClinico
from app.modules.atenciones.models import AtencionMedica
import test_adecuacion_funcional as adecuacion


class Proteccion(unittest.TestCase):
    setUp = adecuacion.AdecuacionFuncional.setUp
    peticion = adecuacion.AdecuacionFuncional.peticion
    crear_atencion = adecuacion.AdecuacionFuncional.crear_atencion

    def test_rangos_y_coherencia_rechazados_sin_crear_atencion(self):
        limites = {"temperatura": (30, 45), "frecuencia_cardiaca": (20, 240),
                   "frecuencia_respiratoria": (5, 80), "saturacion_o2": (50, 100),
                   "tiempo_evolucion_dias": (0, 90), "presion_sistolica": (50, 300),
                   "presion_diastolica": (30, 200)}
        for campo, (minimo, maximo) in limites.items():
            for valor in (minimo - 1, maximo + 1):
                with self.subTest(campo=campo, valor=valor):
                    self.peticion("POST", "/atenciones/", esperado=422,
                                  json={**self.datos, campo: valor})
        for presion in ("80/120", "120/120", "texto", "120", "301/80", "120/29"):
            self.peticion("POST", "/atenciones/", esperado=422,
                          json={**self.datos, "presion_arterial": presion})
        self.peticion("POST", "/atenciones/", esperado=422,
                      json={**self.datos, "presion_sistolica": 130})
        self.peticion("POST", "/atenciones/", esperado=422,
                      json={**self.datos, "estado": "Finalizada"})
        self.assertEqual(self.db.query(AtencionMedica).count(), 0)
        self.assertFalse(self.peticion("GET", f"/pacientes/{self.paciente['id']}")["en_atencion"])

    def test_caso_cerrado_no_admite_evaluacion_carga_ni_revalidacion(self):
        aid = self.crear_atencion()["id"]
        diag = Diagnostico(atencion_medica_id=aid, estado_validacion=EstadoClinico.Validado,
                           diagnostico_descripcion="Validación original")
        self.db.add(diag)
        self.db.query(AtencionMedica).filter_by(id=aid).update({"estado": "Finalizada"})
        self.db.commit()
        did = diag.id
        for accion in ("guardar_progreso", "derivar_radiografia"):
            self.peticion("PATCH", f"/atenciones/{aid}/evaluar", esperado=400,
                          json={"accion": accion, "examen_fisico": "Intento de modificación"})
        self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=400,
                      files={"archivo_ap": ("prueba.dcm", b"corrupto", "application/dicom")})
        self.peticion("PATCH", f"/diagnosticos/{did}/validar", esperado=400,
                      json={"clasificacion_medico": "Sano", "diagnostico_descripcion": "Reemplazo"})
        self.db.expire_all()
        self.assertEqual(self.db.get(Diagnostico, did).diagnostico_descripcion, "Validación original")
        self.assertIsNone(self.db.get(AtencionMedica, aid).examen_fisico)

    def test_archivo_corrupto_no_crea_diagnostico_y_conserva_el_existente(self):
        aid = self.crear_atencion()["id"]
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
            "accion": "derivar_radiografia", "examen_fisico": "Examen completo de prueba"})
        with tempfile.TemporaryDirectory() as tmp, patch(
            "app.modules.diagnosticos.service.UPLOAD_DIR", Path(tmp) / "radiografias"
        ):
            for nombre, esperado in (("archivo.txt", 400), ("archivo.png", 400), ("archivo.dcm", 422)):
                self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=esperado,
                              files={"archivo_ap": (nombre, b"archivo corrupto", "application/dicom")})
                self.assertEqual(self.db.query(Diagnostico).count(), 0)
                self.assertEqual(list(Path(tmp).rglob("*")), [])
            diag = Diagnostico(atencion_medica_id=aid, estado_validacion=EstadoClinico.PendienteDeValidacion,
                               diagnostico_descripcion="Resultado previo")
            self.db.add(diag)
            self.db.commit()
            archivo = Path(tmp) / "radiografias" / str(aid) / "anterior.dcm"
            archivo.parent.mkdir(parents=True)
            archivo.write_bytes(b"contenido anterior conservado")
            self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=400,
                          files={"archivo_ap": ("nuevo.dcm", b"corrupto", "application/dicom")})
            self.assertEqual(archivo.read_bytes(), b"contenido anterior conservado")
            self.assertEqual(diag.diagnostico_descripcion, "Resultado previo")

    def test_permiso_revocado_bloquea_api_y_archivos_con_token_vigente(self):
        aid = self.crear_atencion()["id"]
        usuario = self.db.query(Usuario).filter_by(rol=TipoRol.Especialista).one()
        token = self.sesiones["Especialista"]["Authorization"].split()[1]
        for permiso in ("atenciones.examen_fisico", "radiografias.cargar", "resultados.ver", "historial.ver"):
            self.db.add(UsuarioPermisoOverride(usuario_id=usuario.id, permiso=permiso, concede=False))
        self.db.commit()
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", esperado=403,
                      json={"accion": "guardar_progreso", "examen_fisico": "Notas"})
        self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=403,
                      files={"archivo_ap": ("prueba.dcm", b"corrupto", "application/dicom")})
        with patch("app.core.archivos.SessionLocal", return_value=self.db), patch.object(self.db, "close"):
            self.assertEqual(_usuario_activo(token)[:2], (False, 403))
            admin = self.sesiones["Admin"]["Authorization"].split()[1]
            self.assertEqual(_usuario_activo(admin)[:2], (False, 403))
            enfermera = self.sesiones["Enfermera"]["Authorization"].split()[1]
            self.assertTrue(_usuario_activo(enfermera)[0])
            with tempfile.TemporaryDirectory() as tmp:
                Path(tmp, "prueba.txt").write_text("archivo sintetico", encoding="utf-8")
                self.cliente.app.mount("/uploads", ArchivosConSesion(directory=tmp))
                for credencial, esperado in ((token, 403), (admin, 403), (enfermera, 200), ("", 401)):
                    respuesta = self.cliente.request("GET", f"/uploads/prueba.txt?token={credencial}")
                    self.assertEqual(respuesta.status_code, esperado)

    def test_carga_sin_derivacion_rechazada(self):
        aid = self.crear_atencion()["id"]
        self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=400,
                      files={"archivo_ap": ("prueba.dcm", b"corrupto", "application/dicom")})
        self.assertEqual(self.db.query(Diagnostico).count(), 0)

    def test_limite_de_archivo_y_vista_previa_corrupta(self):
        aid = self.crear_atencion()["id"]
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
            "accion": "derivar_radiografia", "examen_fisico": "Examen completo de prueba"})
        for contenido, esperado in ((b"corrupto", 422), (b"x" * (30 * 1024 * 1024 + 1), 413)):
            archivo = ("prueba.dcm", contenido, "application/dicom")
            self.peticion("POST", "/diagnosticos/radiografias/vista-previa", esperado=esperado,
                          files={"archivo": archivo})
            self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=esperado,
                          files={"archivo_ap": archivo})
        self.assertEqual(self.db.query(Diagnostico).count(), 0)

    def test_fallo_de_inferencia_y_segunda_vista_corrupta_no_guardan_resultado_parcial(self):
        from pydicom.dataset import FileDataset, FileMetaDataset
        from pydicom.uid import ExplicitVRLittleEndian, generate_uid
        from pydicom import dcmwrite
        meta = FileMetaDataset()
        meta.TransferSyntaxUID = ExplicitVRLittleEndian
        meta.MediaStorageSOPClassUID = generate_uid()
        meta.MediaStorageSOPInstanceUID = generate_uid()
        ds = FileDataset(None, {}, file_meta=meta, preamble=b"\0" * 128)
        ds.Rows = ds.Columns = 16
        ds.SamplesPerPixel = 1
        ds.PhotometricInterpretation = "MONOCHROME2"
        ds.BitsAllocated = ds.BitsStored = 16
        ds.HighBit = 15
        ds.PixelRepresentation = 0
        ds.PixelData = b"\0\0" * 256
        buffer = BytesIO()
        dcmwrite(buffer, ds, enforce_file_format=True)
        aid = self.crear_atencion()["id"]
        self.peticion("PATCH", f"/atenciones/{aid}/evaluar", json={
            "accion": "derivar_radiografia", "examen_fisico": "Examen completo de prueba"})
        archivo = ("sintetico.dcm", buffer.getvalue(), "application/dicom")
        with tempfile.TemporaryDirectory() as tmp, patch(
            "app.modules.diagnosticos.service.UPLOAD_DIR", Path(tmp) / "radiografias"
        ), patch("app.modules.diagnosticos.service._ejecutar_inferencia", return_value={}):
            self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=503,
                          files={"archivo_ap": archivo})
            self.peticion("POST", f"/diagnosticos/atenciones/{aid}/radiografias", esperado=422,
                          files={"archivo_ap": archivo,
                                 "archivo_pa": ("corrupto.dcm", b"corrupto", "application/dicom")})
            self.assertEqual(list(Path(tmp).rglob("*")), [])
        self.assertEqual(self.db.query(Diagnostico).count(), 0)
