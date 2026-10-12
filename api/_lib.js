const crypto = require('crypto');
const PIXEL_ID = process.env.META_PIXEL_ID || '1118368660702185';
const TOKEN = process.env.META_CAPI_TOKEN || '';
const TEST_CODE = process.env.META_TEST_CODE || '';

function cookies(req) {
  const o = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) {
      const k = p.slice(0, i).trim();
      const v = p.slice(i + 1).trim();
      try { o[k] = decodeURIComponent(v); } catch (e) { o[k] = v; }
    }
  });
  return o;
}
const sha = s => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');

// Meta normalisation for geo fields: lowercase, no accents, letters/digits only, then SHA-256
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const hashNorm = s => { const n = norm(s); return n ? crypto.createHash('sha256').update(n).digest('hex') : ''; };
const dec = s => { try { return decodeURIComponent(s); } catch (e) { return String(s || ''); } };

// fbc fallback: build from ?fbclid= in the page URL when the _fbc cookie is not there yet
function fbcFromUrl(url) {
  try {
    const id = new URL(url).searchParams.get('fbclid');
    if (id && /^[\w-]{10,500}$/.test(id)) return `fb.1.${Date.now()}.${id}`;
  } catch (e) { /* ignore */ }
  return '';
}

// Traffic source: UTM params from the page URL, falling back to the fd_src cookie set by the page
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
function sourceParams(c, url) {
  const out = {};
  let q = null;
  try { q = new URL(url).searchParams; } catch (e) { /* ignore */ }
  let ck = {};
  try { ck = JSON.parse(c.fd_src || '{}') || {}; } catch (e) { ck = {}; }
  for (const k of UTM) {
    const v = (q && q.get(k)) || ck[k];
    if (v) out[k] = String(v).slice(0, 100);
  }
  if (ck.referrer) out.referrer = String(ck.referrer).slice(0, 100);
  return out;
}

function geo(req) {
  const h = req.headers;
  const o = {};
  const country = norm(h['x-vercel-ip-country']);
  const st = norm(dec(h['x-vercel-ip-country-region'] || ''));
  const ct = norm(dec(h['x-vercel-ip-city'] || ''));
  if (country) o.country = [hashNorm(country)];
  if (st) o.st = [hashNorm(st)];
  if (ct) o.ct = [hashNorm(ct)];
  return o;
}

async function sendCapi(req, { name, eid, url, custom }) {
  if (!TOKEN) return { skipped: 'no token' };
  const ua = req.headers['user-agent'] || '';
  if (/bot|crawl|spider|facebookexternalhit|preview/i.test(ua)) return { skipped: 'bot' };
  const c = cookies(req);
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const user = { client_ip_address: ip, client_user_agent: ua, ...geo(req) };
  const fbc = c._fbc || fbcFromUrl(url);
  if (c._fbp) user.fbp = c._fbp;
  if (fbc) user.fbc = fbc;
  if (c.fd_uid) user.external_id = [sha(c.fd_uid)];
  const body = {
    data: [{
      event_name: name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eid,
      event_source_url: url,
      action_source: 'website',
      user_data: user,
      custom_data: { ...(custom || {}), ...sourceParams(c, url) },
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
module.exports = { sendCapi, _t: { geo, fbcFromUrl, sourceParams, cookies, hashNorm } };
