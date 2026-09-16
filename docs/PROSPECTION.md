# Prospection Toolkit 🎯

Automatisez votre prospection CampConnect : scrape les campings, génère le PDF marketing et exporte une liste prête pour email.

## Quick Start

```bash
# Générer kit complet (PDF + CSV) pour une région
npm run scrape:campings "provence"

# Ou depuis la racine
node scripts/prospection-kit.js "provence"
```

**Résultat :**
- `data/campings-provence.csv` — Liste des campings
- `docs/campconnect-prospection.pdf` — PDF à envoyer

---

## Scripts disponibles

### 1️⃣ `prospection-kit.js` (RECOMMENDED)
**All-in-one** : scrape + PDF + instructions

```bash
node scripts/prospection-kit.js [region]
```

**Options :**
- `[region]` — Optionnel : Provence, Aquitaine, Dordogne, Languedoc, Bretagne, Loire, Alpes, Normandie
- Sans région = scrape TOUTES les régions

**Output :**
```
data/campings.csv                      # Tous les campings
docs/campconnect-prospection.pdf       # PDF marketing
```

### 2️⃣ `scrape-campings-advanced.js`
Utilise **Puppeteer** (headless browser) pour scraper acamping.fr

```bash
node scripts/scrape-campings-advanced.js "provence" "campings-provence.csv"
```

**Paramètres :**
- `region` — Filtre par région (optionnel)
- `output.csv` — Nom du fichier de sortie (défaut: `campings.csv`)

### 3️⃣ `generate-pdf.js`
Génère le PDF prospection depuis le template HTML

```bash
node scripts/generate-pdf.js
```

---

## Régions disponibles

```
Provence, Aquitaine, Dordogne, Languedoc, Bretagne,
Loire, Alpes, Normandie
```

(Facilement extensible dans `REGIONS` object)

---

## CSV Format

```csv
Nom,Région,Téléphone,Email,Adresse,Lien
"Camping Les Pins Verts","PROVENCE","04 92 XX XX XX","contact@example.fr","Sisteron, 04200","https://acamping.fr/..."
```

---

## Stratégie d'outreach

### 1. Filtrer la liste CSV

```excel
Campings 3-5 étoiles + 150-400 emplacements = ROI meilleur
(Découverte: 490 €/an, sweet spot: Essentiel 790 €/an)
```

Supprime les lignes sans email → crée liste de 50-100 contacts.

### 2. Mail merge (FREE)

**Option A: Gmail + MailMerge extension**
- Importe CSV dans Gmail Contacts
- Utilise MailMerge add-on
- Envoie avec template personnalisé

**Option B: Google Sheets (native)**
- Importe CSV dans Sheet
- Tools → Mail Merge
- Configure avec Gmail account

**Option C: HubSpot (FREE CRM)**
- Import CSV
- Create email campaign
- Track opens/clicks
- Automate follow-ups

### 3. Email template

> ⚠️ La version précédente de ce modèle listait six fonctionnalités à la
> suite. C'est exactement ce que `PITCH_COMMERCIAL.md` interdit : **un gérant
> n'achète pas un logiciel, il achète moins de problèmes.** Une liste de
> fonctionnalités oblige le lecteur à faire lui-même le travail de traduction
> vers sa propre situation — et il ne le fait pas, il archive le message.

```
Objet : une question sur votre camping

Bonjour [Nom],

Je me demandais si vous observez la même chose que les gérants à qui
je parle : les vacanciers ont envie de se rencontrer, mais personne
n'ose. Il manque un quatrième à la pétanque, les parents espèrent que
les enfants vont se trouver, et tout le monde reste sur son
emplacement.

On a créé CampConnect pour ça. Chaque camping a son espace privé : les
vacanciers y entrent par QR code, sans compte ni mot de passe, créent
leurs groupes et s'organisent entre eux. De votre côté, vous publiez
une animation et vous voyez qui s'inscrit — plus besoin de deviner si
vous sortez douze chaises ou quarante.

Je cherche trois campings pilotes pour la saison 2026. C'est gratuit,
et je ne demande qu'un retour honnête en échange.

Est-ce que ça vous dirait d'en parler dix minutes ?

Johan Abitbol — CampConnect
contact@campconnect.fr
```

Ce qui fait tenir ce message : il ouvre sur **sa** réalité, pas sur le
produit ; il ne cite qu'un seul bénéfice chiffrable, les inscriptions ; et il
demande une conversation, pas une décision.

**Attache :** `campconnect-prospection.pdf`

**Si vous ajoutez un numéro de téléphone**, mettez-le à la main. Il n'est
volontairement pas dans ce dépôt, qui est public.

**Avant d'envoyer**, relisez `PITCH_COMMERCIAL.md` — la section « Les
questions qu'on va vous poser » couvre ce qu'un gérant intéressé demandera en
réponse : RGPD, modération, langues, hébergement, ce qui se passe si vous
arrêtez.

### 4. Fréquence de suivi

- **Day 0 :** Email initial + PDF
- **Day 2 :** Mail de relance ("une question ?")
- **Day 4 :** Appel / WhatsApp + invitation démo
- **Week 2 :** Dernier mail ("offre pilote")

**Target :** 5% de conversion = excellent (vs 1% baseline)

---

## Troubleshooting

### CSV vide / Pas de résultats

**Cause :** acamping.fr a changé sa structure HTML

**Fix :**
1. Ouvre https://acamping.fr/camping/search
2. Inspecte l'élément (F12)
3. Finds les sélecteurs CSS pour : nom, email, téléphone
4. Update `const selectors = {...}` dans `scrape-campings-advanced.js`

### Erreur de Puppeteer

```
Error: Chromium revision is not downloaded
```

**Fix :**
```bash
npm install puppeteer --force
```

### Email bloqués / Spam

Si beaucoup de campings sans email dans la liste :
- Appelle directement (Google : "camping [région]")
- Cherche le site web → cherche "contact"
- LinkedIn direct message aux directeurs

---

## Performance

- **Scrape 1 région :** ~2-3 min (respectful delays)
- **PDF gen :** ~5 sec
- **Total kit :** ~3-4 min

**80+ campings extraits typiquement par région**

---

## Notes légales

✅ **Respectueux :**
- Pas de DoS (délais entre requêtes)
- User-Agent correct
- No automation of purchases
- Data = contact info public

⚠️ **À vérifier :**
- Terms of service acamping.fr
- CNIL consent (contact lists)
- CAN-SPAM compliance (US) / RGPD (EU)

Pour l'outreach B2B français = OK si message pertinent et option unsubscribe.

---

## Next iteration

- [ ] DB persistence (Supabase campings table)
- [ ] Auto phone number extraction (scrape sites web)
- [ ] Duplicate detection
- [ ] Bulk email via Resend API
- [ ] Campaign tracking dashboard

