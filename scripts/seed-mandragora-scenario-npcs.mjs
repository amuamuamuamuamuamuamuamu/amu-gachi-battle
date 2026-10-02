const endpoint=process.env.NEKOSAGASI_LAYOUT_API||'https://nekosagasi.pages.dev/api/layout';
const response=await fetch(endpoint,{cache:'no-store'});
if(!response.ok)throw new Error('layout read failed: '+response.status);
const payload=await response.json(),layout=payload.layout||{};
layout.objects??=[];
layout.npcDefinitions??={};

const scenarioId='test-mandragora-voice';
const outcome=(extra={})=>({item:'',card:'',building:'',buildingMode:'show',npc:'',npcMode:'show',...extra});
const talk=(message,afterMessage,setScenarioNodeId,out={})=>({message,afterMessage,rewardOnce:true,repeatMessage:'また話しかけてね。',outcome:outcome(out),setScenarioId:scenarioId,setScenarioNodeId});
const normal=(eventNpcName,profileId,initial,conditions=[],extra={})=>({eventType:'normal',eventNpcName,profileId,firstMessage:'',afterEventAction:'cooldown',cooldownCondition:'npc-events-2',cooldownMessage:'いまは話を整理しているところだよ。',normalTalk:{initial,conditions},...extra});

const defs={
  'event-scenario-cleaner':{...normal('掃除おばさん','npc58',talk('あら、聞こえる？　水耕栽培工場の中から、まいばん低いうなり声がするのよ。','気になるなら、工場の中にいるマンドラゴラに話しかけてみてちょうだい。','cleaner')),displayScale:.5},
  'event-scenario-mandragora':normal('マンドラゴラ','npc30',talk('う゛う゛う゛……。電気が足りない……。','生命維持装置か、そばにあるレポートを調べてみて。','mandragora',{npc:'event-scenario-life-support-panel',npcMode:'show'}),[
    {scenarioId,scenarioNodeId:'old-man',...talk('おじいさんが協力してくれるんだね。','人間電池を装置にセットしよう。','install')},
    {scenarioId,scenarioNodeId:'install',...talk('……カチッ。人間電池が、装置に入った。','う゛う゛……という声が、少しずつ消えていく。','silence')},
    {scenarioId,scenarioNodeId:'silence',...talk('電池の力で、ぼくは元気になったよ。','右の道をふさいでいた、あの人も静かになったみたい。','hallucination-leaves',{npc:'event-scenario-hallucination',npcMode:'hide'})},
    {scenarioId,scenarioNodeId:'hallucination-leaves',...talk('これで、メインマップ6の右の道も通れるはずだよ。','道が開いたら、また会いにきて。','road-opens')},
    {scenarioId,scenarioNodeId:'road-opens',...talk('助けてくれてありがとう。これはぼくからのお礼。','食べてもなくならない、無限レタスだよ。','reward',{item:'無限レタス.png'})}
  ]),
  'event-scenario-alien':normal('ゲームセンターの宇宙人','npc01',talk('ピコピコ……。あの水耕栽培の装置？　人間電池が必要なやつだよ。','カフェの前にいる、椅子に座ったおじいさんに相談してみて。','alien',{npc:'event-scenario-grandfather',npcMode:'show'})),
  'event-scenario-grandfather':normal('椅子に座るおじいさん','npc27',talk('人間電池？　困っているマンドラゴラがいるのかい。','わしでよければ、力になろう。これでわしは人間電池だ。装置まで案内しておくれ。','old-man',{item:'人間電池.png'}),[],{profileAsset:'seated-grandfather'}),
  'event-scenario-life-support-panel':normal('生命維持パネル','npc57',talk('生命維持パネル：植物育成のための電力が不足しています。','大型電池が抜けています。詳しい者を探すなら、宇宙人に聞くのが早そうです。','alien-ready',{npc:'event-scenario-alien',npcMode:'show'})),
  'event-scenario-hallucination':normal('幻聴が聞こえる人','npc56',talk('うるさい……。工場のほうから、ずっと声が聞こえるんだ。','怖くて、ここから動けない。','',{}))
};
Object.assign(defs['event-scenario-life-support-panel'].normalTalk.initial,{requiresScenarioId:scenarioId,requiresScenarioNodeId:'mandragora',lockedMessage:'先にマンドラゴラの話を聞いてください。'});
Object.assign(defs['event-scenario-mandragora'].normalTalk.initial,{requiresScenarioId:scenarioId,requiresScenarioNodeId:'cleaner',lockedMessage:'先に水耕栽培工場の前にいる掃除おばさんに話を聞いてください。'});
Object.assign(defs['event-scenario-alien'].normalTalk.initial,{requiresScenarioId:scenarioId,requiresScenarioNodeId:'alien-ready',lockedMessage:'先に生命維持装置かレポートを調べてください。'});
Object.assign(defs['event-scenario-grandfather'].normalTalk.initial,{requiresScenarioId:scenarioId,requiresScenarioNodeId:'alien',lockedMessage:'先にゲームセンターの宇宙人に相談してください。'});
for(const [id,definition] of Object.entries(defs))layout.npcDefinitions[id]={...(layout.npcDefinitions[id]||{}),...definition};

