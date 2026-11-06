from pathlib import Path
import sys, json, time, secrets
from datetime import datetime, timezone, timedelta, date
import urllib.request, urllib.error, urllib.parse
from uuid import uuid4
from PIL import Image
import io

OUT = Path(__file__).resolve().parent
CONFIG = json.loads((OUT/"private_config.json").read_text())
SAMPLES = json.loads((OUT/"samples.json").read_text())
BASE = "http://127.0.0.1:8093"
RUN = {"started": datetime.now(timezone(timedelta(hours=-5))).isoformat(), "cases": {}, "http": []}
SESSIONS = {}
COUNTER = 0
CASES = {}
class LocalClient:
    def __init__(self, base_url, timeout=90):
        self.base_url, self.timeout = base_url, timeout
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    def request(self, method, path, **kwargs):
        headers = dict(kwargs.get("headers",{}))
        data = None
        if "json" in kwargs:
            data = json.dumps(kwargs["json"]).encode()
            headers["Content-Type"] = "application/json"
        elif "data" in kwargs:
            data = urllib.parse.urlencode(kwargs["data"]).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        elif "files" in kwargs:
            boundary = uuid4().hex
            parts = []
            for field,(name,content,mime) in kwargs["files"].items():
                parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode()+content+b"\r\n")
            data = b"".join(parts)+f"--{boundary}--\r\n".encode()
            headers["Content-Type"] = "multipart/form-data; boundary="+boundary
        req = urllib.request.Request(self.base_url+path,data=data,headers=headers,method=method)
        try:
            response = self.opener.open(req,timeout=self.timeout)
        except urllib.error.HTTPError as e:
            response = e
        return LocalResponse(response)
    def get(self,path,**kwargs):
        return self.request("GET",path,**kwargs)
    def close(self):
        pass
    def __enter__(self):
        return self
    def __exit__(self,*args):
        self.close()
class LocalResponse:
    def __init__(self,response):
        self.status_code = response.code
        self.headers = response.headers
        self.content = response.read()
        response.close()
        self.text = self.content.decode("utf-8",errors="replace")
    def json(self):
        return json.loads(self.content)
CLIENT = LocalClient(base_url=BASE, timeout=90)

def save():
    RUN["finished"] = datetime.now(timezone(timedelta(hours=-5))).isoformat()
    (OUT/"blackbox_api_results.json").write_text(json.dumps(RUN,ensure_ascii=False,indent=2,default=str),encoding="utf-8")
    (OUT/"test_cases_created.json").write_text(json.dumps(CASES,ensure_ascii=False,indent=2),encoding="utf-8")

def check(case, name, condition, expected, observed):
    item = RUN["cases"].setdefault(case, {"checks":[]})
    item["checks"].append({"name":name, "pass":bool(condition),"expected":expected,"observed":observed})
    save()

def request(method, route, role="Enfermera", **kw):
    headers = dict(kw.pop("headers", {}))
    if role in SESSIONS:
        headers["Authorization"] = "Bearer "+SESSIONS[role]
    started = time.perf_counter()
    r = CLIENT.request(method,"/api/v1"+route if route.startswith("/") and not route.startswith("/uploads") else route,headers=headers,**kw)
    elapsed = round((time.perf_counter()-started)*1000,2)
    route_safe = route.split("?")[0] + ("?token=[omitido]" if "?token=" in route else "")
    RUN["http"].append({"method":method,"route":route_safe,"role":role,"status":r.status_code,"ms":elapsed})
    return r

def body(r):
    try: return r.json()
    except ValueError: return {"bytes":len(r.content)}

def status(case,name,r,expected):
    check(case,name,r.status_code==expected,expected,{"status":r.status_code,"body":body(r) if r.status_code>=400 else "Respuesta recibida"})

def login(username,password):
    return request("POST","/auth/login",role=None,data={"username":username,"password":password})

