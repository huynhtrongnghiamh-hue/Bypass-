// POR — Cloudflare Worker
// Deploy: dash.cloudflare.com → Workers & Pages → Create → dán code này → Deploy.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'POR-worker' });
    }

    if (url.pathname === '/api/bypass' && request.method === 'POST') {
      try {
        const { url: target } = await request.json();
        if (!target) return json({ ok: false, error: 'Thiếu URL.' }, 400);

        let parsed;
        try { parsed = new URL(target); }
        catch { return json({ ok: false, error: 'URL không hợp lệ.' }, 400); }

        if (!/^https?:$/.test(parsed.protocol)) {
          return json({ ok: false, error: 'Chỉ http/https.' }, 400);
        }

        const started = Date.now();
        const result = await bypass(parsed.href);
        return json({ ok: true, ...result, elapsedMs: Date.now() - started });
      } catch (err) {
        return json({ ok: false, error: err.message || 'Bypass lỗi.' }, 500);
      }
    }

    return json({ ok: false, error: 'Not found' }, 404);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ---------- Router theo host ----------

async function bypass(url) {
  const host = new URL(url).hostname;

  if (/link4m\.(com|net|co)/i.test(host))    return link4m(url);
  if (/link1s\.(com|net)/i.test(host))       return link1s(url);
  if (/yeumoney\.(com|net)/i.test(host))     return yeumoney(url);

  return generic(url);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---------- Link4m ----------

async function link4m(url) {
  const headers = {
    'User-Agent': UA,
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
  };

  const step1 = await fetch(url, { headers, redirect: 'follow' });
  const html1 = await step1.text();

  const formTag =
    html1.match(/<form[^>]*id=["']go-link["'][^>]*>/i)?.[0] ||
    html1.match(/<form[^>]*name=["']tp-form["'][^>]*>/i)?.[0] ||
    html1.match(/<form[^>]*>/i)?.[0];

  if (!formTag) throw new Error('link4m: không tìm thấy form.');

  const action = formTag.match(/action=["']([^"']+)["']/i)?.[1] || url;
  const method = (formTag.match(/method=["']([^"']+)["']/i)?.[1] || 'POST').toUpperCase();
  const actionUrl = new URL(action, url).href;

  const inputs = {};
  const formBody = html1.match(/<form[\s\S]*?<\/form>/i)?.[0] || '';
  const inputRe = /<input[^>]*>/gi;
  let m;
  while ((m = inputRe.exec(formBody)) !== null) {
    const tag = m[0];
    const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
    const value = tag.match(/value=["']([^"']*)["']/i)?.[1] || '';
    if (name) inputs[name] = value;
  }
  if (!inputs._method) inputs._method = 'getlink';

  const body = new URLSearchParams(inputs).toString();
  const step2 = await fetch(actionUrl, {
    method,
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
    redirect: 'follow',
  });

  const html2 = await step2.text();

  let key =
    html2.match(/<a[^>]*id=["']link["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html2.match(/<a[^>]*class=["'][^"']*get-link[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html2.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/i)?.[1];

  if (!key) {
    const urls = html2.match(/https?:\/\/[^\s"'<>]+/g) || [];
    key = urls.find(u => !u.includes('link4m'));
  }

  if (!key) throw new Error('link4m: không bóc được link đích.');
  return { key: decodeHtml(key.trim()), source: 'link4m' };
}

// ---------- Link1s ----------

async function link1s(url) {
  const headers = {
    'User-Agent': UA,
    'Accept-Language': 'vi-VN,vi;q=0.9',
  };

  const step1 = await fetch(url, { headers, redirect: 'follow' });
  const html1 = await step1.text();

  const formTag =
    html1.match(/<form[^>]*id=["']go-link["'][^>]*>/i)?.[0] ||
    html1.match(/<form[^>]*>/i)?.[0];

  if (!formTag) throw new Error('link1s: không tìm thấy form.');

  const action = formTag.match(/action=["']([^"']+)["']/i)?.[1] || url;
  const method = (formTag.match(/method=["']([^"']+)["']/i)?.[1] || 'POST').toUpperCase();
  const actionUrl = new URL(action, url).href;

  const inputs = {};
  const formBody = html1.match(/<form[\s\S]*?<\/form>/i)?.[0] || '';
  const inputRe = /<input[^>]*>/gi;
  let m;
  while ((m = inputRe.exec(formBody)) !== null) {
    const tag = m[0];
    const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
    const value = tag.match(/value=["']([^"']*)["']/i)?.[1] || '';
    if (name) inputs[name] = value;
  }
  if (!inputs._method) inputs._method = 'getlink';

  const body = new URLSearchParams(inputs).toString();
  const step2 = await fetch(actionUrl, {
    method,
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
    redirect: 'follow',
  });

  const html2 = await step2.text();

  let key =
    html2.match(/<a[^>]*id=["']link["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html2.match(/<a[^>]*class=["'][^"']*get-link[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];

  if (!key) {
    const urls = html2.match(/https?:\/\/[^\s"'<>]+/g) || [];
    key = urls.find(u => !u.includes('link1s'));
  }

  if (!key) throw new Error('link1s: không bóc được link.');
  return { key: decodeHtml(key.trim()), source: 'link1s' };
}

// ---------- Yeumoney ----------

async function yeumoney(url) {
  const headers = {
    'User-Agent': UA,
    'Accept-Language': 'vi-VN,vi;q=0.9',
  };

  const step1 = await fetch(url, { headers, redirect: 'follow' });
  const html1 = await step1.text();

  const formTag =
    html1.match(/<form[^>]*id=["'](?:go-link|form-captcha)["'][^>]*>/i)?.[0] ||
    html1.match(/<form[^>]*>/i)?.[0];

  if (!formTag) throw new Error('yeumoney: không tìm thấy form.');

  const action = formTag.match(/action=["']([^"']+)["']/i)?.[1] || url;
  const method = (formTag.match(/method=["']([^"']+)["']/i)?.[1] || 'POST').toUpperCase();
  const actionUrl = new URL(action, url).href;

  const inputs = {};
  const formBody = html1.match(/<form[\s\S]*?<\/form>/i)?.[0] || '';
  const inputRe = /<input[^>]*>/gi;
  let m;
  while ((m = inputRe.exec(formBody)) !== null) {
    const tag = m[0];
    const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
    const value = tag.match(/value=["']([^"']*)["']/i)?.[1] || '';
    if (name) inputs[name] = value;
  }
  if (!inputs._method) inputs._method = 'getlink';

  const body = new URLSearchParams(inputs).toString();
  const step2 = await fetch(actionUrl, {
    method,
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
    redirect: 'follow',
  });

  const html2 = await step2.text();

  let key =
    html2.match(/<a[^>]*id=["']link["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html2.match(/<a[^>]*class=["'][^"']*get-link[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];

  if (!key) {
    const urls = html2.match(/https?:\/\/[^\s"'<>]+/g) || [];
    key = urls.find(u => !u.includes('yeumoney'));
  }

  if (!key) throw new Error('yeumoney: không bóc được link.');
  return { key: decodeHtml(key.trim()), source: 'yeumoney' };
}

// ---------- Generic ----------

async function generic(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  const html = await res.text();

  let key =
    html.match(/<a[^>]*id=["']link["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html.match(/<a[^>]*class=["'][^"']*get-link[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/i)?.[1];

  if (!key) {
    const targetHost = new URL(url).hostname;
    const urls = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
    key = urls.find(u => {
      try { return new URL(u).hostname !== targetHost; }
      catch { return false; }
    });
  }

  if (!key) throw new Error('generic: không bóc được link.');
  return { key: decodeHtml(key.trim()), source: 'generic' };
}

// ---------- Helpers ----------

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
    }
