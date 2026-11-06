from pathlib import Path
import json, importlib.metadata as meta
import urllib.request, urllib.parse
p=Path(__file__).resolve().parent
cfg=json.loads((p/'private_config.json').read_text(encoding='utf-8'))
created=json.loads((p/'test_cases_created.json').read_text(encoding='utf-8'))
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
request=urllib.request.Request('http://127.0.0.1:8093/api/v1/auth/login',data=urllib.parse.urlencode({'username':'qa_especialista','password':cfg['password']}).encode(),headers={'Content-Type':'application/x-www-form-urlencoded'},method='POST')
with opener.open(request,timeout=20) as r:token=json.load(r)['access_token']
before=created['priority_matrix'][1]['diagnosis']
request=urllib.request.Request('http://127.0.0.1:8093/api/v1/diagnosticos/atenciones/'+str(before['atencion_medica_id'])+'/diagnostico',headers={'Authorization':'Bearer '+token})
with opener.open(request,timeout=20) as r:after=json.load(r)
check={'name':'Consulta posterior confirma integridad del análisis validado','pass':after['id']==before['id'] and after['estado_validacion']=='Validado' and [i['id'] for i in after['imagenes']]==[i['id'] for i in before['imagenes']], 'expected':'Mismo diagnóstico e imágenes, estado Validado','observed':{'id':after['id'],'estado':after['estado_validacion'],'imagenes':[i['id'] for i in after['imagenes']]}}
(p/'supplement_api_results.json').write_text(json.dumps({'cases':{'CN-14':{'checks':[check]}}},ensure_ascii=False,indent=2),encoding='utf-8')
print('Verificación posterior CN-14:',check['pass'])
env=json.loads((p/'environment.json').read_text(encoding='utf-8'))
for name in ['SQLAlchemy','pydantic','numpy','Pillow','psycopg2-binary']:
 try:env['versions'][name]=meta.version(name)
 except meta.PackageNotFoundError:pass
(p/'environment.json').write_text(json.dumps(env,ensure_ascii=False,indent=2),encoding='utf-8')
