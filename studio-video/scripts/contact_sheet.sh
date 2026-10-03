#!/usr/bin/env bash
# Planche contact horodatée pour repérer les timecodes : ./contact_sheet.sh video.mp4 [debut] [duree] [fps]
V="$1"; S="${2:-0}"; D="${3:-999}"; F="${4:-1}"
ffmpeg -v error -ss "$S" -t "$D" -i "$V" -vf "fps=$F,scale=200:-1,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='%{pts\:flt}':x=5:y=60:fontsize=22:fontcolor=red:box=1,tile=10x8:padding=2" sheet_%02d.jpg
echo "-> sheet_XX.jpg (temps affiché = secondes depuis $S)"
