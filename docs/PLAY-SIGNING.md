# Play signing + EAS — Eligr

**Package:** `com.sdelapenya.eligr`  
**Privacy (Play Console):** https://sergio.sdelapenya.dev/eligr/privacy/  
**Profile EAS:** `production` → AAB (`eas.json`)

## Estado (2026-08-19)

| Paso | Estado |
|------|--------|
| Package / iconos / privacy HTTPS | Hecho |
| Login Expo (`eas login`) | Hecho — `sdelapenya` / `sdelapenya-apps` |
| Credenciales Android en EAS | Hecho — keystore de producción administrado por Expo |
| `eas build --platform android --profile production` | Hecho — AAB `0.1.0 (3)` verificado |
| Subida Internal Testing | Pendiente |

Proyecto EAS: `@sdelapenya-apps/eligr` (`aa4c4cf5-bf2f-4e05-959a-3b3ada08830b`). Este PC tiene sesión Expo iniciada como `sdelapenya`.

### AAB candidato para Play

- Build EAS: `a26873c0-3294-4db3-9786-d03d385d9a03`
- Archivo local ignorado por Git: `dist/Eligr-0.1.0-build3-production.aab`
- Package / versión: `com.sdelapenya.eligr`, `0.1.0`, `versionCode 3`
- SHA-256 del AAB: `1C08E5D15AD3FF9F34B5D1B6B6768CC61EA18F992764FA78A70967A05D614E92`
- Certificado de subida SHA-256: `52:AB:EE:90:09:18:34:EB:C1:4A:FC:0B:9B:30:81:C4:CD:A7:9E:02:00:59:5A:1D:E6:DF:B5:FE:2A:89:A2:9E`
- Verificación: `bundletool 1.18.1 validate` OK y `jarsigner -verify` OK.
- Permisos bloqueados/ausentes: `SYSTEM_ALERT_WINDOW`, `WRITE_EXTERNAL_STORAGE`, `CAMERA`, `RECORD_AUDIO`.

El build `0.1.0 (2)` fue técnicamente válido, pero queda obsoleto porque la verificación detectó permisos opcionales de plantilla que no necesita Eligr. No subirlo a Play.

## Opción recomendada (EAS)

En el PC/servidor donde trabajes Eligr:

```bash
cd ~/lab/apps/Eligr   # o el clone de GitHub
npm install
npx eas-cli login
npx eas-cli build:configure   # si pide projectId, aceptar
npx eas-cli credentials -p android   # generar o subir upload keystore
npx eas-cli build --platform android --profile production
```

Cuando el build termine, descarga el `.aab` y súbelo a Play Console → Internal testing.

**Importante:** no uses el keystore de debug para producción. EAS ya generó el keystore de subida; queda guardar una copia segura fuera del repositorio.

## Opción local (keystore + Gradle)

```bash
# Linux
npm run keystore:generate:linux
# o
bash scripts/generate-keystore.sh
```

Luego `android/keystore.properties` (desde `scripts/keystore.properties.example`) y release Gradle. Para Play suele ser más simple EAS.

## Verificación

1. AAB instalable vía Internal Testing con `com.sdelapenya.eligr`
2. Privacy URL abre en el móvil
3. Icono launcher cuadrado / adaptive correcto
