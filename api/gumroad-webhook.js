// ============================================================
// 🔔 Gumroad webhook -> marca el email como Premium en Supabase
// Dónde: /api/gumroad-webhook  (función Vercel, auto-deploy desde GitHub)
// Recibe el "sale" de Gumroad y añade el email a la tabla premium_users.
// ============================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const body = req.body || {};
    // El email del comprador (Gumroad lo manda en el payload de "sale")
    const email = (body && (
      (body.purchase && body.purchase.email) || body.email ||
      (body.purchase && body.purchase.buyer_email)
    )) || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      // Si no hay email, aun así devolvemos 200 para no reintentar Gumroad
      return res.status(200).json({ ok: true, note: 'sin email' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE' });
    }

    // Insertar el email (PostgREST con service_role: ignora RLS, es seguro)
    await fetch(SUPABASE_URL + '/rest/v1/premium_users', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE,
        'Authorization': 'Bearer ' + SERVICE_ROLE,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Devuelve 200 para que Gumroad no reintente; loguea el error
    console.error('Error gumroad-webhook:', e);
    return res.status(200).json({ ok: false });
  }
}
