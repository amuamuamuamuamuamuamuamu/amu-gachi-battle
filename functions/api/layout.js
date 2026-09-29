const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};

export async function onRequestGet({request,env}){
  const surveyId=new URL(request.url).searchParams.get("surveyId");
  if(surveyId)return new Response(JSON.stringify({counts:await env.NEKOSAGASI_LAYOUT.get("survey-"+surveyId,"json")||[0,0]}),{headers});
  return new Response(JSON.stringify({layout:await env.NEKOSAGASI_LAYOUT.get("shared-layout","json")}),{headers});
}

export async function onRequestPut({request,env}){
  const layout=await request.json().catch(()=>null);
  if(!layout||typeof layout!=="object"||Array.isArray(layout)||JSON.stringify(layout).length>2_000_000)return new Response(JSON.stringify({error:"invalid layout"}),{status:400,headers});
  const questionTexts=Object.values(layout.npcDefinitions||{}).flatMap(npc=>[
    ...(npc?.quizzes||[]).flatMap(quiz=>[quiz?.question,...(quiz?.choices||[])]),
    ...(npc?.surveys||[]).flatMap(survey=>[survey?.question,...(survey?.choices||[])]),
  ]);
  if(questionTexts.filter(value=>typeof value==="string"&&/\?{3,}/.test(value)).length>=10)
    return new Response(JSON.stringify({error:"corrupted question text"}),{status:409,headers});
  const previous=await env.NEKOSAGASI_LAYOUT.get("shared-layout","json");
  if(previous)await env.NEKOSAGASI_LAYOUT.put("shared-layout-backup",JSON.stringify({savedAt:new Date().toISOString(),layout:previous}));
  await env.NEKOSAGASI_LAYOUT.put("shared-layout",JSON.stringify(layout));
  return new Response(JSON.stringify({ok:true}),{headers});
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>null),id=String(body?.surveyId||''),choice=Number(body?.choice);
  if(!/^survey[a-zA-Z0-9_-]{1,80}$/.test(id)||(choice!==0&&choice!==1))return new Response(JSON.stringify({error:"invalid survey"}),{status:400,headers});
  const key="survey-"+id,current=await env.NEKOSAGASI_LAYOUT.get(key,"json")||[0,0];
  current[choice]=Number(current[choice]||0)+1;
  await env.NEKOSAGASI_LAYOUT.put(key,JSON.stringify(current));
  return new Response(JSON.stringify({counts:current}),{headers});
}