def patient(name="Paciente de evaluación", birth="1980-01-01", **extra):
    global COUNTER
    COUNTER += 1
    data={"dni":str(81000000+COUNTER),"nombres_apellidos":name,
          "sexo":"Femenino","fecha_nacimiento":birth,**extra}
    r=request("POST","/pacientes/",json=data)
    if r.status_code != 201: raise RuntimeError(f"Preparación de paciente: {r.status_code}")
    return r.json()

def attention(p, grade=0, **extra):
    data={"paciente_id":p["id"],"temperatura":37.0,"frecuencia_cardiaca":80,
          "frecuencia_respiratoria":20 if grade==0 else 32,
          "saturacion_o2":97,"presion_arterial":"85/55" if grade>=3 else "120/80",
          "tiempo_evolucion_dias":3,"confusion":grade>=3,
          "sintomas_principales":"Evaluación sintética sin identidad clínica real",**extra}
    r=request("POST","/atenciones/",json=data)
    if r.status_code!=201: raise RuntimeError(f"Preparación de atención: {r.status_code} {r.text[:250]}")
    return r.json()

def evaluate(a, action="derivar_radiografia", text="Examen físico sintético para evaluación funcional"):
    return request("PATCH",f"/atenciones/{a['id']}/evaluar",role="Especialista",
                   json={"accion":action,"examen_fisico":text})

def upload(a, sample="1_AP", both=False):
    files={"archivo_ap":("evaluacion_AP.dcm",Path(SAMPLES[sample]["file"]).read_bytes(),"application/dicom")}
    if both:
        files["archivo_pa"]=("evaluacion_PA.dcm",Path(SAMPLES["0_PA"]["file"]).read_bytes(),"application/dicom")
    return request("POST",f"/diagnosticos/atenciones/{a['id']}/radiografias",files=files)

def validate(d, classification="Neumonía", role="Especialista"):
    return request("PATCH",f"/diagnosticos/{d['id']}/validar",role=role,
                   json={"clasificacion_medico":classification,
                         "diagnostico_descripcion":"Conclusión sintética registrada únicamente para pruebas."})

