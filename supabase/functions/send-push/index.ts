// ─────────────────────────────────────────────────────────────────────────────
// Edge Function : envoi des notifications push
//
// Deux transports, et ce n'est pas un choix esthétique.
//
// @capacitor/push-notifications ne passe pas par Firebase sur iOS : son code
// natif renvoie le deviceToken brut d'APNs, encodé en hexadécimal, sans jamais
// toucher au SDK Firebase. FCM, lui, n'accepte que ses propres jetons
// d'enregistrement. Envoyer un jeton APNs à FCM le fait rejeter — les push
// Android auraient marché, les push iOS jamais, et sans erreur visible dans
// l'application.
//
//   Android → FCM HTTP v1   (jeton FCM, via google-services.json)
//   iOS     → APNs          (jeton APNs, via la clé .p8)
//
// Le routage se fait sur push_tokens.platform, que le client renseigne déjà.
//
// Déclenchée par un Database Webhook Supabase sur INSERT de :
//   • messages    → notifie les membres présents du groupe (sauf l'auteur)
//   • animations  → notifie tous les vacanciers présents du camping (si publiée)
//
// Secrets requis (supabase secrets set ...) :
//   FCM_SERVICE_ACCOUNT   = contenu JSON du compte de service Firebase (Android)
//   PUSH_WEBHOOK_SECRET   = secret partagé avec le webhook (OBLIGATOIRE)
//   APNS_KEY_P8           = contenu de la clé .p8 Apple            (iOS)
//   APNS_KEY_ID           = identifiant de cette clé, 10 caractères
//   APNS_TEAM_ID          = identifiant d'équipe Apple, 10 caractères
//   APNS_BUNDLE_ID        = défaut com.campconnect.ios (voir plus bas)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY = injectés automatiquement
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FCM_SA        = Deno.env.get('FCM_SERVICE_ACCOUNT')!
const APNS_P8       = Deno.env.get('APNS_KEY_P8')
const APNS_KEY_ID   = Deno.env.get('APNS_KEY_ID')
const APNS_TEAM_ID  = Deno.env.get('APNS_TEAM_ID')
// Et non com.campconnect.app, qui est le package Android. Les deux plateformes
// ne portent pas le même identifiant ici : PRODUCT_BUNDLE_IDENTIFIER vaut
// com.campconnect.ios dans le projet Xcode. Or APNs exige que l'en-tête
// apns-topic corresponde exactement au bundle de l'application — le package
// Android y aurait fait rejeter chaque notification par un 400 BadTopic,
// après que tout le reste de la chaîne eut été correctement configuré.
const APNS_BUNDLE   = Deno.env.get('APNS_BUNDLE_ID') || 'com.campconnect.ios'
// Le secret n'est pas optionnel.
//
// Cette fonction est joignable depuis l'extérieur, et la clé anonyme de
// Supabase est publique par construction — elle est dans le bundle de l'app.
// Sans secret partagé, n'importe qui pouvant lire ce bundle peut appeler la
// fonction avec { table: 'animations', record: { publiee: true, camping_id } }
// et faire sonner tous les téléphones d'un camping. On refuse donc de servir
// tant qu'il n'est pas posé, plutôt que de laisser la porte ouverte par
// simple omission de configuration.
const WEBHOOK_SECRET = Deno.env.get('PUSH_WEBHOOK_SECRET')

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
const todayISO = () => new Date().toISOString().slice(0, 10)

// ── OAuth2 : jeton d'accès FCM via le compte de service (JWT RS256) ──────────
let _cache: { token: string; exp: number } | null = null

async function getAccessToken(): Promise<{ token: string; projectId: string }> {
  const sa = JSON.parse(FCM_SA)
  const projectId = sa.project_id
  if (_cache && _cache.exp > Date.now() + 60_000) return { token: _cache.token, projectId }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)))
  const unsigned = `${enc(header)}.${enc(claim)}`
  const key = await importKey(sa.private_key)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const json = await res.json()
  if (!json.access_token) throw new Error('FCM token error: ' + JSON.stringify(json))
  _cache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 }
  return { token: json.access_token, projectId }
}

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

// ── Envoi FCM v1 (un message par token, purge des tokens morts) ──────────────
type Tok = { token: string; device_id: string; platform: string | null }

const LOT = 100

