# Arranque fiable de Eligr en Android (emulador + SDK + puerto Metro).
# Uso: npm run android:dev

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $SdkRoot "platform-tools\adb.exe"
$emulator = Join-Path $SdkRoot "emulator\emulator.exe"
$avdName = if ($env:ELIGR_AVD) { $env:ELIGR_AVD } else { "Eligr_Pixel_35" }
$metroPort = if ($env:ELIGR_METRO_PORT) { [int]$env:ELIGR_METRO_PORT } else { 8081 }

if (-not (Test-Path $SdkRoot)) {
  Write-Error "No encuentro Android SDK en $SdkRoot. Instala Android Studio o define ANDROID_HOME."
}

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot

function Ensure-LocalProperties {
  $propsPath = Join-Path $ProjectRoot "android\local.properties"
  if (-not (Test-Path (Join-Path $ProjectRoot "android"))) {
    return
  }
  $escaped = $SdkRoot -replace "\\", "/"
  $content = "sdk.dir=$escaped`n"
  if (-not (Test-Path $propsPath) -or (Get-Content $propsPath -Raw) -notmatch "sdk\.dir=") {
    Set-Content -Path $propsPath -Value $content -Encoding ASCII
    Write-Host "OK android/local.properties actualizado." -ForegroundColor Green
  }
}

function Get-ListeningPids([int]$Port) {
  $pids = @()
  try {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  } catch {
    $lines = netstat -ano | Select-String ":$Port\s"
    foreach ($line in $lines) {
      if ($line -match "\s+(\d+)\s*$") {
        $pids += [int]$Matches[1]
      }
    }
    $pids = $pids | Select-Object -Unique
  }
  return $pids
}

function Stop-MetroOnPort([int]$Port) {
  foreach ($procId in Get-ListeningPids $Port) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $proc) { continue }
    if ($proc.Name -eq "node") {
      Write-Host "Liberando puerto $Port (PID $procId, $($proc.Name))..." -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
  }
}

function Restart-AdbServer {
  Write-Host "Reiniciando adb..." -ForegroundColor Yellow
  Get-Process adb -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
  Invoke-Adb kill-server | Out-Null
  Invoke-Adb start-server | Out-Null
}

function Invoke-Adb {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$AdbArgs)

  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  try {
    & $adb @AdbArgs 2>&1 | ForEach-Object {
      if ($_ -is [System.Management.Automation.ErrorRecord]) {
        $message = $_.ToString()
        if ($message -notmatch "daemon not running|daemon started successfully") {
          Write-Host $message -ForegroundColor Yellow
        }
      } else {
        $_
      }
    }
  } finally {
    $ErrorActionPreference = $previous
  }
}

function Get-AdbDevices() {
  if (-not (Test-Path $adb)) {
    Write-Error "No encuentro adb en $adb"
  }
  $raw = @(Invoke-Adb devices)
  return $raw | Where-Object { $_ -match "^(emulator-\d+|.+)\s+device$" } | ForEach-Object { ($_ -split "\s+")[0] }
}

function Start-EmulatorIfNeeded {
  $devices = Get-AdbDevices
  if ($devices.Count -gt 0) {
    Write-Host "OK Dispositivo Android: $($devices -join ', ')" -ForegroundColor Green
    return
  }

  if (-not (Test-Path $emulator)) {
    Write-Error "No hay emulador/dispositivo y no encuentro emulator.exe. Abre Android Studio > Device Manager."
  }

  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $avds = @(& $emulator -list-avds 2>&1 | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
  $ErrorActionPreference = $previous
  if ($avds -notcontains $avdName) {
    Write-Error "AVD '$avdName' no existe. Crea uno en Android Studio o define ELIGR_AVD con otro nombre. Disponibles: $($avds -join ', ')"
  }

  Write-Host "Arrancando emulador $avdName..." -ForegroundColor Cyan
  Start-Process -FilePath $emulator -ArgumentList "-avd", $avdName -WindowStyle Normal | Out-Null

  $deadline = (Get-Date).AddMinutes(3)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 5
    $devices = Get-AdbDevices
    if ($devices.Count -gt 0) {
      Write-Host "OK Emulador listo: $($devices -join ', ')" -ForegroundColor Green
      return
    }
    Write-Host "Esperando emulador..." -ForegroundColor DarkGray
  }

  Write-Error "El emulador no respondió a tiempo. Ábrelo manualmente y vuelve a ejecutar npm run android:dev"
}

function Ensure-AdbReverse([int]$Port) {
  $devices = Get-AdbDevices
  foreach ($device in $devices) {
    Invoke-Adb @("-s", $device, "reverse", "tcp:$Port", "tcp:$Port") | Out-Null
  }
  Write-Host "OK adb reverse tcp:$Port" -ForegroundColor Green
}

Write-Host "`n=== Eligr Android dev ===" -ForegroundColor Cyan
Write-Host "Paso 1/5: SDK y propiedades locales..." -ForegroundColor DarkGray
Ensure-LocalProperties

if (-not (Test-Path (Join-Path $ProjectRoot "node_modules\expo-document-picker\package.json"))) {
  Write-Host "Instalando dependencias (falta expo-document-picker)..." -ForegroundColor Yellow
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install falló. Revisa la conexión y vuelve a ejecutar npm run android:dev"
  }
}

Write-Host "Paso 2/5: Liberando puerto Metro $metroPort..." -ForegroundColor DarkGray
Stop-MetroOnPort $metroPort

Write-Host "Paso 3/5: Comprobando emulador/dispositivo..." -ForegroundColor DarkGray
Restart-AdbServer
Start-EmulatorIfNeeded

Write-Host "Paso 4/5: adb reverse..." -ForegroundColor DarkGray
Ensure-AdbReverse $metroPort

Write-Host "Paso 5/5: Compilando e instalando (la primera vez tarda varios minutos, puede parecer parado)..." -ForegroundColor Cyan
Write-Host "Para parar Metro: Ctrl+C una vez y confirma con S." -ForegroundColor DarkGray
# CI=true desactiva hot reload en Metro; el puerto ya se libera arriba.
Remove-Item Env:CI -ErrorAction SilentlyContinue

$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
$expoCli = Join-Path $ProjectRoot "node_modules\expo\bin\cli"
& node $expoCli run:android --port $metroPort
exit $LASTEXITCODE
