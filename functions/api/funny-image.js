const headers = {
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'public, max-age=31536000, immutable'
};

const keyFor = sentence => `funny-image:${encodeURIComponent(sentence)}`;

function imageUrl(request, sentence) {
  const url = new URL(request.url);
  url.pathname = '/api/funny-image';
  url.search = new URLSearchParams({ sentence }).toString();
  return url.toString();
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (!env.NEKOSAGASI_LAYOUT || !env.AI) return Response.json({ error: '画像生成の準備ができていません' }, { status: 503, headers });
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const sentence = url.searchParams.get('sentence') || '';
    const image = sentence && await env.NEKOSAGASI_LAYOUT.get(keyFor(sentence));
    if (!image) return new Response('not found', { status: 404, headers });
    const bytes = Uint8Array.from(atob(image), char => char.charCodeAt(0));
    return new Response(bytes, { headers: { ...headers, 'content-type': 'image/jpeg' } });
  }
  if (request.method === 'POST') {
    let sentence = '';
    try { sentence = String((await request.json()).sentence || '').trim(); } catch {}
    if (!sentence || sentence.length > 180) return Response.json({ error: '文を正しく入力してください' }, { status: 400, headers });
    const storageKey = keyFor(sentence);
    if (await env.NEKOSAGASI_LAYOUT.get(storageKey)) return Response.json({ url: imageUrl(request, sentence), cached: true }, { headers });
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: `A single polished cute Japanese game event illustration for the phrase: ${sentence}. Clear simple composition, thick clean outlines, vibrant colors, no text, no watermark.`,
      steps: 4
    });
    if (!result?.image) return Response.json({ error: '画像を生成できませんでした' }, { status: 502, headers });
    await env.NEKOSAGASI_LAYOUT.put(storageKey, result.image);
    return Response.json({ url: imageUrl(request, sentence) }, { headers });
  }
  return Response.json({ error: 'method not allowed' }, { status: 405, headers });
}
