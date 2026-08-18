# Eligr

Eligr es una aplicación local-first para guardar, comparar y elegir alquileres según las prioridades de cada persona.

> Compara alquileres. Decide mejor.

No es un marketplace. El usuario incorpora las opciones que encuentra en portales, mensajes, capturas o visitas; Eligr calcula un ranking determinista y explica ventajas, riesgos y tradeoffs.

## Estado

El MVP funcional incluye:

- búsqueda editable y opciones de alquiler;
- alta manual, rápida, desde texto pegado y OCR local de capturas;
- prioridades personalizables y scoring transparente;
- ranking, comparación, filtros y elección final;
- checklist, notas y recordatorios de visita;
- fotos, backup/importación, informe y compartir;
- persistencia local con Zustand y AsyncStorage;
- onboarding, tema claro/oscuro y límite free de cinco opciones activas.

El proyecto está en estabilización para beta interna. Billing, backend y RevenueCat quedan fuera de la versión 0.1.0.

## Stack

- React Native 0.81 + Expo SDK 54
- TypeScript + Expo Router
- Zustand + AsyncStorage
- React Hook Form + Zod
- Maestro para E2E Android

## Desarrollo local

```powershell
npm install
npm run typecheck
npm test
npm run start
```

Para Android nativo (necesario para OCR):

```powershell
npm run android:dev
```

Comprobaciones adicionales:

```powershell
npm run lint
npm run test:e2e
```

## Estructura

```text
app/                 pantallas y rutas Expo Router
src/components/      componentes de producto
src/domain/          reglas, scoring e importación/exportación
src/store/           estado y persistencia local
src/ui/              primitivas visuales y tema
.maestro/            flujos E2E Android
scripts/             desarrollo, build y firma
docs/                producto, operación y handoff
```

## Publicación

- Package Android/iOS: `com.sdelapenya.eligr`
- EAS produce AAB en el perfil `production`.
- La firma y publicación están documentadas en `docs/PLAY-SIGNING.md`.
- La política de privacidad publicada se configura en `app.json`.

Consulta `docs/HANDOFF.md` para el estado operativo vigente y `PROJECT_CONTEXT.md` para la visión original del producto.
