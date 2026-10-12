const { sendCapi } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const eid = String((b && b.eid) || '').slice(0, 64);
  if (!eid) { res.statusCode = 400; return res.end(); }
  await sendCapi(req, { name: 'PageView', eid, url: (b && b.url) || req.headers.referer || 'https://flordeli.id/',
    custom: { content_category: 'landing', content_type: 'page' } });
  res.statusCode = 204; res.end();
};
