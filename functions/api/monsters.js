export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return Response.json({error:'D1 binding DB is not configured'}, {status:503});
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS monsters (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, name TEXT NOT NULL, image_data TEXT NOT NULL, stats TEXT NOT NULL, history TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL)`).run();
  try { await env.DB.prepare('ALTER TABLE monsters ADD COLUMN battle_code TEXT').run(); } catch {}
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS battles (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, opponent TEXT NOT NULL, result TEXT NOT NULL, logs TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
  if (request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    const id = params.get('id'), code = params.get('code');
    if (code) {
      const monster = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at, battle_code FROM monsters WHERE battle_code = ? LIMIT 1').bind(code).first();
      if (!monster) return Response.json({error:'Monster not found'}, {status:404});
      return Response.json(monster);
    }
    if (id) {
      const monster = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at FROM monsters WHERE id = ?').bind(id).first();
      if (!monster) return Response.json({error:'Monster not found'}, {status:404});
      return Response.json(monster);
    }
    const result = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at FROM monsters ORDER BY created_at DESC').all();
    return Response.json(result.results || []);
  }
  if (request.method === 'POST') {
    const body = await request.json();
    if (body.type === 'battle') {
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO battles (id, room, trainer, opponent, result, logs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.opponent || ''), String(body.result || ''), JSON.stringify(body.logs || []), new Date().toISOString()).run();
      return Response.json({ ok: true, id });
    }
    const id = body.id || crypto.randomUUID();
    await env.DB.prepare('INSERT OR REPLACE INTO monsters (id, room, trainer, name, image_data, stats, history, created_at, battle_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.name || ''), String(body.imageData || ''), JSON.stringify(body.stats || []), JSON.stringify(body.history || []), body.createdAt || new Date().toISOString(), String(body.battleCode || '')).run();
    return Response.json({ ok: true, id });
  }
  return new Response('Method Not Allowed', { status: 405 });
}
