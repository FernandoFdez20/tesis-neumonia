const fs=require("node:fs"),path=require("node:path"),{createRequire}=require("node:module");
const root=path.resolve(__dirname,"..");
const out=__dirname;
const req=createRequire(root+"/frontend/package.json");
const ts=req("typescript");
process.env.TZ="America/Bogota";
const NativeDate=Date;
class FixedDate extends NativeDate {
  constructor(...args){super(...(args.length?args:["2026-11-05T12:00:00-05:00"]));}
  static now(){return new NativeDate("2026-11-05T12:00:00-05:00").getTime();}
}
const result={cases:{},environment:{date:"2026-11-05",timezone:"America/Bogota",node:process.version}};
function record(id,name,pass,expected,observed){
  (result.cases[id]??={checks:[]}).checks.push({name,pass:!!pass,expected,observed});
}
function load(file,deps=req,only){
  let source=fs.readFileSync(root+"/frontend/"+file,"utf8");
  if(only){
    const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    source=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===only).getText(ast);
  }
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const mod={exports:{}};
  new Function("require","module","exports","Date",js)(deps,mod,mod.exports,FixedDate);
  return mod.exports;
}
const v=load("src/components/atenciones/validacion-atencion.ts");
const base={documentoPaciente:"12345678",nombrePaciente:"Paciente sintético",
  fechaAtencion:"2026-11-05",horaAtencion:"12:00",motivoConsulta:"Evaluación",
  presionArterial:"120/80",frecuenciaCardiaca:"80",frecuenciaRespiratoria:"20",
  temperatura:"37",saturacionOxigeno:"97",tiempoEvolucionDias:"3",
  sintomasPrincipales:"Síntomas sintéticos",confusion:false,estadoAtencion:"pendiente-evaluacion",observaciones:""};
record("CB-05","Formulario clínico válido",Object.keys(v.validarFormularioAtencion(base)).length===0,"Sin errores",v.validarFormularioAtencion(base));
for(const [field,min,max] of [
  ["temperatura",30,45],["frecuenciaCardiaca",20,240],["frecuenciaRespiratoria",5,80],
  ["saturacionOxigeno",50,100],["tiempoEvolucionDias",0,90]]){
  for(const [value,valid] of [[min,true],[max,true],[min-1,false],[max+1,false],["abc",false]]){
    const errors=v.validarFormularioAtencion({...base,[field]:String(value)});
    record("CB-05",field+" = "+value,(!errors[field])===valid,valid?"Aceptado":"Rechazado",errors[field]??"Aceptado");
  }
}
for(const [pressure,valid] of [["120/80",true],["50/30",true],["300/200",true],
  ["49/30",false],["301/80",false],["120/29",false],["250/201",false],
  ["80/120",false],["80/80",false],["120-80",false],["120 / 80",true]]){
  const error=v.validarPresion(pressure);
  record("CB-05","Presión "+pressure,(!error)===valid,valid?"Aceptada":"Rechazada",error??"Aceptada");
}
for(const [document,valid] of [["12345678",true],["1234567",false],["123456789",false],["1234ABCD",false]]){
  const error=v.validarDocumento(document);
  record("CB-05","Documento "+document,(!error)===valid,valid?"Aceptado":"Rechazado",error??"Aceptado");
}
for(const [day,valid] of [["2026-11-05",true],["2026-11-06",false],["2026-11-04",true]]){
  const error=v.validarFechaAtencion(day);
  record("CB-05","Fecha "+day,(!error)===valid,valid?"Aceptada":"Rechazada",error??"Aceptada");
}
const age=load("src/components/pacientes/nuevo-paciente-dialog.tsx",req,"esMayorDeEdad").esMayorDeEdad;
for(const [birth,valid] of [["2008-11-05",true],["2008-11-06",false],["2008-11-04",true],["2030-01-01",false]]){
  record("CB-05","Edad desde fecha "+birth,age(birth)===valid,valid,age(birth));
}
const validateUser=load("src/components/usuarios/usuario-dialog.tsx",req,"validarFormulario").validarFormulario;
const user={username:"control",correo:"control@example.com",password:"12345678",nombre:"Cuenta sintética",rol:"Enfermera"};
for(const [name,data,valid] of [
  ["Usuario válido",user,true],["Clave con siete caracteres",{...user,password:"1234567"},false],
  ["Nombre de usuario corto",{...user,username:"ab"},false],["Correo inválido",{...user,correo:"incorrecto"},false]
]){
  const errors=validateUser(data,"crear");
  record("CB-05",name,(Object.keys(errors).length===0)===valid,valid?"Aceptado":"Rechazado",errors);
}
const auth=load("src/hooks/use-auth.ts");
const actions=load("src/lib/accion-atencion.ts",name=>name==="@/hooks/use-auth"?auth:req(name)).obtenerAccionAtencion;
for(const [state,label] of [
  ["Pendiente de evaluación","Evaluar atención"],["Derivado a radiografía","Cargar radiografía"],
  ["Diagnostico pendiente","Cargar radiografía"],["Pendiente de validación","Revisar y validar"],
  ["Validado","Ver diagnóstico y reporte"],["Sin atención pendiente",null],["Estado desconocido",null]
]){
  const actual=actions(state,()=>true)?.etiqueta??null;
  record("CB-12","Permisos completos y estado "+state,actual===label,label,actual);
  const none=actions(state,()=>false);
  record("CB-12","Sin permiso y estado "+state,none===null,null,none);
}
for(const [state,label] of [["Pendiente de validación","Ver resultado"],["Validado","Ver diagnóstico"]]){
  const actual=actions(state,p=>p===auth.PERMISOS.RESULTADOS_VER)?.etiqueta;
  record("CB-12","Solo consulta "+state,actual===label,label,actual);
}
fs.writeFileSync(path.join(out,"whitebox_frontend_results.json"),JSON.stringify(result,null,2),"utf8");
console.log(JSON.stringify(Object.fromEntries(Object.entries(result.cases).map(([id,v])=>[id,{
  checks:v.checks.length,passed:v.checks.filter(x=>x.pass).length,failed:v.checks.filter(x=>!x.pass).length} ])),null,2));
