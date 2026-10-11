const crypto = require('crypto');
const PIXEL_ID = process.env.META_PIXEL_ID || '1118368660702185';
const TOKEN = process.env.META_CAPI_TOKEN || '';
const TEST_CODE = process.env.META_TEST_CODE || '';

function cookies(req) {
  const o = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return o;
}
const sha = s => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');

async function sendCapi(req, { name, eid, url, custom }) {
  if (!TOKEN) return { skipped: 'no token' };
  const ua = req.headers['user-agent'] || '';
  if (/bot|crawl|spider|facebookexternalhit|preview/i.test(ua)) return { skipped: 'bot' };
  const c = cookies(req);
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const user = { client_ip_address: ip, client_user_agent: ua };
  if (c._fbp) user.fbp = c._fbp;
  if (c._fbc) user.fbc = c._fbc;
  if (c.fd_uid) user.external_id = [sha(c.fd_uid)];
  const body = {
    data: [{
      event_name: name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eid,
      event_source_url: url,
      action_source: 'website',
      user_data: user,
      custom_data: custom || undefined,
    }],
  };
  if (TEST_CODE) body.test_event_code = TEST_CODE;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 1500);
  try {
    const r = await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: ctl.signal,
    });
    if (!r.ok) console.error('CAPI', r.status, await r.text());
    return { status: r.status };
  } catch (e) {
    console.error('CAPI error', e.message);
    return { error: e.message };
  } finally { clearTimeout(t); }
}
module.exports = { sendCapi };
