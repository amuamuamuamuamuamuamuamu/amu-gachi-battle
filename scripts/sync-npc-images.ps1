param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\npc'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\npc-light')
)

$ErrorActionPreference = 'Stop'
$names = @(
  '宇宙人', 'おじさん', 'うんこマン', '犬', '植物', 'やくざ', 'カピパラ', '銅像くん', '枝豆くん', '便器くん',
  'カエルおじさん', 'カミナリ様', 'サウナおじさん', 'デブ猫', 'ピザくん', 'マッチョおじさん', 'ラーメン君', '札束くん', '野菜くん',
  '悪人', '怪しいやつ', 'そううつくん', '中割れくん', 'クイズマン',
  '空腹女', '煙君', 'じじい', '狸', '浮浪者', 'マンドラゴラ', '半身おじさん', '温泉タオルおばさん',
  '不衛生キノコおじ', '人面犬', '緑おじさん',
  'OL', 'カフェ店員', 'キノコおじさん', 'ギャラリスト', 'サラリーマン', 'ハンバーガーおじさん',
  'ファーストフード店員女の子', '教祖', '教徒', '女の子', '少年', '大学生の男', '透明人間', '平成ギャル', '幼女',
  'サウナおじさん_ブロンズ像', 'サウナおじさん_純金像'
)

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($index in 0..($names.Count - 1)) {
  $source = Join-Path $SourceDirectory ($names[$index] + '.png')
  if (-not (Test-Path -LiteralPath $source)) { throw "NPC画像がありません: $source" }
  $target = Join-Path $OutputDirectory ('npc{0:D2}.png' -f ($index + 1))
  & ffmpeg -y -loglevel error -i $source -vf 'scale=512:512:force_original_aspect_ratio=decrease' $target
  if ($LASTEXITCODE -ne 0) { throw "ゲーム用NPC画像への変換に失敗しました: $source" }
}
