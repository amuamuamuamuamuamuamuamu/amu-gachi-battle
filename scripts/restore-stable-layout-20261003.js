// 2026-10-03の安定版レイアウトを公開環境へ戻す。
// 実行前に、必ず「復元用/マップ接続・配置情報_20261003.txt」と「復元用/NPC情報_20261003.txt」を確認すること。
const fs = require('node:fs');
const path = require('node:path');

const endpoint = 'https://nekosagasi.pages.dev/api/layout';
const restoreRoot = path.resolve(__dirname, '..', '復元用');
const source = path.join(restoreRoot, '安定版レイアウト_20261003.json');

(async () => {
  const snapshot = JSON.parse(fs.readFileSync(source, 'utf8'));
  const before = await fetch(endpoint, { cache: 'no-store' });
  if (!before.ok) throw new Error(`layout read failed: ${before.status}`);
  const current = await before.json();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(restoreRoot, `復元前レイアウト_${timestamp}.json`), JSON.stringify(current.layout || {}, null, 2) + '\n', 'utf8');
  const saved = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  if (!saved.ok) throw new Error(`layout save failed: ${saved.status}`);
  console.log('2026-10-03の安定版レイアウトを復元しました。');
})();
