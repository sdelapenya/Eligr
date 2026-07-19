# Play signing + EAS — Eligr

**Package:** `com.sdelapenya.eligr`  
**Privacy (Play Console):** https://sergio.sdelapenya.dev/eligr/privacy/  
**Profile EAS:** `production` → AAB (`eas.json`)

## Estado (2026-07-18)

| Paso | Estado |
|------|--------|
| Package / iconos / privacy HTTPS | Hecho |
| Login Expo (`eas login`) | **Pendiente — acción de Sergio** |
| Credenciales Android en EAS | Pendiente tras login |
| `eas build --platform android --profile production` | Pendiente tras login |
| Subida Internal Testing | Pendiente |

Este entorno no tiene sesión Expo (`eas whoami` → Not logged in). No se puede generar AAB en la nube sin tu login.

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

**Importante:** no uses el keystore de debug para producción. Si EAS genera el keystore, **guarda el backup** que Expo ofrece (pérdida = no puedes actualizar la app).

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
