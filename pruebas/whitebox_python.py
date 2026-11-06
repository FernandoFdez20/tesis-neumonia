"""Pruebas dirigidas a decisiones y funciones del código original."""
from pathlib import Path
import sys, json, inspect, dis, itertools, tempfile
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from datetime import date, timedelta
from contextlib import contextmanager
import numpy as np
import torch
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError
import io

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/"backend"))
from app.core.database import engine as original_engine
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.permisos import resolver_permisos, permisos_base
from app.api.deps import requiere_permiso, get_usuario_actual
from app.modules.auth.models import Usuario, TipoRol
from app.modules.auth.service import AuthService
from app.modules.pacientes.schemas import PacienteCreate
from app.modules.pacientes.models import Paciente, EstadoClinico
from app.modules.atenciones.models import AtencionMedica
from app.modules.diagnosticos.crb65_service import calcular_crb65, CRB65Request
from app.modules.diagnosticos.models import Diagnostico
from app.modules.diagnosticos.schemas import DiagnosticoValidacionRequest
from app.modules.diagnosticos.service import DiagnosticoService, _ejecutar_inferencia
from app.modules.notificaciones.service import NotificacionService
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.schemas import UsuarioUpdate, UsuarioCreate
from app.ml.inferencia import (leer_dicom_como_gris, redimensionar, gris_a_rgb,
                               normalizar_imagenet, preprocesar_imagen, etiqueta_de, predecir)

RESULT={"cases":{}, "coverage":[], "limitations":[
    "Cobertura de líneas limitada a las funciones Python seleccionadas.",
    "Las probabilidades controladas de CB-08 prueban la regla de fusión, no el rendimiento clínico del modelo.",
    "Los dobles de CB-01, CB-03 y CB-10 sustituyen repositorios o fallos de almacenamiento para recorrer sus decisiones."
]}
hits={}
def tracer(frame,event,arg):
    if event=="line" and str(ROOT/"backend/app") in frame.f_code.co_filename:
        hits.setdefault(frame.f_code.co_filename,set()).add(frame.f_lineno)
    return tracer
sys.settrace(tracer)

def record(case,name,passed,expected,observed):
    RESULT["cases"].setdefault(case,{"checks":[]})["checks"].append({
        "name":name,"pass":bool(passed),"expected":expected,"observed":observed})

def expected_error(case,name,func,expected):
    try:
        func()
        record(case,name,False,str(expected),"No se produjo rechazo")
    except Exception as e:
        value=e.status_code if isinstance(e,HTTPException) else type(e).__name__
        match=value==expected if isinstance(expected,int) else isinstance(e,expected)
        record(case,name,match,expected.__name__ if isinstance(expected,type) else expected,value)

config=json.loads((OUT/"private_config.json").read_text())
engine=create_engine(original_engine.url,connect_args={"options":"-csearch_path="+config["schema"]})
conn=engine.connect()
outer=conn.begin()
db=Session(bind=conn,join_transaction_mode="create_savepoint")
admin=db.query(Usuario).filter_by(username="qa_admin").one()
nurse=db.query(Usuario).filter_by(username="qa_enfermera").one()
doctor=db.query(Usuario).filter_by(username="qa_especialista").one()
inactive=db.query(Usuario).filter_by(username="qa_inactivo").one()
counter=0
def fixture(gravity="Leve",positive=False):
    global counter
    counter+=1
    p=Paciente(dni=str(91000000+counter),nombres_apellidos="Paciente unitario sintético",
               sexo="Femenino",fecha_nacimiento=date(1980,1,1),en_atencion=True)
    db.add(p);db.flush()
    a=AtencionMedica(paciente_id=p.id,usuario_id=nurse.id,temperatura=37,
                     frecuencia_cardiaca=80,frecuencia_respiratoria=20,
                     saturacion_o2=97,presion_sistolica=120,presion_diastolica=80,
                     sintomas_principales="Datos controlados para prueba unitaria",
                     crb65_puntaje={"Leve":0,"Moderado":1,"Grave":3}.get(gravity),
                     crb65_gravedad=gravity,derivado_radiografia=True)
    db.add(a);db.flush()
    return p,a

