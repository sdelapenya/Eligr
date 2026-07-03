# Ejecuta flujos Maestro E2E contra emulador/dispositivo Android conectado.
# Uso: npm run test:e2e
# Variables: ELIGR_E2E_RESET=1, ELIGR_E2E_FLOWS=01-smoke,03-ranking, ELIGR_E2E_SKIP_METRO_RESTART=1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
$env:EXPO_PUBLIC_ELIGR_E2E = "1"
if ($env:ELIGR_E2E_EXPRESS -eq "1" -or ($env:ELIGR_E2E_FLOWS -match "08-express")) {
  $env:EXPO_PUBLIC_ELIGR_E2E_EXPRESS = "1"
  Write-Host "Modo E2E express journey (sin datos demo)." -ForegroundColor DarkGray
}

function Resolve-MaestroCommand {
  $cmd = Get-Command maestro -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $localBat = Join-Path $env:USERPROFILE ".maestro\bin\maestro.bat"
  if (Test-Path $localBat) { return $localBat }
  return $null
}

$maestro = Resolve-MaestroCommand
if (-not $maestro) {
  Write-Host "Maestro no encontrado. Ejecuta: npm run test:e2e:install" -ForegroundColor Yellow
  exit 1
}

$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $SdkRoot "platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  Write-Error "No encuentro adb en $adb. Instala Android Studio o define ANDROID_HOME."
}

function Get-DeviceIdFromRow {
  param([string]$Row)
  return ($Row -split "\s+", 2)[0].Trim()
}

function Get-AdbDeviceRows {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $lines = @(& $adb devices 2>&1 | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
  $ErrorActionPreference = $previous
  return @($lines | Where-Object { $_ -match "^(emulator-\d+|.+)\s+device$" })
}

function Get-AvdNameForDevice {
  param([string]$TargetDeviceId)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $avd = (& $adb -s $TargetDeviceId shell getprop ro.boot.qemu.avd_name 2>$null | Out-String).Trim()
  $ErrorActionPreference = $previous
  return $avd
}

function Get-PreferredDeviceId {
  param([string[]]$Rows)
  $preferredAvd = if ($env:ELIGR_AVD) { $env:ELIGR_AVD } else { "Eligr_Pixel_35" }
  if ($env:ELIGR_E2E_DEVICE) {
    $wanted = $env:ELIGR_E2E_DEVICE.Trim()
    foreach ($row in $Rows) {
      $id = Get-DeviceIdFromRow ([string]$row)
      if ($id -eq $wanted) { return $id }
    }
    return $null
  }
  foreach ($row in $Rows) {
    $id = Get-DeviceIdFromRow ([string]$row)
    if ((Get-AvdNameForDevice -TargetDeviceId $id) -eq $preferredAvd) {
      if ($Rows.Count -gt 1) {
        Write-Host "Usando $id ($preferredAvd); hay $($Rows.Count) dispositivos conectados." -ForegroundColor DarkGray
      }
      return $id
    }
  }
  return $null
}

function Ensure-EligrAvdRunning {
  param([string]$AvdName)
  $emulator = Join-Path $SdkRoot "emulator\emulator.exe"
  if (-not (Test-Path $emulator)) {
    Write-Error "No encuentro emulator.exe. Abre Android Studio > Device Manager."
  }
  foreach ($row in @(Get-AdbDeviceRows)) {
    $id = Get-DeviceIdFromRow ([string]$row)
    if ((Get-AvdNameForDevice -TargetDeviceId $id) -eq $AvdName) { return }
  }
  Write-Host "Arrancando $AvdName (otros AVD, p. ej. FoodRanker, pueden seguir abiertos)..." -ForegroundColor Yellow
  Start-Process -FilePath $emulator -ArgumentList "-avd", $AvdName -WindowStyle Normal | Out-Null
}

function Ensure-EmulatorDevice {
  $avdName = if ($env:ELIGR_AVD) { $env:ELIGR_AVD } else { "Eligr_Pixel_35" }
  $rows = @(Get-AdbDeviceRows)
  if ($rows.Count -gt 0) {
    $id = Get-PreferredDeviceId -Rows $rows
    if ($id) { return $id }
    $other = @($rows | ForEach-Object {
      $oid = Get-DeviceIdFromRow ([string]$_)
      "$oid ($((Get-AvdNameForDevice -TargetDeviceId $oid)))"
    }) -join ", "
    Write-Host "Dispositivos conectados sin $avdName : $other" -ForegroundColor DarkGray
  }

  Ensure-EligrAvdRunning -AvdName $avdName

  $deadline = (Get-Date).AddMinutes(7)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 5
    $rows = @(Get-AdbDeviceRows)
    $id = Get-PreferredDeviceId -Rows $rows
    if ($id) {
      $previous = $ErrorActionPreference
      $ErrorActionPreference = "SilentlyContinue"
      $boot = (& $adb -s $id shell getprop sys.boot_completed 2>$null | Out-String).Trim()
      $ErrorActionPreference = $previous
      if ($boot -eq "1") { return $id }
    }
  }
  Write-Error "El emulador $avdName no respondió a tiempo (7 min). Arráncalo desde Device Manager."
}

