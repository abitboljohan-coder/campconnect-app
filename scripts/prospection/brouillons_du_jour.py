# Crée les brouillons Infomaniak du jour par le webhook Make sécurisé.
# python3 brouillons_du_jour.py MMJJ AAAA-MM-JJ [version=1]
import json, glob, os, subprocess, sys, html, re
S = os.path.dirname(os.path.abspath(__file__))
jour, date = sys.argv[1], sys.argv[2]
version = int(sys.argv[3]) if len(sys.argv) > 3 else 1
HOOK = open(os.environ.get('HOOK_BROUILLON_FICHIER', f'{S}/hook-brouillon.txt')).read().strip()  # webhook Make, hors dépôt
CLE = open(os.environ.get('CLE_BROUILLON_FICHIER', f'{S}/cle-brouillon.txt')).read().strip()
LEGAL = ('<p style="font-size:12px;color:#888;margin-top:24px">CampConnect, entreprise immatriculée au RCS d\'Évry '
         '(SIREN 109 189 803). Vous recevez ce message car votre adresse figure sur le site de votre camping. '
         'Pour ne plus être contacté, répondez simplement STOP.</p>')
def para(t):
    t = html.escape(t).replace('\n', '<br>')
    return re.sub(r'(https://[^\s<]+)', r'<a href="\1">\1</a>', t)
os.makedirs(f'{S}/mails-{jour}', exist_ok=True)
ecritures = []
for f in sorted(glob.glob(f'{S}/crm-{jour}/prospects/*.json')):
    doc = os.path.basename(f)[:-5]; d = json.load(open(f))
    if d.get('note_brouillon') or not d.get('email') or not d.get('email_brouillon'): continue
    texte = d['email_brouillon'].strip()
    objet = d.get('email_objet', '')
    if texte.startswith('Objet :'):
        premiere, _, texte = texte.partition('\n')
        objet = premiere.replace('Objet :', '').strip(); texte = texte.strip()
    corps = ''.join(f'<p>{para(p)}</p>' for p in texte.split('\n\n') if p.strip()) + LEGAL
    r = subprocess.run(['curl', '-s', '-m', '60', '--form-string', f'cle={CLE}', '--form-string', f'destinataire={d["email"]}',
                        '--form-string', f'objet={objet}', '--form-string', f'html={corps}', HOOK], capture_output=True, text=True)
    print(f'{doc} | {d["email"]} | {objet} | {r.stdout.strip() or r.stderr.strip()}')
    if r.stdout.strip() == 'Accepted':
        p = f'{S}/mails-{jour}/{doc}.json'
        json.dump({'note_brouillon': f'Brouillon Infomaniak créé le {date}'}, open(p, 'w'), ensure_ascii=False)
        ecritures.append({'op': 'update', 'collection': 'prospects', 'doc_id': doc, 'if_version': version, 'file_path': p})
print(json.dumps(ecritures, ensure_ascii=False))
