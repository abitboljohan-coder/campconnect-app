#!/usr/bin/env bash
# Mode nuit du studio CampConnect : produit UNE vidéo courte, d'une commande,
# depuis un clone neuf du dépôt. Mode d'emploi complet : studio-video/NUIT.md.
#
#   bash studio-video/nuit.sh                      # thème du jour (rotation par date)
#   bash studio-video/nuit.sh --theme pub-en       # un thème précis
#   bash studio-video/nuit.sh --date 2026-10-04    # le thème d'une autre date
#   bash studio-video/nuit.sh --liste              # les thèmes et la rotation
#
# Sorties : studio-video/out/nuit/  (MP4 web, vignette.jpg, planche.jpg, fiche.json, qc.txt)
# Code de sortie ≠ 0 et message « ÉCHEC … » si une étape ou le contrôle qualité échoue.
set -euo pipefail

STUDIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RACINE="$(dirname "$STUDIO")"
# NUIT_OUT : un autre dossier de sortie (pour tester plusieurs thèmes en parallèle).
OUT="${NUIT_OUT:-$STUDIO/out/nuit}"
WORK="$OUT/work"
DATE="$(TZ=Europe/Paris date +%F)"
THEME=""
PORT="${PORT:-5199}"

while [ $# -gt 0 ]; do
  case "$1" in
    --date) DATE="$2"; shift 2 ;;
    --theme) THEME="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --liste)
      python3 - "$STUDIO/nuit/themes.json" <<'EOF'
import json, sys, datetime as dt
c = json.load(open(sys.argv[1], encoding='utf-8')); t = [x for x in c['themes'] if x.get('verifie')]
d0 = dt.date.fromisoformat(c['rotation_depuis']); auj = dt.date.today()
for i, th in enumerate(t):
    n = (auj - d0).days % len(t); j = (i - n) % len(t)
    print(f"{i:2d}  {th['slug']:26s} {th['langue']}  {th['format']:5s} prochain : {auj + dt.timedelta(days=j)}  {th['titre']}")
hors = [x['slug'] for x in c['themes'] if not x.get('verifie')]
if hors: print('hors rotation (à tester) : ' + ', '.join(hors))
EOF
      exit 0 ;;
    *) echo "Option inconnue : $1 (voir l'en-tête de $0)" >&2; exit 2 ;;
  esac
done

echec() { echo "ÉCHEC nuit : $*" >&2; exit 1; }
etape() { echo; echo "== $* ($(( $(date +%s) - T0 )) s)"; }
T0=$(date +%s)

# ---------------------------------------------------------------- dépendances
etape "1/7 Dépendances"
command -v node >/dev/null || echec "node introuvable (Node 20+ requis)"
command -v python3 >/dev/null || echec "python3 introuvable"
if [ ! -d "$RACINE/node_modules/vite" ]; then
  (cd "$RACINE" && npm ci --no-audit --no-fund --loglevel=error) || echec "npm ci de l'app"
fi
if [ ! -d "$STUDIO/app/node_modules/playwright" ]; then
  (cd "$STUDIO/app" && npm ci --no-audit --no-fund --loglevel=error) || echec "npm ci du studio"
fi
if ! python3 -c "import numpy, scipy, PIL" 2>/dev/null; then
  pip install -q numpy scipy pillow 2>/dev/null \
    || pip install -q --break-system-packages numpy scipy pillow 2>/dev/null \
    || echec "installation de numpy, scipy, pillow"
fi
# ffmpeg avec libx264 et ebur128 ; sinon le binaire statique d'imageio-ffmpeg (PyPI).
FFMPEG="${FFMPEG:-}"
if [ -z "$FFMPEG" ]; then
  if command -v ffmpeg >/dev/null && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then
    FFMPEG=ffmpeg
  else
    python3 -c "import imageio_ffmpeg" 2>/dev/null \
      || pip install -q imageio-ffmpeg 2>/dev/null \
      || pip install -q --break-system-packages imageio-ffmpeg 2>/dev/null \
      || echec "ffmpeg introuvable et imageio-ffmpeg impossible à installer"
    FFMPEG="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
  fi
fi
export FFMPEG
# Chromium : celui de l'image s'il existe, sinon celui de Playwright.
export CHROMIUM_PATH="${CHROMIUM_PATH:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
if [ ! -x "$CHROMIUM_PATH" ]; then
  unset CHROMIUM_PATH
  (cd "$STUDIO/app" && npx playwright install chromium >/dev/null) || echec "installation de Chromium (npx playwright install chromium)"
fi
python3 "$STUDIO/nuit/plan.py" --verifier >/dev/null || { python3 "$STUDIO/nuit/plan.py" --verifier; echec "themes.json invalide"; }

# ---------------------------------------------------------------- démo de l'app
etape "2/7 Démo de l'app (vite --mode demo)"
while curl -s -o /dev/null "http://localhost:$PORT/" 2>/dev/null; do PORT=$((PORT + 1)); done
rm -rf "$OUT"; mkdir -p "$WORK"
(cd "$RACINE" && exec node node_modules/vite/bin/vite.js --mode demo --port "$PORT" --strictPort >"$WORK/vite.log" 2>&1) &
VITE_PID=$!
# On n'arrête que le serveur lancé ici.
trap 'kill "$VITE_PID" 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://localhost:$PORT/demo.html" && break
  kill -0 "$VITE_PID" 2>/dev/null || { cat "$WORK/vite.log"; echec "la démo ne démarre pas"; }
  sleep 1
done
curl -s -o /dev/null "http://localhost:$PORT/demo.html" || echec "la démo ne répond pas sur le port $PORT"

# ---------------------------------------------------------------- thème du jour
etape "3/7 Thème"
ARGS=(--date "$DATE" --base "http://localhost:$PORT" --work "$WORK")
[ -n "$THEME" ] && ARGS+=(--theme "$THEME")
python3 "$STUDIO/nuit/plan.py" "${ARGS[@]}" || echec "choix du thème"

etape "4/7 Capture des écrans de la démo"
node "$STUDIO/nuit/capture.cjs" "$WORK/plan.json" || echec "capture (voir le message ci-dessus)"
kill "$VITE_PID" 2>/dev/null || true

etape "5/7 Rendu vidéo"
node "$STUDIO/nuit/render.cjs" "$WORK/plan.json" || echec "rendu (mise en page ou encodage)"

etape "6/7 Musique et sound design"
python3 "$STUDIO/scripts/music2.py" "$WORK/audio.json" || echec "musique"

etape "7/7 Mixage et contrôle qualité"
python3 "$STUDIO/nuit/finir.py" "$WORK" "$OUT" || echec "contrôle qualité : voir $OUT/qc.txt et $OUT/planche.jpg"

echo
echo "OK en $(( $(date +%s) - T0 )) s -> $OUT"
ls -la "$OUT" | grep -v '^total'
