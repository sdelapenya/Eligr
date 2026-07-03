$p='E:\Eligr\.maestro\flows\06-visit-assistant.yaml'
$lines = Get-Content -LiteralPath $p
$scroll = @('- scrollUntilVisible:', '    element:', '      id: "visit-wizard-next"', '    direction: DOWN', '    timeout: 30000')
$out = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -eq '    id: "visit-wizard-next"' -and $i -gt 0 -and $lines[$i-1] -eq '- tapOn:') { $out += $scroll }
  $out += $lines[$i]
}
Remove-Item -LiteralPath $p -Force
[IO.File]::WriteAllLines($p, $out, (New-Object Text.UTF8Encoding $false))
