// ─────────────────────────────────────────────────────────────────────────────
// Edge Function : envoi des notifications push (FCM HTTP v1 — Android + iOS)
//
// Déclenchée par un Database Webhook Supabase sur INSERT de :
//   • messages    → notifie les membres présents du groupe (sauf l'auteur)
//   • animations  → notifie tous les vacanciers présents du camping (si publiée)
//
// Secrets requis (supabase secrets set ...) :
//   FCM_SERVICE_ACCOUNT   = contenu JSON du compte de service Firebase
//   PUSH_WEBHOOK_SECRET   = (optionnel) secret partagé avec le webhook
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY = injectés automatiquement
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FCM_SA        = Deno.env.get('FCM_SERVICE_ACCOUNT')!
const WEBHOOK_SECRET = Deno.env.get('PUSH_WEBHOOK_SECRET') // optionnel

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
type Tok = { token: string; device_id: string }

async function sendToTokens(tokens: Tok[], notif: { title: string; body: string }, data: Record<string, string>) {
  if (!tokens.length) return
  const { token: access, projectId } = await getAccessToken()
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  await Promise.all(tokens.map(async (t) => {
    const message = {
      message: {
        token: t.token,
        notification: { title: notif.title, body: notif.body },
        data,
        android: { priority: 'HIGH', notification: { sound: 'default' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      },
    }
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    // token invalide/expiré → on le supprime
    if (r.status === 404 || r.status === 403 || r.status === 410) {
      await admin.from('push_tokens').delete().eq('device_id', t.device_id)
    }
  }))
}

async function tokensForVacanciers(vacIds: string[], excludeVacId?: string): Promise<Tok[]> {
  const ids = vacIds.filter((id) => id && id !== excludeVacId)
  if (!ids.length) return []
  const { data } = await admin.from('push_tokens').select('token, device_id').in('vacancier_id', ids)
  return data || []
}

const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })

// ── Point d'entrée ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
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
