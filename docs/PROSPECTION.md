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

```
Subject: CampConnect — Votre camping mérite une app mobile 📱

Body:
---

Bonjour [Nom],

En camping, les vraies connexions se font entre vacanciers.

Découvrez comment CampConnect transforme l'expérience de vos
vacanciers en 48h :

🗺️  Carte GPS interactive
👥 Groupes spontanés
💬 Chat temps réel
📅 Agenda animations
📖 Livret d'accueil numérique
📊 Dashboard gérant complet

→ Tout white-label à vos couleurs (logo + palette)
→ Opérationnel en 48h
→ À partir de 490 €/an

Voir la démo en pièce jointe.

Parlons-en ? Je peux vous montrer en 15 min comment ça fonctionne.

contact@campconnect.fr
+336 XX XX XX XX

---
```

**Attache:** `campconnect-prospection.pdf`

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

