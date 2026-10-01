"""Prepare a public asset tree without source artwork, backups, or tooling."""

import os
import shutil
import sys
from pathlib import Path


root = Path(__file__).resolve().parent.parent
target = root / (sys.argv[1] if len(sys.argv) > 1 else ".pages-deploy-map-refresh")
if target.parent != root or not target.name.startswith(".pages-deploy-"):
    raise SystemExit("Deployment directory must be a .pages-deploy-* directory in the project root")
if target.exists():
    raise SystemExit(f"Deployment directory already exists: {target}")
target.mkdir()

excluded_directories = {
    ".git", ".vscode", ".wrangler", ".repair-backups",
    "scripts", "functions", "復元用", "マップ", "game-maps", "多数派アンケート",
    "作業中かold",
}
excluded_suffixes = {".psd", ".ps1", ".py", ".md"}
excluded_files = {".assetsignore", ".gitignore", "wrangler.jsonc", "NPC情報.txt"}
count = 0
size = 0
for base, directories, files in os.walk(root):
    directories[:] = [
        directory for directory in directories
        if directory.lower() not in {name.lower() for name in excluded_directories}
        and directory.lower() != "old"
        and not directory.startswith(".restore-")
        and not directory.startswith(".pages-deploy-")
    ]
    for filename in files:
        source = Path(base) / filename
        if filename in excluded_files or source.suffix.lower() in excluded_suffixes:
            continue
        if source.stat().st_size > 25 * 1024 * 1024:
            raise SystemExit(f"Asset exceeds 25 MB: {source}")
        destination = target / source.relative_to(root)
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.link(source, destination)
        except OSError:
            shutil.copy2(source, destination)
        count += 1
        size += source.stat().st_size

for required in ("index.html", "map/index.html", "app.js", "game-assets/maps/m1-game.webp"):
    if not (target / required).is_file():
        raise SystemExit(f"Required public asset is missing: {required}")
print(f"Prepared {count} assets ({size / 1024 / 1024:.1f} MiB) in {target}")
