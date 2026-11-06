from pathlib import Path
import json, re, sys, hashlib
from sqlalchemy import text
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/"backend"))
from app.core.database import engine
config=json.loads((OUT/"private_config.json").read_text())
schema=config["schema"]
assert re.fullmatch(r"qa_informe_[a-f0-9]{32}",schema), "El esquema no pertenece a esta evaluación"
baseline=json.loads((OUT/"database_baseline.json").read_text())
with engine.connect() as c:
    current={}
    for name in baseline:
        assert re.fullmatch(r"[a-z_]+",name)
        rows=c.execute(text(f'SELECT to_jsonb(t)::text FROM public."{name}" t')).scalars().all()
        current[name]={"count":len(rows),"sha256":hashlib.sha256("\n".join(sorted(rows)).encode()).hexdigest()}
    test_counts={name:c.execute(text(f'SELECT count(*) FROM "{schema}"."{name}"')).scalar_one()
                 for name in ["usuarios","pacientes","atenciones_medicas","diagnosticos","diagnostico_imagenes","notificaciones"]}
original_unchanged=current==baseline
assert original_unchanged, "Cambió información del esquema público durante la evaluación"
with engine.begin() as c:
    c.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
with engine.connect() as c:
    removed=c.execute(text("SELECT count(*) FROM information_schema.schemata WHERE schema_name=:name"),{"name":schema}).scalar_one()==0
hashes=json.loads((OUT/"source_hashes.json").read_text())
changed=[file for file,h in hashes.items() if hashlib.sha256((ROOT/file).read_bytes()).hexdigest()!=h]
result={"public_data_unchanged":original_unchanged,"public_counts":{k:v["count"] for k,v in current.items()},
        "temporary_records_removed":test_counts,"temporary_schema_removed":removed,
        "application_files_verified":len(hashes),"application_files_changed":changed}
(OUT/"preservation_verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(result,ensure_ascii=False,indent=2))
