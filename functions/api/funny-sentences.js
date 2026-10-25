const KEY = 'funny-sentences-v1';
const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-methods': 'GET, PUT, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (!env.NEKOSAGASI_LAYOUT) return Response.json({ error: '保存領域が見つかりません' }, { status: 500, headers });

  if (request.method === 'GET') {
    const saved = await env.NEKOSAGASI_LAYOUT.get(KEY);
    return new Response(saved || JSON.stringify({ data: null }), { headers });
  }

  if (request.method === 'PUT') {
    const text = await request.text();
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') throw new Error('invalid data');
    } catch {
      return Response.json({ error: '保存データの形式が違います' }, { status: 400, headers });
    }
    await env.NEKOSAGASI_LAYOUT.put(KEY, text);
    return Response.json({ ok: true }, { headers });
  }

  return Response.json({ error: 'method not allowed' }, { status: 405, headers });
}
