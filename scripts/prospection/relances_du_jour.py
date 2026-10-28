# Crée les brouillons de relance du jour (J+4 « en une phrase », puis J+15 « je clos le sujet »)
# par le webhook Make sécurisé. Rien n'est envoyé : ce sont des brouillons Infomaniak.
# python3 relances_du_jour.py AAAA-MM-JJ <dossier prospects> <dossier relances> [nombre=5] [--essai]
import json, glob, os, subprocess, sys, html, re, datetime as dt
S = os.path.dirname(os.path.abspath(__file__))
date = sys.argv[1]; P = sys.argv[2]; R = sys.argv[3]
N = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].isdigit() else 5
essai = '--essai' in sys.argv
CLE = open(os.environ.get('CLE_BROUILLON_FICHIER', f'{S}/cle-brouillon.txt')).read().strip()
HOOK = open(os.environ.get('HOOK_BROUILLON_FICHIER', f'{S}/hook-brouillon.txt')).read().strip()  # webhook Make, hors dépôt
LEGAL = ('<p style="font-size:12px;color:#888;margin-top:24px">CampConnect, entreprise immatriculée au RCS d\'Évry '
         '(SIREN 109 189 803). Vous recevez ce message car votre adresse figure sur le site de votre camping. '
         'Pour ne plus être contacté, répondez simplement STOP.</p>')
SIGN = 'Johan Abitbol\nCampConnect · 06 51 74 94 93'
jour = dt.date.fromisoformat(date)
age = lambda s: (jour - dt.date.fromisoformat(s[:10])).days if s else -1

prospects = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob(f'{P}/*.json')}
relances = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob(f'{R}/*.json')}

def bonjour(d):
    n = (d.get('contact_nom') or '').split()
    return f'Bonjour {n[0]},' if n else 'Bonjour,'

def de(nom):  # « de » contracté : du Camping X, de la Comtesse, des Pins, de l'Airial
    for a, b in (('Camping ', 'du camping '), ('Aux ', 'des '), ('Au ', 'du '), ('Flower ', 'du Flower '), ('Domaine ', 'du domaine '), ('Le ', 'du '), ('Les ', 'des '), ('La ', 'de la '), ("L'", "de l'")):
        if nom.startswith(a): return b + nom[len(a):]
    return 'de ' + nom

def textes(etape, d):
    nom = re.sub(r'\s*\(.*?\)', '', d.get('nom') or 'votre camping')
    if etape == 'r1':
        return (f'{nom}, en une phrase',
                f"{bonjour(d)}\n\nJe reviens vers vous en une phrase : avec CampConnect, vos vacanciers voient vos animations "
                f"et s'y inscrivent depuis leur téléphone, par un simple QR code à l'accueil.\n\n"
                f"Je peux vous préparer un aperçu {de(nom)} dans l'app, avec vos propres animations. "
                f"Je vous l'envoie ? Un simple « oui » suffit.\n\n{SIGN}")
    return ('Je clos le sujet',
            f"{bonjour(d)}\n\nJe ne veux pas vous encombrer, je clos le sujet de mon côté.\n\n"
            f"Si cet hiver, en préparant la saison 2027, vous voulez voir à quoi ressemblerait votre camping dans l'app, "
            f"répondez simplement « aperçu » et je vous l'envoie.\n\nBonne fin d'année,\n{SIGN}")

import re
def envoye_le(d):  # date d'envoi connue, ou brouillon créé il y a 3 jours (Johan l'envoie entre-temps)
    if d.get('etape') == 'email_envoye': return d.get('date_envoi')
    m = re.search(r'(\d{4}-\d{2}-\d{2})', d.get('note_brouillon') or '')
    if d.get('etape') == 'a_contacter' and m:
        return str(dt.date.fromisoformat(m.group(1)) + dt.timedelta(days=3))

def vivant(d):  # toujours sans réponse, adresse valide, pas en pause
    if not envoye_le(d) or not d.get('email'): return False
    pd = d.get('prochaine_date')
    return not (pd and pd[:10] > date)

choix = []
for k, d in prospects.items():   # clôtures d'abord (J+11 après la relance), puis relances (J+4 après le 1er mail)
    if vivant(d) and f'{k}-r1' in relances and f'{k}-r2' not in relances and age(relances[f'{k}-r1'].get('date')) >= 11:
        choix.append((0, relances[f'{k}-r1']['date'], k, 'r2'))
for k, d in prospects.items():
    if vivant(d) and f'{k}-r1' not in relances and age(envoye_le(d)) >= 4:
        choix.append((1, envoye_le(d), k, 'r1'))
choix = sorted(choix)[:N]

os.makedirs(f'{S}/relances-{date}', exist_ok=True)
ecritures = []
for _, _, k, etape in choix:
    d = prospects[k]; objet, texte = textes(etape, d)
    corps = ''.join(f'<p>{html.escape(p).replace(chr(10), "<br>")}</p>' for p in texte.split('\n\n')) + LEGAL
    if essai:
        print(f'--- {k} | {d["email"]} | {etape} | {objet}\n{texte}\n'); continue
    r = subprocess.run(['curl', '-s', '-m', '60', '--form-string', f'cle={CLE}', '--form-string', f'destinataire={d["email"]}',
                        '--form-string', f'objet={objet}', '--form-string', f'html={corps}', HOOK], capture_output=True, text=True)
    print(f'{k} | {d["email"]} | {etape} | {objet} | {r.stdout.strip() or r.stderr.strip()}')
    if r.stdout.strip() == 'Accepted':
        p = f'{S}/relances-{date}/{k}-{etape}.json'
        json.dump({'prospect': k, 'etape': etape, 'date': date, 'email': d['email'], 'objet': objet}, open(p, 'w'), ensure_ascii=False)
        ecritures.append({'op': 'set', 'collection': 'relances', 'doc_id': f'{k}-{etape}', 'file_path': p})
print(json.dumps(ecritures, ensure_ascii=False))
