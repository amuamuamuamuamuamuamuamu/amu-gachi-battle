// 公開中の共有レイアウトを、復元用の完全JSONと確認用テキストに固定保存する。
// 実行: node scripts/export-stable-layout.js
const fs = require('node:fs');
const path = require('node:path');

const endpoint = 'https://nekosagasi.pages.dev/api/layout';
const stamp = '20261003';
const output = path.resolve(__dirname, '..', '復元用');
const jsonFile = path.join(output, `安定版レイアウト_${stamp}.json`);
const textFile = path.join(output, `マップ接続・配置情報_${stamp}.txt`);
const npcTextFile = path.join(output, `NPC情報_${stamp}.txt`);
const latestNpcTextFile = path.resolve(__dirname, '..', 'NPC情報.txt');

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
    `このテキストは確認用。復元は同じフォルダのJSONを scripts/restore-stable-layout-${stamp}.js で送信する。`,
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
  const buildings = Array.isArray(layout.buildings) ? layout.buildings : [];
  lines.push('', `【建築配置】 ${buildings.length}件`);
  for (const item of buildings) lines.push(`${item.id || 'IDなし'} / ${item.graphic || '名称未設定'} / ${point(item)} / ${item.visible === false ? '初期非表示' : '初期表示'} / rotation=${item.rotation || 0}`);
  lines.push('', `【NPC定義】 ${Object.keys(definitions).length}件`);
  for (const [id, definition] of Object.entries(definitions)) {
    lines.push(`${id} / ${definition.eventNpcName || '名称未設定'} / ${definition.eventType || '種類未設定'} / profile=${definition.profileId || 'なし'}`);
  }
  lines.push('', `collision: ${JSON.stringify(layout.collision || {})}`, `mapIndexSchema: ${layout.mapIndexSchema || '未設定'}`, '');
  fs.writeFileSync(textFile, lines.join('\n'), 'utf8');
  const quote = value => JSON.stringify(String(value ?? ''));
  const outcome = value => {
    const data = value || {}, result = [];
    if (data.item) result.push(`アイテム=${data.item}`);
    if (data.card) result.push(`カード=${data.card}`);
    if (data.building) result.push(`建築=${data.building}:${data.buildingMode || '変更なし'}`);
    if (data.npc) result.push(`NPC=${data.npc}:${data.npcMode || '変更なし'}`);
    return result.length ? result.join(' / ') : 'なし';
  };
  const npcLines = [
    'ねこさがし 現在のNPC情報',
    `書き出し日: ${stamp}`,
    `取得元: ${endpoint}`,
    `完全復元データ: 復元用/安定版レイアウト_${stamp}.json`,
    `配置情報: 復元用/マップ接続・配置情報_${stamp}.txt`,
    '',
    `登録NPC定義: ${Object.keys(definitions).length}件 / マップ配置NPC: ${npcs.length}件`,
    'このファイルは確認用。正確な復元は同日の安定版JSONを使う。',
  ];
  for (const [id, definition] of Object.entries(definitions)) {
    const placed = npcs.filter(item => item.npc === id).map(point);
    npcLines.push('', '==============================================================================');
    npcLines.push(`登録ID: ${id}`);
    npcLines.push(`登録名: ${definition.eventNpcName || definition.name || '名称未設定'}`);
    npcLines.push(`イベント種類: ${definition.eventType || 'words'}`);
    npcLines.push(`元NPC画像: ${definition.profileId || 'なし'}`);
    npcLines.push(`マップ配置: ${placed.length ? placed.join(' / ') : 'なし'}`);
    if (definition.firstMessage) npcLines.push(`最初の言葉: ${quote(definition.firstMessage)}`);
    if (definition.eventType === 'normal' || definition.normalTalk) {
      const talk = definition.normalTalk || {};
      npcLines.push('【通常会話】');
      npcLines.push(`話す言葉: ${quote(talk.initial?.message || talk.message || '')}`);
      npcLines.push(`会話後の言葉: ${quote(talk.initial?.afterMessage || talk.afterMessage || '')}`);
      npcLines.push(`一度だけ: ${Boolean(talk.initial?.rewardOnce ?? talk.rewardOnce)}`);
      npcLines.push(`起きること: ${outcome(talk.initial?.outcome || talk.outcome)}`);
      for (const condition of talk.conditions || []) npcLines.push(`フラグ会話: scenario=${condition.scenarioId || ''} / flow=${condition.scenarioNodeId || ''} / 言葉=${quote(condition.message || '')} / 結果=${outcome(condition.outcome)}`);
    }
    if (definition.eventType === 'warashibe' || definition.warashibe) {
      const trade = definition.warashibe || {};
      npcLines.push('【わらしべ長者】');
      npcLines.push(`相手が出す物: ${trade.offerItem || '未設定'}`);
      npcLines.push('候補: プレイヤーのわらしべアイテム1個が、相手の物より1ランク低い以上');
      npcLines.push('成立率: 70%（30%は「うーん、やめとく。」）');
    }
    if ((definition.word1 || []).length || (definition.word2 || []).length) {
      npcLines.push('【言葉を作る】');
      npcLines.push(`言葉1: ${(definition.word1 || []).map(quote).join('、') || '未設定'}`);
      npcLines.push(`言葉2: ${(definition.word2 || []).map(quote).join('、') || '未設定'}`);
      for (const [key, event] of Object.entries(definition.events || {})) npcLines.push(`組み合わせ ${key}: 絵=${event.art || 'なし'} / 結果=${outcome(event)}`);
    }
    const registrations = definition.itemRegistrations || (definition.requiredItem ? [{requiredItem: definition.requiredItem, itemArt: definition.itemArt, receiveMessage: definition.receiveMessage}] : []);
    if (registrations.length) {
      npcLines.push('【物を渡す】');
      for (const [index, item] of registrations.entries()) npcLines.push(`登録 ${index + 1}: 渡す物=${item.requiredItem || '未設定'} / 絵=${item.itemArt || 'なし'} / 言葉=${quote(item.receiveMessage || '')}`);
    }
    if ((definition.quizzes || []).length) {
      npcLines.push(`【クイズ】 ${definition.quizzes.length}問`);
      for (const [index, quiz] of definition.quizzes.entries()) npcLines.push(`問題 ${index + 1}: ${quote(quiz.question)} / A=${quote(quiz.choices?.[0])} / B=${quote(quiz.choices?.[1])} / 正解=${Number(quiz.answer) === 0 ? 'A' : 'B'} / 結果=${outcome(quiz.outcome)}`);
    }
    if ((definition.surveys || []).length) {
      npcLines.push(`【多数派】 ${definition.surveys.length}問`);
      for (const [index, survey] of definition.surveys.entries()) npcLines.push(`問題 ${index + 1}: 出題物=${survey.subject || survey.imageFile || 'なし'} / ${quote(survey.question)} / A=${quote(survey.choices?.[0])} / B=${quote(survey.choices?.[1])}`);
    }
    if ((definition.ultimates || []).length) {
      npcLines.push(`【究極の2択】 ${definition.ultimates.length}問`);
      for (const [index, item] of definition.ultimates.entries()) npcLines.push(`問題 ${index + 1}: ${quote(item.question)} / A=${quote(item.choices?.[0])} / B=${quote(item.choices?.[1])}`);
    }
    if ((definition.cardBattleSets || []).length) {
      npcLines.push(`【カードバトル】 ${definition.cardBattleSets.length}セット`);
      for (const [index, set] of definition.cardBattleSets.entries()) npcLines.push(`セット ${index + 1}: 対戦相手=${set.npc || definition.profileId || ''} / 最初の言葉=${quote(set.firstMessage)} / 勝利時=${quote(set.npcLoseMessage)} / 敗北時=${quote(set.npcWinMessage)} / 結果=${outcome(set.outcome)}`);
    }
  }
  npcLines.push('', '==============================================================================', '');
  const npcText = npcLines.join('\n');
  fs.writeFileSync(npcTextFile, npcText, 'utf8');
  fs.writeFileSync(latestNpcTextFile, npcText, 'utf8');
  console.log(`saved ${jsonFile}`);
  console.log(`saved ${textFile}`);
  console.log(`saved ${npcTextFile}`);
  console.log(`saved ${latestNpcTextFile}`);
})();
