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
  // マップ編集など、古い端末が持つ全体レイアウトを保存しても、新しく登録されたイベントNPCは消さない。
  if(previous?.npcDefinitions){
    layout.npcDefinitions??={};
    for(const [id,npc] of Object.entries(previous.npcDefinitions))
      if(id.startsWith("event-")&&!layout.npcDefinitions[id])layout.npcDefinitions[id]=npc;
  }
  if(previous)await env.NEKOSAGASI_LAYOUT.put("shared-layout-backup",JSON.stringify({savedAt:new Date().toISOString(),layout:previous}));
  await env.NEKOSAGASI_LAYOUT.put("shared-layout",JSON.stringify(layout));
  return new Response(JSON.stringify({ok:true}),{headers});
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>null);
  // 新規イベントNPCは、クライアントの古いレイアウト全体を送らず、このNPCだけを現在の共有データへ追加する。
  if(body?.action==="upsert-event-npc"){
    const id=String(body?.id||""),npc=body?.npc;
    if(!/^event-[\w-]{8,160}$/.test(id)||!npc||typeof npc!=="object"||Array.isArray(npc)||npc.eventType!=="item"||typeof npc.profileId!=="string"||!npc.profileId||!Array.isArray(npc.itemRegistrations)||!npc.itemRegistrations.some(entry=>typeof entry?.requiredItem==="string"&&entry.requiredItem))
      return new Response(JSON.stringify({error:"invalid event npc"}),{status:400,headers});
    const layout=await env.NEKOSAGASI_LAYOUT.get("shared-layout","json")||{};
    layout.npcDefinitions??={};
    const previous=await env.NEKOSAGASI_LAYOUT.get("shared-layout","json");
    if(previous)await env.NEKOSAGASI_LAYOUT.put("shared-layout-backup",JSON.stringify({savedAt:new Date().toISOString(),layout:previous}));
    layout.npcDefinitions[id]=npc;
    await env.NEKOSAGASI_LAYOUT.put("shared-layout",JSON.stringify(layout));
    return new Response(JSON.stringify({ok:true,id}),{headers});
  }
  // 共有レイアウト全体をクライアントから書き戻さず、ゲーム内に置く単体アイテムだけを安全に追加する。
  if(body?.action==="add-map-item"){
    const item=body?.item;
    const map=Number(body?.map),x=Number(body?.x),y=Number(body?.y),itemId=String(body?.id||"");
    if(item!=="ちょっと臭い水道水.png"||itemId!=="water-pipe-1"||!Number.isInteger(map)||map<0||map>99||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>100||y<0||y>100)
      return new Response(JSON.stringify({error:"invalid map item"}),{status:400,headers});
    const layout=await env.NEKOSAGASI_LAYOUT.get("shared-layout","json")||{};
    layout.objects??=[];
    const existing=layout.objects.find(entry=>entry?.id===itemId);
    if(existing)return new Response(JSON.stringify({ok:true,existing:true,item:existing}),{headers});
    const placed={id:itemId,kind:"item",map,x,y,item};
    layout.objects.push(placed);
    await env.NEKOSAGASI_LAYOUT.put("shared-layout-backup",JSON.stringify({savedAt:new Date().toISOString(),layout:await env.NEKOSAGASI_LAYOUT.get("shared-layout","json")}));
    await env.NEKOSAGASI_LAYOUT.put("shared-layout",JSON.stringify(layout));
    return new Response(JSON.stringify({ok:true,item:placed}),{headers});
  }
  const id=String(body?.surveyId||''),choice=Number(body?.choice);
  // 既定の多数派問題IDには画像名由来の日本語が含まれるため、Unicodeの文字と数字も受け付ける。
  if(!/^survey[\p{L}\p{N}_-]{1,160}$/u.test(id)||(choice!==0&&choice!==1))return new Response(JSON.stringify({error:"invalid survey"}),{status:400,headers});
  const key="survey-"+id,current=await env.NEKOSAGASI_LAYOUT.get(key,"json")||[0,0];
  current[choice]=Number(current[choice]||0)+1;
  await env.NEKOSAGASI_LAYOUT.put(key,JSON.stringify(current));
  return new Response(JSON.stringify({counts:current}),{headers});
}
