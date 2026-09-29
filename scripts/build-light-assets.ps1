param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..')
)
$ErrorActionPreference = 'Stop'
$outputRoot = Join-Path $ProjectRoot 'game-assets'
$sources = @(
  @{ Name = 'items'; Source = 'アイテム'; Size = '512:512'; Quality = '78' },
  @{ Name = 'buildings'; Source = '建築'; Size = '720:720'; Quality = '80' },
  @{ Name = 'events'; Source = 'イベント画像'; Size = '960:960'; Quality = '80' }
)
foreach ($group in $sources) {
  $sourcePath = Join-Path $ProjectRoot $group.Source
  $outputPath = Join-Path $outputRoot $group.Name
  New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
  Get-ChildItem -LiteralPath $sourcePath -Filter '*.png' -File | ForEach-Object {
    $target = Join-Path $outputPath ($_.BaseName + '.webp')
    $filter = "scale=$($group.Size):force_original_aspect_ratio=decrease"
    if ($group.Name -eq 'items') { $filter = "format=rgba,chromakey=0xffffff:0.08:0.0,$filter" }
    & ffmpeg -y -loglevel error -i $_.FullName -vf $filter -c:v libwebp -quality $group.Quality -compression_level 6 $target
    if ($LASTEXITCODE -ne 0) { throw "軽量画像への変換に失敗しました: $($_.FullName)" }
  }
}
& (Join-Path $PSScriptRoot 'sync-map-images.ps1') -OutputDirectory (Join-Path $outputRoot 'maps')
if ($LASTEXITCODE -ne 0) { throw 'マップ画像の変換に失敗しました。' }
& (Join-Path $PSScriptRoot 'sync-npc-images.ps1') -OutputDirectory (Join-Path $ProjectRoot 'npc-light')
if ($LASTEXITCODE -ne 0) { throw 'NPC画像の変換に失敗しました。' }