async function sendFcm(tokens: Tok[], notif: { title: string; body: string }, data: Record<string, string>) {
  if (!tokens.length) return
  const { token: access, projectId } = await getAccessToken()
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const morts: string[] = []

  // Par lots, et non tous d'un coup : un camping de plusieurs centaines de
  // vacanciers ouvrirait autant de requêtes simultanées, ce que la fonction
  // ne tient pas. Les lots partent l'un après l'autre, chacun en parallèle.
  for (let i = 0; i < tokens.length; i += LOT) {
    await Promise.all(tokens.slice(i, i + LOT).map(async (t) => {
      const message = {
        message: {
          token: t.token,
          notification: { title: notif.title, body: notif.body },
          data,
          android: { priority: 'HIGH', notification: { sound: 'default' } },
        },
      }
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
      if (r.ok) return

      // Seul 404 (UNREGISTERED) dit que le token est mort. 403 signale une
      // erreur de configuration Firebase — projet mal apparié, compte de
      // service d'un autre projet — et 400 peut venir d'un message mal formé,
      // donc de nous. Purger sur ces codes-là viderait la table entière au
      // premier déploiement de travers, et tous les appareils cesseraient de
      // recevoir quoi que ce soit sans que rien ne le signale.
      if (r.status === 404) { morts.push(t.device_id); return }
      console.error('FCM', r.status, (await r.text()).slice(0, 200))
    }))
  }

  if (morts.length) await admin.from('push_tokens').delete().in('device_id', morts)
}

// ── APNs (iOS) ───────────────────────────────────────────────────────────────
//
// Le jeton d'autorisation est un JWT ES256 signé par la clé .p8. Apple impose
// de le renouveler au moins toutes les heures et refuse qu'on en génère plus
// d'un toutes les vingt minutes : on le garde donc cinquante minutes.
let _apns: { jwt: string; exp: number } | null = null

async function apnsJwt(): Promise<string> {
  if (_apns && _apns.exp > Date.now()) return _apns.jwt

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'ES256', kid: APNS_KEY_ID, typ: 'JWT' }
  const claim = { iss: APNS_TEAM_ID, iat: now }
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)))
  const unsigned = `${enc(header)}.${enc(claim)}`

  const body = APNS_P8!
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  )
  // WebCrypto rend déjà la signature au format brut r||s attendu par APNs :
  // aucune conversion depuis DER n'est nécessaire, contrairement à OpenSSL.
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned),
  )
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`
  _apns = { jwt, exp: Date.now() + 50 * 60_000 }
  return jwt
}

const APNS_PROD = 'https://api.push.apple.com'
const APNS_DEV  = 'https://api.sandbox.push.apple.com'

async function sendApns(tokens: Tok[], notif: { title: string; body: string }, data: Record<string, string>) {
  if (!tokens.length) return
  if (!APNS_P8 || !APNS_KEY_ID || !APNS_TEAM_ID) {
    console.error(`APNs non configuré : ${tokens.length} appareil(s) iOS ignoré(s).`)
    return
  }
  const jwt = await apnsJwt()
  const charge = JSON.stringify({
    aps: { alert: { title: notif.title, body: notif.body }, sound: 'default', badge: 1 },
    ...data,
  })
  const morts: string[] = []

  const envoyer = (hote: string, t: Tok) => fetch(`${hote}/3/device/${t.token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': APNS_BUNDLE,
      'apns-push-type': 'alert',
      'apns-priority': '10',
    },
    body: charge,
  })

  for (let i = 0; i < tokens.length; i += LOT) {
    await Promise.all(tokens.slice(i, i + LOT).map(async (t) => {
      let r = await envoyer(APNS_PROD, t)

      // BadDeviceToken ne veut pas dire « jeton mort » : il veut presque
      // toujours dire « mauvais environnement ». Un appareil qui installe
      // l'app depuis Xcode reçoit un jeton de bac à sable, que la passerelle
      // de production refuse — et inversement pour TestFlight. On retente
      // donc l'autre passerelle avant de conclure quoi que ce soit.
      if (r.status === 400) {
        const raison = await r.clone().json().catch(() => ({}))
        if (raison?.reason === 'BadDeviceToken') r = await envoyer(APNS_DEV, t)
      }
      if (r.ok) return

      // 410 Unregistered est le seul verdict sans appel : l'appareil a
      // desinstallé l'app. Le reste est journalisé, jamais purgé — un 403
      // signale une clé mal configurée, et purger dessus viderait la table.
      if (r.status === 410) { morts.push(t.device_id); return }
      console.error('APNs', r.status, (await r.text()).slice(0, 200))
    }))
  }

  if (morts.length) await admin.from('push_tokens').delete().in('device_id', morts)
}

