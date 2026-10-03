// Ancienne alerte « nouvelle candidature » (remplacée par l'Edge Function
// Supabase notify-candidature, voir docs/NOTIFICATION_CANDIDATURES.md).
//
// Elle reste dans le dépôt, mais fermée par défaut : déployée sur Vercel avec
// le reste du site, elle laissait n'importe qui envoyer, sans authentification,
// un email au contenu HTML de son choix à contact@campconnect.fr depuis
// l'adresse de CampConnect (audit sécurité du 3 octobre 2026).
// Elle ne répond plus qu'avec l'en-tête x-webhook-secret égal à NOTIFY_SECRET,
// et échappe tout ce qu'elle insère dans l'email.

import process from 'node:process'

const echapper = (v) =>
  String(v ?? '—').replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.NOTIFY_SECRET;
  if (!secret || req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { record } = req.body || {};
  if (!record) {
    return res.status(400).json({ error: 'No record in payload' });
  }

  const html = `
    <h2 style="color:#639922;font-family:sans-serif">🏕️ Nouvelle candidature pilote CampConnect</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;width:100%;max-width:480px">
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Nom</td>
          <td style="padding:10px 16px;border:1px solid #eee">${echapper(record.nom)}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Email</td>
          <td style="padding:10px 16px;border:1px solid #eee">${echapper(record.email)}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Camping</td>
          <td style="padding:10px 16px;border:1px solid #eee">${echapper(record.camping)}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Emplacements</td>
          <td style="padding:10px 16px;border:1px solid #eee">${echapper(record.emplacements)}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Message</td>
          <td style="padding:10px 16px;border:1px solid #eee">${echapper(record.message)}</td></tr>
    </table>
    <p style="font-family:sans-serif;color:#888;font-size:12px;margin-top:24px">
      Soumis le ${echapper(new Date(record.created_at ?? Date.now()).toLocaleString('fr-FR'))}
    </p>
  `;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CampConnect <noreply@campconnect.fr>',
      to: ['contact@campconnect.fr'],
      subject: `Nouvelle candidature — ${String(record.camping ?? 'camping').slice(0, 120)}`,
      html,
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend error:', await emailRes.text());
    return res.status(500).json({ error: 'email' });
  }

  return res.status(200).json({ ok: true });
}
