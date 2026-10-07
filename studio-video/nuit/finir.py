"""Mixage final, contrôle qualité et livrables de la vidéo de nuit.

Usage : python3 nuit/finir.py <work> <out>
Lit <work>/plan.json, capture.json, film.json, muet.mp4, vignette.png, audio/mix_full.wav.
Écrit dans <out> : <date>-<slug>.mp4, vignette.jpg, planche.jpg, fiche.json, qc.txt.
Sort avec le code 4 (et la liste des défauts) si le contrôle qualité échoue.
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
LUFS_CIBLE = -14.0
POIDS_MAX = 8 * 1024 * 1024
FORMAT_AFFICHE = {'9x16': '9:16', '1x1': '1:1', '16x9': '16:9'}


def ff(*args, capture=True):
    r = subprocess.run([FFMPEG, '-hide_banner', '-nostats', *args], capture_output=capture, text=True)
    if r.returncode != 0:
        sys.exit(f'ÉCHEC ffmpeg {" ".join(args[:6])}… :\n{r.stderr[-1500:]}')
    return r.stderr


def loudnorm(src, dst):
    """Normalisation en deux passes à -14 LUFS (crête vraie -1,5 dB)."""
    flt = f'loudnorm=I={LUFS_CIBLE}:TP=-1.5:LRA=11'
    err = ff('-i', src, '-af', flt + ':print_format=json', '-f', 'null', '-')
    m = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    ff('-y', '-i', src, '-af',
       f"{flt}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
       f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
       '-ar', '48000', dst)


def duree(path):
    err = subprocess.run([FFMPEG, '-hide_banner', '-i', path], capture_output=True, text=True).stderr
    h, mi, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', err).groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def police(taille):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p):
            return ImageFont.truetype(p, taille)
    return ImageFont.load_default()


def planche(mp4, work, dest, fps=2):
    """Planche contact horodatée : 2 images par seconde."""
    d = os.path.join(work, 'planche')
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    ff('-i', mp4, '-vf', f'fps={fps},scale=300:-2', '-q:v', '3', os.path.join(d, '%03d.jpg'))
    fs = sorted(glob.glob(os.path.join(d, '*.jpg')))
    ims = [Image.open(f).convert('RGB') for f in fs]
    w, h = ims[0].size
    cols = 10 if h < w * 1.2 else 8
    rows = (len(ims) + cols - 1) // cols
    W = Image.new('RGB', (cols * (w + 4) + 4, rows * (h + 4) + 4), (30, 30, 30))
    dr = ImageDraw.Draw(W)
    f = police(18)
    for i, im in enumerate(ims):
        x, y = 4 + (i % cols) * (w + 4), 4 + (i // cols) * (h + 4)
        W.paste(im, (x, y))
        t = f'{i / fps:.1f}s'
        dr.rectangle([x, y, x + 62, y + 24], fill=(0, 0, 0))
        dr.text((x + 5, y + 2), t, fill=(255, 80, 80), font=f)
    W.save(dest, quality=82)
    return ims


def regard_seul(shot):
    """Plan sans geste (ni appui, ni saisie, ni défilement) mais avec un effet
    de caméra : l'écran reste immobile, c'est la loupe ou le zoom qui bouge.
    Un appui "clic": false (le doigt se pose, la vidéo coupe) ne compte pas."""
    gestes = ('appui', 'appuiLong', 'saisir', 'defiler')
    actions = [a for a in shot.get('actions', []) if not ('appui' in a and a.get('clic') is False)]
    return (not any(k in a for a in actions for k in gestes)
            and any(k in a for a in actions for k in ('zoom', 'loupe', 'notif')))


def controle_clips(work, cap, plan):
    """Chaque plan doit bouger : sinon une action n'a pas eu lieu (écran figé)."""
    pb = []
    for i, s in enumerate(cap['shots']):
        if s.get('erreurs'):
            pb.append(f"plan {i + 1} ({s['ecran']}) : erreur dans la démo : {s['erreurs'][0]}")
        fs = sorted(glob.glob(os.path.join(work, 'clips', str(i + 1), '*.jpg')))
        if len(fs) != s['images']:
            pb.append(f'plan {i + 1} : {len(fs)} images au lieu de {s["images"]}')
            continue
        a = Image.open(fs[0]).convert('L').resize((195, 422))
        b = Image.open(fs[-1]).convert('L').resize((195, 422))
        diff = ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
        if diff < 1.0 and not regard_seul(plan['shots'][i]):
            pb.append(f"plan {i + 1} ({s['ecran']}) : l'écran ne change pas (écart {diff:.2f})")
        # pas d'écran blanc ou vide : il faut du contenu
        if ImageStat.Stat(b).stddev[0] < 12:
            pb.append(f"plan {i + 1} ({s['ecran']}) : écran presque uni (page vide ?)")
    return pb