const flow=(layout.scenarioFlows||[]).find(item=>item.id===scenarioId);
if(flow){
  flow.nodes=(flow.nodes||[]).filter(node=>!['locked-factory','life-support-panel','battery-needed','find-battery'].includes(node.id));
  const upsert=(id,data)=>{const node=flow.nodes.find(item=>item.id===id);if(node)Object.assign(node,data);else flow.nodes.push({id,...data})};
  upsert('cleaner',{type:'npc',npc:'npc58',name:'掃除おばさん',text:'水耕栽培工場の前で、まいばん唸り声がすると話す。',setFlag:'掃除おばさんに話した'});
  upsert('mandragora',{type:'npc',npc:'npc30',name:'マンドラゴラ',text:'工場の中でマンドラゴラが唸っている。',needFlag:'掃除おばさんに話した',setFlag:'マンドラゴラに話した'});
  upsert('alien-ready',{type:'outcome',name:'宇宙人を探す',text:'生命維持装置かレポートのどちらかを調べ、宇宙人に聞きにいく。',needFlag:'マンドラゴラに話した',setFlag:'宇宙人を探す'});
  upsert('alien',{type:'npc',npc:'npc01',name:'ゲームセンターの宇宙人',text:'人間電池が必要だと教えてくれる。',needFlag:'宇宙人を探す',setFlag:'宇宙人に聞いた'});
  upsert('old-man',{type:'npc',npc:'seated-grandfather',name:'椅子に座るおじいさん',text:'カフェの前で、人間電池になることを快く了承してくれる。',needFlag:'宇宙人に聞いた',setFlag:'おじいさんが協力する'});
  upsert('install',{type:'outcome',name:'人間電池をはめる',text:'マンドラゴラの装置に人間電池をはめる。',needFlag:'おじいさんが協力する',setFlag:'人間電池を装置にセット'});
  upsert('silence',{type:'outcome',name:'唸り声が消える',text:'電池が動き出し、マンドラゴラの唸り声が消える。',needFlag:'人間電池を装置にセット',setFlag:'マンドラゴラの唸り声が消えた'});
  upsert('hallucination-leaves',{type:'npc',npc:'npc56',name:'幻聴が聞こえる人が消える',text:'メインマップ6の右の道を塞いでいた幻聴が聞こえる人が、いなくなる。',needFlag:'マンドラゴラの唸り声が消えた',setFlag:'幻聴が聞こえる人が消えた'});
  upsert('road-opens',{type:'outcome',name:'メインマップ6右の道が開く',text:'塞がれていた右の道が通れるようになる。',needFlag:'幻聴が聞こえる人が消えた',setFlag:'メインマップ6右の道が開いた'});
  upsert('reward',{type:'outcome',name:'無限レタスをもらう',text:'お礼に、食べてもなくならない無限レタスをマンドラゴラからもらう。',needFlag:'メインマップ6右の道が開いた',setFlag:'無限レタスを入手'});
  const order=['cleaner','mandragora','alien-ready','alien','old-man','install','silence','hallucination-leaves','road-opens','reward'];
  flow.nodes.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  flow.edges=[
    {from:'cleaner',to:'mandragora',label:'マンドラゴラに話しかける'},
    {from:'mandragora',to:'alien-ready',label:'生命維持装置かレポートを調べる'},
    {from:'alien-ready',to:'alien',label:'ゲームセンターへ行く'},
    {from:'alien',to:'old-man',label:'おじいさんに相談する'},
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
Object.assign(report||layout.objects[layout.objects.push({id:reportId})-1],{id:reportId,kind:'item',item:'レポート.png',map:23,x:38,y:61,visible:true,requiresScenarioId:scenarioId,requiresScenarioNodeId:'mandragora',setScenarioId:scenarioId,setScenarioNodeId:'alien-ready',outcome:{npc:'event-scenario-alien',npcMode:'show'}});

const hydroponicsExit=layout.objects.find(item=>item.id==='hydroponics-inside');
if(hydroponicsExit)Object.assign(hydroponicsExit,{map:23,link:19,x:50,y:92,sizeStage:4});

const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log(JSON.stringify({registered:Object.keys(defs),placed:placements.map(([,npc,map,x,y,visible])=>({npc,map,x,y,visible}))},null,2));
