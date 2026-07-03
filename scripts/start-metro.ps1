# Arranca Metro en el puerto habitual sin preguntar por otro puerto.
# Uso: npm run start | npm run start:clear

param(
  [switch]$Clear
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$metroPort = if ($env:ELIGR_METRO_PORT) { [int]$env:ELIGR_METRO_PORT } else { 8081 }

& (Join-Path $PSScriptRoot "stop-metro.ps1")

$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
$expoCli = Join-Path $ProjectRoot "node_modules\expo\bin\cli"
$args = @("start", "--port", "$metroPort")
if ($Clear) {
  $args += "--clear"
}

Write-Host "Iniciando Metro en http://localhost:$metroPort$(if ($Clear) { ' (cache limpia)' })" -ForegroundColor Cyan
& node $expoCli @args
exit $LASTEXITCODE
