const OLLAMA_URL = 'http://localhost:11434'

export const CAMPING_LIEUX = [
  { id: 'piscine',      label: 'Piscine',            emoji: '🏊', color: '#60a5fa', keywords: ['piscine','pool','swimming','natation','bassin'] },
  { id: 'toboggan',     label: 'Toboggan aquatique',  emoji: '🌊', color: '#60a5fa', keywords: ['toboggan','waterslide','slide','water slide'] },
  { id: 'pataugeoire',  label: 'Pataugeoire',         emoji: '🐣', color: '#60a5fa', keywords: ['pataugeoire','paddling','wading','shallow pool'] },
  { id: 'jacuzzi',      label: 'Jacuzzi / Spa',       emoji: '♨️', color: '#60a5fa', keywords: ['jacuzzi','spa','hot tub','bain bouillonnant'] },
  { id: 'plage',        label: 'Plage / Lac',         emoji: '🏖️', color: '#60a5fa', keywords: ['plage','beach','lac','lake','river','rivière','étang'] },
  { id: 'bar',          label: 'Bar / Snack',         emoji: '🍹', color: '#f59e0b', keywords: ['bar','snack','café','cafe','drink','buvette'] },
  { id: 'restaurant',   label: 'Restaurant',          emoji: '🍽️', color: '#f59e0b', keywords: ['restaurant','resto','dining','repas'] },
  { id: 'epicerie',     label: 'Épicerie',            emoji: '🛒', color: '#f59e0b', keywords: ['épicerie','epicerie','shop','supermarket','store','magasin'] },
  { id: 'boulangerie',  label: 'Boulangerie',         emoji: '🥐', color: '#f59e0b', keywords: ['boulangerie','bakery','pain','bread'] },
  { id: 'bbq',          label: 'BBQ commun',          emoji: '🔥', color: '#f59e0b', keywords: ['bbq','barbecue','grill','picnic'] },
  { id: 'distributeur', label: 'Distributeur',        emoji: '🏧', color: '#6b7280', keywords: ['distributeur','vending','automate'] },
  { id: 'tennis',       label: 'Tennis',              emoji: '🎾', color: '#10b981', keywords: ['tennis','court'] },
  { id: 'foot',         label: 'Terrain de foot',     emoji: '⚽', color: '#10b981', keywords: ['foot','soccer','football','terrain sport','goal'] },
  { id: 'volley',       label: 'Beach volley',        emoji: '🏐', color: '#10b981', keywords: ['volley','volleyball','beach volley'] },
  { id: 'petanque',     label: 'Pétanque',            emoji: '🎯', color: '#10b981', keywords: ['petanque','pétanque','boules','bocce'] },
  { id: 'pingpong',     label: 'Ping-pong',           emoji: '🏓', color: '#10b981', keywords: ['ping','pong','table tennis'] },
  { id: 'basket',       label: 'Basket',              emoji: '🏀', color: '#10b981', keywords: ['basket','basketball'] },
  { id: 'minigolf',     label: 'Minigolf',            emoji: '⛳', color: '#a78bfa', keywords: ['minigolf','mini golf','golf'] },
  { id: 'velo',         label: 'Location vélos',      emoji: '🚲', color: '#10b981', keywords: ['vélo','velo','bike','bicycle','cycle'] },
  { id: 'fitness',      label: 'Fitness / Gym',       emoji: '💪', color: '#10b981', keywords: ['fitness','gym','musculation','salle de sport'] },
  { id: 'skate',        label: 'Skate park',          emoji: '🛹', color: '#a78bfa', keywords: ['skate','skateboard'] },
  { id: 'archery',      label: "Tir à l'arc",         emoji: '🏹', color: '#10b981', keywords: ['archery','tir arc'] },
  { id: 'jeux',         label: 'Aire de jeux',        emoji: '🛝', color: '#a78bfa', keywords: ['playground','jeux','enfant','children','kids','aire de jeux'] },
  { id: 'miniclub',     label: 'Mini-club enfants',   emoji: '🧸', color: '#a78bfa', keywords: ['mini club','miniclub','kids club','club enfant'] },
  { id: 'trampoline',   label: 'Trampoline',          emoji: '🤸', color: '#a78bfa', keywords: ['trampoline','bouncy'] },
  { id: 'animation',    label: 'Espace animations',   emoji: '🎪', color: '#f472b6', keywords: ['animation','salle animation','events hall','amphithéâtre'] },
  { id: 'jeux_salle',   label: 'Salle de jeux',       emoji: '🎮', color: '#f472b6', keywords: ['salle de jeux','game room','arcade','billard','babyfoot'] },
  { id: 'cinema',       label: 'Cinéma / Spectacle',  emoji: '🎬', color: '#f472b6', keywords: ['cinema','outdoor cinema','spectacle','plein air'] },
  { id: 'disco',        label: 'Discothèque / Bar',   emoji: '🎵', color: '#f472b6', keywords: ['disco','discothèque','nightclub','soirée','dancing'] },
  { id: 'reception',    label: 'Réception',           emoji: '🏠', color: '#639922', keywords: ['reception','réception','accueil','office','welcome','entrée'] },
  { id: 'sanitaires',   label: 'Sanitaires',          emoji: '🚿', color: '#94a3b8', keywords: ['toilet','sanitaire','wc','shower','douche','bloc sanitaire','restroom'] },
  { id: 'laverie',      label: 'Laverie',             emoji: '🧺', color: '#94a3b8', keywords: ['laundry','laverie','wash','linge'] },
  { id: 'infirmerie',   label: 'Infirmerie',          emoji: '🏥', color: '#ef4444', keywords: ['infirmerie','medical','pharmacy','pharmacie','first aid','secours'] },
  { id: 'wifi',         label: 'Zone WiFi',           emoji: '📶', color: '#6b7280', keywords: ['wifi','wi-fi','internet','wireless'] },
  { id: 'poubelles',    label: 'Poubelles / Tri',     emoji: '♻️', color: '#6b7280', keywords: ['poubelle','trash','recycling','tri','déchets'] },
  { id: 'borne_elec',   label: 'Bornes électriques',  emoji: '⚡', color: '#f59e0b', keywords: ['borne électrique','electric','charging','recharge'] },
  { id: 'point_eau',    label: "Point d'eau",         emoji: '💧', color: '#60a5fa', keywords: ['point eau','water point','fontaine','robinet'] },
  { id: 'parking',      label: 'Parking',             emoji: '🅿️', color: '#6b7280', keywords: ['parking','car park','voiture','stationnement'] },
  { id: 'parking_velo', label: 'Parking vélos',       emoji: '🚴', color: '#6b7280', keywords: ['bike parking','parking vélo','abri vélo'] },
  { id: 'navette',      label: 'Arrêt navette',       emoji: '🚌', color: '#6b7280', keywords: ['navette','shuttle','bus','transport','arrêt'] },
  { id: 'station_gaz',  label: 'Station / Gaz',       emoji: '⛽', color: '#6b7280', keywords: ['station','gas','gaz','fuel','pompe'] },
  { id: 'foret',        label: 'Forêt / Nature',      emoji: '🌲', color: '#10b981', keywords: ['forest','forêt','bois','wood','nature'] },
  { id: 'rando',        label: 'Sentier randonnée',   emoji: '🥾', color: '#10b981', keywords: ['sentier','hiking','randonnée','trail','chemin'] },
]

