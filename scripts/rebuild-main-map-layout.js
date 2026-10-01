const api = 'https://nekosagasi.pages.dev/api/layout';
const id = label => `restored-${label}`;
const gate = (label, map, link, x, y) => ({ id: id(label), kind: 'gateway', map, link, x, y });

// メインマップ（0-8）は 1-9 を左上から 3×3 に並べたもの。
const gridLinks = [
  ['m1-right', 0, 1, 98, 50], ['m2-left', 1, 1, 2, 50],
  ['m2-right', 1, 2, 98, 50], ['m3-left', 2, 2, 2, 50],
  ['m4-right', 3, 3, 98, 50], ['m5-left', 4, 3, 2, 50],
  ['m5-right', 4, 4, 98, 50], ['m6-left', 5, 4, 2, 50],
  ['m7-right', 6, 5, 98, 50], ['m8-left', 7, 5, 2, 50],
  ['m8-right', 7, 6, 98, 50], ['m9-left', 8, 6, 2, 50],
  ['m1-bottom', 0, 7, 50, 98], ['m4-top', 3, 7, 50, 2],
  ['m2-bottom', 1, 8, 50, 98], ['m5-top', 4, 8, 50, 2],
  ['m3-bottom', 2, 9, 50, 98], ['m6-top', 5, 9, 50, 2],
  ['m4-bottom', 3, 10, 50, 98], ['m7-top', 6, 10, 50, 2],
  ['m5-bottom', 4, 11, 50, 98], ['m8-top', 7, 11, 50, 2],
  ['m6-bottom', 5, 12, 50, 98], ['m9-top', 8, 12, 50, 2],
];

// [外観側のラベル, 外観マップ, 入口番号, 外観上の座標, 室内マップ]
// 室内側は必ず下中央に置く。
const buildingLinks = [
  ['cafe', 0, 13, 28, 39, 9], ['game-center', 1, 14, 27, 74, 10],
  ['apartment', 2, 15, 26, 35, 25], ['lab', 2, 16, 67, 35, 14],
  ['office', 3, 17, 65, 37, 17], ['candy', 4, 18, 34, 36, 24],
  ['hydroponics', 5, 19, 25, 35, 23], ['gallery', 5, 20, 73, 36, 19],
  ['school', 6, 21, 66, 33, 18], ['zoo', 6, 22, 27, 72, 21],
  ['toilet', 7, 23, 72, 31, 20], ['hot-spring', 8, 24, 70, 37, 15],
  ['family-home', 8, 25, 27, 70, 16],
];

const main = gridLinks.map(([label, map, link, x, y]) => gate(label, map, link, x, y));
const building = buildingLinks.flatMap(([label, outsideMap, link, x, y, insideMap]) => [
  gate(`${label}-outside`, outsideMap, link, x, y),
  gate(`${label}-inside`, insideMap, link, 50, 90),
]);

const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);
const payload = await response.json();
const layout = payload.layout || {};
// 既存のNPC・アイテム・手作業で置いた入口は消さない。
// このスクリプト自身が追加した印だけを更新する。
const existingObjects = (layout.objects || []).filter(item => !String(item.id || '').startsWith('restored-'));
layout.objects = [...existingObjects, ...main, ...building, { id: id('player-map5-center'), kind: 'player-start', map: 4, x: 50, y: 50 }];
layout.collision = layout.collision || {};
layout.buildings = layout.buildings || [];
layout.buildingDefinitions = layout.buildingDefinitions || {};
const save = await fetch(api, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(layout) });
if (!save.ok) throw new Error(`layout save failed: ${save.status}`);
console.log(JSON.stringify({ restoredGateways: main.length + building.length, playerStart: { map: 5, x: 50, y: 50 } }));
