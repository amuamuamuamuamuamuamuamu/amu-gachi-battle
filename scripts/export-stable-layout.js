// 公開中の共有レイアウトを、復元用の完全JSONと確認用テキストに固定保存する。
// 実行: node scripts/export-stable-layout.js
const fs = require('node:fs');
const path = require('node:path');

const endpoint = 'https://nekosagasi.pages.dev/api/layout';
const stamp = '20261002';
const output = path.resolve(__dirname, '..', '復元用');
const jsonFile = path.join(output, `安定版レイアウト_${stamp}.json`);
const textFile = path.join(output, `マップ接続・配置情報_${stamp}.txt`);

const format = value => Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
const point = item => `マップ${Number(item.map) + 1} (${format(item.x)}, ${format(item.y)}) size=${item.sizeStage ?? 0}`;

(async () => {
  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) throw new Error(`layout read failed: ${response.status}`);
  const payload = await response.json();
  const layout = payload.layout || {};
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(jsonFile, JSON.stringify(layout, null, 2) + '\n', 'utf8');

  const objects = Array.isArray(layout.objects) ? layout.objects : [];
  const gateways = objects.filter(item => item.kind === 'gateway' || item.type === 'gateway');
  const gatewayGroups = new Map();
  for (const gateway of gateways) {
    const link = String(gateway.link ?? '未設定');
    if (!gatewayGroups.has(link)) gatewayGroups.set(link, []);
    gatewayGroups.get(link).push(gateway);
  }
  const npcs = objects.filter(item => item.kind === 'npc');
  const items = objects.filter(item => item.kind === 'item');
  const others = objects.filter(item => !['gateway', 'npc', 'item'].includes(item.kind) && item.type !== 'gateway');
  const definitions = layout.npcDefinitions || {};
  const lines = [
    'ねこさがし 安定版マップ接続・配置情報',
    `書き出し日: ${stamp}`,
    `取得元: ${endpoint}`,
    `完全復元データ: 復元用/安定版レイアウト_${stamp}.json`,
    '',
    '【復元の基準】',
    'このテキストは確認用。復元は同じフォルダのJSONを scripts/restore-stable-layout-20261002.js で送信する。',
    '復元前の公開状態も 復元用/復元前レイアウト_YYYYMMDD-HHMMSS.json としてローカルへ退避される。',
    '',
    `【出入口】 ${gateways.length}件`,
  ];
  for (const [link, members] of [...gatewayGroups.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    lines.push(`リンク ${link}: ${members.map(item => `${item.id || 'IDなし'} / ${point(item)}`).join('  <->  ')}`);
  }
  lines.push('', `【NPC配置】 ${npcs.length}件`);
  for (const item of npcs) {
    const definition = definitions[item.npc] || {};
    lines.push(`${item.id} / ${item.npc} / ${definition.eventNpcName || '名称未設定'} / ${definition.eventType || '種類未設定'} / ${point(item)}`);
  }
  lines.push('', `【アイテム配置】 ${items.length}件`);
  for (const item of items) lines.push(`${item.id} / ${item.item || '名称未設定'} / ${point(item)}`);
  lines.push('', `【その他の配置】 ${others.length}件`);
  for (const item of others) lines.push(`${item.id || item.kind || item.type || '名称未設定'} / ${point(item)}`);
  lines.push('', `【NPC定義】 ${Object.keys(definitions).length}件`);
  for (const [id, definition] of Object.entries(definitions)) {
    lines.push(`${id} / ${definition.eventNpcName || '名称未設定'} / ${definition.eventType || '種類未設定'} / profile=${definition.profileId || 'なし'}`);
  }
  lines.push('', `collision: ${JSON.stringify(layout.collision || {})}`, `mapIndexSchema: ${layout.mapIndexSchema || '未設定'}`, '');
  fs.writeFileSync(textFile, lines.join('\n'), 'utf8');
  console.log(`saved ${jsonFile}`);
  console.log(`saved ${textFile}`);
})();