// ── Ollama ───────────────────────────────────────────────────────────────────
async function askMoondream(base64, question) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'moondream', prompt: question, images: [base64], stream: false }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`Erreur Ollama (${res.status})`)
  const data = await res.json()
  return (data.response || '').toLowerCase().trim()
}

// ── Canvas : charge l'image et retourne un HTMLImageElement ─────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Canvas : découpe un rectangle de l'image → base64 JPEG ──────────────────
function cropImage(img, sx, sy, sw, sh) {
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  // Supprime le préfixe "data:image/jpeg;base64,"
  return canvas.toDataURL('image/jpeg', 0.8).replace(/^data:[^;]+;base64,/, '')
}

// ── Parse légende : "A=Minigolf, K=Tennis" → { a:'minigolf', k:'tennis' } ───
function extractLegendLetters(legendText) {
  const m = {}
  for (const part of legendText.split(/[\n,;]+/)) {
    const r = part.trim().match(/^([a-z])\s*[=:\-\s]+\s*(.+)$/i)
    if (r) m[r[1].toLowerCase()] = r[2].toLowerCase().trim()
  }
  return m
}

// ── Scan par grille : approche la plus précise pour un petit VLM ─────────────
//
// PRINCIPE :  au lieu de demander "où est X ?" sur toute l'image (difficile),
//             on découpe la carte en COLS×ROWS cellules et on demande pour
//             chaque cellule "qu'est-ce qui est visible ici ?" (facile).
//
// Ainsi "K=Tennis" dans la cellule (col=1, row=1) → x≈33%, y≈50%.
// La légende (en bas à gauche) est détectée et exclue.
//
async function scanGrid(planUrl, detected, letterMappings, onProgress) {
  const COLS = 6, ROWS = 4                   // 24 cellules — plus précis (±8% au lieu de ±12%)
  const img = await loadImage(planUrl)
  const W = img.naturalWidth, H = img.naturalHeight
  const cw = Math.floor(W / COLS), ch = Math.floor(H / ROWS)

  // Toutes les lettres de légende connues (pour les détecter dans les cellules)
  const allLetters = new Set(Object.keys(letterMappings))

  const positions  = {}   // lieu.id → {x, y}
  const cellScores = {}   // cellKey → nombre de lettres/mots de légende trouvés
                          //          (pour identifier la cellule-légende et l'exclure)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const num = row * COLS + col + 1
      onProgress?.(`Scan zone ${num}/${COLS * ROWS} de la carte...`)

      const cellB64 = cropImage(img, col * cw, row * ch, cw, ch)

      // Question simple : quels textes / labels sont visibles dans ce crop ?
      const ans = await askMoondream(cellB64,
        'What TEXT LABELS or WORDS do you see in this image? ' +
        'List facility names (Piscine, Tennis, Restaurant, Réception, Parking, Laverie, etc.), ' +
        'AND any single capital letter markers (A, B, C, K, etc.) placed on the image. ' +
        'Ignore decorative text or arrows. Reply with a comma-separated list or "none".'
      )

      if (!ans || ans === 'none' || ans.length < 2) {
        await new Promise(r => setTimeout(r, 80))
        continue
      }

      // Détecter si cette cellule EST la boîte de légende
      // (contient beaucoup de lettres consécutives de l'alphabet → c'est la légende)
      let legendLetterCount = 0
      for (const letter of allLetters) {
        // La légende liste les lettres avec "=" : "a=minigolf" → si l'IA lit "a minigolf" c'est la légende
        if (ans.includes(`${letter}=`) || ans.includes(`${letter} =`) || ans.match(new RegExp(`\\b${letter}\\b`))) {
          legendLetterCount++
        }
      }
      // La cellule légende a beaucoup de correspondances de lettres + les mots sont courts
      // Si legendLetterCount > 4, c'est probablement la légende → on skip
      if (legendLetterCount > 4) {
        await new Promise(r => setTimeout(r, 80))
        continue
      }

      const cx = ((col + 0.5) / COLS) * 100
      const cy = ((row + 0.5) / ROWS) * 100

      for (const lieu of detected) {
        if (positions[lieu.id]) continue

        const byName = lieu.keywords.some(kw => ans.includes(kw)) ||
                       ans.includes(lieu.label.toLowerCase())

        const ltr = Object.entries(letterMappings).find(([, n]) =>
          lieu.keywords.some(kw => n.includes(kw))
        )?.[0]
        // Lettre de légende : doit apparaître SEULE (ex: " k " ou "k,") pas dans un mot
        const byLetter = ltr && new RegExp(`\\b${ltr}\\b`).test(ans)

        if (byName || byLetter) {
          positions[lieu.id] = { x: cx, y: cy }
        }
      }

      await new Promise(r => setTimeout(r, 80))
    }
  }

  return positions
}

