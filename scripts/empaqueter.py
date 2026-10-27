"""Construit dist/Preuve-Haine-v<version>.zip : extension, guide et code source, sans node_modules."""
import json
import re
import sys
import zipfile
from pathlib import Path

racine = Path(__file__).resolve().parent.parent
version = json.loads((racine / "extension" / "manifest.json").read_text(encoding="utf-8"))["version"]
nom = f"Preuve-Haine-v{version}"
sortie = racine / "dist" / f"{nom}.zip"
sortie.parent.mkdir(exist_ok=True)

contenu = [(f, f"preuve-haine-extension/{f.relative_to(racine / 'extension').as_posix()}") for f in (racine / "extension").rglob("*") if f.is_file()]
contenu += [(f, f"code-source/{f.relative_to(racine).as_posix()}") for f in (racine / "src").rglob("*") if f.is_file()]
contenu += [(racine / n, f"code-source/{n}") for n in ("package.json", "package-lock.json", "README.md", "scripts/empaqueter.py")]
contenu += [(racine / "GUIDE-INSTALLATION.html", "GUIDE-INSTALLATION.html")]

# Garde-fou : aucune clé API ne doit partir dans le paquet.
for fichier, _ in contenu:
    if re.search(rb"sk-ant-[a-z0-9]+-[A-Za-z0-9_-]{20,}", fichier.read_bytes()):
        sys.exit(f"Clé API trouvée dans {fichier} : paquet annulé.")

with zipfile.ZipFile(sortie, "w", zipfile.ZIP_DEFLATED) as zf:
    for fichier, chemin in contenu:
        zf.write(fichier, f"{nom}/{chemin}")

print(f"{sortie} ({sortie.stat().st_size // 1024} Ko, {len(contenu)} fichiers)")
