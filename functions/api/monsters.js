export async function onRequest(context) {
  const { request, env } = context;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS monsters (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, name TEXT NOT NULL, image_data TEXT NOT NULL, stats TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, created_at FROM monsters ORDER BY created_at DESC').all();
    return Response.json(result.results || []);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    await env.DB.prepare('INSERT OR REPLACE INTO monsters (id, room, trainer, name, image_data, stats, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.name || ''), String(body.imageData || ''), JSON.stringify(body.stats || []), new Date().toISOString()).run();
    return Response.json({ ok: true, id });
  }
  return new Response('Method Not Allowed', { status: 405 });
}
