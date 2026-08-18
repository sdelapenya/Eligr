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

function Wait-ForTargetDevice {
  param([string[]]$AdbArgs, [int]$TimeoutSec = 90)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $state = (& $adb @AdbArgs get-state 2>$null | Out-String).Trim()
    $ErrorActionPreference = $previous
    if ($state -eq "device") { return }
    Start-Sleep -Seconds 2
  }
  Write-Error "ADB no puso el dispositivo en estado 'device' tras ${TimeoutSec}s."
}

function Get-DeviceAbi {
  param([string[]]$AdbArgs)
  $abi = (& $adb @AdbArgs shell getprop ro.product.cpu.abi 2>$null | Out-String).Trim()
  if ($abi) { return $abi }
  return "x86_64"
}

function Get-ApkPackage {
  param([string]$ApkPath)
  if (-not (Test-Path $ApkPath)) { return $null }
  $aapt = Get-ChildItem (Join-Path $SdkRoot "build-tools") -Filter "aapt.exe" -Recurse -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1
  if (-not $aapt) { return $null }
  $badging = (& $aapt.FullName dump badging $ApkPath 2>$null | Select-Object -First 1 | Out-String).Trim()
  if ($badging -match "package: name='([^']+)'") { return $Matches[1] }
  return $null
}

function Remove-StaleCmakeCaches {
  $cacheRoots = @(
    (Join-Path $ProjectRoot "android\app\.cxx"),
    (Join-Path $ProjectRoot "node_modules\expo-modules-core\android\.cxx"),
    (Join-Path $ProjectRoot "node_modules\react-native-screens\android\.cxx")
  )
  foreach ($cacheRoot in $cacheRoots) {
    if (-not (Test-Path -LiteralPath $cacheRoot)) { continue }
    $stale = Get-ChildItem -LiteralPath $cacheRoot -Recurse -File -Include "build.ninja", "prefab_config.json" -ErrorAction SilentlyContinue |
      Select-String -SimpleMatch "cursor-sandbox-cache" -Quiet
    if (-not $stale) { continue }
    $resolved = (Resolve-Path -LiteralPath $cacheRoot).Path
    if (-not $resolved.StartsWith($ProjectRoot)) { Write-Error "Caché CMake fuera del proyecto: $resolved" }
    Write-Host "Eliminando caché CMake con rutas antiguas: $resolved" -ForegroundColor Yellow
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
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

Wait-ForTargetDevice -AdbArgs $adbArgs
$targetAbi = if ($env:ELIGR_E2E_ABI) { $env:ELIGR_E2E_ABI } else { Get-DeviceAbi -AdbArgs $adbArgs }
Write-Host "ABI objetivo E2E: $targetAbi" -ForegroundColor DarkGray

$installed = (& $adb @adbArgs shell pm path $package 2>$null | Out-String).Trim()
$needsInstall = $env:ELIGR_E2E_FORCE_INSTALL -eq "1" -or -not ($installed -match "package:")
$apkPackage = Get-ApkPackage -ApkPath $apk
$apkMatchesPackage = $apkPackage -eq $package
if ((Test-Path $apk) -and -not $apkMatchesPackage) {
  Write-Host "AVISO: APK existente usa '$apkPackage' y se esperaba '$package'; recompilando..." -ForegroundColor Yellow
}
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

if ((Test-Path $apk) -and $apkMatchesPackage) {
  Write-Host "Instalando $apk ..." -ForegroundColor Yellow
  & $adb @adbArgs install -r $apk
  if ($LASTEXITCODE -eq 0) {
    $installed = (& $adb @adbArgs shell pm path $package 2>$null | Out-String).Trim()
    if ($installed -match "package:") {
      Write-Host "OK APK instalado." -ForegroundColor Green
      exit 0
    }
    Write-Host "AVISO: la instalación no creó el package esperado; compilando..." -ForegroundColor Yellow
  }
  Write-Host "AVISO: adb install falló; probando gradlew..." -ForegroundColor Yellow
}

$gradlew = Join-Path $ProjectRoot "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
  Write-Error "No hay APK ni android/gradlew. Ejecuta: npm run android:dev"
}

Write-Host "Compilando e instalando con Gradle (puede tardar varios minutos)..." -ForegroundColor Cyan
Remove-StaleCmakeCaches
$eligrGradleHome = if ($env:ELIGR_GRADLE_USER_HOME) { $env:ELIGR_GRADLE_USER_HOME } else { Join-Path $ProjectRoot ".gradle-local" }
$env:GRADLE_USER_HOME = $eligrGradleHome
$env:EXPO_PUBLIC_ELIGR_E2E = "1"
$env:NODE_ENV = "development"
$gradleAbi = if ($targetAbi -eq "arm64-v8a") { "arm64-v8a" } else { "x86_64" }
Push-Location (Join-Path $ProjectRoot "android")
try {
  & .\gradlew.bat app:installDebug --no-daemon --max-workers=2 "-PreactNativeDevServerPort=8081" "-PreactNativeArchitectures=$gradleAbi"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
Write-Host "OK APK instalado vía Gradle." -ForegroundColor Green
$installed = (& $adb @adbArgs shell pm path $package 2>$null | Out-String).Trim()
if (-not ($installed -match "package:")) {
  Write-Error "Gradle terminó, pero no se instaló el package esperado: $package"
}
