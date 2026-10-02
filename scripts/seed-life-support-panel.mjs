const endpoint=process.env.NEKOSAGASI_LAYOUT_API||'https://nekosagasi.pages.dev/api/layout';
const response=await fetch(endpoint,{cache:'no-store'});
if(!response.ok)throw new Error('layout read failed: '+response.status);
const payload=await response.json(),layout=payload.layout||{};
layout.npcDefinitions??={};
layout.npcDefinitions.npc57={
  ...(layout.npcDefinitions.npc57||{}),
  eventType:'normal',
  eventNpcName:'生命維持パネル',
  profileId:'npc57',
  firstMessage:'',
  normalTalk:{
    initial:{
      message:'生命維持パネルです。植物の育成状況を監視しています。',
      afterMessage:'大型電池が抜けています。電力が不足しています。',
      rewardOnce:false,
      repeatMessage:'大型電池が抜けています。電力が不足しています。',
      outcome:{item:'',card:'',building:'',buildingMode:'show',npc:'',npcMode:'show'},
      setScenarioId:'',
      setScenarioNodeId:''
    },
    conditions:[]
  }
};
const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log('生命維持パネルをNPCツールに登録しました');
