param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\イベント画像'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\npc-light')
)

$ErrorActionPreference = 'Stop'
$images = @(
  'ワレワレハ侵略者だ', 'ワレワレハ仲間だ', 'おじさんがかえる', 'おじさんもかえる',
  'うんこを育てる', 'うんこが育てる', '犬が踏んだ', '犬で踏んだ',
  'しゃべる植物', 'しゃべらない植物', 'やくざがきれる', 'やくざがきれない',
  'かぴぱらがかぴる', 'かぴぱらがぴかる', 'どうぞうがおれる', 'どうぞうがわれる',
  '枝豆を飛ばす', '枝豆をむく', '便器が掃除する', '便器を掃除する',
  'おじさんでかえる', 'かぴぱらがぽかる', 'カピパラがパカる'
)

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($index in 0..($images.Count - 1)) {
  $source = Join-Path $SourceDirectory ($images[$index] + '.png')
  if (-not (Test-Path -LiteralPath $source)) { throw "イベント画像がありません: $source" }
  $target = Join-Path $OutputDirectory ('art{0:D3}.jpg' -f ($index + 1))
  & ffmpeg -y -loglevel error -i $source -vf 'scale=960:960:force_original_aspect_ratio=decrease' -q:v 4 $target
  if ($LASTEXITCODE -ne 0) { throw "軽量画像の作成に失敗しました: $source" }
}
