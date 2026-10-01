const api = 'https://nekosagasi.pages.dev/api/layout';
const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);

const payload = await response.json();
const layout = payload.layout || {};
const replacedIds = new Set([
  'restored-hut-outside', 'restored-hut-inside',
  'restored-living-from-candy-outside', 'restored-living-from-candy-inside',
]);

// 旧駄菓子屋の外観位置だけを、ボロアパート和室ではなく爪痕のリビングへ接続し直す。
layout.objects = (layout.objects || []).filter(item => !replacedIds.has(item.id));
layout.objects.push(
  { id: 'restored-living-from-candy-outside', kind: 'gateway', map: 4, link: 18, x: 34, y: 36 },
  { id: 'restored-living-from-candy-inside', kind: 'gateway', map: 26, link: 18, x: 50, y: 90 },
);

const saved = await fetch(api, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(layout),
});
if (!saved.ok) throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({ updated: '旧駄菓子屋外観 → 爪痕のリビング', link: 18 }));
