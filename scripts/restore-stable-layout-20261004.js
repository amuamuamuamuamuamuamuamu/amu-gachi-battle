// 2026-10-04 の安定版共有レイアウトを復元する。
// 実行: node scripts/restore-stable-layout-20261004.js
const fs = require('node:fs');
const path = require('node:path');

const endpoint = 'https://nekosagasi.pages.dev/api/layout';
const restoreRoot = path.resolve(__dirname, '..', '復元用');
const source = path.join(restoreRoot, '安定版レイアウト_20261004.json');

(async () => {
  const snapshot = JSON.parse(fs.readFileSync(source, 'utf8'));
  const before = await fetch(endpoint, { cache: 'no-store' });
  if (!before.ok) throw new Error(`layout read failed: ${before.status}`);
  const backupFile = path.join(restoreRoot, `復元前レイアウト_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupFile, JSON.stringify((await before.json()).layout || {}, null, 2) + '\n', 'utf8');
  const saved = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  if (!saved.ok || !(await saved.json()).ok) throw new Error(`layout restore failed: ${saved.status}`);
  console.log(`2026-10-04の安定版を復元しました。復元前の控え: ${backupFile}`);
})();
