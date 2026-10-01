// メイン3と和室のボロアパートをつなぐ入口番号15だけを、既存レイアウトを保ったまま追加する。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const ids=new Set(['restored-apartment-outside','restored-apartment-inside']);
layout.objects=(layout.objects||[]).filter(item=>!ids.has(item.id));
layout.objects.push(
  {id:'restored-apartment-outside',kind:'gateway',map:2,link:15,x:31.69,y:41.78,sizeStage:1},
  {id:'restored-apartment-inside',kind:'gateway',map:25,link:15,x:50,y:90,sizeStage:0}
);
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({added:['メイン3 (31.69, 41.78)','和室のボロアパート (50, 90)'],link:15}));
