"""Choisit le thème du jour et écrit <work>/plan.json.

Usage : python3 nuit/plan.py --date AAAA-MM-JJ [--theme slug] --base URL --work DIR
        python3 nuit/plan.py --verifier      (contrôle tous les thèmes, sans rien écrire)

Rotation déterministe : themes[(date - rotation_depuis) en jours modulo N].
Un thème sans « verifie »: true n'entre pas dans la rotation (il se teste à la
main avec --theme) : la nuit ne tombe que sur des thèmes rendus et regardés.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
FORMATS = {'9x16', '1x1', '16x9'}
LANGUES = {'fr', 'en', 'es', 'nl'}


def charger():
    with open(os.path.join(ICI, 'themes.json'), encoding='utf-8') as f:
        return json.load(f)


def defauts(th):
    """Liste des défauts d'un thème (vide = bon pour la nuit)."""
    pb = []
    if th.get('format') not in FORMATS:
        pb.append(f"format inconnu {th.get('format')}")
    if th.get('langue') not in LANGUES:
        pb.append(f"langue inconnue {th.get('langue')}")
    if not 1 <= len(th.get('plans', [])) <= 3:
        pb.append('il faut 1 à 3 plans')
    total = sum(p.get('duree', 0) for p in th.get('plans', []))
    # accroche 4 s + plans + valeur 2 s + fin 4 s : la vidéo dure 16 à 24 s
    if not 6 <= total <= 14:
        pb.append(f'plans : {total} s au total (6 à 14 s attendus)')
    if not 1 <= len(th.get('accroche', [])) <= 3:
        pb.append("l'accroche fait 1 à 3 lignes")
    # toujours finir sur ce que le gérant y gagne
    if not 1 <= len(th.get('valeur', [])) <= 3:
        pb.append('la valeur pour le gérant fait 1 à 3 lignes')
    for i, p in enumerate(th.get('plans', [])):
        if p.get('cote') not in ('vacanciers', 'gerant'):
            pb.append(f'plan {i + 1} : cote = vacanciers ou gerant')
        if not 1 <= len(p.get('titre', [])) <= 2:
            pb.append(f'plan {i + 1} : titre de 1 ou 2 lignes')
        if p.get('langue', th.get('langue')) not in LANGUES:
            pb.append(f'plan {i + 1} : langue inconnue')
    leg = th.get('legende', '')
    mots = len(re.sub(r'#\S+', '', leg).split())
    tags = len(re.findall(r'#\w+', leg))
    if not 60 <= mots <= 120:
        pb.append(f'légende : {mots} mots (60 à 120 attendus)')
    if tags > 3:
        pb.append(f'légende : {tags} hashtags (3 au plus)')
    return pb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--date')
    ap.add_argument('--theme')
    ap.add_argument('--base', default='http://localhost:5199')
    ap.add_argument('--work')
    ap.add_argument('--verifier', action='store_true')
    a = ap.parse_args()
    cfg = charger()
    themes = cfg['themes']

    if a.verifier:
        ok = True
        for th in themes:
            pb = defauts(th)
            print(('OK    ' if not pb else 'ÉCHEC ') + th['slug'] + ('' if not pb else ' : ' + ' ; '.join(pb)))
            ok = ok and not pb
        sys.exit(0 if ok else 1)

    date = dt.date.fromisoformat(a.date)
    if a.theme:
        th = next((t for t in themes if t['slug'] == a.theme), None)
        if not th:
            sys.exit(f"ÉCHEC : thème inconnu « {a.theme} ». Thèmes : {', '.join(t['slug'] for t in themes)}")
    else:
        rot = [t for t in themes if t.get('verifie')]
        if not rot:
            sys.exit('ÉCHEC : aucun thème vérifié dans themes.json')
        n = (date - dt.date.fromisoformat(cfg['rotation_depuis'])).days
        th = rot[n % len(rot)]
    pb = defauts(th)
    if pb:
        sys.exit(f"ÉCHEC : thème {th['slug']} invalide : " + ' ; '.join(pb))

    plan = {
        'base': a.base, 'date': date.isoformat(), 'heure': th.get('heure', '16:40'),
        'slug': th['slug'], 'titre': th['titre'], 'theme': th['theme'],
        'langue': th['langue'], 'format': th['format'],
        'accroche': th['accroche'], 'valeur': th['valeur'], 'textes': cfg['textes'][th['langue']],
        'legende': th['legende'],
        # un plan peut avoir sa propre langue (l'interface en 4 langues)
        'shots': [dict(p, langue=p.get('langue', th['langue'])) for p in th['plans']],
    }
    os.makedirs(a.work, exist_ok=True)
    with open(os.path.join(a.work, 'plan.json'), 'w', encoding='utf-8') as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
    print(f"Thème du {date.isoformat()} : {th['titre']} ({th['slug']}, {th['langue']}, {th['format']})")


if __name__ == '__main__':
    main()
