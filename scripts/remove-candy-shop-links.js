// 駄菓子屋は配置ツールで単独編集するため、出入口リンクを持たせない。
const api = 'https://nekosagasi.pages.dev/api/layout';
const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);

const payload = await response.json();
const layout = payload.layout || {};
const ids = new Set(['candy-shop-outside', 'candy-shop-inside', 'restored-candy-outside', 'restored-candy-inside']);
const before = (layout.objects || []).length;
layout.objects = (layout.objects || []).filter(item => !ids.has(item.id) && !(item.kind === 'gateway' && Number(item.link) === 18));

const saved = await fetch(api, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(layout),
});
if (!saved.ok) throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({ removedCandyLinks: before - layout.objects.length }));