def main():
    work, out = sys.argv[1], sys.argv[2]
    plan = json.load(open(os.path.join(work, 'plan.json'), encoding='utf-8'))
    cap = json.load(open(os.path.join(work, 'capture.json'), encoding='utf-8'))
    film = json.load(open(os.path.join(work, 'film.json'), encoding='utf-8'))
    os.makedirs(out, exist_ok=True)
    nom = f"{plan['date']}-{plan['slug']}"
    mp4 = os.path.join(out, f'campconnect-{nom}.mp4')

    # 1. son normalisé puis mux (vidéo copiée telle quelle, AAC 160 k)
    norm = os.path.join(work, 'audio', 'mix_norm.wav')
    loudnorm(os.path.join(work, 'audio', 'mix_full.wav'), norm)
    ff('-y', '-i', os.path.join(work, 'muet.mp4'), '-i', norm, '-map', '0:v', '-map', '1:a',
       '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4)

    # 2. contrôle qualité
    pb = controle_clips(work, cap, plan)
    d = duree(mp4)
    if not 15 <= d <= 25.5:
        pb.append(f'durée {d:.1f} s (15 à 25 s attendues)')
    poids = os.path.getsize(mp4)
    if poids > POIDS_MAX:
        pb.append(f'poids {poids / 1e6:.1f} Mo (8 Mo au plus)')
    err = ff('-i', mp4, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-')
    resume = err[err.rindex('Summary:'):]
    lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', resume).group(1))
    if abs(lufs - LUFS_CIBLE) > 1.0:
        pb.append(f'loudness {lufs:.1f} LUFS (−14 ± 1 attendu)')
    err = ff('-i', mp4, '-map', '0:v', '-vf', 'blackdetect=d=0.1:pix_th=0.06,freezedetect=n=0.001:d=1.5', '-f', 'null', '-')
    if 'black_start' in err:
        pb.append('image noire détectée : ' + re.search(r'black_start:\S+', err).group(0))
    if 'freeze_start' in err:
        pb.append('image figée ≥ 1,5 s : ' + re.search(r'freeze_start: \S+', err).group(0))
    leg = plan['legende']
    mots = len(re.sub(r'#\S+', '', leg).split())
    if not 60 <= mots <= 120 or len(re.findall(r'#\w+', leg)) > 3:
        pb.append(f'légende hors règles ({mots} mots)')

    # 3. planche contact, vignette, fiche
    planche(mp4, work, os.path.join(out, 'planche.jpg'))
    Image.open(os.path.join(work, 'vignette.png')).convert('RGB').save(os.path.join(out, 'vignette.jpg'), quality=88)
    fiche = {
        'titre': plan['titre'], 'theme': plan['theme'], 'format': FORMAT_AFFICHE[plan['format']],
        'duree': round(d), 'langue': plan['langue'].upper(), 'legende': leg, 'date': plan['date'],
        'doc_id': nom, 'fichier': os.path.basename(mp4),
    }
    with open(os.path.join(out, 'fiche.json'), 'w', encoding='utf-8') as f:
        json.dump(fiche, f, ensure_ascii=False, indent=1)
    rapport = [f'vidéo     {os.path.basename(mp4)}', f'durée     {d:.2f} s ({film["W"]}×{film["H"]}, 30 i/s)',
               f'poids     {poids / 1e6:.2f} Mo', f'loudness  {lufs:.1f} LUFS',
               f'plans     ' + ', '.join(f"{s['ecran']} ({s['images'] / 30:.1f} s, {len(s['appuis'])} appui(s))" for s in cap['shots']),
               'QC        ' + ('OK' if not pb else 'ÉCHEC')] + ['  - ' + p for p in pb]
    open(os.path.join(out, 'qc.txt'), 'w', encoding='utf-8').write('\n'.join(rapport) + '\n')
    print('\n'.join(rapport))
    if pb:
        sys.exit(4)


if __name__ == '__main__':
    main()
