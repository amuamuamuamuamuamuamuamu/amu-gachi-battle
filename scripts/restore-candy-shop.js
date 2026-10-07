// 公開中のレイアウトへ、駄菓子屋（マップ25）を往復できる入口だけを追加する。
// 既存のNPC・アイテム・他の入口・衝突判定は変更しない。
const api = 'https://nekosagasi.pages.dev/api/layout';
const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);

const payload = await response.json();
const layout = payload.layout || {};
const ids = new Set(['candy-shop-outside', 'candy-shop-inside', 'restored-candy-outside', 'restored-candy-inside']);
layout.objects = (layout.objects || []).filter(item => !ids.has(item.id) && !(item.kind === 'gateway' && Number(item.link) === 18));
layout.objects.push(
  { id: 'candy-shop-outside', kind: 'gateway', map: 4, link: 18, x: 34, y: 36, sizeStage: 1 },
  { id: 'candy-shop-inside', kind: 'gateway', map: 24, link: 18, x: 50, y: 90, sizeStage: 1 },
);

const saved = await fetch(api, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(layout),
});
if (!saved.ok) throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({ restored: '駄菓子屋', link: 18, maps: [4, 24] }));
