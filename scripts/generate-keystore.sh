#!/usr/bin/env bash
# Genera un keystore de firma release para Google Play (Android) — Linux/macOS.
# Uso: bash scripts/generate-keystore.sh
# El keystore NO se sube al repositorio. Guárdalo en un gestor de contraseñas.
# Preferible para Play: eas credentials -p android (ver docs/PLAY-SIGNING.md).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
KEYSTORE_PATH="${KEYSTORE_PATH:-$ANDROID_DIR/eligr-upload.keystore}"
ALIAS="${ALIAS:-eligr-upload}"
VALIDITY_YEARS="${VALIDITY_YEARS:-25}"
DNAME="${DNAME:-CN=Eligr, OU=Mobile, O=Eligr, L=Madrid, ST=Madrid, C=ES}"

if ! command -v keytool >/dev/null 2>&1; then
  echo "No encuentro keytool. Instala JDK 17+ o define JAVA_HOME." >&2
  exit 1
fi

mkdir -p "$ANDROID_DIR"

if [[ -f "$KEYSTORE_PATH" ]]; then
  echo "Ya existe $KEYSTORE_PATH. Borra o renómbralo antes de generar otro." >&2
  exit 1
fi

echo "Generando keystore de firma release en:"
echo "  $KEYSTORE_PATH"
echo "Alias: $ALIAS"
echo "Te pedirá contraseñas (store + key). Guárdalas fuera del repo."

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity $((VALIDITY_YEARS * 365)) \
  -dname "$DNAME"

EXAMPLE="$ROOT/scripts/keystore.properties.example"
TARGET="$ANDROID_DIR/keystore.properties"
if [[ -f "$EXAMPLE" && ! -f "$TARGET" ]]; then
  cp "$EXAMPLE" "$TARGET"
  echo "Creado $TARGET — rellena storePassword / keyPassword / keyAlias / storeFile."
fi

echo "Listo. Para Play preferible: npx eas-cli credentials -p android"
echo "Ver docs/PLAY-SIGNING.md"
