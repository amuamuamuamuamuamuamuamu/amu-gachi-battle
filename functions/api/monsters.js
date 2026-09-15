export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return Response.json({error:'D1 binding DB is not configured'}, {status:503});
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS monsters (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, name TEXT NOT NULL, image_data TEXT NOT NULL, stats TEXT NOT NULL, history TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL)`).run();
  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at FROM monsters ORDER BY created_at DESC').all();
    return Response.json(result.results || []);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    await env.DB.prepare('INSERT OR REPLACE INTO monsters (id, room, trainer, name, image_data, stats, history, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.name || ''), String(body.imageData || ''), JSON.stringify(body.stats || []), JSON.stringify(body.history || []), body.createdAt || new Date().toISOString()).run();
    return Response.json({ ok: true, id });
  }
  return new Response('Method Not Allowed', { status: 405 });
}
