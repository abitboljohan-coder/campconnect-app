export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { record } = req.body;
  if (!record) {
    return res.status(400).json({ error: 'No record in payload' });
  }

  const html = `
    <h2 style="color:#639922;font-family:sans-serif">🏕️ Nouvelle candidature pilote CampConnect</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;width:100%;max-width:480px">
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Nom</td>
          <td style="padding:10px 16px;border:1px solid #eee">${record.nom}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Email</td>
          <td style="padding:10px 16px;border:1px solid #eee"><a href="mailto:${record.email}">${record.email}</a></td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Camping</td>
          <td style="padding:10px 16px;border:1px solid #eee">${record.camping}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Emplacements</td>
          <td style="padding:10px 16px;border:1px solid #eee">${record.emplacements || '—'}</td></tr>
      <tr><td style="padding:10px 16px;border:1px solid #eee;font-weight:bold;background:#f9f9f9">Message</td>
          <td style="padding:10px 16px;border:1px solid #eee">${record.message || '—'}</td></tr>
    </table>
    <p style="font-family:sans-serif;color:#888;font-size:12px;margin-top:24px">
      Soumis le ${new Date(record.created_at).toLocaleString('fr-FR')}
    </p>
  `;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_ZG5ySUA7_6aVtM2zrvp9YpkD5U3XbB1f1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CampConnect <onboarding@resend.dev>',
      to: ['abitboljohan@gmail.com'],
      subject: `Nouvelle candidature — ${record.camping}`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ ok: true });
}
