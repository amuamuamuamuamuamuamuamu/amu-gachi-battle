const endpoint=process.env.NEKOSAGASI_LAYOUT_API||'https://nekosagasi.pages.dev/api/layout';
const response=await fetch(endpoint,{cache:'no-store'});
if(!response.ok)throw new Error('layout read failed: '+response.status);
const payload=await response.json(),layout=payload.layout||{};
layout.buildingDefinitions??={};
const renamedGraphic=['凍結保存スラブ.png','カーボン漬け.png'];
if(layout.buildingDefinitions[renamedGraphic[0]]){
  layout.buildingDefinitions[renamedGraphic[1]]??=layout.buildingDefinitions[renamedGraphic[0]];
  delete layout.buildingDefinitions[renamedGraphic[0]];
}
for(const building of layout.buildings||[])if(building.graphic===renamedGraphic[0])building.graphic=renamedGraphic[1];
const roadblocks=['荷物.png','瓦礫.png','岩.png','苔むした岩.png','地面に突き刺さった瓦礫とロケット.png','封じられた鳥居.png','真っ赤な顔のモンスター.png','タコの集合体.png','カーボン漬け.png','巨大キノコ.png'];
const fullCollision=()=>Object.fromEntries(Array.from({length:10000},(_,i)=>[(i%100)+','+Math.floor(i/100),1]));
for(const graphic of roadblocks){
  const definition=layout.buildingDefinitions[graphic]??={entrances:[],collision:{},passable:{}};
  definition.entrances??=[];definition.collision??={};definition.passable??={};
  if(!Object.keys(definition.collision).length)definition.collision=fullCollision();
}
const save=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!save.ok)throw new Error('layout save failed: '+save.status);
console.log('道を塞ぐ建築物を10種類登録しました');
