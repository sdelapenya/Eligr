# Instala el APK debug en el emulador/dispositivo conectado si falta o está desactualizado.
param(
  [string]$DeviceId = "",
  [string]$SdkRoot = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not $SdkRoot) {
  $SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
}
$adb = Join-Path $SdkRoot "platform-tools\adb.exe"
$apk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$package = "com.sdelapenya.eligr"

if (-not (Test-Path $adb)) {
  Write-Error "No encuentro adb en $adb"
}

$adbArgs = @()
if ($DeviceId) { $adbArgs += @("-s", $DeviceId) }

function Get-DeviceAbi {
  param([string[]]$AdbArgs)
  $abi = (& $adb @AdbArgs shell getprop ro.product.cpu.abi 2>$null | Out-String).Trim()
  if ($abi) { return $abi }
  return "x86_64"
}

function Test-EligrLaunchable {
  param([string[]]$AdbArgs)
  & $adb @AdbArgs shell am force-stop $package | Out-Null
  & $adb @AdbArgs shell am start -n "$package/.MainActivity" | Out-Null
  Start-Sleep -Seconds 8
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  & $adb @AdbArgs shell uiautomator dump /sdcard/eligr-apk-probe.xml 2>$null | Out-Null
  $xml = (& $adb @AdbArgs shell cat /sdcard/eligr-apk-probe.xml 2>$null | Out-String)
  $ErrorActionPreference = $previous
  if ($xml -match "keeps stopping|aerr_close|libreactnative") { return $false }
  return ($xml -match "com.sdelapenya.eligr")
}

$targetAbi = if ($env:ELIGR_E2E_ABI) { $env:ELIGR_E2E_ABI } else { Get-DeviceAbi -AdbArgs $adbArgs }
Write-Host "ABI objetivo E2E: $targetAbi" -ForegroundColor DarkGray

$installed = (& $adb @adbArgs shell pm path $package 2>$null | Out-String).Trim()
$needsInstall = $env:ELIGR_E2E_FORCE_INSTALL -eq "1" -or -not ($installed -match "package:")
if (-not $needsInstall -and (Test-Path $apk)) {
  if (-not (Test-EligrLaunchable -AdbArgs $adbArgs)) {
    Write-Host "AVISO: Eligr instalada pero no arranca; reinstalando..." -ForegroundColor Yellow
    $needsInstall = $true
  }
}

if (-not $needsInstall -and (Test-Path $apk)) {
  Write-Host "OK APK ya instalado ($package)." -ForegroundColor Green
  exit 0
}

if (Test-Path $apk) {
  Write-Host "Instalando $apk ..." -ForegroundColor Yellow
  & $adb @adbArgs install -r $apk
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK APK instalado." -ForegroundColor Green
    exit 0
  }
  Write-Host "AVISO: adb install falló; probando gradlew..." -ForegroundColor Yellow
}

$gradlew = Join-Path $ProjectRoot "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
  Write-Error "No hay APK ni android/gradlew. Ejecuta: npm run android:dev"
}

Write-Host "Compilando e instalando con Gradle (puede tardar varios minutos)..." -ForegroundColor Cyan
$env:GRADLE_USER_HOME = if ($env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME } else { Join-Path $env:USERPROFILE ".gradle" }
$env:EXPO_PUBLIC_ELIGR_E2E = "1"
$gradleAbi = if ($targetAbi -eq "arm64-v8a") { "arm64-v8a" } else { "x86_64" }
Push-Location (Join-Path $ProjectRoot "android")
try {
  & .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=$gradleAbi
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
Write-Host "OK APK instalado vía Gradle." -ForegroundColor Green
