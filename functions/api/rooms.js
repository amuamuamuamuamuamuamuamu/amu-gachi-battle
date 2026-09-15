export async function onRequest({request,env}){
  if(!env.DB)return Response.json({error:'D1 binding DB is not configured'},{status:503});
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS monsters (id TEXT PRIMARY KEY, room TEXT NOT NULL, trainer TEXT NOT NULL, name TEXT NOT NULL, image_data TEXT NOT NULL, stats TEXT NOT NULL, history TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL)`).run();
  const rows=(await env.DB.prepare('SELECT room, MAX(trainer) trainer, COUNT(*) count FROM monsters GROUP BY room').all()).results||[];
  return Response.json(Array.from({length:10},(_,i)=>{const x=rows.find(r=>r.room===String(i+1));return {room:i+1,trainer:x?.trainer||'',count:x?.count||0}}));
}
