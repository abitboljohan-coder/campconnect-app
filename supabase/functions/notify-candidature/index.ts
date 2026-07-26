// ─────────────────────────────────────────────────────────────────────────────
// Edge Function : alerte email à chaque nouvelle candidature pilote.
//
// Déclenchée par un Database Webhook Supabase sur INSERT dans `candidatures`.
// Envoie l'email via Resend.
//
// Secrets requis :
//   RESEND_API_KEY   — clé API Resend (https://resend.com → API Keys)
//   NOTIFY_TO        — destinataire (ex. abitboljohan@gmail.com)
//   NOTIFY_FROM      — expéditeur vérifié chez Resend
//                      (par défaut « onboarding@resend.dev », qui fonctionne
//                       sans vérifier de domaine mais n'envoie qu'à l'adresse
//                       du compte Resend)
//   NOTIFY_SECRET    — (optionnel) secret partagé avec le webhook
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_TO      = Deno.env.get('NOTIFY_TO')
const NOTIFY_FROM    = Deno.env.get('NOTIFY_FROM') ?? 'CampConnect <onboarding@resend.dev>'
const NOTIFY_SECRET  = Deno.env.get('NOTIFY_SECRET')

const echapper = (v: unknown) =>
  String(v ?? '—').replace(/[<>&"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string))

Deno.serve(async (req) => {
  try {
    if (NOTIFY_SECRET && req.headers.get('x-webhook-secret') !== NOTIFY_SECRET) {
      return new Response('unauthorized', { status: 401 })
    }
    if (!RESEND_API_KEY || !NOTIFY_TO) {
      // Configuration incomplète : on le dit clairement dans les logs plutôt
      // que d'échouer en silence.
      console.error('RESEND_API_KEY ou NOTIFY_TO manquant — email non envoyé.')
      return new Response(
        JSON.stringify({ ok: false, raison: 'secrets manquants' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await req.json()
    const c = payload?.record
    if (!c) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    const ligne = (label: string, valeur: unknown) => `
      <tr>
        <td style="padding:10px 16px;border:1px solid #eee;font-weight:700;background:#f8f8f4;width:150px">${label}</td>
        <td style="padding:10px 16px;border:1px solid #eee">${echapper(valeur)}</td>
      </tr>`

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2 style="color:#23423A">🏕️ Nouvelle candidature pilote</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          ${ligne('Nom', c.nom)}
          ${ligne('Email', c.email)}
          ${ligne('Camping', c.camping)}
          ${ligne('Emplacements', c.emplacements)}
          ${ligne('Message', c.message)}
        </table>
        <p style="margin-top:20px">
          <a href="mailto:${echapper(c.email)}"
             style="display:inline-block;background:#FA8072;color:#fff;padding:11px 22px;
                    border-radius:24px;text-decoration:none;font-weight:700;font-size:14px">
            Répondre à ${echapper(c.nom)}
          </a>
        </p>
        <p style="color:#888;font-size:12px;margin-top:22px">
          Reçue le ${new Date(c.created_at ?? Date.now()).toLocaleString('fr-FR')}
        </p>
      </div>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: c.email,
        subject: `Nouvelle candidature — ${c.camping ?? 'camping'}`,
        html,
      }),
    })

    if (!r.ok) {
      const detail = await r.text()
      console.error('Envoi Resend échoué', r.status, detail)
      return new Response(JSON.stringify({ ok: false, status: r.status, detail }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('notify-candidature', e)
    return new Response(JSON.stringify({ ok: false, erreur: String(e) }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
})
