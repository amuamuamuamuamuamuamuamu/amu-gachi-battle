export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return Response.json({error:'D1 binding DB is not configured'}, {status:503});
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS monsters (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, name TEXT NOT NULL, image_data TEXT NOT NULL, stats TEXT NOT NULL, history TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL)`).run();
  try { await env.DB.prepare("ALTER TABLE monsters ADD COLUMN history TEXT NOT NULL DEFAULT '[]'").run(); } catch {}
  try { await env.DB.prepare('ALTER TABLE monsters ADD COLUMN battle_code TEXT').run(); } catch {}
  try { await env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS monsters_battle_code_unique ON monsters(battle_code) WHERE battle_code IS NOT NULL AND battle_code != ""').run(); } catch {}
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS battles (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, opponent TEXT NOT NULL, result TEXT NOT NULL, logs TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS battle_requests (id TEXT PRIMARY KEY, challenger_id TEXT NOT NULL, target_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
  if (request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    const id = params.get('id'), code = params.get('code'), waitingFor = params.get('waitingFor');
    if (waitingFor) {
      const requestRow = await env.DB.prepare("SELECT id, challenger_id FROM battle_requests WHERE target_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1").bind(waitingFor).first();
      if (!requestRow) return new Response(null, {status:204});
      const challenger = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at, battle_code FROM monsters WHERE id = ?').bind(requestRow.challenger_id).first();
      if (!challenger) return new Response(null, {status:204});
      await env.DB.prepare("UPDATE battle_requests SET status = 'claimed' WHERE id = ?").bind(requestRow.id).run();
      return Response.json({battleId:requestRow.id, monster:challenger});
    }
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
    if (body.type === 'challenge') {
      const challenger = await env.DB.prepare('SELECT id FROM monsters WHERE id = ?').bind(String(body.challengerId || '')).first();
      const target = await env.DB.prepare('SELECT id, room, trainer, name, image_data, stats, history, created_at, battle_code FROM monsters WHERE battle_code = ? LIMIT 1').bind(String(body.targetCode || '')).first();
      if (!challenger || !target) return Response.json({error:'Monster not found'}, {status:404});
      if (challenger.id === target.id) return Response.json({error:'Cannot battle the same monster'}, {status:400});
      const battleId = crypto.randomUUID();
      await env.DB.prepare("UPDATE battle_requests SET status = 'expired' WHERE target_id = ? AND status = 'pending'").bind(target.id).run();
      await env.DB.prepare('INSERT INTO battle_requests (id, challenger_id, target_id, status, created_at) VALUES (?, ?, ?, ?, ?)').bind(battleId, challenger.id, target.id, 'pending', new Date().toISOString()).run();
      return Response.json({battleId, monster:target});
    }
    if (body.type === 'battle') {
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO battles (id, room, trainer, opponent, result, logs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.opponent || ''), String(body.result || ''), JSON.stringify(body.logs || []), new Date().toISOString()).run();
      return Response.json({ ok: true, id });
    }
    const id = body.id || crypto.randomUUID();
    let battleCode = /^\d{5}$/.test(String(body.battleCode || '')) ? String(body.battleCode) : '';
    for (let attempt = 0; attempt < 20; attempt++) {
      if (!battleCode) battleCode = String(10000 + Math.floor(Math.random() * 90000));
      const used = await env.DB.prepare('SELECT id FROM monsters WHERE battle_code = ? AND id != ? LIMIT 1').bind(battleCode, id).first();
      if (!used) break;
      battleCode = '';
    }
    if (!battleCode) return Response.json({error:'Could not allocate battle code'}, {status:503});
    await env.DB.prepare('INSERT OR REPLACE INTO monsters (id, room, trainer, name, image_data, stats, history, created_at, battle_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, String(body.room || ''), String(body.trainer || ''), String(body.name || ''), String(body.imageData || ''), JSON.stringify(body.stats || []), JSON.stringify(body.history || []), body.createdAt || new Date().toISOString(), battleCode).run();
    return Response.json({ ok: true, id, battleCode });
  }
  if (request.method === 'DELETE') {
    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    if (!id) return Response.json({error:'Monster id is required'}, {status:400});
    await env.DB.prepare('DELETE FROM monsters WHERE id = ?').bind(id).run();
    return Response.json({ok:true});
  }
  return new Response('Method Not Allowed', { status: 405 });
}
