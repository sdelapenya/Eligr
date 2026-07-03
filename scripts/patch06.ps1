$p='E:\Eligr\.maestro\flows\06-visit-assistant.yaml'
$lines = Get-Content -LiteralPath $p
$lines[9] = '    visible: "Habitacion luminosa en Delicias"'
$lines[10] = '    timeout: 30000'
Remove-Item -LiteralPath $p -Force
[IO.File]::WriteAllLines($p, $lines, (New-Object Text.UTF8Encoding $false))