function Wait-ForAdbOnline {
  param([string]$TargetDeviceId)
  $deadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $deadline) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $state = (& $adb -s $TargetDeviceId get-state 2>$null | Out-String).Trim()
    $ErrorActionPreference = $previous
    if ($state -eq "device") { return $true }
    if ($state -match "offline|unknown|authorizing") {
      Write-Host "adb $TargetDeviceId en estado '$state'; esperando..." -ForegroundColor DarkGray
      & $adb -s $TargetDeviceId wait-for-device | Out-Null
      Start-Sleep -Seconds 3
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Wait-ForAndroidSystem {
  param([string]$TargetDeviceId)
  Write-Host "Esperando sistema Android en $TargetDeviceId..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddMinutes(5)
  while ((Get-Date) -lt $deadline) {
    if (-not (Wait-ForAdbOnline -TargetDeviceId $TargetDeviceId)) {
      Start-Sleep -Seconds 4
      continue
    }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $boot = (& $adb -s $TargetDeviceId shell getprop sys.boot_completed 2>$null | Out-String).Trim()
    $anim = (& $adb -s $TargetDeviceId shell getprop init.svc.bootanim 2>$null | Out-String).Trim()
    $user = (& $adb -s $TargetDeviceId shell cmd activity get-current-user 2>$null | Out-String).Trim()
    $ErrorActionPreference = $previous
    if ($boot -eq "1" -and $anim -eq "stopped" -and $user -match "^\d+$") {
      Write-Host "OK sistema Android listo." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 4
  }
  Write-Host "AVISO: sistema Android puede no estar del todo listo." -ForegroundColor Yellow
  return $false
}

function Wait-ForPackageManager {
  param([string]$TargetDeviceId)
  Write-Host "Esperando servicio package en $TargetDeviceId..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddMinutes(3)
  while ((Get-Date) -lt $deadline) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $probe = (& $adb -s $TargetDeviceId shell pm path android 2>$null | Out-String).Trim()
    $ErrorActionPreference = $previous
    if ($probe -match "package:") {
      Write-Host "OK servicio package listo." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 3
  }
  Write-Host "AVISO: servicio package no respondió a tiempo." -ForegroundColor Yellow
  Write-Host "Reiniciando emulador (adb reboot)..." -ForegroundColor Yellow
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId reboot | Out-Null
  $ErrorActionPreference = $previous
  & $adb -s $TargetDeviceId wait-for-device | Out-Null
  Wait-ForAndroidSystem -TargetDeviceId $TargetDeviceId | Out-Null
  $deadline = (Get-Date).AddMinutes(5)
  while ((Get-Date) -lt $deadline) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $probe = (& $adb -s $TargetDeviceId shell pm path android 2>$null | Out-String).Trim()
    $ErrorActionPreference = $previous
    if ($probe -match "package:") {
      Write-Host "OK servicio package tras reboot." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 5
  }
  return $false
}

function Test-AndroidServicesHealthy {
  param([string]$TargetDeviceId)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $settings = (& $adb -s $TargetDeviceId shell settings get global adb_enabled 2>$null | Out-String).Trim()
  $package = (& $adb -s $TargetDeviceId shell pm path android 2>$null | Out-String).Trim()
  $ErrorActionPreference = $previous
  return ($settings -match "0|1") -and ($package -match "package:")
}

function Restart-AndroidDevice {
  param([string]$TargetDeviceId)
  Write-Host "Reiniciando $TargetDeviceId (adb reboot)..." -ForegroundColor Yellow
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId reboot | Out-Null
  $ErrorActionPreference = $previous
  & $adb -s $TargetDeviceId wait-for-device | Out-Null
  Wait-ForAndroidSystem -TargetDeviceId $TargetDeviceId | Out-Null
  Wait-ForPackageManager -TargetDeviceId $TargetDeviceId | Out-Null
  Start-Sleep -Seconds 8
}

function Ensure-AndroidHealthy {
  param([string]$TargetDeviceId)
  if (-not (Wait-ForAndroidSystem -TargetDeviceId $TargetDeviceId)) {
    Restart-AndroidDevice -TargetDeviceId $TargetDeviceId
  }
  if (-not (Wait-ForPackageManager -TargetDeviceId $TargetDeviceId)) {
    Restart-AndroidDevice -TargetDeviceId $TargetDeviceId
  }
  if (-not (Test-AndroidServicesHealthy -TargetDeviceId $TargetDeviceId)) {
    Restart-AndroidDevice -TargetDeviceId $TargetDeviceId
    if (-not (Test-AndroidServicesHealthy -TargetDeviceId $TargetDeviceId)) {
      Write-Error "Emulador inestable (settings/package). Cold boot Eligr_Pixel_35 desde Device Manager."
    }
  }
}

function Ensure-EligrInstalled {
  param([string]$TargetDeviceId, [string]$SdkRoot)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $installed = (& $adb -s $TargetDeviceId shell pm path com.anonymous.eligr 2>$null | Out-String).Trim()
  $ErrorActionPreference = $previous
  if ($installed -match "package:") { return $true }
  Write-Host "App Eligr no instalada; instalando APK debug..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot "ensure-e2e-apk.ps1") -DeviceId $TargetDeviceId -SdkRoot $SdkRoot
  return ($LASTEXITCODE -eq 0)
}

function Clear-EligrAppData {
  param([string]$TargetDeviceId)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $out = (& $adb -s $TargetDeviceId shell pm clear com.anonymous.eligr 2>&1 | Out-String)
  $ErrorActionPreference = $previous
  if ($out -match "Exception|Error type|Failure calling") {
    Write-Host "AVISO: pm clear falló ($($out.Trim()))." -ForegroundColor Yellow
    return $false
  }
  return $true
}

function Dismiss-BlockingDialogs {
  param([string]$TargetDeviceId)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId shell pm disable-user --user 0 com.google.android.apps.wellbeing | Out-Null
  for ($i = 0; $i -lt 4; $i++) {
    & $adb -s $TargetDeviceId shell uiautomator dump /sdcard/eligr-e2e-dialog.xml 2>$null | Out-Null
    $xml = (& $adb -s $TargetDeviceId shell cat /sdcard/eligr-e2e-dialog.xml 2>$null | Out-String)
    if ($xml -match 'resource-id="android:id/aerr_close"') {
      Write-Host "Cerrando diálogo ANR del sistema..." -ForegroundColor Yellow
      & $adb -s $TargetDeviceId shell input tap 540 1233 | Out-Null
      Start-Sleep -Seconds 2
      continue
    }
    if ($xml -match "Digital Wellbeing|isn't responding|no responde") {
      & $adb -s $TargetDeviceId shell input keyevent KEYCODE_BACK | Out-Null
      Start-Sleep -Seconds 1
      continue
    }
    break
  }
  $ErrorActionPreference = $previous
}

function Disable-EmulatorAnimations {
  param([string]$TargetDeviceId)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId shell settings put global window_animation_scale 0 | Out-Null
  & $adb -s $TargetDeviceId shell settings put global transition_animation_scale 0 | Out-Null
  & $adb -s $TargetDeviceId shell settings put global animator_duration_scale 0 | Out-Null
  $ErrorActionPreference = $previous
}

function Disable-PackageVerifier {
  param([string]$TargetDeviceId)
  Write-Host "Desactivando verificacion de paquetes (APK Maestro)..." -ForegroundColor DarkGray
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId shell settings put global package_verifier_enable 0 | Out-Null
  & $adb -s $TargetDeviceId shell settings put global verifier_verify_adb_installs 0 | Out-Null
  & $adb -s $TargetDeviceId shell settings put secure install_non_market_apps 1 | Out-Null
  $ErrorActionPreference = $previous
}

function Prepare-DeviceForMaestro {
  param([string]$TargetDeviceId)
  Dismiss-BlockingDialogs -TargetDeviceId $TargetDeviceId
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb -s $TargetDeviceId shell input keyevent KEYCODE_WAKEUP | Out-Null
  & $adb -s $TargetDeviceId shell wm dismiss-keyguard | Out-Null
  & $adb -s $TargetDeviceId shell settings put system screen_off_timeout 2147483647 | Out-Null
  $ErrorActionPreference = $previous
  Start-Sleep -Seconds 2
}
function Stop-MaestroProcesses {
  Get-Process -Name "maestro" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 3
}
function Stabilize-AdbSession {
  param([string]$TargetDeviceId, [int]$Port)
  Stop-MaestroProcesses
  Wait-ForAdbOnline -TargetDeviceId $TargetDeviceId | Out-Null
  & $adb -s $TargetDeviceId wait-for-device | Out-Null
  & $adb -s $TargetDeviceId reverse tcp:$Port tcp:$Port | Out-Null
  Start-Sleep -Seconds 2
}

function Get-MetroStatusText {
  param($ResponseContent)
  if ($ResponseContent -is [byte[]]) {
    return [System.Text.Encoding]::UTF8.GetString($ResponseContent)
  }
  return [string]$ResponseContent
}

function Wait-ForMetroRunning {
  param([int]$Port)
  $deadline = (Get-Date).AddMinutes(6)
  while ((Get-Date) -lt $deadline) {
    try {
      $status = Get-MetroStatusText -ResponseContent (Invoke-WebRequest -Uri "http://127.0.0.1:$Port/status" -UseBasicParsing -TimeoutSec 15).Content
      if ($status -match "running") { return $true }
    } catch { }
    Start-Sleep -Seconds 3
  }
  return $false
}

function Start-MetroForE2e {
  param([int]$Port)
  Write-Host "Reiniciando Metro limpio para E2E..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot "stop-metro.ps1")
  Start-Sleep -Seconds 2
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
  $env:EXPO_PUBLIC_ELIGR_E2E = "1"
  $expoCli = Join-Path $ProjectRoot "node_modules\expo\bin\cli"
  $logOut = Join-Path $env:TEMP "eligr-metro-e2e.out.log"
  $logErr = Join-Path $env:TEMP "eligr-metro-e2e.err.log"
  foreach ($path in @($logOut, $logErr)) {
    if (Test-Path $path) { Remove-Item $path -Force -ErrorAction SilentlyContinue }
  }
  $expressMetro = if ($env:EXPO_PUBLIC_ELIGR_E2E_EXPRESS -eq "1") { "set EXPO_PUBLIC_ELIGR_E2E_EXPRESS=1&& " } else { "" }
  $null = Start-Process -FilePath "cmd.exe" -ArgumentList @(
    "/c",
    "set EXPO_PUBLIC_ELIGR_E2E=1&& ${expressMetro}set REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1&& node `"$expoCli`" start --port $Port --clear"
  ) -WorkingDirectory $ProjectRoot -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr
  if (-not (Wait-ForMetroRunning -Port $Port)) {
    Write-Error "Metro no arrancó a tiempo. Revisa $logOut y $logErr"
  }
  Write-Host "OK Metro en puerto $Port." -ForegroundColor Green
}

function Invoke-MetroWarmup {
  param([int]$Port)
  $warmupUrl = "http://127.0.0.1:$Port/node_modules/expo-router/entry.bundle?platform=android&dev=true&minify=false"
  Write-Host "Precalentando bundle Android..." -ForegroundColor DarkGray
  try {
    Invoke-WebRequest -Uri $warmupUrl -Method GET -UseBasicParsing -TimeoutSec 300 | Out-Null
    Write-Host "OK bundle precalentado." -ForegroundColor Green
  } catch {
    Write-Host "AVISO: warmup bundle: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

function Start-EligrActivity {
  param([string]$TargetDeviceId)
  & $adb -s $TargetDeviceId shell am force-stop com.anonymous.eligr | Out-Null
  Start-Sleep -Seconds 2
  & $adb -s $TargetDeviceId shell am start -n "com.anonymous.eligr/.MainActivity" -a android.intent.action.MAIN -c android.intent.category.LAUNCHER | Out-Null
}

function Wait-ForAppUiReady {
  param([string]$TargetDeviceId, [int]$TimeoutSec = 150, [switch]$RequireOptionsTab)
  Write-Host "Esperando UI de Eligr (hasta ${TimeoutSec}s)..." -ForegroundColor DarkGray
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (-not (Wait-ForAdbOnline -TargetDeviceId $TargetDeviceId)) {
      Start-Sleep -Seconds 4
      continue
    }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    & $adb -s $TargetDeviceId shell uiautomator dump /sdcard/eligr-e2e-ui.xml 2>$null | Out-Null
    $xml = (& $adb -s $TargetDeviceId shell cat /sdcard/eligr-e2e-ui.xml 2>$null | Out-String)
    $ErrorActionPreference = $previous
    if ($RequireOptionsTab) {
      $expressReady = $env:EXPO_PUBLIC_ELIGR_E2E_EXPRESS -eq "1" -and (
        $xml -match 'resource-id="assistant-paste-button"' -or $xml -match 'resource-id="options-empty-paste"' -or $xml -match 'resource-id="options-empty-active"' -or $xml -match 'Tu comparación empieza aquí'
      )
      $demoReady = $xml -match 'resource-id="tab-options"' -or $xml -match 'text="Opciones"' -or $xml -match 'resource-id="options-screen"' -or $xml -match 'Habitacion luminosa en Delicias' -or $xml -match 'Tu comparación empieza aquí'
      if ($expressReady -or $demoReady) {
        Write-Host "OK tab Opciones visible." -ForegroundColor Green
        return $true
      }
    } elseif ($xml -match 'resource-id="tab-options"' -or $xml -match 'onboarding-skip' -or $xml -match 'Pega tus anuncios') {
      Write-Host "OK UI de Eligr visible." -ForegroundColor Green
      return $true
    }
    Start-Sleep -Seconds 4
  }
  Write-Host "AVISO: UI de Eligr no detectada a tiempo." -ForegroundColor Yellow
  return $false
}

function Launch-EligrAndWait {
  param([string]$TargetDeviceId, [int]$Port, [int]$UiTimeoutSec = 150)
  Stabilize-AdbSession -TargetDeviceId $TargetDeviceId -Port $Port
  Wait-ForAndroidSystem -TargetDeviceId $TargetDeviceId | Out-Null
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    if ($attempt -gt 1) {
      Write-Host "Reintento abrir app ($attempt/3)..." -ForegroundColor DarkGray
      Start-Sleep -Seconds 5
    }
    Start-EligrActivity -TargetDeviceId $TargetDeviceId
    Start-Sleep -Seconds 4
    Dismiss-BlockingDialogs -TargetDeviceId $TargetDeviceId
    if (Wait-ForAppUiReady -TargetDeviceId $TargetDeviceId -TimeoutSec $UiTimeoutSec -RequireOptionsTab:($env:ELIGR_E2E_RESET -eq "1")) {
      return $true
    }
  }
  return $false
}

function Invoke-Maestro {
  param([string[]]$Targets, [string]$TargetDeviceId, [int]$Port, [switch]$ReinstallDriver, [switch]$SkipStopMaestro)
  if (-not $SkipStopMaestro) {
    Stop-MaestroProcesses
  }
  Stabilize-AdbSession -TargetDeviceId $TargetDeviceId -Port $Port
  Prepare-DeviceForMaestro -TargetDeviceId $TargetDeviceId
  if (-not (Wait-ForAdbOnline -TargetDeviceId $TargetDeviceId)) {
    Write-Host "AVISO: adb no estable antes de Maestro." -ForegroundColor Yellow
  }
  $targetList = @($Targets)
  Write-Host "maestro test ($($targetList.Count) flujos)..." -ForegroundColor DarkGray
  $logFile = Join-Path $env:TEMP ("eligr-maestro-run-{0}.log" -f [Guid]::NewGuid().ToString("N"))
  $exitCode = 1
  $logText = ""
  $maestroArgs = @("test", "--udid", $TargetDeviceId)
  if ($ReinstallDriver) {
    Disable-PackageVerifier -TargetDeviceId $TargetDeviceId
    Write-Host "Reinstalando driver Maestro en $TargetDeviceId..." -ForegroundColor DarkGray
    $maestroArgs += "--reinstall-driver"
  }
  $maestroArgs += $targetList
  try {
    $output = & $maestro @maestroArgs 2>&1
    $exitCode = $LASTEXITCODE
    $logText = ($output | Out-String)
    $output | Write-Host
    try {
      Set-Content -Path $logFile -Value $logText -Encoding UTF8 -ErrorAction Stop
    } catch {
      Write-Host "AVISO: no se pudo escribir log Maestro ($logFile): $($_.Exception.Message)" -ForegroundColor Yellow
    }
  } catch {
    $logText = if ($output) { ($output | Out-String) } else { $_.Exception.Message }
    Write-Host "Maestro falló: $logText" -ForegroundColor Red
    $exitCode = 1
  }
  $script:LastMaestroLog = $logText
  if ($logText -match "(\d+)/(\d+) Flows Passed") {
    $passed = [int]$Matches[1]
    $total = [int]$Matches[2]
    if ($passed -eq $total) { return 0 }
  }
  if ($logText -match "Flows Failed") { return 1 }
  return $exitCode
}

$deviceId = Ensure-EmulatorDevice
$metroPort = if ($env:ELIGR_METRO_PORT) { [int]$env:ELIGR_METRO_PORT } else { 8081 }

if ($env:ELIGR_E2E_SKIP_METRO_RESTART -ne "1") {
  try {
    $metroBusy = @(Get-NetTCPConnection -LocalPort $metroPort -State Listen -ErrorAction SilentlyContinue).Count -gt 0
    if ($metroBusy) {
      Write-Host "AVISO: Puerto $metroPort ocupado. E2E reiniciará Metro de Eligr (puede afectar otra app en el mismo puerto, p. ej. FoodRanker)." -ForegroundColor Yellow
    }
  } catch { }
}

Ensure-AndroidHealthy -TargetDeviceId $deviceId
Dismiss-BlockingDialogs -TargetDeviceId $deviceId
Start-Sleep -Seconds 3
Disable-PackageVerifier -TargetDeviceId $deviceId
if (-not (Ensure-EligrInstalled -TargetDeviceId $deviceId -SdkRoot $SdkRoot)) {
  Write-Error "No se pudo instalar com.anonymous.eligr. Arranca el emulador y ejecuta: npm run android:dev"
}

if ($env:ELIGR_E2E_SKIP_METRO_RESTART -ne "1") {
  Start-MetroForE2e -Port $metroPort
} else {
  if (-not (Wait-ForMetroRunning -Port $metroPort)) {
    Write-Error "Metro no escucha en $metroPort. Ejecuta: npm run start:clear"
  }
}

& $adb -s $deviceId reverse tcp:$metroPort tcp:$metroPort | Out-Null
Write-Host "OK adb reverse tcp:$metroPort en $deviceId" -ForegroundColor Green

if (-not $env:MAESTRO_DRIVER_STARTUP_TIMEOUT) {
  $env:MAESTRO_DRIVER_STARTUP_TIMEOUT = "600000"
}

Disable-EmulatorAnimations -TargetDeviceId $deviceId

if ($env:ELIGR_E2E_RESET -eq "1") {
  Write-Host "Reset datos E2E (ELIGR_E2E_RESET=1)..." -ForegroundColor Yellow
  if (-not (Clear-EligrAppData -TargetDeviceId $deviceId)) {
    Restart-AndroidDevice -TargetDeviceId $deviceId
    Ensure-EligrInstalled -TargetDeviceId $deviceId -SdkRoot $SdkRoot | Out-Null
    Clear-EligrAppData -TargetDeviceId $deviceId | Out-Null
  }
  Write-Host "Esperando 20s tras pm clear (maestro-server / estado limpio)..." -ForegroundColor DarkGray
  Start-Sleep -Seconds 20
}

Invoke-MetroWarmup -Port $metroPort
if (-not (Wait-ForMetroRunning -Port $metroPort)) {
  Write-Host "Metro caído; reiniciando..." -ForegroundColor Yellow
  Start-MetroForE2e -Port $metroPort
}

if ($env:ELIGR_E2E_RESET -eq "1") {
  Write-Host "Precalentando app tras reset (bundle + tab Opciones)..." -ForegroundColor Yellow
  $warmOk = Launch-EligrAndWait -TargetDeviceId $deviceId -Port $metroPort -UiTimeoutSec 240
  if (-not $warmOk) {
    Write-Host "AVISO: precalentado incompleto; Maestro usará launchApp en flujos." -ForegroundColor Yellow
  }
}

Write-Host "Listo para Maestro (app precalentada; launchApp stopApp:false en flujos)." -ForegroundColor DarkGray
Start-Sleep -Seconds 2

$flowsDir = Join-Path $ProjectRoot ".maestro\flows"
$flowFilter = $env:ELIGR_E2E_FLOWS
if ($flowFilter) {
  $filterNames = @($flowFilter.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  $flowFiles = @(Get-ChildItem -Path $flowsDir -Filter "*.yaml" | Where-Object { $filterNames -contains $_.BaseName } | Sort-Object Name)
  if ($flowFiles.Count -eq 0) {
    Write-Error "Ningún flujo coincide con ELIGR_E2E_FLOWS=$flowFilter"
  }
} else {
  $flowFiles = @(Get-ChildItem -Path $flowsDir -Filter "*.yaml" | Where-Object { $_.BaseName -notmatch "^08-" } | Sort-Object Name)
}

Write-Host "`n=== Eligr Maestro E2E ===" -ForegroundColor Cyan
Write-Host "Dispositivo: $deviceId | Flujos: $($flowFiles.Count) en una sesión Maestro" -ForegroundColor DarkGray
Write-Host "Cierra Maestro Studio si está abierto.`n" -ForegroundColor DarkGray

$flowPaths = @($flowFiles | ForEach-Object { $_.FullName })
Write-Host "Ejecutando: $($flowFiles.Name -join ', ')" -ForegroundColor DarkGray
$suiteExit = Invoke-Maestro -Targets $flowPaths -TargetDeviceId $deviceId -Port $metroPort

$driverFailure = $LastMaestroLog -match "Maestro Android driver|instrumentation could not|Failed to install apk|dadb\.open|Broken pipe|Command failed \(tcp|UNAVAILABLE|Unable to launch app"
$uiFailure = $LastMaestroLog -match "tab-options is visible|options-screen is visible|Assertion is false.*Delicias|Assertion is false.*intake-|Assertion is false.*Piso prueba"

if ($suiteExit -ne 0 -and ($driverFailure -or $uiFailure)) {
  Write-Host "`nReintento suite ($(if ($driverFailure) { 'driver Maestro' } else { 'UI / aserciones' }))..." -ForegroundColor Yellow
  Stop-MaestroProcesses
  & $adb -s $deviceId wait-for-device | Out-Null
  if (-not (Wait-ForAdbOnline -TargetDeviceId $deviceId)) {
    & (Join-Path $PSScriptRoot "fix-adb.ps1")
    Start-Sleep -Seconds 5
    & $adb -s $deviceId wait-for-device | Out-Null
    Wait-ForAdbOnline -TargetDeviceId $deviceId | Out-Null
    Wait-ForAndroidSystem -TargetDeviceId $deviceId | Out-Null
    Wait-ForPackageManager -TargetDeviceId $deviceId | Out-Null
  }
  & $adb -s $deviceId reverse tcp:$metroPort tcp:$metroPort | Out-Null
  Disable-EmulatorAnimations -TargetDeviceId $deviceId
  Invoke-MetroWarmup -Port $metroPort
  Launch-EligrAndWait -TargetDeviceId $deviceId -Port $metroPort -UiTimeoutSec 240 | Out-Null
  Start-Sleep -Seconds 3
  if ($driverFailure) {
    $suiteExit = Invoke-Maestro -Targets $flowPaths -TargetDeviceId $deviceId -Port $metroPort -ReinstallDriver
  } else {
    $suiteExit = Invoke-Maestro -Targets $flowPaths -TargetDeviceId $deviceId -Port $metroPort
  }
}

# Maestro no devuelve conteo por flujo en multi-file; inferir por exit code
if ($suiteExit -eq 0) {
  Write-Host "`n=== Resumen E2E: $($flowFiles.Count)/$($flowFiles.Count) ===" -ForegroundColor Green
  exit 0
}

Write-Host "`n=== Resumen E2E: suite falló (revisa logs Maestro arriba) ===" -ForegroundColor Red
Write-Host "Flujos intentados: $($flowFiles.Name -join ', ')" -ForegroundColor DarkGray
exit 1
