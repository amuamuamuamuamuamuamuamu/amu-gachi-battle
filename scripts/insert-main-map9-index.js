// メインマップ1-9を地図一覧の9枚目へ戻すため、共有配置の地図番号を一度だけ補正する。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
if(layout.mapIndexSchema==='main-map-9-inserted'){
  console.log('map index schema is already current');
  process.exit(0);
}
const shift=item=>{
  if(Number.isInteger(Number(item?.map))&&Number(item.map)>=8)item.map=Number(item.map)+1;
};
(layout.objects||[]).forEach(shift);
(layout.buildings||[]).forEach(shift);
const shiftIndexedRecord=record=>Object.fromEntries(Object.entries(record||{}).map(([key,value])=>{
  const index=Number(key);
  return [Number.isInteger(index)&&index>=8?String(index+1):key,value];
}));
layout.collision=shiftIndexedRecord(layout.collision);
layout.gatewayDiagramPositions=shiftIndexedRecord(layout.gatewayDiagramPositions);
layout.mapIndexSchema='main-map-9-inserted';
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({schema:layout.mapIndexSchema,main6Bottom:{map:5,link:12},main9Top:{map:8,link:12}}));