// ── Analyse principale ────────────────────────────────────────────────────────
export async function analyzeMapWithAI(planUrl, onProgress) {
  const match = planUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')
  const [, , base64] = match

  try {
    await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
  } catch {
    throw new Error("Ollama n'est pas démarré. Lancez Ollama depuis le menu Démarrer.")
  }

  // ── Phase 1 : Légende ────────────────────────────────────────────────────
  onProgress?.('Lecture de la légende de la carte...')
  const legendAnswer = await askMoondream(base64,
    'Does this camping map have a legend/key box listing letters and facility names ' +
    '(like "A=Minigolf, B=Reception, K=Tennis")? ' +
    'If yes, list ALL entries as "Letter=Name". If no legend, reply "no legend".'
  )

  const hasLegend = !legendAnswer.includes('no legend') && legendAnswer.length > 15
  const letterMappings = hasLegend ? extractLegendLetters(legendAnswer) : {}

  if (hasLegend) {
    const preview = Object.entries(letterMappings).slice(0, 5).map(([k, v]) => `${k.toUpperCase()}=${v}`).join(', ')
    onProgress?.(`Légende : ${preview}...`)
  }

  // ── Phase 2 : Détection ──────────────────────────────────────────────────
  onProgress?.('Détection des équipements...')

  const legendItems = hasLegend
    ? CAMPING_LIEUX.filter(l => l.keywords.some(kw => legendAnswer.includes(kw)))
    : []

  const overview = await askMoondream(base64,
    'List ALL facilities visible on this camping map: ' +
    'pool, bar, restaurant, reception, tennis, petanque, playground, minigolf, parking, ' +
    'toilets, laundry, shop, etc. Only include ones you are CERTAIN about. ' +
    'Comma-separated list in English.'
  )
  const overviewItems = CAMPING_LIEUX.filter(l => l.keywords.some(kw => overview.includes(kw)))

  const detectedIds = new Set()
  const detected = []
  for (const l of [...legendItems, ...overviewItems]) {
    if (!detectedIds.has(l.id)) { detectedIds.add(l.id); detected.push(l) }
  }

  if (detected.length === 0) {
    onProgress?.('Vérification un par un...')
    const common = CAMPING_LIEUX.filter(l =>
      ['piscine','bar','reception','sanitaires','parking','jeux','tennis','petanque','restaurant','laverie'].includes(l.id)
    )
    for (const l of common) {
      const ans = await askMoondream(base64, `Is there a ${l.keywords[0]} in this camping map? yes or no.`)
      if (ans.startsWith('yes')) detected.push(l)
      await new Promise(r => setTimeout(r, 80))
    }
  }

  if (detected.length === 0) throw new Error('Aucun équipement détecté.')
  onProgress?.(`${detected.length} équipement${detected.length > 1 ? 's' : ''} à localiser...`)

  // ── Phase 3 : Localisation par scan de grille ────────────────────────────
  //
  // C'est l'approche clé : on découpe l'image et on cherche dans chaque zone.
  // Bien plus fiable que demander au modèle de raisonner sur la position globale.
  //
  onProgress?.('Scan de la carte en cours (6×4 zones)...')
  const gridPositions = await scanGrid(planUrl, detected, letterMappings, onProgress)

  // ── Phase 4 : Construction des pins ─────────────────────────────────────
  const pins = []
  const jitter = () => (Math.random() - 0.5) * 4

  for (let i = 0; i < detected.length; i++) {
    const lieu = detected[i]
    const pos  = gridPositions[lieu.id]

    if (pos) {
      pins.push({
        ref_id: `lieu_ai_${Date.now()}_${i}`,
        ref_type: 'lieu',
        label: lieu.label,
        emoji: lieu.emoji,
        color: lieu.color,
        x: Math.min(93, Math.max(7, pos.x + jitter())),
        y: Math.min(93, Math.max(7, pos.y + jitter())),
      })
    }
  }

  // Fallback : équipements détectés mais non localisés → grille propre
  // Équipements non localisés par le scan → grille visible au centre de l'image
  const localized = new Set(pins.map(p => p.label))
  const unlocated = detected.filter(l => !localized.has(l.label))
  if (unlocated.length > 0) {
    const cols = 4
    unlocated.forEach((l, i) => {
      pins.push({
        ref_id: `lieu_ai_${Date.now()}_unlocated_${i}`,
        ref_type: 'lieu',
        label: l.label,
        emoji: l.emoji,
        color: l.color,
        // Grille centrée visible — à ajuster manuellement ensuite
        x: 15 + (i % cols) * 23,
        y: 25 + Math.floor(i / cols) * 20,
      })
    })
  }

  if (pins.length === 0) throw new Error('Positions introuvables. Utilisez le placement manuel.')

  onProgress?.(`✓ ${pins.length} pin${pins.length > 1 ? 's' : ''} (${localized.size} localisés, ${unlocated.length} à repositionner)`)
  return pins
}