try:
    # CN-01
    for role in ["Admin","Enfermera","Especialista"]:
        r=login("qa_"+{"Admin":"admin","Enfermera":"enfermera","Especialista":"especialista"}[role],CONFIG["password"])
        status("CN-01","Acceso de "+role,r,200)
        SESSIONS[role]=r.json()["access_token"]
        check("CN-01","Hash no expuesto para "+role,
              "password" not in r.json()["usuario"],"Sin campo password",list(r.json()["usuario"]))
    bad=login("qa_especialista","clave_errada_de_prueba")
    absent=login("qa_no_existe","clave_errada_de_prueba")
    status("CN-01","Contraseña incorrecta",bad,401)
    status("CN-01","Usuario inexistente",absent,401)
    check("CN-01","Mensaje genérico",body(bad)==body(absent),body(bad),body(absent))
    status("CN-01","Cuenta inactiva",login("qa_inactivo",CONFIG["password"]),400)

    # CN-02
    for route in ["/pacientes/","/atenciones/","/usuarios/","/notificaciones/pendientes",
                  "/diagnosticos/prioridades/pendientes","/auth/me"]:
        status("CN-02","Sin sesión "+route,request("GET",route,role=None),401)
    status("CN-02","Administrador sin acceso a pacientes",request("GET","/pacientes/",role="Admin"),403)
    status("CN-02","Enfermería sin gestión de usuarios",request("GET","/usuarios/"),403)
    status("CN-02","Token inválido",request("GET","/pacientes/",role=None,headers={"Authorization":"Bearer no.es.jwt"}),403)
    bad_token=SESSIONS["Especialista"][:-8]+"AAAAAAAA"
    status("CN-02","Token con firma alterada",request("GET","/pacientes/",role=None,headers={"Authorization":"Bearer "+bad_token}),403)

    # CN-03
    p=patient("Paciente QA con antecedentes",birth="1960-02-02",
              antecedentes_familiares="asma, diabetes",otros_antecedentes="hipertensión")
    CASES["patient"]=p
    check("CN-03","Registro adulto y antecedentes",p["antecedentes_familiares"]=="asma, diabetes"
          and p["otros_antecedentes"]=="hipertensión", "Antecedentes conservados",p)
    data={"dni":p["dni"],"nombres_apellidos":p["nombres_apellidos"],"sexo":"Femenino","fecha_nacimiento":"1960-02-02"}
    status("CN-03","DNI duplicado",request("POST","/pacientes/",json=data),400)
    for dni in ["1234567","123456789","12AB5678"]:
        status("CN-03","DNI inválido "+dni,request("POST","/pacientes/",json={**data,"dni":dni}),422)
    today=date.today()
    for desc,birth in [("Menor de edad",today.replace(year=today.year-17).isoformat()),
                       ("Fecha futura",today.replace(year=today.year+1).isoformat())]:
        COUNTER+=1
        status("CN-03",desc,request("POST","/pacientes/",json={**data,"dni":str(81000000+COUNTER),"fecha_nacimiento":birth}),422)
    adult=patient("Paciente QA límite 18",today.replace(year=today.year-18).isoformat())
    check("CN-03","Límite adulto de 18 años",adult["id"]>0,"Registro permitido",adult["fecha_nacimiento"])
    detail=request("GET",f"/pacientes/dni/{p['dni']}").json()
    check("CN-03","Recuperación por DNI",detail["id"]==p["id"],p["id"],detail["id"])

    # CN-04
    a=attention(p,grade=1)
    CASES["initial_attention"]=a
    r=request("GET",f"/atenciones/{a['id']}",role="Especialista")
    d=r.json()
    check("CN-04","Presión serializada y CRB-65",d["presion_arterial"]=="120/80" and d["crb65_puntaje"]==2,
          {"presion":"120/80","crb65":2},{"presion":d["presion_arterial"],"crb65":d["crb65_puntaje"]})
    status("CN-04","Atención activa duplicada",request("POST","/atenciones/",json={"paciente_id":p["id"]}),400)
    for desc,invalid in [("Temperatura fuera de rango",{"temperatura":49}),
                         ("Saturación superior a 100",{"saturacion_o2":101}),
                         ("Sistólica menor que diastólica",{"presion_arterial":"80/120"})]:
        pi=patient("Paciente QA validación")
        r=request("POST","/atenciones/",json={"paciente_id":pi["id"],"temperatura":37,
                  "frecuencia_cardiaca":80,"frecuencia_respiratoria":20,"saturacion_o2":97,
                  "presion_arterial":"120/80",**invalid})
        check("CN-04",desc,r.status_code in [400,422],"Rechazo 400/422",
              {"status":r.status_code,"valores_recibidos":{k:body(r).get(k) for k in invalid}})

    # CN-05
    denied=request("PATCH",f"/atenciones/{a['id']}/evaluar",
                   json={"accion":"derivar_radiografia","examen_fisico":"Evaluación sintética suficiente"})
    status("CN-05","Derivación exige permiso de especialista",denied,403)
    saved=evaluate(a,action="guardar_progreso")
    status("CN-05","Guardar progreso",saved,200)
    state=saved.json()["paciente_estado_clinico"]
    check("CN-05","Guardar progreso mantiene la evaluación pendiente",
          state=="Pendiente de evaluación","Pendiente de evaluación",state)
    derived=evaluate(a)
    check("CN-05","Derivación explícita",derived.status_code==200 and derived.json()["paciente_estado_clinico"]=="Derivado a radiografía",
          "Derivado a radiografía",body(derived).get("paciente_estado_clinico"))

    # CN-06
    r=upload(a,both=True)
    status("CN-06","Carga AP y PA con modelo real",r,200)
    dg=r.json()
    CASES["two_view_diagnosis"]=dg
    imgs=dg["imagenes"]
    check("CN-06","Dos resultados independientes",len(imgs)==2 and all(i["probabilidad_ia"] is not None for i in imgs),
          "Dos vistas con probabilidad",[{k:i[k] for k in ["tipo_vista","probabilidad_ia","confianza_radiografica","hallazgo_positivo"]} for i in imgs])
    ref=max(imgs,key=lambda i:float(i["probabilidad_ia"]))
    check("CN-06","Referencia por mayor probabilidad",dg["imagen_referencia_id"]==ref["id"],ref["id"],dg["imagen_referencia_id"])
    for img in imgs:
        prob=float(img["probabilidad_ia"])
        check("CN-06","Consistencia probabilidad confianza "+img["tipo_vista"],
              img["hallazgo_positivo"]==(prob>=0.5) and abs(float(img["confianza_radiografica"])-round(max(prob,1-prob)*100,2))<0.02,
              "Umbral 0.50 y confianza de clase",{"p":prob,"confianza":img["confianza_radiografica"],"positivo":img["hallazgo_positivo"]})
    preview=request("POST","/diagnosticos/radiografias/vista-previa",
                    files={"archivo":("valida.dcm",Path(SAMPLES["1_AP"]["file"]).read_bytes(),"application/dicom")})
    check("CN-06","Vista previa DICOM",preview.status_code==200 and preview.headers.get("content-type")=="image/png",
          "PNG 200",{"status":preview.status_code,"content_type":preview.headers.get("content-type"),"bytes":len(preview.content)})
    CASES["inference_ms"]=[h["ms"] for h in RUN["http"] if "radiografias" in h["route"] and "vista-previa" not in h["route"] and h["method"]=="POST"]

    # CN-07
    pi=patient("Paciente QA archivos inválidos")
    ai=attention(pi)
    evaluate(ai)
    status("CN-07","Carga sin archivos",request("POST",f"/diagnosticos/atenciones/{ai['id']}/radiografias"),400)
    for filename,content,mime in [("texto.txt",b"No es una radiografia","text/plain"),
                                  ("corrupta.dcm",b"DICOM corrupto","application/dicom")]:
        prev=request("POST","/diagnosticos/radiografias/vista-previa",files={"archivo":(filename,content,mime)})
        check("CN-07","Rechazo en vista previa "+filename,prev.status_code in [400,422],
              "400/422",{"status":prev.status_code,"detail":body(prev)})
        up=request("POST",f"/diagnosticos/atenciones/{ai['id']}/radiografias",files={"archivo_ap":(filename,content,mime)})
        check("CN-07","Rechazo en análisis "+filename,up.status_code in [400,422],
              "400/422 sin diagnóstico nuevo",{"status":up.status_code,"estado":body(up).get("estado_validacion"),
              "probabilidades":[i.get("probabilidad_ia") for i in body(up).get("imagenes",[])]})
    buffer=io.BytesIO();Image.new("L",(224,224),120).save(buffer,format="PNG")
    png=request("POST",f"/diagnosticos/atenciones/{ai['id']}/radiografias",
                files={"archivo_ap":("gris.png",buffer.getvalue(),"image/png")})
    pbody=body(png)
    check("CN-07","Formato PNG excluido de la carga DICOM",
          png.status_code in [400,415,422],
          "Rechazo explícito de formato PNG",
          {"status":png.status_code,"estado":pbody.get("estado_validacion"),"probabilidades":[i.get("probabilidad_ia") for i in pbody.get("imagenes",[])]})

    empty=request("GET",f"/diagnosticos/atenciones/{ai['id']}/diagnostico")
    status("CN-07","Los rechazos no persisten un diagnóstico",empty,404)
    mixed=request("POST",f"/diagnosticos/atenciones/{ai['id']}/radiografias",files={
        "archivo_ap":("valida.dcm",Path(SAMPLES["1_AP"]["file"]).read_bytes(),"application/dicom"),
        "archivo_pa":("corrupta.dcm",b"DICOM corrupto","application/dicom")})
    status("CN-07","AP válida y PA corrupta se rechazan conjuntamente",mixed,422)
    status("CN-07","La carga mixta no deja análisis parcial",request("GET",f"/diagnosticos/atenciones/{ai['id']}/diagnostico"),404)
    oversized=request("POST",f"/diagnosticos/atenciones/{ai['id']}/radiografias",files={
        "archivo_ap":("grande.dcm",b"0"*(30*1024*1024+1),"application/dicom")})
    status("CN-07","Límite de 30 MiB por archivo",oversized,413)

    # CN-08
    priority_cases=[]
    for grade,clinical in [(0,"Leve"),(1,"Moderado"),(3,"Grave")]:
        for label in [0,1]:
            px=patient(f"Paciente QA matriz {clinical} {'positivo' if label else 'negativo'}")
            ax=attention(px,grade=grade);evaluate(ax)
            dx=upload(ax,sample=f"{label}_AP").json()
            expected={("Leve",False):"Baja",("Leve",True):"Moderada",
                      ("Moderado",False):"Moderada",("Moderado",True):"Alta",
                      ("Grave",False):"Alta",("Grave",True):"Crítica"}[(clinical,bool(dx["enfermo"]))]
            check("CN-08",clinical+(" positivo" if label else " negativo"),
                  ax["crb65_gravedad"]==clinical and dx["prioridad_final"]==expected,
                  expected,{"crb65":ax["crb65_puntaje"],"ia":dx["enfermo"],"prioridad":dx["prioridad_final"],
                            "probabilidad":dx["imagenes"][0]["probabilidad_ia"]})
            check("CN-08","Muestra produce clase esperada "+clinical+str(label),dx["enfermo"]==bool(label),
                  "Clase de la muestra pública",dx["enfermo"])
            priority_cases.append({"patient":px,"attention":ax,"diagnosis":dx})
    CASES["priority_matrix"]=priority_cases
    CASES["ui_positive"]=priority_cases[-1]
    CASES["ui_negative"]=priority_cases[0]
    CASES["ui_pending"]=priority_cases[-2]

    # CN-09
    notices=request("GET","/notificaciones/pendientes",role="Especialista").json()
    high=[x for x in priority_cases if x["diagnosis"]["prioridad_final"] in ["Alta","Crítica"]]
    check("CN-09","Avisos para casos Alta y Crítica",all(any(n["diagnostico_id"]==x["diagnosis"]["id"] for n in notices) for x in high),
          [x["diagnosis"]["id"] for x in high],[n["diagnostico_id"] for n in notices])
    check("CN-09","Orden de avisos",notices[0]["prioridad"]=="Crítica","Crítica primero",[n["prioridad"] for n in notices])
    target=next(n for n in notices if n["diagnostico_id"]==high[0]["diagnosis"]["id"])
    status("CN-09","Marcar aviso leído",request("PATCH",f"/notificaciones/{target['id']}/leer",role="Especialista"),200)
    status("CN-09","Cerrar aviso",request("PATCH",f"/notificaciones/{target['id']}/cerrar",role="Especialista"),200)
    remained=request("GET",f"/diagnosticos/atenciones/{high[0]['attention']['id']}/diagnostico").json()
    check("CN-09","Cerrar aviso no valida el diagnóstico",remained["estado_validacion"]=="Pendiente de validación",
          "Pendiente de validación",remained["estado_validacion"])

    # CN-10
    positive=priority_cases[-1]
    dx=positive["diagnosis"]
    status("CN-10","Enfermería no valida",validate(dx,role="Enfermera"),403)
    final=validate(dx,classification="Sano").json()
    CASES["validated_positive"]={**positive,"final":final}
    check("CN-10","Corrección conserva IA y registra concordancia",
          final["enfermo"]==dx["enfermo"] and final["clasificacion_medico"]=="Sano" and final["concordancia_ia"]=="Corregido"
          and final["estado_validacion"]=="Validado" and final["fecha_validacion"] is not None,
          "IA original conservada; Sano, Corregido, Validado y fecha",
          {k:final[k] for k in ["enfermo","clasificacion_medico","concordancia_ia","estado_validacion","fecha_validacion"]})
    status("CN-10","Doble validación rechazada",validate(dx),400)
    pa=request("GET",f"/pacientes/{positive['patient']['id']}").json()
    at=request("GET",f"/atenciones/{positive['attention']['id']}").json()
    check("CN-10","Cierre de atención y liberación del paciente",at["estado"]=="Finalizada" and not pa["en_atencion"],
          {"estado":"Finalizada","en_atencion":False},{"estado":at["estado"],"en_atencion":pa["en_atencion"]})
    notices=request("GET","/notificaciones/pendientes",role="Especialista").json()
    check("CN-10","Cierre automático del aviso",all(n["diagnostico_id"]!=dx["id"] for n in notices),
          "Sin aviso abierto del diagnóstico",[n["diagnostico_id"] for n in notices])

    # CN-11
    new_password=secrets.token_urlsafe(24)
    user_data={"username":"qa_cuenta_nueva","correo":"qa_cuenta_nueva@example.com","password":new_password,
               "nombre_completo":"Cuenta sintética de evaluación","rol":"Enfermera"}
    cr=request("POST","/usuarios/",role="Admin",json=user_data)
    status("CN-11","Crear usuario",cr,201);u=cr.json()
    duplicate=request("POST","/usuarios/",role="Admin",json=user_data)
    status("CN-11","Nombre de usuario duplicado",duplicate,400)
    changed=request("PATCH",f"/usuarios/{u['id']}",role="Admin",json={"nombre_completo":"Cuenta sintética actualizada"})
    check("CN-11","Editar datos",changed.status_code==200 and changed.json()["nombre_completo"]=="Cuenta sintética actualizada",
          "Nombre actualizado",body(changed).get("nombre_completo"))
    u=request("GET","/usuarios/?buscar=qa_cuenta_nueva",role="Admin").json()["items"][0]
    perms=[p for p in u["permisos"] if p!="resultados.ver"]
    status("CN-11","Revocar permiso",request("PUT",f"/usuarios/{u['id']}/permisos",role="Admin",json={"permisos":perms}),200)
    token=login(user_data["username"],new_password).json()["access_token"];SESSIONS["Restringido"]=token
    status("CN-11","Permiso revocado aplicado",request("GET",f"/diagnosticos/atenciones/{a['id']}/diagnostico",role="Restringido"),403)
    admin=request("GET","/auth/me",role="Admin").json()
    status("CN-11","Administrador sin permisos clínicos concedibles",
           request("PUT",f"/usuarios/{admin['id']}/permisos",role="Admin",json={"permisos":["usuarios.gestionar","pacientes.ver"]}),400)
    status("CN-11","Bloqueo de autosuspensión",request("PATCH",f"/usuarios/{admin['id']}",role="Admin",json={"estado":False}),400)
    status("CN-11","Suspender cuenta",request("PATCH",f"/usuarios/{u['id']}",role="Admin",json={"estado":False}),200)
    status("CN-11","Acceso suspendido",login(user_data["username"],new_password),400)
    status("CN-11","Reactivar cuenta",request("PATCH",f"/usuarios/{u['id']}",role="Admin",json={"estado":True}),200)
    replacement=secrets.token_urlsafe(24)
    status("CN-11","Reasignar contraseña",request("PATCH",f"/usuarios/{u['id']}/password",role="Admin",json={"password":replacement}),200)
    status("CN-11","Clave anterior rechazada",login(user_data["username"],new_password),401)
    status("CN-11","Clave nueva aceptada",login(user_data["username"],replacement),200)
    # El token Restringido se conserva para verificar permisos del archivo.

    # CN-12
    p2=patient("Paciente QA historial multiepisodio")
    hist=[]
    for label in [0,1]:
        aa=attention(p2);evaluate(aa);dd=upload(aa,sample=f"{label}_AP").json()
        validate(dd,classification="Sano" if label==0 else "Neumonía")
        hist.append(aa["id"])
    with LocalClient(base_url=BASE,timeout=30) as independent:
        rr=independent.get(f"/api/v1/atenciones/paciente/{p2['id']}",headers={"Authorization":"Bearer "+SESSIONS["Especialista"]})
        recovered=rr.json()
    check("CN-12","Historial recuperado desde nueva sesión HTTP",rr.status_code==200 and {x["id"] for x in recovered}==set(hist),
          hist,[x["id"] for x in recovered])
    check("CN-12","Presión y estado conservados",all(x["presion_arterial"]=="120/80" and x["estado"]=="Finalizada" for x in recovered),
          "120/80 y Finalizada en ambos",[{k:x[k] for k in ["id","presion_arterial","estado"]} for x in recovered])
    CASES["history_patient"]=p2

    # CN-13
    image_url=dg["imagenes"][0]["imagen_url"]
    status("CN-13","Archivo sin sesión",request("GET",image_url,role=None),401)
    valid_file=request("GET",image_url+"?token="+SESSIONS["Especialista"],role=None)
    check("CN-13","Archivo con usuario clínico",valid_file.status_code==200 and len(valid_file.content)>0,
          "200 y archivo no vacío",{"status":valid_file.status_code,"bytes":len(valid_file.content)})
    admin_file=request("GET",image_url+"?token="+SESSIONS["Admin"],role=None)
    check("CN-13","Administrador no accede al archivo clínico",admin_file.status_code==403,"403",{"status":admin_file.status_code,"bytes":len(admin_file.content)})
    status("CN-13","Preparar consulta con historial.ver como único permiso",request("PUT",f"/usuarios/{u['id']}/permisos",role="Admin",json={"permisos":["historial.ver"]}),200)
    history_file=request("GET",image_url+"?token="+SESSIONS["Restringido"],role=None)
    check("CN-13","Historial permite consultar archivo sin resultados.ver",history_file.status_code==200,200,
          {"status":history_file.status_code,"bytes":len(history_file.content)})
    status("CN-13","Revocar los dos permisos de consulta",request("PUT",f"/usuarios/{u['id']}/permisos",role="Admin",
           json={"permisos":[p for p in perms if p!="historial.ver"]}),200)
    denied_file=request("GET",image_url+"?token="+SESSIONS["Restringido"],role=None)
    check("CN-13","Sin resultados.ver ni historial.ver se deniega archivo",denied_file.status_code==403,403,
          {"status":denied_file.status_code,"bytes":len(denied_file.content)})

    pending_repeat=upload(priority_cases[0]["attention"],sample="1_AP")
    status("CN-14","Tampoco se reemplaza un análisis pendiente",pending_repeat,400)
    original_pending=request("GET",f"/diagnosticos/atenciones/{priority_cases[0]['attention']['id']}/diagnostico").json()
    check("CN-14","El rechazo conserva imágenes y estado pendiente",
          original_pending["id"]==priority_cases[0]["diagnosis"]["id"] and
          [i["id"] for i in original_pending["imagenes"]]==[i["id"] for i in priority_cases[0]["diagnosis"]["imagenes"]] and
          original_pending["estado_validacion"]=="Pendiente de validación",
          "Análisis inicial conservado",{k:original_pending[k] for k in ["id","estado_validacion"]})

    # CN-14
    disposable=priority_cases[1]
    before=validate(disposable["diagnosis"]).json()
    after=upload(disposable["attention"],sample="0_AP")
    check("CN-14","No se reemplazan imágenes de un diagnóstico validado",after.status_code in [400,403,409],
          "Rechazo de nueva carga sobre caso validado",
          {"status":after.status_code,"estado_anterior":before["estado_validacion"],
           "estado_posterior":body(after).get("estado_validacion"),
           "imagen_ids_antes":[i["id"] for i in before["imagenes"]],
           "imagen_ids_despues":[i["id"] for i in body(after).get("imagenes",[])]})

finally:
    save()
    CLIENT.close()
    summary={k:{"checks":len(v["checks"]),"passed":sum(x["pass"] for x in v["checks"]),
                "failed":sum(not x["pass"] for x in v["checks"])} for k,v in RUN["cases"].items()}
    print(json.dumps(summary,ensure_ascii=False,indent=2))
