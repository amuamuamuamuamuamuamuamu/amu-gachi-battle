// メインマップ1-2にあるハンバーガー屋の入口を、新しい内観マップへつなぐ。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const insideId='hamburger-shop-inside';
const outside=(layout.objects||[]).find(item=>item.id==='restored-living-from-candy-outside');
if(!outside)throw new Error('existing hamburger shop entrance not found');
// 既存の外側入口をそのまま利用する。爪痕のリビング側の別ルートは削除しない。
// 入口の絵の前で確実に反応するよう、当たり判定は広めにする。
outside.map=1;outside.x=31;outside.y=37;outside.link=34;outside.sizeStage=4;
layout.objects=(layout.objects||[]).filter(item=>item.id!==insideId);
layout.objects.push({id:insideId,kind:'gateway',map:34,link:34,x:50,y:90,sizeStage:1});
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({facility:'ハンバーガー屋_店内',outside:{map:'メイン1-2',x:31,y:37},inside:{map:34,x:50,y:90},link:34}));
