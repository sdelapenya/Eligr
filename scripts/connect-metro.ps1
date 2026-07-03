# Conecta el emulador Android a Metro en localhost:8081.
# Uso: npm run metro:connect

$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $SdkRoot "platform-tools\adb.exe"
$metroPort = if ($env:ELIGR_METRO_PORT) { [int]$env:ELIGR_METRO_PORT } else { 8081 }

if (-not (Test-Path $adb)) {
  Write-Error "No encuentro adb en $adb"
}

$devices = @(& $adb devices | Where-Object { $_ -match "device$" })
if ($devices.Count -eq 0) {
  Write-Error "No hay emulador/dispositivo. Arranca Pixel_6 en Android Studio."
}

& $adb reverse tcp:$metroPort tcp:$metroPort
Write-Host "OK adb reverse tcp:$metroPort" -ForegroundColor Green

$listening = $false
try {
  $listening = @(Get-NetTCPConnection -LocalPort $metroPort -State Listen -ErrorAction SilentlyContinue).Count -gt 0
} catch {
  $listening = [bool](netstat -ano | Select-String ":$metroPort\s")
}

if (-not $listening) {
  Write-Host "AVISO: Metro NO escucha en puerto $metroPort. En otra terminal: npm run start:clear" -ForegroundColor Yellow
  exit 1
}

Write-Host "OK Metro escuchando en $metroPort" -ForegroundColor Green
& $adb shell am force-stop com.anonymous.eligr | Out-Null
Start-Sleep -Seconds 1
& $adb shell monkey -p com.anonymous.eligr -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Host "Eligr reiniciada. Si sigue en blanco, pulsa R en Metro." -ForegroundColor Cyan