try:
    # CB-01 ramas de autenticación y hash.
    hashed=get_password_hash("Clave sintética CB-01")
    second=get_password_hash("Clave sintética CB-01")
    record("CB-01","Contraseña correcta",verify_password("Clave sintética CB-01",hashed),True,True)
    record("CB-01","Contraseña errada",not verify_password("Otra clave",hashed),False,False)
    record("CB-01","Sal distinta por hash",hashed!=second,"Hashes diferentes",hashed!=second)
    record("CB-01","Esquema de almacenamiento",hashed.startswith("$pbkdf2-sha256$"),"PBKDF2-SHA256",hashed.split("$")[1])
    service=AuthService.__new__(AuthService);service.repo=MagicMock()
    service.repo.get_usuario_por_username.return_value=None
    expected_error("CB-01","Usuario inexistente",lambda:service.login("inexistente","clave"),401)
    user=SimpleNamespace(id=44,password=hashed,estado=True)
    service.repo.get_usuario_por_username.return_value=user
    expected_error("CB-01","Usuario con contraseña incorrecta",lambda:service.login("control","errada"),401)
    user.estado=False
    expected_error("CB-01","Usuario inactivo",lambda:service.login("control","Clave sintética CB-01"),400)
    user.estado=True
    logged=service.login("control","Clave sintética CB-01")
    record("CB-01","Rama de acceso correcto",bool(logged["access_token"]) and service.repo.update_ultimo_login.called,
           "Token y actualización del acceso","Ambos ejecutados")

    # CB-02 token firmado y decisiones del control de sesión.
    token=create_access_token(doctor.id)
    record("CB-02","Token válido resuelve la cuenta",get_usuario_actual(db=db,token=token).id==doctor.id,
           doctor.id,doctor.id)
    expected_error("CB-02","Token inválido",lambda:get_usuario_actual(db=db,token="no.es.valido"),403)
    expired=create_access_token(doctor.id,expires_delta=timedelta(seconds=-10))
    expected_error("CB-02","Token expirado",lambda:get_usuario_actual(db=db,token=expired),403)
    expected_error("CB-02","Cuenta inexistente",lambda:get_usuario_actual(db=db,token=create_access_token(9999999)),404)
    expected_error("CB-02","Cuenta inactiva",lambda:get_usuario_actual(db=db,token=create_access_token(inactive.id)),400)

    # CB-03 conjunto efectivo y guardas de permiso.
    for role in TipoRol:
        fake=MagicMock();fake.query.return_value.filter.return_value.all.return_value=[]
        user=SimpleNamespace(id=1,rol=role)
        effective=resolver_permisos(fake,user)
        record("CB-03","Base del rol "+role.value,effective==permisos_base(role),
               sorted(permisos_base(role)),sorted(effective))
    for name,role,overrides,wanted,absent in [
        ("Conceder y revocar",TipoRol.Enfermera,
         [SimpleNamespace(permiso="diagnostico.validar",concede=True),
          SimpleNamespace(permiso="resultados.ver",concede=False)],"diagnostico.validar","resultados.ver"),
        ("Admin excluye permiso clínico concedido",TipoRol.Admin,
         [SimpleNamespace(permiso="pacientes.ver",concede=True)],"usuarios.gestionar","pacientes.ver"),
        ("Clave desconocida ignorada",TipoRol.Enfermera,
         [SimpleNamespace(permiso="clave.inexistente",concede=True)],"pacientes.ver","clave.inexistente"),
    ]:
        fake=MagicMock();fake.query.return_value.filter.return_value.all.return_value=overrides
        e=resolver_permisos(fake,SimpleNamespace(id=1,rol=role))
        record("CB-03",name,wanted in e and absent not in e,{"presente":wanted,"ausente":absent},sorted(e))
    expected_error("CB-03","Catálogo rechaza permiso inexistente",lambda:requiere_permiso("desconocido"),ValueError)
    expected_error("CB-03","Guarda requiere al menos una clave",lambda:requiere_permiso(),ValueError)
    guard=requiere_permiso("diagnostico.validar")
    record("CB-03","Guarda permite especialista",guard(db=db,usuario=doctor).id==doctor.id,"Permitido","Permitido")
    expected_error("CB-03","Guarda deniega enfermería",lambda:guard(db=db,usuario=nurse),403)

    # CB-04 límites de identificación y población.
    base={"dni":"12345678","nombres_apellidos":"Paciente de prueba","sexo":"Femenino","fecha_nacimiento":"1980-01-01"}
    parsed=PacienteCreate(**{**base,"dni":" 12345678 ","nombres_apellidos":" Paciente de prueba "})
    record("CB-04","Limpieza de texto",parsed.dni=="12345678" and parsed.nombres_apellidos=="Paciente de prueba",
           "Texto sin espacios extremos",{"dni":parsed.dni,"nombre":parsed.nombres_apellidos})
    for invalid in ["1234567","123456789","1234ABCD",""]:
        expected_error("CB-04","DNI "+repr(invalid),lambda v=invalid:PacienteCreate(**{**base,"dni":v}),ValidationError)
    cutoff=date.today().replace(year=date.today().year-18)
    for name,birth,valid in [("18 años exactos",cutoff,True),("Menor por un día",cutoff+timedelta(days=1),False),
                             ("Adulto por un día",cutoff-timedelta(days=1),True),("Fecha futura",date.today()+timedelta(days=1),False)]:
        if valid:
            p=PacienteCreate(**{**base,"fecha_nacimiento":birth})
            record("CB-04",name,True,"Aceptado",p.fecha_nacimiento.isoformat())
        else:
            expected_error("CB-04",name,lambda b=birth:PacienteCreate(**{**base,"fecha_nacimiento":b}),ValidationError)
    for field in ["nombres_apellidos","sexo"]:
        expected_error("CB-04","Campo requerido vacío "+field,lambda f=field:PacienteCreate(**{**base,f:"  "}),ValidationError)

    # CB-06 todas las combinaciones lógicas y sus fronteras CRB-65.
    for confusion,resp,pressure,age in itertools.product([False,True],repeat=4):
        req=CRB65Request(confusion=confusion,frecuencia_respiratoria=30 if resp else 29,
                        presion_sistolica=89 if pressure else 90,presion_diastolica=61,
                        edad=65 if age else 64)
        result=calcular_crb65(req);score=sum([confusion,resp,pressure,age])
        expected="Grave" if score>=3 else "Moderado" if score>=1 else "Leve"
        record("CB-06",f"Combinación {int(confusion)}{int(resp)}{int(pressure)}{int(age)}",
               result.puntaje_total==score and result.gravedad==expected,
               {"puntaje":score,"gravedad":expected},{"puntaje":result.puntaje_total,"gravedad":result.gravedad})
    for pas,pad,score in [(90,61,0),(90,60,1),(89,61,1),(89,60,1)]:
        r=calcular_crb65(CRB65Request(confusion=False,frecuencia_respiratoria=29,
                                    presion_sistolica=pas,presion_diastolica=pad,edad=64))
        record("CB-06",f"Frontera de presión {pas}/{pad}",r.puntaje_total==score,score,r.puntaje_total)
    no_age=CRB65Request(confusion=False,frecuencia_respiratoria=20,presion_sistolica=120,presion_diastolica=80)
    record("CB-06","Edad inyectada desde paciente",calcular_crb65(no_age,65).puntaje_total==1,1,1)
    expected_error("CB-06","Ausencia de ambas edades",lambda:calcular_crb65(no_age),ValueError)

    # CB-07 transformaciones e inferencia matemática con entradas controladas.
    with tempfile.TemporaryDirectory(prefix="cb_ml_",dir=OUT) as temp:
        folder=Path(temp).resolve();assert folder.is_relative_to(OUT.resolve())
        def dicom(name,array,photo):
            meta=FileMetaDataset();meta.TransferSyntaxUID=ExplicitVRLittleEndian
            meta.MediaStorageSOPClassUID="1.2.840.10008.5.1.4.1.1.7";meta.MediaStorageSOPInstanceUID="1.2.826.0.1.3680043.8.498.123456"
            ds=FileDataset(str(folder/name),{},file_meta=meta,preamble=b"\0"*128)
            ds.Rows,ds.Columns=array.shape;ds.SamplesPerPixel=1;ds.PhotometricInterpretation=photo
            ds.BitsAllocated=array.dtype.itemsize*8;ds.BitsStored=ds.BitsAllocated
            ds.HighBit=ds.BitsStored-1;ds.PixelRepresentation=0;ds.PixelData=array.tobytes()
            ds.save_as(folder/name,enforce_file_format=True);return folder/name
        a8=np.array([[0,64],[128,255]],dtype=np.uint8)
        f2=dicom("mono2.dcm",a8,"MONOCHROME2");f1=dicom("mono1.dcm",a8,"MONOCHROME1")
        g2,_=leer_dicom_como_gris(f2);g1,_=leer_dicom_como_gris(f1)
        record("CB-07","MONOCHROME2",np.array_equal(g2,a8),a8.tolist(),g2.tolist())
        record("CB-07","MONOCHROME1",np.array_equal(g1,255-a8),(255-a8).tolist(),g1.tolist())
        a16=np.array([[0,512],[1024,4095]],dtype=np.uint16)
        g16,_=leer_dicom_como_gris(dicom("16bits.dcm",a16,"MONOCHROME2"))
        record("CB-07","Escalado de 16 bits",g16.min()==0 and g16.max()==255,"Extremos 0 y 255",[int(g16.min()),int(g16.max())])
        resized=redimensionar(g2);rgb=gris_a_rgb(resized);arr,_=preprocesar_imagen(f2)
        record("CB-07","Forma y tipo de entrada",arr.shape==(3,224,224) and arr.dtype==np.float32 and np.isfinite(arr).all(),
               "(3,224,224), float32 y finito",{"shape":list(arr.shape),"dtype":str(arr.dtype)})
        record("CB-07","Replicación de gris",np.array_equal(rgb[0],rgb[1]) and np.array_equal(rgb[1],rgb[2]),
               "Tres canales iguales antes de normalizar","Iguales")
        expected=(rgb-np.array([.485,.456,.406],dtype=np.float32)[:,None,None])/np.array([.229,.224,.225],dtype=np.float32)[:,None,None]
        record("CB-07","Normalización ImageNet",np.allclose(arr,expected),"Media y desviación de ImageNet","Coincidente")
        for value,label in [(0,0),(.499999,0),(.5,1),(.500001,1),(1,1)]:
            record("CB-07","Umbral "+str(value),etiqueta_de(value)==label,label,etiqueta_de(value))
        class ControlledModel(torch.nn.Module):
            def forward(self,x):
                return torch.zeros((x.shape[0],1))
        value=predecir(ControlledModel(),arr)
        record("CB-07","Sigmoide del logit cero",value==.5,.5,value)
        with patch("app.modules.diagnosticos.service.get_modelo",return_value=object()), \
             patch("app.modules.diagnosticos.service.preprocesar_imagen",side_effect=RuntimeError("Fallo controlado")):
            r=_ejecutar_inferencia(f2,f1)
            record("CB-07","Fallos independientes AP y PA",r=={},"Diccionario sin resultados",r)

    SAMPLE_BYTES=Path(json.loads((OUT/"samples.json").read_text())["1_AP"]["file"]).read_bytes()

    # CB-08 regla de fusión con probabilidades explícitamente simuladas.
    with tempfile.TemporaryDirectory(prefix="cb_fusion_",dir=OUT) as temp:
        folder=Path(temp).resolve();assert folder.is_relative_to(OUT.resolve())
        expected_matrix={("Leve",False):"Baja",("Leve",True):"Moderada",
                         ("Moderado",False):"Moderada",("Moderado",True):"Alta",
                         ("Grave",False):"Alta",("Grave",True):"Crítica"}
        for (gravity,positive),priority in expected_matrix.items():
            p,a=fixture(gravity)
            values={"AP":.1,"PA":.9 if positive else .2}
            with patch("app.modules.diagnosticos.service.UPLOAD_DIR",folder/"uploads/radiografias"), \
                 patch("app.modules.diagnosticos.service._ejecutar_inferencia",return_value=values):
                dg=DiagnosticoService(db).cargar_radiografias(a.id,
                     UploadFile(file=io.BytesIO(SAMPLE_BYTES),filename="ap.dcm"),
                     UploadFile(file=io.BytesIO(SAMPLE_BYTES),filename="pa.dcm"))
            ref=next(i for i in dg.imagenes if i.id==dg.imagen_referencia_id)
            observed={"priority":dg.prioridad_final.value,"vista":ref.tipo_vista,
                      "probabilidad":float(ref.probabilidad_ia),"confianza":float(ref.confianza_radiografica)}
            record("CB-08",gravity+(" positivo" if positive else " negativo"),
                   dg.prioridad_final.value==priority and ref.tipo_vista=="PA" and abs(float(ref.probabilidad_ia)-values["PA"])<1e-6,
                   {"prioridad":priority,"referencia":"PA","probabilidad":values["PA"]},observed)
        expected_error("CB-08","Ausencia de archivos",lambda:DiagnosticoService(db).cargar_radiografias(999,None,None),400)
        expected_error("CB-08","Atención inexistente",lambda:DiagnosticoService(db).cargar_radiografias(9999999,UploadFile(file=io.BytesIO(b"x"),filename="a.bin"),None),404)

    # CB-09 concordancia, conservación y guardas de validación.
    for ia in [False,True]:
        for classification in ["Neumonía","Sano","Otro diagnóstico"]:
            p,a=fixture()
            dg=Diagnostico(atencion_medica_id=a.id,enfermo=ia,estado_validacion=EstadoClinico.PendienteDeValidacion)
            db.add(dg);db.flush()
            payload=DiagnosticoValidacionRequest(clasificacion_medico=classification,diagnostico_descripcion="Validación unitaria sintética.")
            result=DiagnosticoService(db).validar_diagnostico(dg.id,payload,doctor)
            expected="Confirmado" if (classification=="Neumonía")==ia else "Corregido"
            record("CB-09",str(ia)+" y "+classification,
                   result.enfermo==ia and result.concordancia_ia==expected and not p.en_atencion and a.estado=="Finalizada",
                   {"IA":ia,"concordancia":expected,"atención":"Finalizada"},
                   {"IA":result.enfermo,"concordancia":result.concordancia_ia,"atención":str(a.estado)})
    expected_error("CB-09","Segunda validación",lambda:DiagnosticoService(db).validar_diagnostico(dg.id,payload,doctor),400)
    expected_error("CB-09","Validación sin permiso",lambda:DiagnosticoService(db).validar_diagnostico(dg.id,payload,nurse),403)
    expected_error("CB-09","Diagnóstico inexistente",lambda:DiagnosticoService(db).validar_diagnostico(9999999,payload,doctor),404)

    # CB-10 sincronización de alertas y tolerancia al fallo del repositorio.
    scenarios=[
        ("Nueva Alta","Alta",None,"crear"),
        ("Nueva Crítica","Crítica",None,"crear"),
        ("Baja sin aviso","Baja",None,None),
        ("Moderada sin aviso","Moderada",None,None),
        ("Reabrir cierre manual","Alta",SimpleNamespace(cerrada=True,motivo_cierre="manual",prioridad="Alta"),"reabrir"),
        ("Conservar cierre validado","Alta",SimpleNamespace(cerrada=True,motivo_cierre="validacion",prioridad="Alta"),None),
        ("Actualizar prioridad","Crítica",SimpleNamespace(cerrada=False,motivo_cierre=None,prioridad="Alta"),"guardar"),
        ("No duplicar prioridad","Alta",SimpleNamespace(cerrada=False,motivo_cierre=None,prioridad="Alta"),None),
        ("Cerrar por disminución","Baja",SimpleNamespace(cerrada=False,motivo_cierre=None,prioridad="Alta"),"cerrar"),
    ]
    for name,priority,existing,operation in scenarios:
        service=NotificacionService.__new__(NotificacionService);service.repo=MagicMock()
        service.repo.por_diagnostico.return_value=existing
        service.asegurar_para_diagnostico(1,priority,"Mensaje de prueba")
        called=[op for op in ["crear","reabrir","guardar","cerrar"] if getattr(service.repo,op).called]
        record("CB-10",name,called==([operation] if operation else []),[operation] if operation else [],called)
    service=NotificacionService.__new__(NotificacionService);service.repo=MagicMock()
    service.repo.por_diagnostico.side_effect=RuntimeError("Fallo simulado de almacenamiento")
    try:
        service.asegurar_para_diagnostico(1,"Alta","Prueba")
        service.cerrar_por_validacion(1)
        record("CB-10","Fallo de alertas no interrumpe el caso",True,"Sin excepción propagada","Sin excepción")
    except Exception as e:
        record("CB-10","Fallo de alertas no interrumpe el caso",False,"Sin excepción",type(e).__name__)
    for existing,expected in [(None,False),(SimpleNamespace(cerrada=True),False),(SimpleNamespace(cerrada=False),True)]:
        service=NotificacionService.__new__(NotificacionService);service.repo=MagicMock()
        service.repo.por_diagnostico.return_value=existing
        service.cerrar_por_validacion(1)
        record("CB-10","Cierre validación "+str(existing),service.repo.cerrar.called==expected,expected,service.repo.cerrar.called)

    # CB-11 salvaguardas administrativas.
    us=UsuarioService(db)
    expected_error("CB-11","No cambiar el propio rol",lambda:us.actualizar(admin.id,UsuarioUpdate(rol=TipoRol.Enfermera),admin),400)
    expected_error("CB-11","No suspender la propia cuenta",lambda:us.actualizar(admin.id,UsuarioUpdate(estado=False),admin),400)
    expected_error("CB-11","Conservar el último administrador activo",
                   lambda:us.actualizar(admin.id,UsuarioUpdate(rol=TipoRol.Enfermera),SimpleNamespace(id=9999999)),400)
    expected_error("CB-11","Usuario de actualización inexistente",
                   lambda:us.actualizar(9999999,UsuarioUpdate(nombre_completo="Prueba"),admin),404)
    expected_error("CB-11","Permiso fuera del catálogo",lambda:us.asignar_permisos(nurse.id,["no.existe"]),400)
    expected_error("CB-11","Permisos clínicos bloqueados a Admin",lambda:us.asignar_permisos(admin.id,["usuarios.gestionar","pacientes.ver"]),400)
    expected_error("CB-11","Reasignación a cuenta inexistente",lambda:us.resetear_password(9999999,"Clave unitaria sintética"),404)
    record("CB-11","Edición sin cambios",us.actualizar(admin.id,UsuarioUpdate(),admin).id==admin.id,admin.id,admin.id)

