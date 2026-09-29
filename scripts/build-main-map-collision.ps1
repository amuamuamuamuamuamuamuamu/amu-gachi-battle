param([Parameter(Mandatory=$true)][string]$SourceDirectory,[Parameter(Mandatory=$true)][string]$OutputPath,[int[]]$MapIndices=@())
$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Drawing
$maps=@()
foreach($file in (Get-ChildItem -LiteralPath $SourceDirectory -File | Where-Object {$_.Name -match '1-[1-9]\.png$'} | Sort-Object Name)){
  $number=[int]([regex]::Match($file.Name,'1-([1-9])\.png$').Groups[1].Value)
  if($number -le 3){$mapIndex=$number-1}else{$mapIndex=$number+7}
  $maps += [pscustomobject]@{Path=$file.FullName;MapIndex=$mapIndex}
}
$result=[ordered]@{}
foreach($map in $maps){if($MapIndices.Count -and $map.MapIndex -notin $MapIndices){continue};$bmp=[Drawing.Bitmap]::new([string]$map.Path);$barrier=[bool[]]::new(10000);for($gy=0;$gy-lt100;$gy++){for($gx=0;$gx-lt100;$gx++){$dark=0;for($py=$gy*20;$py-lt($gy+1)*20;$py+=4){for($px=$gx*20;$px-lt($gx+1)*20;$px+=4){$p=$bmp.GetPixel($px,$py);if($p.R-lt85-and$p.G-lt85-and$p.B-lt85){$dark++}}};$barrier[$gy*100+$gx]=$dark-ge2}};$bmp.Dispose();$outside=[bool[]]::new(10000);$q=[Collections.Generic.Queue[int]]::new();$add={param([int]$x,[int]$y)if($x-lt0-or$x-ge100-or$y-lt0-or$y-ge100){return};$i=$y*100+$x;if(-not$barrier[$i]-and-not$outside[$i]){$outside[$i]=$true;$q.Enqueue($i)}};for($i=0;$i-lt100;$i++){&$add $i 0;&$add $i 99;&$add 0 $i;&$add 99 $i};while($q.Count){$i=$q.Dequeue();$x=$i%100;$y=[int]($i/100);&$add ($x-1) $y;&$add ($x+1) $y;&$add $x ($y-1);&$add $x ($y+1)};$grid=[ordered]@{};for($gy=0;$gy-lt100;$gy++){for($gx=0;$gx-lt100;$gx++){if($outside[$gy*100+$gx]){$grid["$gx,$gy"]=1}}};$result[[string]$map.MapIndex]=$grid}
$result|ConvertTo-Json -Depth 6 -Compress|Set-Content -LiteralPath $OutputPath -Encoding utf8
