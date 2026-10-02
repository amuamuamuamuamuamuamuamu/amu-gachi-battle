const endpoint=process.env.NEKOSAGASI_LAYOUT_API||'https://nekosagasi.pages.dev/api/layout';
const response=await fetch(endpoint,{cache:'no-store'});
if(!response.ok)throw new Error('layout read failed: '+response.status);
const payload=await response.json(),layout=payload.layout||{};
layout.objects??=[];
layout.npcDefinitions??={};

const scenarioId='test-mandragora-voice';
const outcome=(extra={})=>({item:'',card:'',building:'',buildingMode:'show',npc:'',npcMode:'show',...extra});
const talk=(message,afterMessage,setScenarioNodeId,out={})=>({message,afterMessage,rewardOnce:true,repeatMessage:'また話しかけてね。',outcome:outcome(out),setScenarioId:scenarioId,setScenarioNodeId});
const normal=(eventNpcName,profileId,initial,conditions=[])=>({eventType:'normal',eventNpcName,profileId,firstMessage:'',afterEventAction:'cooldown',cooldownCondition:'npc-events-2',cooldownMessage:'いまは話を整理しているところだよ。',normalTalk:{initial,conditions}});

const defs={
  'event-scenario-cleaner':normal('掃除するおばさん','npc32',talk('あら、聞こえる？　水耕栽培工場の中から、まいばん低いうなり声がするのよ。','気になるなら、工場を見てきてちょうだい。鍵はかかっているけれど……。','locked-factory')),
  'event-scenario-mandragora':normal('マンドラゴラ','npc30',talk('う゛う゛う゛……。電気が足りない……。','このままでは、ぼくはしおれてしまう……。','battery-needed',{npc:'event-scenario-alien',npcMode:'show'}),[
    {scenarioId,scenarioNodeId:'install',...talk('……カチッ。人間電池が、装置に入った。','う゛う゛……という声が、少しずつ消えていく。','silence')},
    {scenarioId,scenarioNodeId:'silence',...talk('電池の力で、ぼくは元気になったよ。','右の道をふさいでいた、あの人も静かになったみたい。','hallucination-leaves',{npc:'event-scenario-hallucination',npcMode:'hide'})},
    {scenarioId,scenarioNodeId:'hallucination-leaves',...talk('これで、メインマップ6の右の道も通れるはずだよ。','道が開いたら、また会いにきて。','road-opens')},
    {scenarioId,scenarioNodeId:'road-opens',...talk('助けてくれてありがとう。これはぼくからのお礼。','食べてもなくならない、無限レタスだよ。','reward',{item:'無限レタス.png'})}
  ]),
  'event-scenario-alien':normal('ゲームセンターの宇宙人','npc01',talk('ピコピコ……。あの水耕栽培の装置？　人間電池が必要なやつだよ。','人間電池になってくれる人を探すしかないね。','find-battery'),[
    {scenarioId,scenarioNodeId:'find-battery',...talk('カフェの前に、頼みごとを聞いてくれそうなおじいさんがいるよ。','人間電池のことを相談してみるといい。','old-man',{npc:'event-scenario-grandfather',npcMode:'show'})}
  ]),
  'event-scenario-grandfather':normal('椅子に座るおじいさん','npc27',talk('人間電池？　困っているマンドラゴラがいるのかい。','わしでよければ、力になろう。装置まで案内しておくれ。','install')),
  'event-scenario-hallucination':normal('幻聴が聞こえる人','npc56',talk('うるさい……。工場のほうから、ずっと声が聞こえるんだ。','怖くて、ここから動けない。','',{}))
};
for(const [id,definition] of Object.entries(defs))layout.npcDefinitions[id]={...(layout.npcDefinitions[id]||{}),...definition};

const placements=[
  ['scenario-cleaner','event-scenario-cleaner',5,27,46,true],
  ['scenario-mandragora','event-scenario-mandragora',23,50,61,true],
  ['scenario-alien','event-scenario-alien',10,53,66,false],
  ['scenario-grandfather','event-scenario-grandfather',0,30,55,false],
  ['scenario-hallucination','event-scenario-hallucination',5,88,63,true]
];
for(const [id,npc,map,x,y,visible] of placements){const found=layout.objects.find(item=>item.id===id);Object.assign(found||layout.objects[layout.objects.push({id})-1],{id,kind:'npc',npc,map,x,y,visible})}

const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log(JSON.stringify({registered:Object.keys(defs),placed:placements.map(([,npc,map,x,y,visible])=>({npc,map,x,y,visible}))},null,2));
