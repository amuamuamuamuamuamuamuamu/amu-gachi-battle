param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\イベント画像'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\game-assets\events')
)

$ErrorActionPreference = 'Stop'
$images = @(
  'ワレワレハ侵略者だ', 'ワレワレハ仲間だ', 'おじさんがかえる', 'おじさんもかえる',
  'うんこを育てる', 'うんこが育てる', '犬が踏んだ', '犬で踏んだ',
  'しゃべる植物', 'しゃべらない植物', 'やくざがきれる', 'やくざがきれない',
  'かぴぱらがかぴる', 'かぴぱらがぴかる', 'どうぞうがおれる', 'どうぞうがわれる',
  '枝豆を飛ばす', '枝豆をむく', '便器が掃除する', '便器を掃除する',
  'おじさんでかえる', 'かぴぱらがぽかる', 'カピパラがパカる',
  'あったかいおじさん', '氷風呂', 'トロッコ問題-v3', 'おじいさん4人お金',
  'わがままショッピング美女', '札束殴り', '札束無人島', '札束が意味ない',
  '汚いキノコ女', '黄色い飲み物女', '薬草_服とズボン中心でほぼ溶けた男',
  '薬草？_眉毛と耳毛と鼻毛が濃い男', 'マンドラゴラをおろす',
  'マンドラゴラがオーディション不合格', 'マンドラゴラを大声でおどかす男',
  'おにぎりまんのなかみ', 'おにぎりまんが食べれる', 'おにぎりまんが食べれない',
  'あかちゃんがあけた', 'あかちゃんがかいた', 'あかちゃんがかんだ',
  '骨犬がたすける', '骨犬がたのしませる', '骨犬がわたらせる', '精神安定装置',
  'お金でかえない', 'お金でかえる', 'お金でつながる',
  'おばさんは見られている', 'おばさんはみた', 'おばさんはみかぎる',
  'なんかこわい', 'みられてこわい', 'すごくこわい'
)

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($imageName in $images) {
  $source = Join-Path $SourceDirectory ($imageName + '.png')
  if (-not (Test-Path -LiteralPath $source)) { throw "イベント画像がありません: $source" }
  $target = Join-Path $OutputDirectory ($imageName + '.webp')
  & ffmpeg -y -loglevel error -i $source -vf 'scale=960:960:force_original_aspect_ratio=decrease' -c:v libwebp -q:v 84 $target
  if ($LASTEXITCODE -ne 0) { throw "軽量画像の作成に失敗しました: $source" }
}
