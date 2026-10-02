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
  'event-scenario-cleaner':{...normal('掃除おばさん','npc58',talk('あら、聞こえる？　水耕栽培工場の中から、まいばん低いうなり声がするのよ。','気になるなら、工場の中にいるマンドラゴラに話しかけてみてちょうだい。','mandragora')),displayScale:.5},
  'event-scenario-mandragora':normal('マンドラゴラ','npc30',talk('う゛う゛う゛……。電気が足りない……。','となりの生命維持パネルを見て。予備電源があるはずなんだ。','life-support-panel',{npc:'event-scenario-life-support-panel',npcMode:'show'}),[
    {scenarioId,scenarioNodeId:'install',...talk('……カチッ。人間電池が、装置に入った。','う゛う゛……という声が、少しずつ消えていく。','silence')},
    {scenarioId,scenarioNodeId:'silence',...talk('電池の力で、ぼくは元気になったよ。','右の道をふさいでいた、あの人も静かになったみたい。','hallucination-leaves',{npc:'event-scenario-hallucination',npcMode:'hide'})},
    {scenarioId,scenarioNodeId:'hallucination-leaves',...talk('これで、メインマップ6の右の道も通れるはずだよ。','道が開いたら、また会いにきて。','road-opens')},
    {scenarioId,scenarioNodeId:'road-opens',...talk('助けてくれてありがとう。これはぼくからのお礼。','食べてもなくならない、無限レタスだよ。','reward',{item:'無限レタス.png'})}
  ]),
  'event-scenario-alien':normal('ゲームセンターの宇宙人','npc01',talk('ピコピコ……。あの水耕栽培の装置？　人間電池が必要なやつだよ。','人間電池になってくれる人を探すしかないね。','find-battery'),[
    {scenarioId,scenarioNodeId:'find-battery',...talk('カフェの前に、頼みごとを聞いてくれそうなおじいさんがいるよ。','人間電池のことを相談してみるといい。','old-man',{npc:'event-scenario-grandfather',npcMode:'show'})}
  ]),
  'event-scenario-grandfather':normal('椅子に座るおじいさん','npc27',talk('人間電池？　困っているマンドラゴラがいるのかい。','わしでよければ、力になろう。装置まで案内しておくれ。','install')),
  'event-scenario-life-support-panel':normal('生命維持パネル','npc57',talk('生命維持パネル：植物育成のための電力が不足しています。','大型電池が抜けています。予備電源として使える、大きな電池が必要です。','battery-needed',{npc:'event-scenario-alien',npcMode:'show'})),
  'event-scenario-hallucination':normal('幻聴が聞こえる人','npc56',talk('うるさい……。工場のほうから、ずっと声が聞こえるんだ。','怖くて、ここから動けない。','',{}))
};
Object.assign(defs['event-scenario-life-support-panel'].normalTalk.initial,{requiresScenarioId:scenarioId,requiresScenarioNodeId:'life-support-panel',lockedMessage:'先にマンドラゴラの話を聞いてください。'});
for(const [id,definition] of Object.entries(defs))layout.npcDefinitions[id]={...(layout.npcDefinitions[id]||{}),...definition};

const flow=(layout.scenarioFlows||[]).find(item=>item.id===scenarioId);
if(flow){
  flow.nodes=(flow.nodes||[]).filter(node=>node.id!=='locked-factory');
  const lifeSupport=flow.nodes.find(node=>node.id==='life-support-panel');
  if(lifeSupport)Object.assign(lifeSupport,{type:'npc',npc:'npc57',name:'生命維持パネル',text:'植物育成の生命維持パネルを調べる。大型電池が抜けており、予備電源が必要だと分かる。',needFlag:'マンドラゴラを発見',setFlag:'生命維持パネルを確認'});
  else flow.nodes.push({id:'life-support-panel',type:'npc',npc:'npc57',name:'生命維持パネル',text:'植物育成の生命維持パネルを調べる。大型電池が抜けており、予備電源が必要だと分かる。',needFlag:'マンドラゴラを発見',setFlag:'生命維持パネルを確認'});
  const batteryNeeded=flow.nodes.find(node=>node.id==='battery-needed');
  if(batteryNeeded)Object.assign(batteryNeeded,{type:'outcome',name:'予備電源が必要',text:'生命維持パネルを動かすには、大きな電池が必要だ。',needFlag:'生命維持パネルを確認',setFlag:'電池が必要'});
  const order=['cleaner','mandragora','life-support-panel','battery-needed','alien','find-battery','old-man','install','silence','hallucination-leaves','road-opens','reward'];
  flow.nodes.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  const mandragora=flow.nodes.find(node=>node.id==='mandragora');
  if(mandragora)Object.assign(mandragora,{needFlag:'工場の唸り声を聞いた'});
  flow.edges=[
    {from:'cleaner',to:'mandragora',label:'マンドラゴラに話しかける'},
    {from:'mandragora',to:'life-support-panel',label:'生命維持パネルを見る'},
    {from:'life-support-panel',to:'battery-needed',label:'予備電源を確認する'},
    {from:'battery-needed',to:'alien',label:'宇宙人に聞く'},
    {from:'alien',to:'find-battery',label:'情報を得る'},
    {from:'find-battery',to:'old-man',label:'カフェへ行く'},
    {from:'old-man',to:'install',label:'了承を得る'},
    {from:'install',to:'silence',label:'電池を入れる'},
    {from:'silence',to:'hallucination-leaves',label:'唸り声が消える'},
    {from:'hallucination-leaves',to:'road-opens',label:'道を塞ぐ人が消える'},
    {from:'road-opens',to:'reward',label:'道を通る'}
  ];
  flow.nodes.forEach((node,index)=>{node.flowNumber=index+1;node.x=170;node.y=40+index*235});
}

const placements=[
  ['scenario-cleaner','event-scenario-cleaner',5,27,46,true],
  ['scenario-mandragora','event-scenario-mandragora',23,50,61,true],
  ['scenario-life-support-panel','event-scenario-life-support-panel',23,72,61,true],
  ['scenario-alien','event-scenario-alien',10,53,66,false],
  ['scenario-grandfather','event-scenario-grandfather',0,30,55,false],
  ['scenario-hallucination','event-scenario-hallucination',5,88,63,true]
];
for(const [id,npc,map,x,y,visible] of placements){const found=layout.objects.find(item=>item.id===id);Object.assign(found||layout.objects[layout.objects.push({id})-1],{id,kind:'npc',npc,map,x,y,visible})}

const reportId='scenario-mandragora-report',report=layout.objects.find(item=>item.id===reportId);
Object.assign(report||layout.objects[layout.objects.push({id:reportId})-1],{id:reportId,kind:'item',item:'レポート.png',map:23,x:61,y:70,visible:true,setScenarioId:scenarioId,setScenarioNodeId:'battery-needed',outcome:{npc:'event-scenario-alien',npcMode:'show'}});

const hydroponicsExit=layout.objects.find(item=>item.id==='hydroponics-inside');
if(hydroponicsExit)Object.assign(hydroponicsExit,{map:23,link:19,x:50,y:92,sizeStage:4});

const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log(JSON.stringify({registered:Object.keys(defs),placed:placements.map(([,npc,map,x,y,visible])=>({npc,map,x,y,visible}))},null,2));
