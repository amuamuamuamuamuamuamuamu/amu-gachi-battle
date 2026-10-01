// 現在の34マップ構成に合わせ、全マップを往復できる入口へ正規化する。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const gate=(id,map,link,x,y,sizeStage=1)=>({id,kind:'gateway',map,link,x,y,sizeStage});
const pair=(id,leftMap,rightMap,link,leftX,leftY,rightX=50,rightY=90,sizeStage=1)=>[
  gate(`${id}-outside`,leftMap,link,leftX,leftY,sizeStage),
  gate(`${id}-inside`,rightMap,link,rightX,rightY,sizeStage)
];
const gateways=[
  // メイン1〜9の3×3接続
  gate('main1-right',0,1,98,50),gate('main2-left',1,1,2,50),
  gate('main2-right',1,2,98,50),gate('main3-left',2,2,2,50),
  gate('main3-right',2,40,98,50),gate('main4-left',3,40,2,50),
  gate('main4-right',3,3,98,50),gate('main5-left',4,3,2,50),
  gate('main5-right',4,4,98,50),gate('main6-left',5,4,2,50),
  gate('main7-right',6,5,98,50),gate('main8-left',7,5,2,50),
  gate('main8-right',7,6,98,50),gate('main9-left',8,6,2,50),
  gate('main1-bottom',0,7,50,98),gate('main4-top',3,7,50,2),
  gate('main2-bottom',1,8,50,98),gate('main5-top',4,8,50,2),
  gate('main3-bottom',2,9,50,98),gate('main6-top',5,9,50,2),
  gate('main4-bottom',3,10,50,98),gate('main7-top',6,10,50,2),
  gate('main6-bottom',5,12,50,98),gate('main9-top',8,12,50,2),
  // すべての施設・追加マップ
  ...pair('cafe',0,9,13,35,42),
  ...pair('game-center',1,10,14,34,84),
  ...pair('lab',2,14,16,60,38),
  ...pair('hot-spring',8,15,24,70,37),
  ...pair('company',3,17,17,65,37),
  ...pair('school',6,18,21,66,33),
  ...pair('gallery',5,19,20,73,36),
  ...pair('toilet',7,20,23,72,31),
  ...pair('zoo',6,21,22,27,72),
  ...pair('hydroponics',5,23,19,25,35),
  ...pair('apartment',2,25,15,31.69,41.78,50,90,4),
  ...pair('claw-living',4,26,35,50,55),
  // メイン端からつながる植物の広場
  [gate('plant3-main',2,27,2,50),gate('plant3-field',27,27,98,50)],
  [gate('plant4-main',3,28,2,50),gate('plant4-field',28,28,98,50)],
  [gate('plant6-main',5,29,2,50),gate('plant6-field',29,29,98,50)],
  [gate('plant8-main',7,30,50,98),gate('plant8-field',30,30,50,2)],
  [gate('plant9-main',8,31,50,98),gate('plant9-field',31,31,50,2)],
  // 闇儀式は植物の広場_メイン6右（29）の上側、ハンバーガー屋はメイン1-2（1）
  ...pair('dark-ritual',29,32,33,50,20),
  ...pair('hamburger-shop',1,33,34,31,37)
].flat();

// 出入口と開始位置を置換し、廃止した6マップ上の配置だけを外す。
const unusedMaps=new Set([11,12,13,16,22,24]);
layout.objects=(layout.objects||[]).filter(item=>item.kind!=='gateway'&&item.kind!=='player-start'&&!unusedMaps.has(item.map));
layout.objects.push(...gateways,{id:'player-start-claw-living',kind:'player-start',map:26,x:50,y:50});
layout.buildings=(layout.buildings||[]).filter(item=>item.id!=='dark-ritual-exterior'&&!unusedMaps.has(item.map));
layout.buildings.push({id:'dark-ritual-exterior',map:29,x:50,y:20,graphic:'謎の闇儀式の外観.png',visible:true});
layout.mapIndexSchema='main-map-9-normalized-connections';
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({mapCount:34,gateways:gateways.length,playerStart:{map:26,x:50,y:50},darkRitualMap:29}));
