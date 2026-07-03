# Desbloquea adb cuando android:dev se queda en silencio.
$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $SdkRoot "platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Error "No encuentro adb en $adb"
}

Write-Host "Cerrando procesos adb colgados..." -ForegroundColor Yellow
Get-Process adb -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

& $adb kill-server
& $adb start-server
Write-Host "=== adb devices ===" -ForegroundColor Cyan
& $adb devices
