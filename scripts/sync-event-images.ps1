param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\イベント画像'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\game-assets\events')
)

$ErrorActionPreference = 'Stop'
$images = Get-ChildItem -LiteralPath $SourceDirectory -Filter '*.png' -File | Sort-Object Name

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($image in $images) {
  $source = $image.FullName
  $target = Join-Path $OutputDirectory ($image.BaseName + '.webp')
  & ffmpeg -y -loglevel error -i $source -vf 'scale=960:960:force_original_aspect_ratio=decrease' -c:v libwebp -q:v 84 $target
  if ($LASTEXITCODE -ne 0) { throw "軽量画像の作成に失敗しました: $source" }
}
