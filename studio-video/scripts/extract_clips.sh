#!/usr/bin/env bash
# Usage: ./extract_clips.sh <enregistrement.mp4>
# Extrait les segments utiles de l'enregistrement d'écran iPhone (1180x2556) en JPG 60 i/s, 780 px de large.
# Le drawbox masque la pastille rouge "enregistrement" dans la Dynamic Island (coordonnées pour 1180x2556).
# ADAPTER les timecodes (début, durée) à chaque nouvel enregistrement : repérer via planche contact (voir README).
set -e
V="$1"; OUT="$(dirname "$0")/../app/clips"; rm -rf "$OUT"; mkdir -p "$OUT"
ex(){ mkdir -p "$OUT/$1"; ffmpeg -v error -ss "$2" -t "$3" -i "$V" \
  -vf "drawbox=x=352:y=63:w=52:h=52:color=black:t=fill,fps=60,scale=780:-1:flags=lanczos" -q:v 2 "$OUT/$1/%04d.jpg"
  echo "$1: $(ls "$OUT/$1" | wc -l) frames"; }
#  nom   début  durée   contenu
ex onb   14.4   3.0     # fin d'onboarding : case CGU cochée -> "C'est parti" -> accueil
ex grp   22.8   5.6     # liste des groupes (scroll)
ex chat  46.2   4.0     # chat "Rando" : frappe + envoi "Je serai là !"
ex map   56.8   5.6     # carte satellite + POI
ex ag    75.6   3.6     # agenda : inscription "Concert live" + toast
ex inf   81.0   3.0     # livret d'accueil (Infos utiles)
ex sig   89.4   0.7     # formulaire "Signaler un problème"
echo "IMPORTANT : reporter les nombres de frames dans CLIPS de app/index.html"
