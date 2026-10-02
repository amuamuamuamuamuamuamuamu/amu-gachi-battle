const endpoint=process.env.NEKOSAGASI_LAYOUT_API||'https://nekosagasi.pages.dev/api/layout';
const response=await fetch(endpoint,{cache:'no-store'});
if(!response.ok)throw new Error('layout read failed: '+response.status);
const payload=await response.json(),layout=payload.layout||{};
layout.npcDefinitions??={};
const normal=(eventNpcName,profileId,message,afterMessage)=>({
  ...(layout.npcDefinitions[profileId]||{}),
  eventType:'normal',eventNpcName,profileId,firstMessage:'',
  normalTalk:{initial:{message,afterMessage,rewardOnce:false,repeatMessage:afterMessage,outcome:{item:'',card:'',building:'',buildingMode:'show',npc:'',npcMode:'show'},setScenarioId:'',setScenarioNodeId:''},conditions:[]}
});
Object.assign(layout.npcDefinitions,{
  npc60:normal('骨の犬','npc60','わん！　ぼく、骨の犬。','骨の模様がお気に入りなんだ。'),
  npc61:normal('おにぎりマン','npc61','おにぎりだけど、おじさんの顔なんだ。','のりがしっとりしてきた。'),
  npc62:normal('全身札束マン','npc62','札束でできた体だけど、使いすぎには注意してね。','一枚も落とさずに歩いているよ。'),
  npc63:normal('はいはいする赤ちゃん','npc63','ばぶー！','はいはいでどこへでも行くよ。')
});
const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log('新しいNPCを4体登録しました');
