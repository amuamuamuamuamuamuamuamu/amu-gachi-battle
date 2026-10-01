// 「植物の広場_メイン6右」から入る謎の闇儀式の施設だけを安全に追加する。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const objectIds=new Set(['dark-ritual-outside-gate','dark-ritual-inside-gate']);
const buildingId='dark-ritual-exterior';
layout.objects=(layout.objects||[]).filter(item=>!objectIds.has(item.id));
layout.objects.push(
  {id:'dark-ritual-outside-gate',kind:'gateway',map:30,link:33,x:50,y:20,sizeStage:1},
  {id:'dark-ritual-inside-gate',kind:'gateway',map:33,link:33,x:50,y:90,sizeStage:1}
);
layout.buildings=(layout.buildings||[]).filter(item=>item.id!==buildingId);
layout.buildings.push({id:buildingId,map:30,x:50,y:20,graphic:'謎の闇儀式の外観.png',visible:true});
layout.buildingDefinitions=layout.buildingDefinitions||{};
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({facility:'謎の闇儀式',outside:{map:'メイン6右',x:50,y:20},inside:{map:33,x:50,y:90},link:33}));