finally:
    sys.settrace(None)
    targets=[
        get_password_hash,verify_password,create_access_token,AuthService.login,
        resolver_permisos,requiere_permiso,get_usuario_actual,
        PacienteCreate.validar_dni,PacienteCreate.validar_paciente_adulto,
        calcular_crb65,leer_dicom_como_gris,redimensionar,gris_a_rgb,normalizar_imagenet,
        preprocesar_imagen,etiqueta_de,predecir,_ejecutar_inferencia,
        DiagnosticoService.cargar_radiografias,DiagnosticoService.validar_diagnostico,
        NotificacionService.asegurar_para_diagnostico,NotificacionService.cerrar_por_validacion,
        UsuarioService.actualizar,UsuarioService.asignar_permisos,
    ]
    for fn in targets:
        code=fn.__func__.__code__ if hasattr(fn,"__func__") else fn.__code__
        lines={line for _,line in dis.findlinestarts(code) if line and line!=code.co_firstlineno}
        executed=hits.get(code.co_filename,set()) & lines
        RESULT["coverage"].append({
            "function":fn.__qualname__,"file":str(Path(code.co_filename).relative_to(ROOT)).replace("\\","/"),
            "line":code.co_firstlineno,"eligible_lines":len(lines),"executed_lines":len(executed),
            "percent":round(len(executed)/len(lines)*100,2) if lines else 100,
            "not_executed":sorted(lines-executed),
        })
    db.close();outer.rollback();conn.close();engine.dispose()
    (OUT/"whitebox_python_results.json").write_text(json.dumps(RESULT,ensure_ascii=False,indent=2,default=str),encoding="utf-8")
    print(json.dumps({k:{"checks":len(v["checks"]),"passed":sum(x["pass"] for x in v["checks"]),
                         "failed":sum(not x["pass"] for x in v["checks"])} for k,v in RESULT["cases"].items()},ensure_ascii=False,indent=2))
