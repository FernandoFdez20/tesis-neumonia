from pathlib import Path
import json, hashlib
from PIL import Image
p=Path(__file__).resolve().parent
pdf=json.loads((p/'pdf_inspection.json').read_text(encoding='utf-8'))
s=pdf['text']
checks=[]
def record(name,cond,expected,observed):checks.append({'name':name,'pass':bool(cond),'expected':expected,'observed':observed})
record('PDF interpretable con radiografía incorporada',pdf['pages']==2 and pdf['embedded_images']>=1,'Dos páginas legibles y al menos una imagen',{'paginas':pdf['pages'],'imagenes':pdf['embedded_images'],'bytes':pdf['bytes']})
record('Identidad y atención del PDF corresponden al caso','81000014' in s and 'AT-0008' in s,'DNI 81000014 y atención AT-0008','DNI 81000014; AT-0008')
record('PDF conserva IA gravedad y prioridad','POSITIVO presuntivo' in s and '3 pts · Grave' in s and 'Crítica' in s,'IA positiva, CRB-65 de 3 y prioridad Crítica','Positivo presuntivo; 3 pts Grave; Crítica')
record('PDF distingue decisión médica y advertencia presuntiva','Sano' in s and 'Corregido' in s and 'No reemplaza el criterio medico' in s,'Clasificación Sano, Corregido y advertencia clínica','Sano; Corregido; advertencia presente')
(p/'supplement_pdf_results.json').write_text(json.dumps({'cases':{'CN-16':{'checks':checks}}},ensure_ascii=False,indent=2),encoding='utf-8')
files=['blackbox_api_results.json','blackbox_ui_results.json','whitebox_python_results.json','whitebox_frontend_results.json','supplement_api_results.json','supplement_pdf_results.json']
cases={}
for f in files:
 d=json.loads((p/f).read_text(encoding='utf-8'))
 for code,c in d['cases'].items():
  dst=cases.setdefault(code,{'checks':[],'sources':[]}); dst['checks'].extend(c['checks']);dst['sources'].append(f)
for c in cases.values():
 c['total']=len(c['checks']);c['passed']=sum(x['pass'] for x in c['checks']);c['failed']=c['total']-c['passed'];c['status']='Aprobado' if not c['failed'] else 'Fallido'
(p/'merged_cases.json').write_text(json.dumps(dict(sorted(cases.items())),ensure_ascii=False,indent=2),encoding='utf-8')
summary={}
for prefix in ['CN','CB']:
 selected={k:v for k,v in cases.items() if k.startswith(prefix)}
 summary[prefix]={'cases':len(selected),'approved_cases':sum(v['failed']==0 for v in selected.values()),'checks':sum(v['total'] for v in selected.values()),'passed_checks':sum(v['passed'] for v in selected.values())}
manifest=[]
for f in sorted((p/'evidence').glob('*.png')):
 with Image.open(f) as im:size=list(im.size)
 manifest.append({'file':f.name,'size':size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(p/'evidence_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(p/'results_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False));print('Capturas originales:',len(manifest))
