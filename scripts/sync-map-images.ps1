param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\マップ'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\game-assets\maps')
)
$ErrorActionPreference = 'Stop'
$names = @(
  'メインマップ1-1', 'メインマップ1-2', 'メインマップ1-3',
  'メインマップ1-4', 'メインマップ1-5', 'メインマップ1-6',
  'メインマップ1-7', 'メインマップ1-8', 'メインマップ1-9',
  'おしゃれカフェ', 'ゲームセンター', 'コンビニ', 'スーパー',
  'やくざの事務所', 'ラボ', '温泉_男女4区画', '家族の家', '会社',
  '学校', '現代美術館', '公衆トイレ', '室内動物園', '図書館',
  '水耕栽培工場', '駄菓子屋', '和室のボロアパート'
)
if ($names.Count -ne 26) { throw 'マップ一覧は26枚である必要があります。' }
$maps = for ($index = 0; $index -lt $names.Count; $index++) {
  $output = if ($index -eq 0) { 'm1-game.webp' } else { 'map' + ($index + 1) + '-game.webp' }
  @{ Source = $names[$index] + '.png'; Output = $output }
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($map in $maps) {
  $source = Join-Path $SourceDirectory $map.Source
  if (-not (Test-Path -LiteralPath $source)) { Write-Warning "未配置のマップは既存のゲーム画像を保持します: $source"; continue }
  $target = Join-Path $OutputDirectory $map.Output
  & ffmpeg -y -loglevel error -i $source -vf 'scale=1024:1024:force_original_aspect_ratio=decrease,pad=1024:1024:(ow-iw)/2:(oh-ih)/2' -c:v libwebp -quality 75 -compression_level 6 $target
  if ($LASTEXITCODE -ne 0) { throw "軽量画像への変換に失敗しました: $source" }
}
