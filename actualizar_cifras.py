# Uso:  python actualizar_cifras.py "RUTA\afiliados-satipo\data"
# Lee manifest.json + resumen_establecimientos.json y genera assets/data/afiliados-data.js
import json, sys, os, collections
from datetime import datetime
d = sys.argv[1] if len(sys.argv) > 1 else os.path.join("..", "..", "afiliados-satipo", "data")
man = json.load(open(os.path.join(d, "manifest.json"), encoding="utf-8-sig"))
res = json.load(open(os.path.join(d, "resumen_establecimientos.json"), encoding="utf-8-sig"))
sx, ge, di = collections.Counter(), collections.Counter(), collections.Counter()
for e in res:
    for k, v in (e.get("sexo") or {}).items(): sx[k] += v
    for k, v in (e.get("grupo_etareo") or {}).items(): ge[k.split(".", 1)[-1].title()] += v
    di[e["distrito"]] += e.get("total_afiliados") or 0
f = datetime.strptime(man["generado"][:10], "%Y-%m-%d").strftime("%d/%m/%Y")
out = {
  "total": man["total_afiliados"], "establecimientos": man["total_establecimientos"],
  "femenino": sx["Femenino"], "masculino": sx["Masculino"],
  "nuevos2026": sum(man["por_mes_afil_2026"].values()), "actualizado": f,
  "distritos": di.most_common(9), "etareo": ge.most_common(),
}
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "data", "afiliados-data.js")
open(dest, "w", encoding="utf-8").write("window.AFILIADOS_DATA = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
print("Listo ->", dest, "| total:", out["total"])
