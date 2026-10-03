#!/usr/bin/env bash
# Pipeline complet CampConnect pub v2 (44 s, 1080x1920). Prérequis : ffmpeg, python3 (numpy scipy pillow opencv-python), node 20+.
set -e
REC="${1:?Usage: ./pipeline.sh enregistrement.mp4}"
cd "$(dirname "$0")"
mkdir -p out v2/textes kit
# 0. dépendances
(cd app && npm install && npm i playwright@1.56 @fontsource/plus-jakarta-sans @fontsource/dm-sans && npx playwright install chromium)
pip install numpy scipy pillow opencv-python qrcode fonttools brotli 2>/dev/null || pip install --break-system-packages numpy scipy pillow opencv-python qrcode fonttools brotli
# 1. logo vectorisé HD + QR (déjà présents dans app/assets ; relancer si la planche logo change)
# python3 scripts/logo.py
# 2. rushs
bash scripts/extract_clips.sh "$REC"
# 3. musique + sound design (génération procédurale, 120 BPM, calée sur la timeline)
python3 scripts/music2.py
# 4. rendu vidéo (complet / fond sans texte / 22 calques texte alpha)
(cd app && node render2.js full && node render2.js plate && node render2.js text)
# 5. mux audio
ffmpeg -y -v error -i v2/full_silent.mp4 -i v2/mix_full.wav -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/CampConnect_pub_v2_9x16.mp4
ffmpeg -y -v error -i v2/full_silent.mp4 -i v2/sfx_seul.wav -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/CampConnect_pub_v2_9x16_sans_musique.mp4
# 6. kit DaVinci (FCPXML) — adapter BASE dans scripts/make_fcpxml.py au dossier final
python3 scripts/make_fcpxml.py
echo "OK -> out/ et kit/"
