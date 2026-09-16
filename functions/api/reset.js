export async function onRequest({request,env}){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405});
  if(!env.DB)return Response.json({error:'D1 binding DB is not configured'},{status:503});
  await env.DB.prepare('DELETE FROM monsters').run();
  await env.DB.prepare('DELETE FROM battles').run().catch(()=>{});
  return Response.json({ok:true});
}
