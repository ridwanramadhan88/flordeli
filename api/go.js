const { sendCapi } = require('./_lib');
const TARGETS = {
  reservasi: { to: 'https://api.whatsapp.com/send?phone=6285168248761', event: 'Contact', custom: { content_name: 'Reservasi', content_category: 'reservasi', content_type: 'cta_button' } },
  menu: { to: '/menu', event: 'ViewContent', custom: { content_name: 'Menu', content_category: 'menu', content_type: 'cta_button' } },
  lokasi: { to: 'https://maps.app.goo.gl/RgVAuPTpd1K9qGeE8', event: 'FindLocation', custom: { content_name: 'Lokasi', content_category: 'lokasi', content_type: 'cta_button' } },
};
module.exports = async (req, res) => {
  const q = req.query || {};
  const t = TARGETS[String(q.name || '').toLowerCase()];
  if (!t) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }
  const eid = String(q.eid || '').slice(0, 64) || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const url = req.headers.referer || 'https://flordeli.id/';
  await sendCapi(req, { name: t.event, eid, url, custom: t.custom });
  res.statusCode = 302;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', t.to);
  res.end();
};
