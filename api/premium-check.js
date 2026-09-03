// ============================================================
// 🔎 premium-check: ¿este email es premium? (mismo dominio -> sin CORS)
// URL: /api/premium-check?email=hola@correo.com
// Usa el service_role (ignora RLS) para consultar premium_users.
// ============================================================
export default async function handler(req, res) {
  const email = (req.query && req.query.email) ? String(req.query.email).toLowerCase().trim() : '';
  if (!email) return res.status(200).json({ premium: false });
  const SUPABASE_URL = process.env.SUPABASE_URL, SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ premium: false, error: 'faltan env' });
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/premium_users?select=email&email=eq.' + encodeURIComponent(email), {
      headers: { 'apikey': SERVICE_ROLE, 'Authorization': 'Bearer ' + SERVICE_ROLE }
    });
    const data = await r.json();
    return res.status(200).json({ premium: Array.isArray(data) && data.length > 0 });
  } catch (e) {
    return res.status(200).json({ premium: false });
  }
}
