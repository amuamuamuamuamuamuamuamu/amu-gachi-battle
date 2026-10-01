// ハンバーガー屋の入口を残しつつ、メイン5と爪痕のリビングをつなぐ専用入口を追加する。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const ids=new Set(['living-map5-outside','living-map5-inside']);
layout.objects=(layout.objects||[]).filter(item=>!ids.has(item.id));
layout.objects.push(
  {id:'living-map5-outside',kind:'gateway',map:4,link:35,x:50,y:55,sizeStage:1},
  {id:'living-map5-inside',kind:'gateway',map:27,link:35,x:50,y:90,sizeStage:1}
);
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({from:'メイン5 (50,55)',to:'爪痕のリビング (50,90)',link:35}));
