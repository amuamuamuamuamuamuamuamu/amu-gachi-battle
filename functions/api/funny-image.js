const headers = {
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'cache-control': 'public, max-age=31536000, immutable'
};

const keyFor = sentence => `funny-image:${encodeURIComponent(sentence)}`;
const sentenceDataKey = 'funny-sentences-v1';

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
    let body = {};
    try { body = await request.json(); } catch {}
    const sentence = String(body?.sentence || '').trim();
    const force = body?.force === true;
    if (!sentence || sentence.length > 180) return Response.json({ error: '文を正しく入力してください' }, { status: 400, headers });
    const storageKey = keyFor(sentence);
    if (!force && await env.NEKOSAGASI_LAYOUT.get(storageKey)) return Response.json({ url: imageUrl(request, sentence), cached: true }, { headers });
    let globalInstruction = '', note = String(body?.note || '').trim();
    try {
      const shared = JSON.parse((await env.NEKOSAGASI_LAYOUT.get(sentenceDataKey)) || '{}');
      globalInstruction = String(shared?.data?.globalImageInstruction || '').trim().slice(0, 1200);
      if (!note) {
        const words = (shared?.data?.axes || []).flatMap(axis => axis.children || []).find(parts => parts.join(' ') === sentence);
        if (words) note = String(shared?.data?.variationNotes?.[words.join('|')] || '').trim();
      }
    } catch {}
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: `A single polished cute Japanese game event illustration for the phrase: ${sentence}. Clear simple composition, thick clean outlines, vibrant colors.${note ? ` Specific per-illustration direction that must be followed exactly: ${note}` : ' Do not add text or a watermark.'}${globalInstruction ? ` Global creative direction that must be followed: ${globalInstruction}` : ''}`,
      steps: 4
    });
    if (!result?.image) return Response.json({ error: '画像を生成できませんでした' }, { status: 502, headers });
    await env.NEKOSAGASI_LAYOUT.put(storageKey, result.image);
    return Response.json({ url: imageUrl(request, sentence) }, { headers });
  }
  return Response.json({ error: 'method not allowed' }, { status: 405, headers });
}
