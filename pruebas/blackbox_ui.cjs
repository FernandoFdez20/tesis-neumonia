const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path");
const OUT=__dirname,EVID=path.join(OUT,"evidence");
fs.mkdirSync(EVID,{recursive:true});
const config=JSON.parse(fs.readFileSync(path.join(OUT,"private_config.json"),"utf8"));
const created=JSON.parse(fs.readFileSync(path.join(OUT,"test_cases_created.json"),"utf8"));
const samples=JSON.parse(fs.readFileSync(path.join(OUT,"samples.json"),"utf8"));
const R={cases:{},screenshots:[],errors:[],environment:{browser:"Brave Chromium",viewport:"1440 x 1024",timezone:"America/Bogota"}};
const HOME="http://127.0.0.1:5193";
let browser,context,page;
function save(){fs.writeFileSync(path.join(OUT,"blackbox_ui_results.json"),JSON.stringify(R,null,2),"utf8");}
function check(id,name,pass,expected,observed){
  (R.cases[id]??={checks:[]}).checks.push({name,pass:!!pass,expected,observed});save();
}
async function screen(name){
  const file=path.join(EVID,name+".png");
  await page.waitForTimeout(1400);
  const dialog=page.getByRole("dialog");
  const box=(await dialog.count())===1 && await dialog.isVisible()?await dialog.boundingBox():null;
  if(box){
    const vp=page.viewportSize();
    const x=Math.max(0,Math.floor(box.x)-8),y=Math.max(0,Math.floor(box.y)-8);
    await page.screenshot({path:file,clip:{x,y,width:Math.min(vp.width-x,Math.ceil(box.width)+16),height:Math.min(vp.height-y,Math.ceil(box.height)+16)},animations:"disabled"});
  }else await page.screenshot({path:file,fullPage:false,animations:"disabled"});
  R.screenshots.push({name,path:file});save();
}
async function login(role){
  await page.goto(HOME+"/login");
  await page.getByLabel("Usuario",{exact:true}).fill("qa_"+role);
  await page.getByLabel("Contraseña",{exact:true}).fill(config.password);
  await page.getByRole("button",{name:"Ingresar al sistema",exact:true}).click();
  await page.waitForURL(role==="admin"?"**/usuarios":"**/dashboard");
}
async function api(method,route,body,token){
  const response=await fetch("http://127.0.0.1:8093/api/v1"+route,{
    method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json()};
}
(async()=>{
  browser=await chromium.launch({executablePath:"C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",headless:true});
  context=await browser.newContext({viewport:{width:1440,height:1024},timezoneId:"America/Bogota",locale:"es-PE",acceptDownloads:true});
  await context.route(/^http:\/\/(?:localhost|127\.0\.0\.1):8000\//,route=>
    route.continue({url:route.request().url().replace(/^http:\/\/(?:localhost|127\.0\.0\.1):8000/,"http://127.0.0.1:8093")}));
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on("pageerror",error=>{R.errors.push(error.message);save();});
  R.environment.browser_version=await browser.version();
  await page.goto(HOME+"/login");
  await page.getByLabel("Usuario",{exact:true}).fill("qa_enfermera");
  await page.getByLabel("Contraseña",{exact:true}).fill("clave_errada_de_prueba");
  await page.getByRole("button",{name:"Ingresar al sistema",exact:true}).click();
  await page.getByText("Usuario o contraseña incorrectos",{exact:true}).waitFor();
  check("CN-15","Error de acceso visible",true,"Mensaje de credenciales","Usuario o contraseña incorrectos");
  await screen("ui_01_acceso_rechazado");
  await login("enfermera");
  await page.getByRole("heading",{name:"Panel principal",exact:true}).waitFor();
  check("CN-15","Enfermería sin menú de usuarios",await page.getByRole("link",{name:"Usuarios",exact:true}).count()===0,
    "Sin acceso administrativo visible",await page.getByRole("link",{name:"Usuarios",exact:true}).count());
  await screen("ui_02_panel_enfermeria");
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Buscar secciones y acciones...").fill("Historial");
  await screen("ui_03_busqueda_secciones");
  await page.getByRole("option",{name:"Historial clínico"}).click();
  await page.waitForURL("**/historial");
  check("CN-15","Buscador navega al historial",true,"/historial",new URL(page.url()).pathname);

  // Registro por la interfaz con identidad sintética.
  const dni=String(82000000+Math.floor(Math.random()*99999));
  R.ui_patient_dni=dni;
  await page.getByRole("button",{name:"Registrar paciente",exact:true}).first().click();
  let dialog=page.getByRole("dialog");
  await dialog.getByLabel("DNI / Documento",{exact:true}).fill(dni);
  await dialog.getByRole("button",{name:"Buscar paciente por documento",exact:true}).click();
  await dialog.getByLabel("Nombres y Apellidos completos",{exact:true}).fill("Paciente sintético de interfaz QA");
  await dialog.getByLabel("Fecha de nacimiento",{exact:true}).fill("1980-01-01");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option",{name:"Femenino",exact:true}).click();
  await screen("ui_04_registro_paciente");
  const patientResponse=page.waitForResponse(r=>r.url().includes("/api/v1/pacientes/")&&r.request().method()==="POST");
  await dialog.getByRole("button",{name:"Guardar registro",exact:true}).click();
  let pr=await patientResponse;
  check("CN-15","Registro de paciente desde formulario",pr.status()===201,201,pr.status());
  await page.goto(HOME+"/pacientes");
  await page.getByPlaceholder("Buscar por nombre o DNI...").fill(dni);
  await page.getByRole("button",{name:"Ver perfil",exact:true}).first().waitFor();
  await screen("ui_05_directorio_paciente");

  // Datos válidos y errores del formulario de atención.
  await page.getByRole("button",{name:"Nueva atención",exact:true}).first().click();
  dialog=page.getByRole("dialog");
  check("CN-15","Atención incompleta no se envía",await dialog.getByRole("button",{name:"Guardar atención",exact:true}).isDisabled(),
        "Botón deshabilitado","Deshabilitado");
  await dialog.getByLabel("Documento de identidad",{exact:true}).fill(dni);
  await dialog.getByRole("button",{name:"Buscar paciente por documento",exact:true}).click();
  await dialog.getByLabel("Nombres",{exact:true}).inputValue();
  await dialog.getByLabel("Fecha de atención",{exact:true}).fill("2026-11-03");
  await dialog.getByLabel("Hora",{exact:true}).fill("09:15");
  for(const [label,value] of [["Presión arterial","80/120"],["Frecuencia cardíaca","80"],
    ["Frecuencia respiratoria","20"],["Temperatura","37"],["Saturación O2","97"],
    ["Motivo de consulta","Motivo QA trazabilidad de captura"],["Tiempo de evolución","3"],
    ["Síntomas principales","Tos sintética de interfaz QA"],["Observaciones (opcional)","Observación sintética QA"]]){
    await dialog.getByLabel(label,{exact:true}).fill(value);
  }
  const invalid=await dialog.getByRole("button",{name:"Guardar atención",exact:true}).isDisabled();
  check("CN-15","Presión invertida impide guardar",invalid,"Deshabilitado",invalid);
  await dialog.getByLabel("Presión arterial",{exact:true}).scrollIntoViewIfNeeded();
  await screen("ui_06_validacion_presion");
  await dialog.getByLabel("Presión arterial",{exact:true}).fill("120/80");
  const attentionResponse=page.waitForResponse(r=>r.url().includes("/api/v1/atenciones/")&&r.request().method()==="POST");
  await dialog.getByRole("button",{name:"Guardar atención",exact:true}).click();
  const ar=await attentionResponse;
  const attention=await ar.json();R.ui_attention=attention;
  const payload=ar.request().postDataJSON();R.ui_attention_request=payload;
  check("CN-15","Atención válida enviada",ar.status()===201,201,ar.status());
  check("CN-15","Motivo de consulta conservado",attention.motivo_consulta==="Motivo QA trazabilidad de captura" && attention.sintomas_principales.includes("Tos sintética de interfaz QA"),
        "Motivo recuperable en el registro",{"campos_enviados":Object.keys(payload),"motivo_guardado":attention.motivo_consulta,"sintomas_guardados":attention.sintomas_principales});
  check("CN-15","Fecha y hora seleccionadas conservadas",attention.fecha_atencion==="2026-11-03" && attention.hora_atencion.startsWith("09:15"),
        "2026-11-03 09:15",{fecha_atencion:attention.fecha_atencion,hora_atencion:attention.hora_atencion,fecha_registro:attention.fecha_registro});
  await page.keyboard.press("Escape");
  await page.goto(HOME+"/atenciones");
  await page.getByRole("button",{name:"Tarjetas",exact:true}).click();
  check("CN-15","Cambio a vista Tarjetas",await page.getByRole("button",{name:"Tarjetas",exact:true}).getAttribute("aria-pressed")==="true",
        "Tarjetas activa",await page.getByRole("button",{name:"Tarjetas",exact:true}).getAttribute("aria-pressed"));
  await screen("ui_07_atenciones_tarjetas");
  await page.getByRole("button",{name:"Tabla",exact:true}).click();
  await screen("ui_08_atenciones_tabla");

  const lr=await fetch("http://127.0.0.1:8093/api/v1/auth/login",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({username:"qa_especialista",password:config.password})});
  const token=(await lr.json()).access_token;
  // El especialista evalúa, guarda y deriva desde la interfaz real.
  await login("especialista");
  await page.goto(HOME+"/atenciones");
  await page.getByPlaceholder("Buscar por paciente, código o síntomas...").fill("Paciente sintético de interfaz QA");
  await page.getByRole("button",{name:"Evaluar atención",exact:true}).click();
  dialog=page.getByRole("dialog");
  const exam="Examen sintético de interfaz para comprobar guardado y derivación.";
  await dialog.getByRole("textbox").fill(exam);
  await screen("ui_08a_evaluacion_medica");
  const saveEvent=page.waitForResponse(r=>r.url().includes("/atenciones/"+attention.id+"/evaluar")&&r.request().method()==="PATCH");
  await dialog.getByRole("button",{name:"Guardar progreso",exact:true}).click();
  const saved=await saveEvent, savedBody=await saved.json();
  check("CN-05","Guardar progreso desde interfaz mantiene etapa pendiente",saved.status()===200&&savedBody.paciente_estado_clinico==="Pendiente de evaluación",
    "200 y Pendiente de evaluación",{status:saved.status(),estado:savedBody.paciente_estado_clinico});
  if(await page.getByRole("dialog").count())await page.keyboard.press("Escape");
  await page.goto(HOME+"/atenciones");
  await page.getByPlaceholder("Buscar por paciente, código o síntomas...").fill("Paciente sintético de interfaz QA");
  await screen("ui_08b_progreso_sin_derivar");
  await page.getByRole("button",{name:"Evaluar atención",exact:true}).click();
  dialog=page.getByRole("dialog");
  const recovered=await dialog.getByRole("textbox").inputValue();
  check("CN-05","Notas guardadas recuperadas en la interfaz",recovered===exam,exam,recovered);
  const deriveEvent=page.waitForResponse(r=>r.url().includes("/atenciones/"+attention.id+"/evaluar")&&r.request().method()==="PATCH");
  await dialog.getByRole("button",{name:"Derivar a Radiografía",exact:true}).click();
  const derived=await deriveEvent, derivedBody=await derived.json();
  check("CN-05","Derivación explícita desde interfaz",derived.status()===200&&derivedBody.paciente_estado_clinico==="Derivado a radiografía",
    "200 y Derivado a radiografía",{status:derived.status(),estado:derivedBody.paciente_estado_clinico});
  await page.getByRole("dialog").waitFor({state:"hidden"});
  await screen("ui_08c_derivacion_confirmada");
  await login("enfermera");
  await page.goto(HOME+"/radiografias/cargar/"+attention.id);
  await page.getByRole("heading",{name:"Cargar Radiografías",exact:true}).waitFor();
  const inputs=page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles({name:"invalido.txt",mimeType:"text/plain",buffer:Buffer.from("No es una radiografia")});
  await page.getByText("Formato no válido: invalido.txt",{exact:true}).waitFor();
  check("CN-15","Selector rechaza texto",await page.getByRole("button",{name:"Iniciar Análisis",exact:true}).isDisabled(),
        "Archivo rechazado y análisis deshabilitado","Rechazado");
  await screen("ui_09_archivo_invalido");
  await inputs.nth(0).setInputFiles(samples["1_AP"].file);
  await page.locator('img[alt="Preview AP"]').waitFor();
  await screen("ui_10_dicom_previsualizado");
  const uploadResponse=page.waitForResponse(r=>r.url().includes("/radiografias")&&r.request().method()==="POST"&&!r.url().includes("vista-previa"));
  await page.getByRole("button",{name:"Iniciar Análisis",exact:true}).click();
  const ur=await uploadResponse;
  check("CN-15","Análisis iniciado desde interfaz",ur.status()===200,200,ur.status());
  R.ui_analysis=await ur.json();
  await login("especialista");
  await page.goto(HOME+"/historial");
  await page.getByPlaceholder("Escribe DNI o nombre... (mín. 2 letras)").fill(dni);
  await page.getByRole("button").filter({hasText:"Paciente sintético de interfaz QA"}).click();
  await page.getByRole("button",{name:"Ver diagnóstico",exact:true}).click();
  await page.getByRole("heading",{name:"Resultado del análisis IA",exact:true}).waitFor();
  await screen("ui_10a_resultado_pendiente");
  await page.getByRole("button",{name:"Validar diagnóstico",exact:true}).click();
  dialog=page.getByRole("dialog");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option",{name:"Neumonía",exact:true}).click();
  await dialog.getByRole("textbox").fill("Conclusión sintética para comprobar la validación mediante la interfaz.");
  await screen("ui_10b_formulario_validacion");
  const validateEvent=page.waitForResponse(r=>r.url().includes("/diagnosticos/"+R.ui_analysis.id+"/validar")&&r.request().method()==="PATCH");
  await dialog.getByRole("button",{name:"Firmar y Validar",exact:true}).click();
  const validated=await validateEvent, validatedBody=await validated.json();
  R.ui_validation=validatedBody;
  check("CN-10","Validación médica desde interfaz",validated.status()===200&&validatedBody.estado_validacion==="Validado"&&validatedBody.clasificacion_medico==="Neumonía",
    "200 Validado y Neumonía",{status:validated.status(),estado:validatedBody.estado_validacion,clasificacion:validatedBody.clasificacion_medico});
  check("CN-10","La validación de interfaz conserva la IA",validatedBody.enfermo===R.ui_analysis.enfermo,
    R.ui_analysis.enfermo,validatedBody.enfermo);
  if(await page.getByRole("dialog").count())await page.keyboard.press("Escape");
  await screen("ui_10c_validacion_registrada");

  // Consulta del diagnóstico validado e informe PDF real.
  await login("especialista");
  await page.goto(HOME+"/historial");
  await page.getByPlaceholder("Escribe DNI o nombre... (mín. 2 letras)").fill(created.ui_positive.patient.dni);
  await page.getByRole("button").filter({hasText:created.ui_positive.patient.nombres_apellidos}).click();
  await page.getByRole("button",{name:"Validados",exact:true}).click();
  await page.getByRole("button",{name:"Ver diagnóstico",exact:true}).click();
  await page.waitForURL("**/resultado");
  await page.getByRole("heading",{name:"Resultado del análisis IA",exact:true}).waitFor();
  await screen("ui_11_resultado_validado");
  const downloadEvent=page.waitForEvent("download",{timeout:60000});
  await page.getByRole("button",{name:"Reporte PDF",exact:true}).click();
  const download=await downloadEvent;
  const pdfPath=path.join(EVID,"Reporte_evaluacion.pdf");
  await download.saveAs(pdfPath);
  check("CN-16","Descarga efectiva del PDF",fs.statSync(pdfPath).size>1000,"PDF no vacío",
        {archivo:download.suggestedFilename(),bytes:fs.statSync(pdfPath).size});
  R.downloaded_pdf=pdfPath;

  // Actualización desde otra sesión y correspondencia del contador inferior.
  await page.goto(HOME+"/dashboard");
  const pendingName=created.ui_pending.patient.nombres_apellidos;
  const pendingLink=page.getByRole("link").filter({hasText:pendingName});
  await pendingLink.waitFor();
  await screen("ui_12_alerta_antes_validacion");
  const priorities=await api("GET","/diagnosticos/prioridades/pendientes",null,token);
  const lowText=await page.getByText("Prioridad Baja",{exact:true}).locator("..").innerText();
  const lowCount=Number(lowText.match(/\d+/)?.[0]);
  check("CN-17","Contador inferior corresponde a Baja",lowCount===priorities.data.conteos.Baja,
        {"Baja_API":priorities.data.conteos.Baja},{"rotulo":"Prioridad Baja","contador":lowCount});
  const t=Date.now();
  const valid=await api("PATCH","/diagnosticos/"+created.ui_pending.diagnosis.id+"/validar",
    {clasificacion_medico:"Sano",diagnostico_descripcion:"Validación sintética desde segunda sesión para comprobar actualización."},token);
  await pendingLink.waitFor({state:"detached",timeout:40000});
  const ms=Date.now()-t;
  check("CN-17","Caso validado desaparece sin recargar",valid.status===200 && ms<=40000,
        "Retiro automático en un ciclo de consulta",{"ms":ms,"validacion":valid.status});
  await screen("ui_13_alerta_despues_validacion");

  await login("admin");
  await page.getByRole("heading",{name:"Usuarios",exact:true}).waitFor();
  await screen("ui_14_administracion");
  check("CN-15","Administrador accede a Usuarios",new URL(page.url()).pathname==="/usuarios",
        "/usuarios",new URL(page.url()).pathname);
  check("CN-15","Sin excepciones JavaScript no controladas",R.errors.length===0,[],R.errors);
  // Frontera de mayoría de edad con reloj explícitamente controlado.
  await login("enfermera");
  await page.clock.install({time:new Date("2026-11-05T12:00:00-05:00")});
  R.environment.age_boundary_clock="2026-11-05T12:00:00-05:00";
  await page.goto(HOME+"/pacientes");
  await page.getByRole("button",{name:"Registrar paciente",exact:true}).first().click();
  dialog=page.getByRole("dialog");
  const minorDni=String(83000000+Math.floor(Math.random()*99999));
  await dialog.getByLabel("DNI / Documento",{exact:true}).fill(minorDni);
  await dialog.getByRole("button",{name:"Buscar paciente por documento",exact:true}).click();
  await dialog.getByLabel("Nombres y Apellidos completos",{exact:true}).fill("Frontera de edad paciente sintético");
  await dialog.getByLabel("Fecha de nacimiento",{exact:true}).fill("2008-11-06");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option",{name:"Femenino",exact:true}).click();
  const ageBlocked=await dialog.getByRole("button",{name:"Guardar registro",exact:true}).isDisabled();
  check("CN-18","Interfaz bloquea a menor por un día",ageBlocked,"Guardar registro deshabilitado",{deshabilitado:ageBlocked,nacimiento:"2008-11-06",fecha_controlada:"2026-11-05",zona:"America/Bogota"});
  await screen("ui_16_frontera_edad");
  if(!ageBlocked){
    const minorEvent=page.waitForResponse(r=>r.url().includes("/pacientes/")&&r.request().method()==="POST");
    await dialog.getByRole("button",{name:"Guardar registro",exact:true}).click();
    const minorResponse=await minorEvent;
    check("CN-18","Servidor rechaza el registro menor por un día",minorResponse.status()===422,422,{status:minorResponse.status(),body:await minorResponse.json()});
    await screen("ui_17_rechazo_servidor_edad");
  }
  save();
})().catch(async e=>{
  R.runner_error={name:e.name,message:e.message};
  if(page){try{await screen("ui_error_automatizacion");fs.writeFileSync(path.join(OUT,"ui_error_text.txt"),await page.locator("body").innerText(),"utf8");}catch{}}
  save();process.exitCode=1;
}).finally(async()=>{
  if(browser)await browser.close();
  console.log(JSON.stringify({cases:Object.fromEntries(Object.entries(R.cases).map(([id,v])=>[id,{
    checks:v.checks.length,passed:v.checks.filter(c=>c.pass).length,failed:v.checks.filter(c=>!c.pass).length}])),
    runner_error:R.runner_error??null,screenshots:R.screenshots.length},null,2));
});
