# Compila APK Android de Eligr y copia a dist/
# Uso: npm run build:apk
#   npm run build:apk -- -Variant release   (por defecto)
#   npm run build:apk -- -Variant debug

param(
  [ValidateSet("release", "debug")]
  [string]$Variant = "release",
  [string]$Abi = "arm64-v8a"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$pkg = Get-Content (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json
$appJson = Get-Content (Join-Path $ProjectRoot "app.json") -Raw | ConvertFrom-Json
$appVersion = $pkg.version
$versionCode = $appJson.expo.android.versionCode
Write-Host "Versión app: $appVersion (versionCode $versionCode)" -ForegroundColor DarkGray

$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
if (-not $env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE ".gradle" }
$env:NODE_ENV = if ($Variant -eq "release") { "production" } else { "development" }

$propsPath = Join-Path $ProjectRoot "android\local.properties"
if (-not (Test-Path $propsPath)) {
  $escaped = $SdkRoot -replace "\\", "/"
  Set-Content -Path $propsPath -Value "sdk.dir=$escaped`n" -Encoding ASCII
}

$task = if ($Variant -eq "release") { "packageRelease" } else { "assembleDebug" }
$skipMap = if ($Variant -eq "release") { @("-x", ":expo-mlkit-ocr:mapReleaseSourceSetPaths", "-x", ":expo:mapReleaseSourceSetPaths") } else { @() }

Write-Host "Compilando APK $Variant ($Abi)..." -ForegroundColor Cyan
Push-Location (Join-Path $ProjectRoot "android")
try {
  & .\gradlew.bat ":app:$task" "-PreactNativeArchitectures=$Abi" @skipMap
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

$src = if ($Variant -eq "release") {
  Join-Path $ProjectRoot "android\app\build\outputs\apk\release\app-release.apk"
} else {
  Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
}

if (-not (Test-Path $src)) {
  Write-Error "No encuentro APK en $src"
}

$dist = Join-Path $ProjectRoot "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$dest = Join-Path $dist "Eligr-$appVersion-$Variant-$($Abi -replace '-v8a','').apk"
Copy-Item $src $dest -Force

$mb = [math]::Round((Get-Item $dest).Length / 1MB, 1)
Write-Host "OK APK: $dest ($mb MB)" -ForegroundColor Green
if ($Variant -eq "debug") {
  Write-Host "Debug: necesitas Metro (npm run start) y adb reverse tcp:8081 tcp:8081" -ForegroundColor Yellow
} else {
  Write-Host "Release: instalable sin PC. adb install -r `"$dest`"" -ForegroundColor DarkGray
}