// ── Détection des emplacements (numéros de parcelles) ────────────────────────
//
// Scanne le plan en grille 4×3 et demande à Moondream de lister les numéros
// d'emplacements visibles dans chaque cellule.
// Retourne des pins avec ref_type='emplacement' et ref_id='emplacement_42'.
//
export async function extractEmplacements(planUrl, onProgress) {
  const match = planUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')

  try {
    await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
  } catch {
    throw new Error("Ollama n'est pas démarré. Lancez Ollama depuis le menu Démarrer.")
  }

  const COLS = 6, ROWS = 5                   // 30 cellules — meilleure précision pour les emplacements
  const img = await loadImage(planUrl)
  const W = img.naturalWidth, H = img.naturalHeight
  const cw = Math.floor(W / COLS), ch = Math.floor(H / ROWS)

  const found = []   // { ref: string, x: number, y: number }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const num = row * COLS + col + 1
      onProgress?.(`Scan zone ${num}/${COLS * ROWS} — recherche des numéros d'emplacements...`)

      const cellB64 = cropImage(img, col * cw, row * ch, cw, ch)
      const ans = await askMoondream(cellB64,
        'List ALL campsite pitch numbers or plot codes visible in this image section. ' +
        'Pitch numbers are typically small numbers printed inside or next to camping plots: ' +
        '1, 12, 42, 103, or codes like 12b, A3. ' +
        'Reply ONLY with a comma-separated list (e.g. "12, 13, 42b"). If none visible, reply "none".'
      )

      if (!ans || ans.trim() === 'none' || ans.length < 1) {
        await new Promise(r => setTimeout(r, 80))
        continue
      }

      const cx = ((col + 0.5) / COLS) * 100
      const cy = ((row + 0.5) / ROWS) * 100

      // Parse: split on comma/space/semicolon, keep alphanumeric tokens
      const tokens = ans.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(s => s && s !== 'none' && /^[a-z]?\d+[a-z]?$/i.test(s))
      for (const ref of tokens) {
        if (!found.some(f => f.ref === ref)) {
          found.push({ ref, x: cx, y: cy })
        }
      }

      await new Promise(r => setTimeout(r, 80))
    }
  }

  if (found.length === 0) throw new Error('Aucun numéro d\'emplacement détecté. Vérifiez que le plan montre les numéros des parcelles.')

  const pins = found.map(f => ({
    ref_id: `emplacement_${f.ref}`,
    ref_type: 'emplacement',
    label: f.ref,
    emoji: '🏕️',
    color: '#639922',
    x: Math.min(95, Math.max(5, f.x)),
    y: Math.min(95, Math.max(5, f.y)),
  }))

  onProgress?.(`✓ ${pins.length} emplacement${pins.length > 1 ? 's' : ''} détecté${pins.length > 1 ? 's' : ''}`)
  return pins
}