// ── Aiguillage ───────────────────────────────────────────────────────────────
//
// La plateforme fait foi. À défaut — lignes antérieures à la colonne —, la
// forme tranche : un jeton APNs est exactement 64 caractères hexadécimaux,
// là où un jeton FCM est bien plus long et contient « : », « _ » ou « - ».
const estIos = (t: Tok) =>
  t.platform === 'ios' || (!t.platform && /^[0-9a-fA-F]{64}$/.test(t.token))

async function sendToTokens(tokens: Tok[], notif: { title: string; body: string }, data: Record<string, string>) {
  if (!tokens.length) return

  // allSettled, et non all : les deux transports sont indépendants et doivent
  // le rester. Avec all, une clé Firebase mal collée ferait rejeter l'ensemble,
  // la fonction renverrait 500, le webhook Supabase réessaierait — et les
  // iPhone, eux, auraient déjà reçu la notification. Une panne d'un côté
  // provoquerait des doublons de l'autre.
  const [android, ios] = await Promise.allSettled([
    sendFcm(tokens.filter((t) => !estIos(t)), notif, data),
    sendApns(tokens.filter(estIos), notif, data),
  ])
  if (android.status === 'rejected') console.error('FCM (Android) :', android.reason)
  if (ios.status === 'rejected') console.error('APNs (iOS) :', ios.reason)
}

async function tokensForVacanciers(vacIds: string[], excludeVacId?: string): Promise<Tok[]> {
  const ids = vacIds.filter((id) => id && id !== excludeVacId)
  if (!ids.length) return []
  const { data } = await admin.from('push_tokens').select('token, device_id, platform').in('vacancier_id', ids)
  return data || []
}

const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })

// ── Point d'entrée ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    if (!WEBHOOK_SECRET) {
      console.error('PUSH_WEBHOOK_SECRET absent : la fonction refuse de servir.')
      return new Response('misconfigured', { status: 500 })
    }
    if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response('unauthorized', { status: 401 })
    }
    const payload = await req.json()
    const table = payload.table
    const rec = payload.record
    if (!rec) return ok()

    // ── Nouveau message de groupe ──────────────────────────────────────────
    if (table === 'messages') {
      const [{ data: grp }, { data: auteur }] = await Promise.all([
        admin.from('groupes').select('id, titre, camping_id').eq('id', rec.groupe_id).single(),
        admin.from('vacanciers').select('pseudo').eq('id', rec.auteur_id).single(),
      ])
      if (!grp) return ok()

      const { data: membres } = await admin
        .from('membres_groupes')
        .select('vacancier_id, vacanciers!inner(date_depart)')
        .eq('groupe_id', rec.groupe_id)

      const present = (membres || [])
        .filter((m: any) => { const dd = m.vacanciers?.date_depart; return !dd || dd >= todayISO() })
        .map((m: any) => m.vacancier_id)

      const tokens = await tokensForVacanciers(present, rec.auteur_id)
      const preview = String(rec.contenu || '').slice(0, 120)
      await sendToTokens(
        tokens,
        { title: grp.titre, body: `${auteur?.pseudo || 'Quelqu\'un'} : ${preview}` },
        { type: 'message', groupe_id: String(rec.groupe_id) },
      )
      return ok()
    }

    // ── Nouvelle animation publiée ─────────────────────────────────────────
    if (table === 'animations') {
      if (!rec.publiee) return ok()
      const { data: vacs } = await admin
        .from('vacanciers').select('id, date_depart').eq('camping_id', rec.camping_id)
      const present = (vacs || [])
        .filter((v: any) => !v.date_depart || v.date_depart >= todayISO())
        .map((v: any) => v.id)

      const tokens = await tokensForVacanciers(present)
      await sendToTokens(
        tokens,
        { title: 'Nouvelle animation 🎉', body: rec.titre || 'Une animation vient d\'être ajoutée' },
        { type: 'animation', animation_id: String(rec.id) },
      )
      return ok()
    }

    return ok()
  } catch (e) {
    console.error('send-push error', e)
    return new Response('error: ' + (e as Error).message, { status: 500 })
  }
})
