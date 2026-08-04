#!/usr/bin/env python3
"""Régénère l'écran de démarrage natif à partir du logo CampConnect.

    python3 scripts/generate_splash.py        (nécessite Pillow)

Produit :
  • assets/logo-mark.png            la marque détourée, source de vérité
  • assets/splash.png / -dark.png   les sources 2732², pour @capacitor/assets
  • les 11 drawables Android et les 3 déclinaisons iOS, écrits directement
    aux dimensions déjà présentes dans le projet

Deux partis pris :

  Le fond est celui de l'application (#faf7f0), pas un vert. Un écran de
  démarrage dont la couleur diffère de la première vue produit un clignotement
  à la reprise de la main par la WebView, et c'était le cas ici : vert foncé,
  puis crème.

  Aucun texte. Les recommandations d'Apple déconseillent d'en mettre sur un
  écran de lancement — il n'est pas localisable, il s'affiche avant toute
  logique applicative, et le nom de l'app figure déjà sous son icône.
"""
from PIL import Image
from pathlib import Path
import base64, io, sys

RACINE = Path(__file__).resolve().parent.parent
FOND = (250, 247, 240)          # #faf7f0, le fond de l'application
SOURCE = RACINE / 'assets' / 'icon-only.png'

# Proportion de la largeur visible occupée par la marque.
PART_MARQUE = 0.30
# Rapport largeur/hauteur d'un téléphone récent, portrait puis paysage. Les
# images de démarrage sont recadrées au centre pour remplir l'écran : sans
# tenir compte de ce recadrage, une marque dimensionnée sur la largeur du
# fichier déborderait largement sur un écran plus étroit.
RATIO_PORTRAIT = 1284 / 2778
RATIO_PAYSAGE = 2778 / 1284


def detourer(src: Path) -> Image.Image:
    """Retire le fond blanc de l'icône, en préservant l'anticrénelage."""
    im = Image.open(src).convert('RGBA')
    px = im.load()
    out = Image.new('RGBA', im.size)
    o = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            m = min(r, g, b)
            if m > 240:
                o[x, y] = (r, g, b, 0)
            elif m > 190:
                o[x, y] = (r, g, b, int((240 - m) * 255 / 50))
            else:
                o[x, y] = (r, g, b, 255)
    # Recadrage sur le contenu réel : les coins arrondis de l'icône laissent un
    # anticrénelage gris qui fausserait une détection automatique de la boîte.
    return out.crop((130, 130, 870, 920))


def composer(marque: Image.Image, largeur: int, hauteur: int) -> Image.Image:
    ratio = RATIO_PAYSAGE if largeur > hauteur else RATIO_PORTRAIT
    visible = min(largeur, hauteur * ratio)
    cible = max(24, round(visible * PART_MARQUE))
    m = marque.resize((cible, round(marque.height * cible / marque.width)), Image.LANCZOS)
    toile = Image.new('RGB', (largeur, hauteur), FOND)
    toile.paste(m, ((largeur - m.width) // 2, (hauteur - m.height) // 2), m)
    return toile


def main() -> int:
    if not SOURCE.exists():
        print(f'✗ source introuvable : {SOURCE}', file=sys.stderr)
        return 1

    marque = detourer(SOURCE)
    (RACINE / 'assets' / 'logo-mark.png').write_bytes(b'')
    marque.save(RACINE / 'assets' / 'logo-mark.png')
    print(f'✓ assets/logo-mark.png  {marque.size}')

    cibles = [RACINE / 'assets' / 'splash.png', RACINE / 'assets' / 'splash-dark.png']
    for c in cibles:
        composer(marque, 2732, 2732).save(c)
        print(f'✓ {c.relative_to(RACINE)}  2732×2732')

    natifs = list((RACINE / 'android/app/src/main/res').glob('drawable*/splash.png'))
    natifs += list((RACINE / 'ios/App/App/Assets.xcassets/Splash.imageset').glob('*.png'))
    for f in sorted(natifs):
        w, h = Image.open(f).size
        composer(marque, w, h).save(f)
        print(f'✓ {f.relative_to(RACINE)}  {w}×{h}')

    # L'écran HTML affiché entre la disparition du splash natif et le premier
    # rendu de React utilise la même marque, en données intégrées : un fichier
    # externe se chargerait après le premier calque et provoquerait un saut.
    apercu = marque.resize((288, round(marque.height * 288 / marque.width)), Image.LANCZOS)
    q = apercu.quantize(colors=48, method=Image.FASTOCTREE)
    buf = io.BytesIO()
    q.save(buf, 'PNG', optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    (RACINE / 'assets' / 'logo-mark-inline.txt').write_text(
        f'data:image/png;base64,{b64}\n', encoding='utf-8')
    print(f'✓ assets/logo-mark-inline.txt  {len(b64) // 1024} Ko '
          '(à recopier dans index.html si la marque change)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
