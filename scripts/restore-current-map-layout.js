// 2026-09-30時点のマップ配置復元用。実行前に「マップ配置復元仕様.md」を確認すること。
// NPC定義そのものは消さずに利用する。定義が失われた場合は先にNPC定義を復元する。
const api = 'https://nekosagasi.pages.dev/api/layout';
const gate = (id, map, link, x, y, sizeStage = 0) => ({ id, kind: 'gateway', map, link, x, y, sizeStage });

const gateways = [
  gate('restored-m1-right', 0, 1, 98, 50, 3), gate('restored-m2-left', 1, 1, 2, 50, 3),
  gate('restored-m2-right', 1, 2, 98, 50, 3), gate('restored-m3-left', 2, 2, 0, 65.68, 3),
  gate('restored-m4-right', 3, 3, 99.78, 51.54, 3), gate('restored-m5-left', 4, 3, 2, 50, 3),
  gate('restored-m5-right', 4, 4, 98, 50, 3), gate('restored-m6-left', 5, 4, 2, 50),
  gate('restored-m7-right', 6, 5, 98, 50), gate('restored-m8-left', 7, 5, 2, 50),
  gate('restored-m8-right', 7, 6, 98, 50), gate('restored-m9-left', 8, 6, 2, 50),
  gate('restored-m1-bottom', 0, 7, 22.92, 99.89, 4), gate('restored-m4-top', 3, 7, 29.71, 0, 4),
  gate('restored-m2-bottom', 1, 8, 51.86, 99.78, 4), gate('restored-m5-top', 4, 8, 65.24, 0, 4),
  gate('restored-m3-bottom', 2, 9, 50, 98, 4), gate('restored-m6-top', 5, 9, 50, 2),
  gate('restored-m4-bottom', 3, 10, 27.96, 99.78, 4), gate('restored-m7-top', 6, 10, 27.96, 0, 4),
  gate('restored-m8-top', 7, 11, 50, 2),
  gate('restored-m6-bottom', 5, 12, 50, 98), gate('restored-m9-top', 8, 12, 50, 2),
  gate('restored-cafe-outside', 0, 13, 35.2, 41.89, 1), gate('restored-cafe-inside', 9, 13, 50, 90),
  gate('restored-game-center-outside', 1, 14, 33.77, 83.99, 1), gate('restored-game-center-inside', 10, 14, 50, 90),
  gate('restored-apartment-outside', 2, 15, 31.69, 41.78, 1), gate('restored-apartment-inside', 25, 15, 50, 90),
  gate('restored-lab-outside', 2, 16, 59.87, 38.27, 1), gate('restored-lab-inside', 14, 16, 50, 90),
  gate('restored-office-outside', 3, 17, 65, 37), gate('restored-office-inside', 17, 17, 50, 90),
  // 駄菓子屋は使わないため入口を削除し、同じメイン5側の場所を爪痕のリビングへの入口に差し替える。
  gate('restored-living-from-candy-outside', 4, 18, 34, 36), gate('restored-living-from-candy-inside', 26, 18, 50, 90),
  gate('restored-hydroponics-outside', 5, 19, 25, 35), gate('restored-hydroponics-inside', 23, 19, 50, 90),
  gate('restored-gallery-outside', 5, 20, 73, 36), gate('restored-gallery-inside', 19, 20, 50, 90),
  gate('restored-school-outside', 6, 21, 66, 33), gate('restored-school-inside', 18, 21, 50, 90),
  gate('restored-zoo-outside', 6, 22, 27, 72), gate('restored-zoo-inside', 21, 22, 50, 90),
  gate('restored-toilet-outside', 7, 23, 72, 31), gate('restored-toilet-inside', 20, 23, 50, 90),
  gate('restored-hot-spring-outside', 8, 24, 70, 37), gate('restored-hot-spring-inside', 15, 24, 50, 90),
  gate('restored-family-home-outside', 8, 25, 27, 70), gate('restored-family-home-inside', 16, 25, 50, 90),
  // 追加マップ（27〜32）も必ず往復できるよう、既存フィールド側と対になる入口を置く。
  gate('restored-living-outside', 0, 26, 50, 28), gate('restored-living-inside', 26, 26, 50, 90),
  gate('restored-plant3-outside', 2, 27, 98, 50), gate('restored-plant3-inside', 27, 27, 2, 50),
  gate('restored-plant4-outside', 3, 28, 2, 50), gate('restored-plant4-inside', 28, 28, 98, 50),
  gate('restored-plant6-outside', 5, 29, 98, 50), gate('restored-plant6-inside', 29, 29, 2, 50),
  gate('restored-plant8-outside', 7, 30, 50, 98), gate('restored-plant8-inside', 30, 30, 50, 2),
  gate('restored-plant9-outside', 8, 31, 50, 98), gate('restored-plant9-inside', 31, 31, 50, 2),
];

const npcs = [
  ['a968d8f8-5314-4aae-846e-f1d4042534a9', 'event-0af33f1b-cba1-440e-84b7-9ac26c945e16', 88.6, 18.97],
  ['dba181d8-0227-4aa6-bc7a-3bc02119e9b9', 'event-9fc012f2-32b2-4891-b9d1-b538b0d5c5c4', 41.23, 76.32],
  ['7bb28968-04ea-4e6b-8644-b04111e569e5', 'event-dfdd1ecc-1a5b-41ed-879b-1fc05f530bb0', 59.76, 65.68],
  ['203a049b-2804-4fe7-87e6-d2c3460f4044', 'event-ea553f0e-6b54-4e2f-9973-e15ee85a066b', 72.59, 19.08],
  ['6468edee-c78e-4bbb-b783-c3e96fda160b', 'event-3f5bb629-8765-4294-9c92-88f21e4a4c5e', 74.89, 61.07],
  ['48c50dac-0c65-4be9-a868-a2293278b7a8', 'event-07cad61a-c126-412a-83a3-217cbd4ab7a2', 21.6, 63.05],
].map(([id, npc, x, y]) => ({ id, kind: 'npc', npc, map: 4, x, y, visible: true }));

const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);
const payload = await response.json();
const layout = payload.layout || {};
const controlledIds = new Set([...gateways.map(item => item.id), 'restored-player-map5-center', ...npcs.map(item => item.id)]);
// 古い片側だけの入口や切れたリンクは残さず、上の接続表だけを使う。
layout.objects = (layout.objects || []).filter(item => item.kind !== 'gateway' && !controlledIds.has(item.id));
layout.objects.push(...gateways, { id: 'restored-player-map5-center', kind: 'player-start', map: 4, x: 50, y: 50 }, ...npcs);
layout.collision = {};
layout.buildings = layout.buildings || [];
layout.buildingDefinitions = layout.buildingDefinitions || {};
const saved = await fetch(api, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(layout) });
if (!saved.ok) throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({ gateways: gateways.length, npcs: npcs.length, playerStart: 'メイン5 (50,50)', collision: '{}' }));
