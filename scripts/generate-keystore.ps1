# Genera un keystore de firma release para Google Play (Android).
# Uso: npm run keystore:generate
#   npm run keystore:generate -- -Alias eligr-upload -ValidityYears 25
#
# El keystore NO se sube al repositorio. Guárdalo en un gestor de contraseñas seguro.
# Para EAS Build: eas credentials -p android (sube el keystore a Expo) o deja que EAS lo genere.
# Para Gradle local: copia scripts/keystore.properties.example → android/keystore.properties y rellena valores.

param(
  [string]$KeystorePath = "",
  [string]$Alias = "eligr-upload",
  [int]$ValidityYears = 25,
  [string]$Dname = "CN=Eligr, OU=Mobile, O=Eligr, L=Madrid, ST=Madrid, C=ES"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $ProjectRoot "android"

if (-not $KeystorePath) {
  $KeystorePath = Join-Path $AndroidDir "eligr-upload.keystore"
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  $javaHome = $env:JAVA_HOME
  if ($javaHome) {
    $candidate = Join-Path $javaHome "bin\keytool.exe"
    if (Test-Path $candidate) { $keytool = @{ Source = $candidate } }
  }
}
if (-not $keytool) {
  Write-Error "No encuentro keytool. Instala JDK 17+ o define JAVA_HOME."
}

if (Test-Path $KeystorePath) {
  Write-Error "Ya existe $KeystorePath. Borra o renómbralo antes de generar otro."
}

Write-Host "Generando keystore de firma release..." -ForegroundColor Cyan
Write-Host "  Ruta:   $KeystorePath" -ForegroundColor DarkGray
Write-Host "  Alias:  $Alias" -ForegroundColor DarkGray
Write-Host "  Validez: $ValidityYears años" -ForegroundColor DarkGray
Write-Host ""
Write-Host "keytool pedirá storePassword y keyPassword (pueden ser iguales)." -ForegroundColor Yellow
Write-Host "Anota ambas contraseñas: las necesitarás en Play Console / EAS / Gradle." -ForegroundColor Yellow
Write-Host ""

& $keytool.Source -genkeypair -v `
  -storetype PKCS12 `
  -keystore $KeystorePath `
  -alias $Alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity ($ValidityYears * 365) `
  -dname $Dname

Write-Host ""
Write-Host "OK keystore creado." -ForegroundColor Green
Write-Host "Siguiente paso (elige una):" -ForegroundColor Cyan
Write-Host "  EAS:  eas credentials -p android" -ForegroundColor DarkGray
Write-Host "  Local: copia scripts/keystore.properties.example → android/keystore.properties y configura signingConfigs.release en build.gradle" -ForegroundColor DarkGray
Write-Host "  Play: sube AAB firmado; conserva este keystore para todas las actualizaciones." -ForegroundColor DarkGray
