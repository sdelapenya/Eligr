# Instala Maestro CLI en Windows (usuario actual).
# Requiere Java 17+ en PATH. Uso: npm run test:e2e:install

$ErrorActionPreference = "Stop"

function Get-MaestroBinDir {
  return Join-Path $env:USERPROFILE ".maestro\bin"
}

if (Get-Command maestro -ErrorAction SilentlyContinue) {
  & maestro --version
  Write-Host "Maestro ya está instalado." -ForegroundColor Green
  exit 0
}

$localMaestro = Join-Path (Get-MaestroBinDir) "maestro.bat"
if (Test-Path $localMaestro) {
  & $localMaestro --version
  Write-Host "Maestro encontrado en $(Get-MaestroBinDir)" -ForegroundColor Green
  exit 0
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Error "Java no encontrado. Maestro necesita Java 17+. Instala JDK 17 (Android Studio suele traerlo)."
}

Write-Host "Descargando Maestro CLI..." -ForegroundColor Cyan
$zipPath = Join-Path $env:TEMP "maestro.zip"
$extractRoot = Join-Path $env:TEMP "maestro-extract"
$installRoot = Join-Path $env:USERPROFILE ".maestro"
$zipUrl = "https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip"

if (Test-Path $extractRoot) {
  Remove-Item -Recurse -Force $extractRoot
}

Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
Expand-Archive -Force $zipPath -DestinationPath $extractRoot

$binDir = Get-ChildItem -Path $extractRoot -Recurse -Directory -Filter "bin" | Select-Object -First 1
if (-not $binDir) {
  Write-Error "El zip de Maestro no contiene carpeta bin. Descarga manual: $zipUrl"
}

if (Test-Path $installRoot) {
  Remove-Item -Recurse -Force $installRoot
}
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
Copy-Item -Path (Join-Path $binDir.Parent.FullName "*") -Destination $installRoot -Recurse -Force

$maestroBin = Get-MaestroBinDir
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$maestroBin*") {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$maestroBin", "User")
  $env:Path = "$env:Path;$maestroBin"
}

& (Join-Path $maestroBin "maestro.bat") --version
Write-Host "OK Maestro instalado en $maestroBin" -ForegroundColor Green
Write-Host "Si 'maestro' no funciona en otra terminal, ciérrala y ábrela de nuevo." -ForegroundColor DarkGray
