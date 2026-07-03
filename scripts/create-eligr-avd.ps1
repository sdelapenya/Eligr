# Crea AVD Eligr_Pixel_35 con system-image android-35 google_apis_playstore (x86_64-3).
# Uso: npm run avd:create

$ErrorActionPreference = "Stop"

$SdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$AvdName = "Eligr_Pixel_35"
$ImageRel = "system-images\android-35\google_apis_playstore\x86_64-3"
$ImageAbs = Join-Path $SdkRoot $ImageRel
$AvdHome = Join-Path $env:USERPROFILE ".android\avd"
$AvdDir = Join-Path $AvdHome "$AvdName.avd"
$AvdIni = Join-Path $AvdHome "$AvdName.ini"
$SkinPath = Join-Path $SdkRoot "skins\pixel_6"

if (-not (Test-Path (Join-Path $ImageAbs "system.img"))) {
  Write-Error "No encuentro imagen completa en $ImageAbs. Instala Google Play x86_64 API 35 en SDK Manager."
}

if (-not (Test-Path $SkinPath)) {
  Write-Error "No encuentro skin pixel_6 en $SkinPath"
}

New-Item -ItemType Directory -Path $AvdDir -Force | Out-Null

$config = @"
AvdId = $AvdName
PlayStore.enabled = true
abi.type = x86_64
avd.ini.displayname = Eligr Pixel 35
avd.ini.encoding = UTF-8
disk.dataPartition.size = 6442450944
fastboot.chosenSnapshotFile =
fastboot.forceChosenSnapshotBoot = no
fastboot.forceColdBoot = no
fastboot.forceFastBoot = yes
hw.accelerometer = yes
hw.arc = false
hw.audioInput = yes
hw.battery = yes
hw.camera.back = virtualscene
hw.camera.front = emulated
hw.cpu.arch = x86_64
hw.cpu.ncore = 4
hw.dPad = no
hw.device.hash2 = MD5:2016577e1656e8e7c2adb0fac972beea
hw.device.manufacturer = Google
hw.device.name = pixel_6
hw.gps = yes
hw.gpu.enabled = yes
hw.gpu.mode = auto
hw.gyroscope = yes
hw.initialOrientation = portrait
hw.keyboard = yes
hw.lcd.density = 420
hw.lcd.height = 2400
hw.lcd.width = 1080
hw.mainKeys = no
hw.ramSize = 2048
hw.sdCard = yes
hw.sensors.light = yes
hw.sensors.magnetic_field = yes
hw.sensors.orientation = yes
hw.sensors.pressure = yes
hw.sensors.proximity = yes
hw.trackBall = no
image.sysdir.1 = $ImageRel\
runtime.network.latency = none
runtime.network.speed = full
sdcard.size = 512M
showDeviceFrame = yes
skin.dynamic = yes
skin.name = pixel_6
skin.path = $($SkinPath -replace '\\', '/')
tag.display = Google Play
tag.displaynames = Google Play
tag.id = google_apis_playstore
tag.ids = google_apis_playstore
target = android-35
vm.heapSize = 228
"@

Set-Content -Path (Join-Path $AvdDir "config.ini") -Value $config -Encoding UTF8

$ini = @"
avd.ini.encoding=UTF-8
path=$AvdDir
path.rel=avd\$AvdName.avd
target=android-35
"@

Set-Content -Path $AvdIni -Value $ini -Encoding UTF8

Write-Host "OK AVD $AvdName creado en $AvdDir" -ForegroundColor Green

$emulator = Join-Path $SdkRoot "emulator\emulator.exe"
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:ANDROID_HOME = $SdkRoot
$listed = @(& $emulator -list-avds 2>&1)
if ($listed -contains $AvdName) {
  Write-Host "OK visible en emulator -list-avds" -ForegroundColor Green
} else {
  Write-Host "AVISO: no aparece en -list-avds. Lista: $($listed -join ', ')" -ForegroundColor Yellow
}
