# Cursor Handoff - Eligr

Last updated: 2026-08-18 (Codex stabilization + physical smoke)

> Estado operativo vigente: leer primero `docs/HANDOFF.md`. Este archivo conserva el historial detallado de sesiones y puede contener notas antiguas ya superadas.

## Codex stabilization update (2026-08-17)

- Eliminado el fallback que desbloqueaba la UI tras 4 segundos sin confirmar la hidratación de AsyncStorage.
- Añadidos estados loading/slow/error/ready y reintento seguro en `StoreGate`.
- Añadidas pruebas del invariante de hidratación; tests de dominio, typecheck y lint pasan.
- Declarado `tsx` como devDependency para no descargarlo implícitamente al ejecutar tests.
- README y plan técnico actualizados al MVP real.
- El primer lint en frío fue anormalmente lento, pero el gate completo termina y pasa sin avisos tras corregir dos advertencias existentes.
- `npm audit fix` sin `--force` redujo los avisos de 28 a 22 y eliminó el crítico. Los restantes requieren seguimiento con el SDK de Expo; no se forzó Expo 57.
- Android generado sincronizado con `com.sdelapenya.eligr`. El runner E2E ahora rechaza APKs con package incorrecto y evita rutas Gradle/CMake largas heredadas del sandbox.
- AVD `Eligr_Pixel_35` recreado; APK correcto compilado/instalado y `01-smoke` validado.
- Cobertura Maestro completa confirmada: estándar `00–07` + `09` (9/9 por cobertura final) y express `08` (1/1), total 10/10. Los YAML multiarchivo se pisaban al correr en paralelo sobre un único emulador; `maestro-test.ps1` ahora ejecuta cada flujo secuencialmente, conserva los aprobados y reintenta solo los fallidos hasta tres veces ante caídas del driver. El lote principal confirmó seis estándar y la tanda complementaria restante terminó 3/3, ejercitando además la recuperación.
- Smoke físico completado el 2026-08-18 en Xiaomi `M2101K7BNY` (Android 13) con release arm64 autónoma: arranque, onboarding, ranking/compartir, backup JSON, alta rápida, persistencia tras force-stop, detalle, visita y selector de fotos OK. La automatización se hizo con ADB/capturas porque MIUI bloqueó el APK auxiliar de Maestro. Hallazgo UX corregido en código: placeholders de título/precio/zona del alta rápida prefijados con `Ej.`. La APK instalada aún no incluye ese ajuste final de copy.

## Project Goal

Eligr is a local-first rental comparison app. The MVP helps users:

1. Create or use a rental search.

2. Add rental options manually.

3. Tune personal priorities.

4. Calculate deterministic, transparent scoring.

5. Review an explained ranking with pros, cons, badges, and warnings.

6. Open rental detail, change status, edit, or delete options.

Stack chosen by the project owner:

- React Native

- Expo

- TypeScript

- Expo Router

- Zustand for local state

- React Hook Form + Zod for forms

- Local-first first; backend later

- Premium/freemium architecture prepared for RevenueCat later

Read these before making changes:

- `PROJECT_CONTEXT.md`

- `README.md`

- `docs/product.md`

- `docs/mvp.md`

- `docs/domain-model.md`

- `docs/technical-plan.md`

- `docs/monetization.md`

## Current Implementation Status

Codex scaffolded a first Expo app manually in `E:\Eligr`.

Created:

- `package.json`

- `app.json`

- `tsconfig.json`

- `expo-env.d.ts`

- `.gitignore`

- `app/_layout.tsx`

- `app/(tabs)/_layout.tsx`

- `app/(tabs)/index.tsx`

- `app/(tabs)/priorities.tsx`

- `app/(tabs)/ranking.tsx`

- `app/(tabs)/premium.tsx`

- `app/rental/new.tsx`

- `app/rental/[id]/index.tsx`

- `app/rental/[id]/edit.tsx`

- `src/domain/*`

- `src/store/useEligrStore.ts`

- `src/components/*`

- `src/ui/*`

Core behavior already implemented in code:

- Seed rental search and seed rental options.

- Domain types for searches, options, priorities, scores, visit notes.

- Freemium limits in `src/domain/limits.ts`.

- Deterministic scoring in `src/domain/scoring.ts`.

- Zustand local state in `src/store/useEligrStore.ts`.

- Rental list, ranking, priorities, premium placeholder, detail, add, edit.

- React Hook Form + Zod rental form.

## Install Status

Clean install completed on 2026-06-06 by Cursor:

1. Removed partial `node_modules/`, `.npm-cache/`, and `package-lock.json`.

2. Ran `npm.cmd install` successfully (748 packages, ~10 minutes).

3. Ran `npm.cmd run typecheck` - passes after fixing Zod 4 + React Hook Form typing in `src/components/RentalForm.tsx`.

4. Ran `npm.cmd run start` - Metro Bundler running at `http://localhost:8081`.

If Expo complains about package versions on another machine, align with the current Expo SDK using:

```powershell

npx expo install --fix

```

## Known Code Risks To Check First

Please typecheck and fix these before adding new features:

- Expo typed routes may dislike dynamic strings like ``router.push(`/rental/${option.id}`)``. Either adjust route typing, use an object route, or disable typed routes temporarily. Typecheck did not flag these yet; verify at runtime in Expo Go or web.

- `src/components/RentalForm.tsx` `Field` helper is now typed; Zod 4 input/output split is handled via `useForm<RentalFormInput, unknown, RentalFormValues>`.

- `src/store/useEligrStore.ts` contains a computed-style `canAddOption` shape. If Zustand or TypeScript dislikes it, remove it from state and compute with selectors in UI. The screens already compute limits directly.

- `Alert.alert` in `app/rental/[id]/index.tsx` is fine on native, but web behavior may need a fallback if the MVP is tested in browser.

- The app text is mostly Spanish without accents because Codex defaulted to ASCII. Cursor can convert UI copy to proper Spanish UTF-8 if desired.

## Architecture Rules

Keep these boundaries:

- Domain logic belongs in `src/domain`.

- Scoring must stay deterministic and explainable.

- UI screens should call domain utilities rather than calculate scores inline.

- Freemium limits should stay in domain/store, not scattered through screens.

- Do not add backend/auth until local workflow feels complete.

- Do not make a marketing landing page; the first screen should remain the usable app.

Suggested module direction:

- `src/domain`: types, labels, seed, scoring, limits.

- `src/store`: local Zustand state and persistence later.

- `src/components`: reusable product components.

- `src/ui`: design primitives.

- `app`: Expo Router screens.

## Collaboration Rules For Cursor And Codex

To avoid conflicts when both tools work on this project:

- Before each session, read this file and `PROJECT_CONTEXT.md`.

- At the end of each session, update this file with:

  - What changed.

  - What commands ran.

  - What failed or remains unverified.

  - Next recommended task.

- Do not rewrite large areas already touched by the other assistant unless necessary.

- Prefer small commits/checkpoints once Git is initialized.

- Keep generated folders out of source control: `node_modules`, `.expo`, `.npm-cache`, build outputs.

- If working on the same feature, update the handoff before switching tools.

- If Cursor changes architecture, document the reason here instead of leaving it implicit.

## Suggested Cursor Prompt

Use this prompt in Cursor Pro:

```text

Continue building Eligr from E:\Eligr. Read PROJECT_CONTEXT.md, README.md, docs/*.md, docs/cursor-handoff.md, and .cursor/rules/eligr.mdc before editing. This is a React Native + Expo + TypeScript local-first MVP for comparing rentals. First clean any partial npm install artifacts, install dependencies, run typecheck, and fix compile/runtime issues in the scaffold Codex created. Preserve the architecture: domain logic in src/domain, Zustand local state, React Hook Form + Zod forms, transparent deterministic scoring, freemium limits prepared for RevenueCat. After every work session, update docs/cursor-handoff.md with what changed, commands run, verification status, and next steps so Cursor and Codex can collaborate without conflicts.

```

## Listing entry (active)

MVP uses **manual import only**:

- `app/rental/new.tsx` shows `RentalForm` directly.

- Optional `sourceUrl` field remains in the form as a reference link.

- User fills price, zone, commute, ratings, and notes manually.

## URL auto-import (parked)

Automatic import from Idealista/Fotocasa/etc. is **not active** to keep maintenance low.

Previous experiment code lives in `parked/url-import/` (excluded from TypeScript). Resume later with a single paid/official API provider, not multi-portal scrapers.

See `parked/url-import/README.md`.

## Cursor Session Log (2026-06-06)

### Changed (earlier)

- `src/components/RentalForm.tsx`: fixed Zod 4 + `@hookform/resolvers` type mismatch; typed `Field` helper.

### Changed (import parked)

- Removed active URL/paste import UI from `app/rental/new.tsx`.

- Moved auto-import code to `parked/url-import/` (manual entry is the active flow).

### Commands run

```powershell

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success after import feature.

- Emulator MVP flow verified by user (options, priorities, ranking, premium).

- Manual add/edit flow verified on emulator.

## Local persistence (2026-06-06)

- `useEligrStore` persists `search`, `rentalOptions`, and `selectedRentalId` via Zustand `persist` + `@react-native-async-storage/async-storage`.

- Storage key: `eligr-store-v1`.

- Actions are not persisted; only domain state.

Install note: AsyncStorage was added with `npm install @react-native-async-storage/async-storage --legacy-peer-deps` due to npm peer resolution on this machine.

## Search setup (2026-06-06)

- `app/search/edit.tsx` + `src/components/SearchForm.tsx`

- Editable fields: title, city, area, max budget, move-in date, commute destination, rental types.

- Entry point: **Editar** on the active search card in Options tab.

- Store action: `updateSearch` (persists with AsyncStorage).

## Design polish (2026-06-06)

- Theme: larger radii, card shadows, accent variants (`default` / `muted` / `accent`).

- Reusable `ScreenHeader` across tabs and forms.

- Rental cards: score color tiers, metrics, chevron affordance.

- Tabs: filled icons when active, accent tint.

- Spanish copy with accents on main screens and labels.

## Product improvements (2026-06-07)

### Added

- **Visit checklist** on rental detail: 8 items (ruido, luz, humedad, contrato, inventario, gastos, convivencia, trayecto real) with tap-to-cycle status, impression + next-action notes.

- **Compare screen** `app/compare.tsx`: pick two rentals, see tradeoffs via `src/domain/compare.ts`.

- **Store v2 migration**: adds `visitChecklist`, `visitImpression`, `visitNextAction` to persisted rentals.

- **Hydration gate** `StoreGate` + `useStoreHydration`: brief loading while AsyncStorage rehydrates.

- **Status chips** on detail (horizontal scroll) replacing 6 equal buttons.

- **Onboarding card** on Options tab when fewer than 3 rentals.

- **Reset demo** button on Premium tab (`resetToSampleData`).

- Entry points: Ranking ÃƒÂ¢Ã‚â€ Ã‚â€™ ÃƒÂ¢Ã‚â‚¬Ã‚Å“Comparar dos opcionesÃƒÂ¢Ã‚â‚¬Ã‚Â; Detail ÃƒÂ¢Ã‚â€ Ã‚â€™ ÃƒÂ¢Ã‚â‚¬Ã‚Å“CompararÃƒÂ¢Ã‚â‚¬Ã‚Â.

### New / updated files

- `src/domain/visit-checklist.ts`, `src/domain/compare.ts`, `src/domain/rental-defaults.ts`

- `src/components/VisitChecklistCard.tsx`, `StatusChipRow.tsx`, `ComparePanel.tsx`, `StoreGate.tsx`

- `app/compare.tsx`

- Updated: `useEligrStore.ts`, rental detail/edit, ranking, premium, index, `RentalCard.tsx`

### Commands run

```powershell

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07).

- Runtime on emulator: not re-verified in this session (user had working Expo flow earlier).

### Dev startup reminder (Windows + Android emulator)

```powershell

cd E:\Eligr

npx.cmd expo start --localhost

& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081

# press a in Expo terminal; first bundle can take several minutes

```

## Decision workflow improvements (2026-06-07, session 2)

### Added

- **List filters** on Options tab: Activas / Todas / Favoritas / Descartadas (`ListFilterChips`, `src/domain/filters.ts`).

- **Discarded excluded** from active ranking pool; shown separately via filter.

- **Budget fit**: warnings when monthly total exceeds `search.maxBudget`; badges on cards and detail.

- **Visit checklist issues** feed into scoring warnings (e.g. "Visita: Ruido a revisar").

- **Share ranking summary** via native `Share` on Ranking tab (`src/domain/summary.ts`).

- **Priorities live preview**: top 3 ranking with draft weights before saving.

- **Open listing URL** button on rental detail when `sourceUrl` is set.

- Scoring explanations now use Spanish priority labels (not raw keys).

### Commands run

```powershell

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 2).

## Bugfix pass (2026-06-07, session 3)

### Fixed

- Filters: empty active list no longer shows discarded; ÃƒÂ¢Ã‚â‚¬Ã‚Å“TodasÃƒÂ¢Ã‚â‚¬Ã‚Â no longer duplicates rows when all discarded.

- Store: delete `selectedRentalId` fix; priorities merged with defaults on rehydrate; allow empty `rentalOptions` persist; checklist no longer overwrites Favorito/Contactado.

- Free tier counts **active** options only (discarded frees slots).

- Scoring: runtime date for availability; NaN guards on commute/weights.

- UI: score `0` display; empty states per filter; weighted breakdown in detail; route `id` normalization; link open errors; save alert on free limit.

- Priorities draft syncs after reset demo.

### Commands run

```powershell

npm.cmd run typecheck

```

## Product pass (2026-06-07, session 4)

### Added

- Scoring uses `moveInDate` (availability vs entrada) and `rentalTypes` (warnings/pros).

- `getScoreContext(search)` centralizes scoring context.

- Decision hints on Options tab (`src/domain/decision-hints.ts`).

- Share summary gated behind premium preview.

- Premium screen: honest free vs premium feature lists (Spanish).

- Compare: pick B manually from detail; debounced priorities preview.

- `RentalCard` memoized.

### Commands run

```powershell

npm.cmd run typecheck

```

## Assistant + post-visit flow (2026-06-07, session 5)

### Added

- **Assistant panel** on Options tab: journey steps (BÃƒÆ’Ã‚Âºsqueda ÃƒÂ¢Ã‚â€ Ã‚â€™ Opciones ÃƒÂ¢Ã‚â€ Ã‚â€™ Visitas ÃƒÂ¢Ã‚â€ Ã‚â€™ DecisiÃƒÆ’Ã‚Â³n) + contextual CTA.

- **Post-visit wizard** `app/visit/index.tsx` + `app/visit/[id].tsx`: 3 steps (~60s) - checklist, impresiÃƒÆ’Ã‚Â³n, prÃƒÆ’Ã‚Â³ximo paso.

- Chips for quick impression/next action; auto status (visitado/favorito/descartado).

- Store: `completeVisitDebrief`.

- Entry: Assistant CTA, detail ÃƒÂ¢Ã‚â‚¬Ã‚Å“Registrar visita con asistenteÃƒÂ¢Ã‚â‚¬Ã‚Â, visit-pending hints.

### Commands run

```powershell

npm.cmd run typecheck

```

## Guided rental intake (2026-06-07, session 6)

### Added

- **Rental intake wizard** on `app/rental/new.tsx` (`RentalIntakeWizard.tsx`): paste-from-listing or guided questions (~2 min).

- Steps: inicio ÃƒÂ¢Ã‚â€ Ã‚â€™ pegar (opcional) ÃƒÂ¢Ã‚â€ Ã‚â€™ identidad ÃƒÂ¢Ã‚â€ Ã‚â€™ costes ÃƒÂ¢Ã‚â€ Ã‚â€™ encaje ÃƒÂ¢Ã‚â€ Ã‚â€™ valoraciÃƒÆ’Ã‚Â³n rÃƒÆ’Ã‚Â¡pida ÃƒÂ¢Ã‚â€ Ã‚â€™ revisar.

- **Paste parser** in `src/domain/listing-import/` (`parse-text.ts`, `to-form.ts`) - local text only, no URL fetch.

- Detects title, price, zone, size, deposit, tipo, bills/furnished hints from pasted portal text.

- Full form fallback at `app/rental/form.tsx` (link from wizard start).

- Assistant journey collect phase copy updated (ÃƒÂ¢Ã‚â‚¬Ã‚Å“AÃƒÆ’Ã‚Â±adir con asistenteÃƒÂ¢Ã‚â‚¬Ã‚Â).

- Default monthly price/deposit prefilled from search `maxBudget`.

### Commands run

```powershell

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 6).

## Screenshot OCR intake (2026-06-07, session 7)

### Added

- **Captura de pantalla** as primary entry in `RentalIntakeWizard` (before pegar texto).

- On-device OCR via `expo-mlkit-ocr` + `expo-image-picker` (`src/domain/listing-import/screenshot-ocr.ts`, `normalize-ocr-text.ts`).

- Flow: elegir captura ÃƒÂ¢Ã‚â€ Ã‚â€™ OCR local ÃƒÂ¢Ã‚â€ Ã‚â€™ texto editable ÃƒÂ¢Ã‚â€ Ã‚â€™ mismo parser `parsePastedListingText` ÃƒÂ¢Ã‚â€ Ã‚â€™ wizard.

- Privacy copy: Ãƒâ€šÃ‚Â«Procesado en tu dispositivoÃƒâ€šÃ‚Â».

- Graceful fallback when OCR unavailable (Expo Go / web) ÃƒÂ¢Ã‚â€ Ã‚â€™ alert + sugerencia pegar texto.

- `app.json` plugins: `expo-mlkit-ocr`, `expo-build-properties` (iOS 16+), `expo-image-picker` permission string.

- Script `npm run android:dev` ÃƒÂ¢Ã‚â€ Ã‚â€™ `scripts/android-dev.ps1` (auto: SDK, emulador, puerto 8081, adb reverse).

- Script `npm run metro:stop` ÃƒÂ¢Ã‚â€ Ã‚â€™ libera Metro en 8081.

### Important

- **OCR does NOT work in Expo Go** - requires `npx expo prebuild` + `npm run android:dev` (or EAS Build).

- OCR quality varies; user always reviews/edits extracted text before analyze.

### Commands run

```powershell

npx.cmd expo install expo-image-picker expo-mlkit-ocr expo-build-properties

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 7).

## Android crash fix (2026-06-07, session 8)

### Cause

- `Eligr keeps stopping` on launch: `NoSuchMethodError` in `expo.modules.font.FontLoaderModule` - duplicate `expo-font` versions (`56.0.5` via `@expo/vector-icons` vs `14.0.12` for SDK 54).

### Fix

- Pinned `@expo/vector-icons` to `15.0.3`, added direct `expo-font@~14.0.12` + npm `overrides`.

- Rebuilt `app-debug.apk`; logcat shows no FATAL on cold start after reinstall.

- Removed stray duplicate `RECORD_AUDIO` permissions from `app.json`.

### Commands run

```powershell

npm.cmd install --legacy-peer-deps

cd android; .\gradlew.bat assembleDebug

adb install -r android\app\build\outputs\apk\debug\app-debug.apk

```

## Audit fixes (2026-06-07, session 9)

### Fixed (P0)

- Decision hints now visible for all routes on Options tab (not only `/visit`).

- `statusFromImpressionChip`: empty/custom text no longer forces `visited`; added `resolveVisitDebriefStatus`.

- `visitImpression` affects scoring (pros/cons/warnings + personalFeeling boost) via `visit-impression-scoring.ts`.

- Rental intake wizard validates with Zod on save; NaN guard on commute/size.

- Compare screen syncs `a`/`b` URL params via `useEffect`; pickers use active options only.

### Fixed (P1)

- Store checklist promotion includes `contacted` status.

- Commute default unified (`effectiveCommuteMinutes` = 75) in scoring + compare.

- Date parsing uses local calendar days (no UTC drift).

- Labels: Ãƒâ€šÃ‚Â«Desembolso inicialÃƒâ€šÃ‚Â» instead of Ãƒâ€šÃ‚Â«EntradaÃƒâ€šÃ‚Â».

- SearchForm `moveInDate` requires `AAAA-MM-DD`.

- Parser locations: Barcelona, Valencia, Sevilla, etc.

- Priorities tab shows Ãƒâ€šÃ‚Â«Cambios sin guardarÃƒâ€šÃ‚Â» banner.

- Visit checklist card points to guided wizard; wizard copy updated.

- `android-dev.ps1` only kills `node` on Metro port (not qemu/java).

- RentalForm Spanish labels/messages; `getRentalFormValidationError` exported.

### Commands run

```powershell

npm.cmd run typecheck

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 9).

## Audit implementation + viral (2026-06-07, session 10)

### Bugs fixed

- Compare: `selectedB` clears when URL has only `a`.

- Ranking: commute unified (`effectiveCommuteMinutes`), lowRisk = fewest warnings, deduped quick picks.

- Assistant journey: no premature Ãƒâ€šÃ‚Â«visitÃƒâ€šÃ‚Â» phase when all options are `new`.

- Decision hint commute ÃƒÂ¢Ã‚â€ Ã‚â€™ edit first option without commute (`actionRentalId`).

- RentalCard: `~75 min est.` when commute missing (matches scoring).

- `resolveVisitDebriefStatus`: empty debrief keeps current status.

### Product / viral

- **Onboarding** modal (3 steps) on first launch (`appMeta.hasCompletedOnboarding`).

- **Demo banner** + Ãƒâ€šÃ‚Â«Mi bÃƒÆ’Ã‚ÂºsquedaÃƒâ€šÃ‚Â» (`startFreshSearch`) when sample data detected.

- **Pendiente hoy** list on Options tab (`pending-tasks.ts`).

- **Move-in countdown** on Options tab (`move-in.ts`).

- **Share top 3** ranking free; full ranking premium (`buildRankingShareSummary`).

- **Share pair comparison** free on `/compare`.

- **WhatsApp casero** template from rental detail (`buildVisitChecklistWhatsAppMessage`).

- **Export/import JSON** backup on Premium tab (`export-import.ts`).

- Priorities + visit empty states improved.

- `showAlert` / `showDestructiveConfirm` for web-safe confirms (Premium).

- Store v3: `appMeta`, removed unused `selectedRentalId`.

- Domain tests: `npm run test` (`src/domain/__tests__/domain.test.ts`).

- `docs/monetization.md` aligned with app.

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 10).

- `npm.cmd run test`: success (2026-06-07, session 10).

## Visit reminders + visual polish (2026-06-07, session 11)

### Post-visit notifications

- `expo-notifications` plugin in `app.json` (accent color `#145C53`).

- `src/domain/visit-reminders.ts`: schedule 2 h + 24 h debrief reminders, cancel, `syncAllVisitReminders`.

- `NotificationBootstrap` in `app/_layout.tsx`: re-sync on hydrate; tap opens `/visit/[id]`.

- Store: `appMeta.visitRemindersEnabled` (default `true`); schedule on `visit_planned`, cancel on visited/discarded/favorite/debrief/delete.

- Checklist path to `visit_planned` also schedules reminders.

- Toggle on Premium tab (`setVisitRemindersEnabled`).

- **Requires dev build** (`npm run android:dev` + prebuild); not available in Expo Go.

### Visual polish

- Theme tokens: `backgroundElevated`, `tabBar`, `borderLight`, `accentMuted`, shadows.

- `Screen`, `Card`, `Button`, `Text`, `ScreenHeader`, `AssistantPanel` refreshed.

- Tab bar: lighter background, `tabBarHideOnKeyboard`.

- `RentalCard`: rank badge, top-1 border, muted metric chips.

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (2026-06-07, session 11).

- `npm.cmd run test`: success (2026-06-07, session 11).

- Notifications: not runtime-tested on emulator this session (needs native rebuild after `expo-notifications` plugin).

## Maestro E2E (2026-06-11, session 12)

### Added

- `.maestro/flows/` - 5 flujos: smoke, detalle, ranking/compare/share, aÃƒÆ’Ã‚Â±adir opciÃƒÆ’Ã‚Â³n, premium toggle.

- `.maestro/subflows/boot.yaml` - arranque limpio + saltar onboarding/banner demo.

- `testID` en `Button`, tabs, onboarding, tarjetas (`rental-card-rental-1`), ranking/premium.

- Scripts: `npm run test:e2e:install`, `npm run test:e2e` ÃƒÂ¢Ã‚â€ Ã‚â€™ `scripts/install-maestro.ps1`, `scripts/maestro-test.ps1`.

- Informes JUnit en `.maestro/reports/` (gitignored).

### Requisitos

- Java 17+ (JDK de Android Studio vale).

- Emulador o dispositivo con `adb devices` en estado `device`.

- App dev build instalada (`com.anonymous.eligr`).

### Comandos

```powershell

npm.cmd run test:e2e:install

npm.cmd run android:dev

npm.cmd run test:e2e

```

Tras cambios de UI/testID, recompila la app en el emulador antes de re-ejecutar Maestro.

## Hardening P0/P1 (2026-06-11, session 13)

### Fixes

- `setStatus` bloquea reactivar descartadas si supera lÃƒÆ’Ã‚Â­mite free (`canReactivateFromDiscarded`).

- `importBackupJson` valida lÃƒÆ’Ã‚Â­mite free + sanitiza backup (`export-import.ts`).

- Compare solo acepta IDs de opciones activas (`pickActiveId`).

- Pendientes visita ÃƒÂ¢Ã‚â€ Ã‚â€™ `/visit/[id]`.

- ConfirmaciÃƒÆ’Ã‚Â³n destructiva: import backup, Ãƒâ€šÃ‚Â«Mi bÃƒÆ’Ã‚ÂºsquedaÃƒâ€šÃ‚Â».

- Premium: permiso notificaciones antes de activar toggle.

- Detalle: trayecto con `Number.isFinite`; alerts web-safe en eliminar/URL/estado.

### Verification

- `npm.cmd run typecheck`: success (session 13).

- `npm.cmd run test`: success (session 13, + lÃƒÆ’Ã‚Â­mites/import).

## Product polish (2026-06-11, session 14)

### Implemented

- Scoring orientativo con 1 opciÃƒÆ’Ã‚Â³n (`orientative` flag, tope 72, badge).

- Backup archivo: `expo-file-system/legacy` + `expo-sharing` + `expo-document-picker` (`backup-files.ts`, Premium tab).

- Checklist ya no marca Ãƒâ€šÃ‚Â«visitadaÃƒâ€šÃ‚Â» automÃƒÆ’Ã‚Â¡tico; requiere debrief o estado manual.

- Tab Opciones: hint + pendientes fusionados en Ãƒâ€šÃ‚Â«Siguiente pasoÃƒâ€šÃ‚Â».

- Ranking: quick pick Ãƒâ€šÃ‚Â«Menos alertasÃƒâ€šÃ‚Â»; `createEmptySearch` con defaults vÃƒÆ’Ã‚Â¡lidos.

- IDs de alquiler con sufijo aleatorio; pantalla editar con `ScreenHeader` + volver.

- Alertas unificadas con `showAlert` (wizard, new, form, visit debrief).

- UI orientativa coherente en cards, ranking y detalle; checklist aclara que no marca visitada.

- BotÃƒÆ’Ã‚Â³n volver en detalle, new, form y compare.

- Detalle: checklist solo lectura + notas rÃƒÆ’Ã‚Â¡pidas; ediciÃƒÆ’Ã‚Â³n del grid solo en asistente `/visit/[id]`.

- Maestro: `testID` visita (`visit-checklist-assistant-button`, `visit-wizard-*`); flujo `06-visit-assistant.yaml`.

### Verification

- `npm.cmd run typecheck`: success (session 14).

- `npm.cmd run test`: success (session 14).

## Scroll / interaction fix (2026-06-14, session 15)

### Cause

- `Screen` `ScrollView` had no `flex: 1`, so on Android the scroll viewport was not height-bounded inside the tab layout and vertical scroll felt broken or sluggish.

- Root layout had multiple siblings (`NotificationBootstrap`, `StatusBar`, `Stack`) without a dedicated `flex: 1` navigator wrapper after the `StoreGate` hydration fix.

### Fixed

- `src/ui/Screen.tsx`: `ScrollView` gets `style={{ flex: 1 }}`, `nestedScrollEnabled`, `keyboardShouldPersistTaps="handled"`; non-scroll mode uses `flex: 1` wrapper.

- `app/_layout.tsx`: single `flex: 1` root + `flex: 1` navigator wrapper around `Stack`; `contentStyle` includes `flex: 1`.

### Verification

- `npm.cmd run typecheck`: success (session 15).

- Runtime scroll on Android dev client: user should reload (`r`) and test Options tab vertical scroll + tab switches.

## Next Recommended Task

1. Rebuild dev client si backup archivo falla en nativo (`npm run android:dev`).

2. `npm run test:e2e` tras cambios UI.

3. Do not re-enable multi-portal URL import without single paid/official API.

## Product UX polish (2026-06-15, session 19)

### Implemented

- **Premium limits UX**: reusable `FreeLimitCard` with count, Ãƒâ€šÃ‚Â«Ver descartadasÃƒâ€šÃ‚Â» and Ãƒâ€šÃ‚Â«Ver premiumÃƒâ€šÃ‚Â» CTAs.

  - Options tab shows banner when free limit reached (above rental list).

  - `/rental/new` blocked state uses same card instead of plain text.

- **Pending tasks polish** (`pending-tasks.ts`):

  - Kind badges (Visita, Trayecto, Seguimiento) and contextual action labels.

  - `filterPendingTasksForDisplay` dedupes visit rows when Ãƒâ€šÃ‚Â«Siguiente pasoÃƒâ€šÃ‚Â» hint already routes to `/visit`.

- **Ranking quick picks**: tappable cards open rental detail.

- **Visit screens**: back button on `/visit` and `/visit/[id]`.

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (session 19).

- `npm.cmd run test`: success (session 19, + pending-tasks tests).

- Runtime on emulator: not re-verified this session.

### How to verify in app

1. **Free limit**: with 5 active options (free), Options tab shows limit banner; Ãƒâ€šÃ‚Â«AÃƒÆ’Ã‚Â±adirÃƒâ€šÃ‚Â» disabled; Ãƒâ€šÃ‚Â«Ver descartadasÃƒâ€šÃ‚Â» switches filter; Ãƒâ€šÃ‚Â«Ver premiumÃƒâ€šÃ‚Â» opens Premium tab. `/rental/new` shows same card.

2. **Pending tasks**: mark option Ãƒâ€šÃ‚Â«Visita planificadaÃƒâ€šÃ‚Â» - Ãƒâ€šÃ‚Â«Siguiente pasoÃƒâ€šÃ‚Â» shows hint; individual visit rows hidden when hint covers visit; commute/followup rows show contextual buttons.

3. **Ranking**: tap quick-pick cards (MÃƒÆ’Ã‚Â¡s barato, etc.) ÃƒÂ¢Ã‚â€ Ã‚â€™ rental detail.

4. **Visit flow**: Ãƒâ€šÃ‚Â«Acabo de visitarÃƒâ€šÃ‚Â» ÃƒÂ¢Ã‚â€ Ã‚â€™ back button on pick screen and debrief wizard.

## Maestro E2E (2026-06-14, session 16)

### 06-visit-assistant.yaml restore (urgent)

- File was corrupted (line1 / line2 only); restored from `.maestro/flows/06-visit-assistant.yaml.bak` with fixes:

  - After `rental-card-rental-1`: `extendedWaitUntil` **Habitacion luminosa en Delicias** (30s), not Puntuacion total.

  - Before each `visit-wizard-next` tap: `scrollUntilVisible` id `visit-wizard-next` DOWN 30s.

  - Ends with `tab-options` (unchanged).

- UTF-8 Spanish strings aligned with `VisitDebriefWizard` / `visit-debrief.ts`.

### Verification (this session)

- `npm.cmd run metro:connect`: OK (adb reverse 8081, app relaunch).

- `npm.cmd run test:e2e`: **0/6** - Maestro `io.grpc.StatusRuntimeException: UNAVAILABLE` / adb channel closed during preflight and all flows (`Unable to launch app` on 02ÃƒÂ¢Ã‚â‚¬Ã‚â€œ06).

- Retry with `ELIGR_FIX_ADB=1`: preflight still failed (adb UNAVAILABLE).

- Prior baseline before corruption: **5/6** (06 failed on Puntuacion total wait).

- Next: restart emulator, close Maestro Studio, `npm run start:clear`, `npm run metro:connect`, `npm run test:e2e`; expect 06 to pass with restored flow if adb stable.

### E2E follow-up (subagent c497173c, 2026-06-14)

- 06-visit-assistant.yaml fix **saved on disk**: Habitacion wait 30s + scrollUntilVisible before both visit-wizard-next taps.

- npm run metro:connect + test:e2e: **0/6** (preflight boot: tab-options not visible / Maestro adb UNAVAILABLE; flows not completed).

## Maestro E2E sequential fixes (2026-06-14, session 17)

### Changed

- `.maestro/flows/06-visit-assistant.yaml`: added `scrollUntilVisible` for `visit-wizard-save` (DOWN, 60s, centerElement) before save tap - fixes off-screen save button on step 3.

- `scripts/maestro-test.ps1`: sequential loop over sorted `.maestro/flows/*.yaml`:

  - Flow 01: `maestro test <file>`

  - Flows 02ÃƒÂ¢Ã‚â‚¬Ã‚â€œ06: `maestro test --no-reinstall-driver <file>`

  - Before each flow: adb reverse 8081, force-stop, monkey launch, 15s wait

  - Per-flow pass/fail + `Resumen E2E: X/6` at end

### Commands run

```powershell

npm.cmd run metro:connect

npm.cmd run test:e2e

```

### Verification

- `npm.cmd run metro:connect`: OK (adb reverse 8081, Metro listening, app relaunch).

- `npm.cmd run test:e2e`: **0/6** - preflight blocked individual flows:

  - Attempt 1: Maestro instrumentation init failure / driver timeout.

  - Attempt 2: preflight retry - `tab-options` not visible (app not booted to tabs).

  - Attempt 3: adb channel closed mid-preflight; emulator-5554 lost (`device not found`).

- Prior sequential baseline (before these fixes): **5/6** (only 06 failed on save tap).

- Next: restart emulator, close Maestro Studio, `npm run start:clear`, `npm run metro:connect`, `npm run test:e2e`; expect **6/6** if adb stable and 06 scroll fix holds.

### E2E validation (2026-06-14, session 17)

- **06 YAML verified:** 54 lines, UTF-8, Habitacion wait 30s, scrollUntilVisible visit-wizard-next x2, tab-options end.

- **Sequential run (boot OK + `--no-reinstall-driver` per flow):** **5/6** - 01ÃƒÂ¢Ã‚â‚¬Ã‚â€œ05 PASS; **06 FAIL** on `visit-wizard-save` (off-screen; `testID` exists in `VisitDebriefWizard.tsx`).

- **Batch `npm run test:e2e`:** **2/6** (01ÃƒÂ¢Ã‚â‚¬Ã‚â€œ02 PASS; 03 FAIL; 04ÃƒÂ¢Ã‚â‚¬Ã‚â€œ06 Unable to launch) - adb/Maestro driver flakes when running `.maestro/flows` as one suite.

- **Fix applied:** `scrollUntilVisible` for `visit-wizard-save` before save tap in `06-visit-assistant.yaml` (61 lines).

- **`maestro-test.ps1`:** already runs flows individually with app relaunch between flows.

- **Re-run:** `npm run adb:fix` ÃƒÂ¢Ã‚â€ Ã‚â€™ wait 30s ÃƒÂ¢Ã‚â€ Ã‚â€™ `npm run metro:connect` ÃƒÂ¢Ã‚â€ Ã‚â€™ `npm run test:e2e`. Target **6/6**.

- **If adb flakes:** close Maestro Studio, keep Metro on 8081, `npm run adb:fix`, retry.

### E2E per-flow prep (subagent, 2026-06-14)

- scripts/maestro-test.ps1: after preflight/warmup unchanged, runs each flow yaml in .maestro/flows individually with adb reverse 8081, force-stop, monkey launch, 15s wait before each flow; prints Resumen E2E X/6.

- Fixed PowerShell compare: passed -lt total (was invalid less-than operator).

- Commands: npm.cmd run metro:connect then ELIGR_FIX_ADB=1 npm.cmd run test:e2e (log: e2e-after-perflow.log).

- Result: 1/6 - preflight OK; 01-smoke passed; 02-06 failed (adb/Maestro UNAVAILABLE, connection timeouts, device offline after flow 01).

- 06-visit-assistant.yaml not modified.

### E2E clean run (2026-06-14, session 18)

- Result 0/6 preflight Maestro adb UNAVAILABLE; log e2e-final.log; adb:fix metro:connect test:e2e no ELIGR_FIX_ADB

## Product UX suggestions batch (2026-06-15, session 20)

### Implemented (all 7)

1. **Quick picks with context** (`ranking.tsx`, `src/domain/quick-picks.ts`): subtitle under each quick pick (price, alerts, commute, score).

2. **Priorities help + clickable preview** (`priorities.tsx`, `src/domain/priority-help.ts`): help text under each slider; preview rows tap to `/rental/[id]`.

3. **Unified empty states** (`EmptyState.tsx`, `ranking.tsx`, `compare.tsx`, `visit/index.tsx`, `priorities.tsx`): reusable `EmptyState` with consistent CTAs.

4. **Compare testIDs + a11y** (`compare.tsx`, `ComparePanel.tsx`): `compare-picker-a-{id}`, `compare-picker-b-{id}`, `accessibilityLabel`.

5. **Backup import preview** (`premium.tsx`, `export-import.ts`): preview card after paste/file (search title, counts, limit warning); confirm before import.

6. **Visit sections + testIDs** (`visit/index.tsx`): `SectionHeader` Planificadas / Otras; `visit-pick-{id}` on cards.

7. **Unsaved priorities guard** (`priorities.tsx`, `GuardedTabBarButton.tsx`, `prioritiesUiStore.ts`, `_layout.tsx`): tab change with dirty draft ÃƒÂ¢Ã‚â€ Ã‚â€™ alert Guardar / Descartar / Cancelar.

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (session 20).

- `npm.cmd run test`: success (session 20, + quick-picks and import preview tests).

- Runtime on emulator: not re-verified this session.

### How to verify in app

1. **Quick picks**: Ranking tab ÃƒÂ¢Ã‚â€ Ã‚â€™ quick pick cards show subtitle (ÃƒÂ¢Ã‚â€šÃ‚Â¬/mes, alertas, min trayecto) ÃƒÂ¢Ã‚â€ Ã‚â€™ tap opens detail.

2. **Priorities help**: Prioridades tab ÃƒÂ¢Ã‚â€ Ã‚â€™ each slider has caption help ÃƒÂ¢Ã‚â€ Ã‚â€™ preview rows tappable to detail.

3. **Empty states**: Ranking/Compare/Visit/Priorities with no data ÃƒÂ¢Ã‚â€ Ã‚â€™ consistent cards with AÃƒÆ’Ã‚Â±adir / Ir a prioridades / Volver.

4. **Compare a11y**: `/compare` ÃƒÂ¢Ã‚â€ Ã‚â€™ picker items have testIDs `compare-picker-a-*` and `compare-picker-b-*`.

5. **Import preview**: Premium ÃƒÂ¢Ã‚â€ Ã‚â€™ paste JSON or import file ÃƒÂ¢Ã‚â€ Ã‚â€™ preview card with title and counts ÃƒÂ¢Ã‚â€ Ã‚â€™ Confirmar importaciÃƒÆ’Ã‚Â³n + destructive confirm.

6. **Visit sections**: `/visit` ÃƒÂ¢Ã‚â€ Ã‚â€™ Planificadas vs Otras sections; cards have `visit-pick-{id}`.

7. **Priorities guard**: Prioridades ÃƒÂ¢Ã‚â€ Ã‚â€™ move slider without saving ÃƒÂ¢Ã‚â€ Ã‚â€™ switch tab ÃƒÂ¢Ã‚â€ Ã‚â€™ alert Guardar / Descartar / Cancelar.

## Holistic priorities (2026-06-15, session 21)

### Priority 1 - Verification & demo

- **`docs/demo-checklist.md`**: guion manual paso a paso para presentaciÃƒÆ’Ã‚Â³n acadÃƒÆ’Ã‚Â©mica (Mi bÃƒÆ’Ã‚Âºsqueda ÃƒÂ¢Ã‚â€ Ã‚â€™ 3 opciones ÃƒÂ¢Ã‚â€ Ã‚â€™ prioridades ÃƒÂ¢Ã‚â€ Ã‚â€™ ranking ÃƒÂ¢Ã‚â€ Ã‚â€™ visita ÃƒÂ¢Ã‚â€ Ã‚â€™ favorito/descartar).

- **`scripts/maestro-test.ps1`**: omite `adb:fix` si ya hay dispositivo conectado (salvo `ELIGR_FIX_ADB=1`); **30s** de espera antes del flujo 01 (15s en 02ÃƒÂ¢Ã‚â‚¬Ã‚â€œ06).

- E2E honesto documentado: baseline **5/6** (01ÃƒÂ¢Ã‚â‚¬Ã‚â€œ05 OK; 06 visita intermitente por adb/Maestro). Manual fallback = `docs/demo-checklist.md`.

### Priority 2 - Less demo feel, simpler Options tab

- **Onboarding** (`OnboardingModal.tsx`): paso final con CTAs Ãƒâ€šÃ‚Â«Empezar mi bÃƒÆ’Ã‚ÂºsquedaÃƒâ€šÃ‚Â», Ãƒâ€šÃ‚Â«AÃƒÆ’Ã‚Â±adir primera opciÃƒÆ’Ã‚Â³nÃƒâ€šÃ‚Â», Ãƒâ€šÃ‚Â«Explorar demoÃƒâ€šÃ‚Â»; skip sigue en pasos 1ÃƒÂ¢Ã‚â‚¬Ã‚â€œ2.

- **Banner demo** mÃƒÆ’Ã‚Â¡s visible arriba en Opciones: Ãƒâ€šÃ‚Â«Modo demoÃƒâ€šÃ‚Â», botones Ãƒâ€šÃ‚Â«Mi bÃƒÆ’Ã‚ÂºsquedaÃƒâ€šÃ‚Â» / Ãƒâ€šÃ‚Â«Seguir con demoÃƒâ€šÃ‚Â» (`testID` sin cambios).

- **AssistantPanel + Siguiente paso** fusionados en **una tarjeta** (`nextStep` slot en `AssistantPanel`).

- **Progressive disclosure**: bloque Ãƒâ€šÃ‚Â«Siguiente pasoÃƒâ€šÃ‚Â» solo si `(activeCount >= 1 || onboarding completado) && hay hint/pendientes`.

### Priority 3 - Sharpen decision core

- **AÃƒÆ’Ã‚Â±adir rÃƒÆ’Ã‚Â¡pido**: `app/rental/quick.tsx` + `src/domain/quick-add.ts`; botÃƒÆ’Ã‚Â³n **RÃƒÆ’Ã‚Â¡pido** en Opciones (`options-quick-add-button`).

- **Ranking**: badges Ãƒâ€šÃ‚Â«Top criteriosÃƒâ€šÃ‚Â» en tarjetas vÃƒÆ’Ã‚Â­a `getTopScoreContributions` (`src/domain/score-breakdown.ts`, reutiliza `weightedBreakdown`).

- **06-visit-assistant.yaml**: intacto en disco (61 lÃƒÆ’Ã‚Â­neas, scroll save + next).

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (session 21).

- `npm.cmd run test`: success (session 21, + quick-add and score-breakdown).

- `npm.cmd run test:e2e`: not re-run this session (adb/Maestro flaky; use manual demo checklist).

### How to verify in app

1. **Demo script**: follow `docs/demo-checklist.md` end-to-end (~10 min).

2. **Onboarding**: first launch ÃƒÂ¢Ã‚â€ Ã‚â€™ last step Ãƒâ€šÃ‚Â«Empezar mi bÃƒÆ’Ã‚ÂºsquedaÃƒâ€šÃ‚Â» or Ãƒâ€šÃ‚Â«Explorar demoÃƒâ€šÃ‚Â» ÃƒÂ¢Ã‚â€ Ã‚â€™ sample banner prominent.

3. **Combined card**: Opciones ÃƒÂ¢Ã‚â€ Ã‚â€™ one Ãƒâ€šÃ‚Â«Tu asistenteÃƒâ€šÃ‚Â» card includes Ãƒâ€šÃ‚Â«Siguiente pasoÃƒâ€šÃ‚Â» when applicable (not during onboarding with 0 options).

4. **Quick add**: Opciones ÃƒÂ¢Ã‚â€ Ã‚â€™ **RÃƒÆ’Ã‚Â¡pido** ÃƒÂ¢Ã‚â€ Ã‚â€™ title/price/zone ÃƒÂ¢Ã‚â€ Ã‚â€™ saves minimal option.

5. **Ranking breakdown**: Ranking tab ÃƒÂ¢Ã‚â€ Ã‚â€™ each card shows top 1ÃƒÂ¢Ã‚â‚¬Ã‚â€œ2 criterion contributions (e.g. Ãƒâ€šÃ‚Â«Trayecto +12Ãƒâ€šÃ‚Â»).

6. **E2E**: `npm run metro:connect` then `npm run test:e2e`; expect **5/6** stable; 06 may need retry or manual visit flow from demo checklist.

## Bug hunt (2026-06-15, session 22)

### Scope

- Ran `npm.cmd run typecheck` and `npm.cmd run test`.

- Lints on `app/(tabs)`, `app/rental`, `src/components`, `src/domain`: clean.

- Grep `TODO`/`FIXME`/`console.error`/`any` in `src` + `app`: none.

- Reviewed: `prioritiesUiStore` + `GuardedTabBarButton`, quick-add validation, import preview, onboarding, merged `AssistantPanel`, `06-visit-assistant.yaml`.

### Bugs found and fixed

1. **Import rating clamp** (`export-import.ts`): `clampRating` capped at 5 but app uses 1ÃƒÂ¢Ã‚â‚¬Ã‚â€œ10; imported backups silently downgraded scores. Fixed max to **10**; test updated.

2. **Text import limit guard** (`premium.tsx`): paste path allowed Ãƒâ€šÃ‚Â«Importar backupÃƒâ€šÃ‚Â» when `limitExceeded`; file path already disabled. Button now also disabled on limit exceeded (store already rejected; UX was misleading).

### Review notes (no code change)

- `GuardedTabBarButton`: tab-only guard works; hardware back / in-screen navigation bypass is known gap.

- Quick-add validation: title ÃƒÂ¢Ã‚â€°Ã‚Â¥3, price >0, zone ÃƒÂ¢Ã‚â€°Ã‚Â¥2; limit screen shows `FreeLimitCard`.

- `06-visit-assistant.yaml`: **61 lines**, testIDs and strings match `VisitDebriefWizard` / visit flow.

- Onboarding + `AssistantPanel` merge: logic consistent with session 21.

### Commands run

```powershell

npm.cmd run typecheck

npm.cmd run test

```

### Verification

- `npm.cmd run typecheck`: success (session 22).

- `npm.cmd run test`: success (session 22, rating clamp assertion updated).

- `npm.cmd run test:e2e`: not re-run (adb/Maestro flaky).

### Suggested next improvements (not implemented)

1. Extend unsaved-priorities guard to hardware back and header navigation (not only tab bar).

2. Add Maestro flow for quick-add (`/rental/quick`) and onboarding skip/fresh-search paths.

3. Sanitize `visitChecklist` on backup import (currently cast-only).

4. Unit tests for `GuardedTabBarButton` / priorities dirty-state integration (or lightweight store test).

5. Stabilize E2E runner (adb keepalive between flows) to close 06 gap reliably.

### Another bug round?

**Not urgent now** - no crashes or critical logic gaps remain after session 22 fixes. Re-run after next feature batch or before demo if E2E/import/priorities areas change.

## Session 23 - Cursor updater + import/guard fixes (2026-06-15)

### Cursor (Windows)

- Set `"update.mode": "none"` in `%APPDATA%\Cursor\User\settings.json` to mitigate auto-updater deleting Cursor on close.

### Eligr fixes

1. **`export-import.ts`**: `sanitizeVisitChecklist()` on backup import (no raw cast).

2. **`priorities-guard.ts`**: shared alert for unsaved priority weights.

3. **`GuardedTabBarButton.tsx`**: uses `confirmPrioritiesLeave`.

4. **`priorities.tsx`**: `usePreventRemove` + Android back handler + preview navigation guarded.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 23).

### E2E

Still use `docs/demo-checklist.md` for demo; Maestro 5/6 baseline when adb stable.

## Session 24 - Safe area / tab bar overlap (2026-06-15)

### Problem

On physical Android, system navigation buttons overlapped the app tab bar (Opciones, Prioridades, Ranking, Premium), making tabs hard to tap.

### Fix

1. **`app/(tabs)/_layout.tsx`**: `useSafeAreaInsets()` - tab bar `height` and `paddingBottom` now include `bottomInset`.

2. **`src/ui/Screen.tsx`**: footer `paddingBottom` includes `insets.bottom` for screens with bottom actions (e.g. Prioridades).

### Verification

```powershell

npm.cmd run typecheck

cd android; $env:NODE_ENV="production"; $env:GRADLE_USER_HOME="E:\Eligr\.gradle"; .\gradlew.bat assembleRelease

```

- `typecheck`: success.

- Release APK rebuilt: `dist/Eligr-0.1.0-release.apk`.

- Install on phone: `adb install -r E:\Eligr\dist\Eligr-0.1.0-release.apk`

- Re-test with 3-button nav and gesture nav; tabs should sit above system bar.

### APK build policy (owner preference)

- **Do not** rebuild/copy release APK after every code change.

- Build APK only when the owner explicitly asks to test on a physical device.

## Session 25 - UX/UI holistic analysis (2026-06-16)

Holistic review (no code changes). MVP ~7.5/10: core decision workflow solid; main gaps are information density and visual hierarchy, not missing backend.

### Prioritized backlog (owner to pick)

**P0:** Lighten Opciones tab (collapse/reorder blocks); explicit ÃƒÂ¢Ã‚â‚¬Ã‚Å“decision closedÃƒÂ¢Ã‚â‚¬Ã‚Â moment; warn when commute/score uses estimates; date picker for `moveInDate`.

**P1:** Compare picker at scale; shorten/reorganize rental detail; split Premium vs Settings/Data; clarify RÃƒÆ’Ã‚Â¡pido vs AÃƒÆ’Ã‚Â±adir vs wizard; optional local photos.

**P2:** Shared `Input` primitive; group priority sliders; list sort options; swipe on cards; dark mode.

**Visual:** Reserve `accent` cards for one hero per screen; compact `RentalCard` in list; custom display font; style sliders; improve badge contrast on warnings.

### Next implementation

Wait for owner to choose which P0/P1 items to implement before starting.

## Session 26 - UX improvements batch (2026-06-16)

### Implemented

**P0 / product**

- Opciones tab lighter: removed duplicate header, merged move-in into search card, single accent hero (assistant + chosen), compact list cards, commute estimate warning banner.

- Decision closure: `chosenOptionId` in `appMeta`, "Esta es mi elecciÃƒÆ’Ã‚Â³n" in rental detail, chosen card on Opciones.

- Date presets: `DateField` in `SearchForm` (1/2/3/6 months).

- Commute estimate visibility: `usesEstimatedCommute()` badge on cards and detail.

**P1 / UX**

- Compare picker: searchable compact `CompareOptionPicker` (replaces long vertical list).

- Premium tab ÃƒÂ¢Ã‚â€ Ã‚â€™ **MÃƒÆ’Ã‚Â¡s**: plan, reminders, backup, local data; JSON paste collapsed under "Pegar backup JSON".

- Priorities grouped (Dinero / UbicaciÃƒÆ’Ã‚Â³n / Calidad / SensaciÃƒÆ’Ã‚Â³n); preview card muted.

- Rental detail: collapsible Visit + Desglose sections; compare-from-detail already existed.

**Visual / primitives**

- `Input`, `DateField`, `ToastHost` + `showToast`.

- `Badge` warning/danger text contrast.

- `RentalCard` `compact` mode for lists.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 26). No APK rebuild (owner policy).

## Session 27 - Onboarding, logo, polish batch (2026-06-16)

### Onboarding + brand

- Full-screen welcome (replaces bottom sheet modal).

- `EligrLogo` component + `assets/eligr-logo-icon.png` in `app.json`.

- Auth buttons shown as Ãƒâ€šÃ‚Â«prÃƒÆ’Ã‚Â³ximamenteÃƒâ€šÃ‚Â» (no backend).

### Polish batch (no APK)

- `AssistantPanel` collapsible; collapsed by default with 3+ active options.

- `EmptyState` with centered icon.

- Ranking quick picks with icons and accent colors.

- Quick add uses shared `Input` + commute estimate note + toast.

- Intake wizard: paste first, screenshot disabled when OCR unavailable, link to quick add.

- `expo-splash-screen` plugin configured (visible after next native build).

### Verification

`npm.cmd run typecheck` + `npm.cmd run test` pass.

## Session 28 - Photos, decision export, dark mode (2026-06-16)

### Implemented

1. **Fotos locales** - `photoUri` en `RentalOption`, `RentalPhotoPicker` en formulario, miniatura en `RentalCard` y hero en detalle; backup import preserva URI.

2. **Inputs unificados** - `RentalForm` y `VisitQuickNotesCard` usan `Input`.

3. **DecisiÃƒÆ’Ã‚Â³n exportable** - `buildChosenOptionSummary`, `ChosenOptionCard` con compartir, pantalla `/decision`.

4. **Modo oscuro** - paletas light/dark, `ThemeProvider`, toggle en **MÃƒÆ’Ã‚Â¡s** (Sistema / Claro / Oscuro); primitivas UI adaptadas.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 28). No APK rebuild.

## Session 29 - Bug fixes + dark mode polish (2026-06-16)

### Fixes

1. **`normalizeFormValues`** - ya no resetea `visitChecklist` / `visitImpression` / `visitNextAction`; el edit no necesita parche manual.

2. **Fotos persistentes** - `persistRentalPhotoUri` copia a `document/rental-photos/` al elegir imagen (`expo-file-system` API nueva).

3. **`chosenOptionId` huÃƒÆ’Ã‚Â©rfano** - se sanea al rehidratar store y con `useEffect` en Opciones si la opciÃƒÆ’Ã‚Â³n no existe.

4. **Modo oscuro** - `RentalCard`, `ScreenHeader`, `AssistantPanel`, `EmptyState`, sliders de Prioridades usan `useThemeColors`.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 29). No APK rebuild.

## Session 30 - Dark mode completion (2026-06-16)

### Implemented

- All remaining `import { colors }` static usages migrated to `useThemeColors` in:

  - Components: `ListFilterChips`, `StatusChipRow`, `CollapsibleSection`, `ScoreBar`, `ComparePanel`, `CompareOptionPicker`, `SearchForm`, `OnboardingModal`, `VisitDebriefWizard`, `RentalIntakeWizard`, `StoreGate`, `EligrLogo`

  - Screens: Opciones tab, ranking, rental detail, visit picker

- Opciones stats use `surfaceMuted` instead of hardcoded white rgba (readable in dark mode).

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 30). No APK rebuild.

## Session 32 - Swipe, informes HTML, E2E (2026-06-16)

### Implemented

1. **Swipe en tarjetas** - `SwipeableRentalCard` (PanResponder, sin deps nuevas): desliza izquierda ÃƒÂ¢Ã‚â€ Ã‚â€™ favorito / descartar / reactivar.

2. **Informe HTML** - `buildRankingReportHtml` + `buildDecisionReportHtml`; compartir vÃƒÆ’Ã‚Â­a `shareHtmlReport` (imprimible como PDF desde navegador). Botones en Ranking, MÃƒÆ’Ã‚Â¡s y `/decision`. Free: top 3; premium: ranking completo.

3. **E2E** - flujos `07-quick-add`, `08-onboarding-skip`; fix wait en `06-visit-assistant`; filtro `ELIGR_E2E_FLOWS` en `maestro-test.ps1`.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

## Session 33 - VerificaciÃƒÆ’Ã‚Â³n completa (2026-06-19)

### Automatizado

| Prueba | Resultado |

|---|---|

| `npm run typecheck` | OK |

| `npm run test` | OK |

| `npx expo export --platform android` | OK (bundle 4.63 MB) |

| `npm run lint` | Falla CLI Expo anidado (`Cannot find module 'eslint'`); eslint en devDeps |

| E2E (Pixel_6 + Metro) | **01-smoke** OK, **03-ranking** OK; **07-quick-add** **1/1 OK** con reset (2026-06-14) |

### Fixes en verificaciÃƒÆ’Ã‚Â³n

- `expo-splash-screen` instalado (faltaba vs `app.json`).

- ESLint + `eslint.config.js` generados por `expo lint`.

- Maestro `07-quick-add`: teclado + scroll entre campos; `scrollUntilVisible` antes del assert final "Piso prueba E2E".

### Pendiente E2E con estado limpio

`$env:ELIGR_E2E_RESET="1"; npm run test:e2e` para 04, 05, 06, 08 (01 y 07 ya verificados).

### Implemented

1. **Ordenar lista** - `ListSortChips` en Opciones: puntuaciÃƒÆ’Ã‚Â³n, precio ÃƒÂ¢Ã‚â€ Ã‚â€˜ÃƒÂ¢Ã‚â€ Ã‚â€œ, trayecto, recientes (`src/domain/list-sort.ts`).

2. **Foto en aÃƒÆ’Ã‚Â±adir rÃƒÆ’Ã‚Â¡pido** - `RentalPhotoPicker` en `/rental/quick` con persistencia.

3. **Acciones rÃƒÆ’Ã‚Â¡pidas** - mantÃƒÆ’Ã‚Â©n pulsada una tarjeta compacta: ver, editar, favorito/descartar/reactivar.

4. **Prioridades + elecciÃƒÆ’Ã‚Â³n** - aviso si hay `chosenOptionId` y cambios sin guardar.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

## Session 34 - AuditorÃƒÆ’Ã‚Â­a cÃƒÆ’Ã‚Â³digo (2026-06-14)

### Gates (pre-fix)

| Gate | Resultado |

|---|---|

| typecheck | OK |

| test (dominio) | OK |

| lint | 0 errores, 14 warnings |

### Hallazgos accionables (prioridad)

1. **Async sin try/catch** - `share-report.ts`, fotos (`rental-photo.ts`), varios `Share.share`.

2. **appMeta** - import/reset pierde `themeMode`; `chosenOptionId` no sanea opciÃƒÆ’Ã‚Â³n descartada en rehydrate.

3. **Dark mode** - quick picks hardcoded (`quick-picks.ts`); `StoreGate` fuera de `ThemeProvider`.

4. **UX** - `markAsChoice` sin alerta si falla; backup no portable para fotos.

5. **Rendimiento** - `ranking.tsx` sin `useMemo` en `rankRentals`.

### Implemented (Session 34 fixes)

1. **Async error handling**

   - `shareHtmlReport` returns `"error"` on failure; callers show `showAlert`.

   - `persistRentalPhotoUri` returns `null` on copy failure; `RentalPhotoPicker` alerts user.

   - New `shareContent` helper wraps `Share.share` (ignores cancel, alerts on real errors) used in ranking, compare, decision, `ChosenOptionCard`, rental detail WhatsApp share.

2. **appMeta consistency**

   - `importBackupJson`: preserves `themeMode` and `visitRemindersEnabled`; sanitizes `chosenOptionId` from backup against imported options (must exist and not discarded).

   - `resetToSampleData` / `startFreshSearch`: preserve `themeMode` and `visitRemindersEnabled`.

   - `normalizePersistedSlice`: rejects `chosenOptionId` if option is discarded.

3. **chosenOptionId on Options tab**

   - `useEffect` clears choice if option missing or discarded.

4. **Dark mode**

   - `_layout.tsx`: `ThemeProvider` wraps `StoreGate` (loading screen uses theme colors).

   - `getQuickPickAccent(kind, colors)` uses theme palette; ranking passes `useThemeColors()`.

5. **UX**

   - Rental detail `markAsChoice`: alert on failure (discarded / free limit).

6. **Performance**

   - `rankRentals(...)` wrapped in `useMemo` on ranking tab.

7. **Minor**

   - Import preview warning uses `colors.danger` from theme.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both pass (session 34 post-fix). No APK rebuild.

## Session 35 - Re-auditorÃƒÆ’Ã‚Â­a post-fixes (2026-06-14)

### Gates

| Gate | Resultado |

|---|---|

| typecheck | OK |

| test (dominio, ~35 asserts) | OK |

| lint | 0 errores, 13 warnings |

Session 34 fixes verificados en cÃƒÆ’Ã‚Â³digo; sin regresiones en gates.

### Gaps restantes (prioridad)

1. Backup: export no incluye `chosenOptionId` (import sÃƒÆ’Ã‚Â­ lo lee).

2. `ranking.tsx`: memoizar tambiÃƒÆ’Ã‚Â©n `pool` (`getScoringPool`).

3. `premium.tsx` `shareBackup` ÃƒÂ¢Ã‚â€ Ã‚â€™ usar `shareContent`.

4. Sin tests de store (rehydrate, import, themeMode).

5. E2E no ejecutado esta sesiÃƒÆ’Ã‚Â³n.

## Session 36 - Producto, viralidad y diseÃƒÆ’Ã‚Â±o (2026-06-14)

### Producto / viralidad

- Onboarding paste-first: Ãƒâ€šÃ‚Â«Pegar mi primer anuncioÃƒâ€šÃ‚Â» como CTA principal.

- Asistente: con 2+ opciones empuja a ranking; fase collect prioriza pegar anuncio.

- Hint Ãƒâ€šÃ‚Â«Ver rankingÃƒâ€šÃ‚Â» cuando hay exactamente 2 opciones activas.

- Banner nudge en Opciones con 2 activas.

- `buildRankingShareSummary` enriquecido (medallas, pros, avisos, delta precio, CTA viral).

- Informe HTML: footer con mensaje para compartir.

- Backup exporta/importa `chosenOptionId`; preview avisa fotos no portables y elecciÃƒÆ’Ã‚Â³n incluida.

### DiseÃƒÆ’Ã‚Â±o

- Onboarding: iconos por paso, card elevada.

- Tab bar: pill activa con fondo accent.

- Tarjeta bÃƒÆ’Ã‚Âºsqueda elevada; recomendaciÃƒÆ’Ã‚Â³n ranking elevada.

- Botones mÃƒÆ’Ã‚Â¡s redondeados; barra acento en headers mÃƒÆ’Ã‚Â¡s ancha.

### TÃƒÆ’Ã‚Â©cnico

- `ranking.tsx`: `pool` y `activeOptions` memoizados.

- `premium.tsx`: `shareBackup` ÃƒÂ¢Ã‚â€ Ã‚â€™ `shareContent`.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

Both OK.

## Session 37 - Usabilidad, plantillas y diseÃƒÆ’Ã‚Â±o (2026-06-14)

### Nuevo

- **Plantillas de prioridades**: estudiante, pareja, teletrabajo, equilibrado (`priority-profiles.ts`).

- Chips en onboarding (ÃƒÆ’Ã‚Âºltimo paso) y pantalla Prioridades.

- **FAB** aÃƒÆ’Ã‚Â±adir rÃƒÆ’Ã‚Â¡pido en Opciones (`QuickAddFab`).

- **RankingShareCard**: tarjeta visual top 3 para compartir/captura.

- **EmptyState** mejorado: anillo icono, pasos numerados, acciones pegar/rÃƒÆ’Ã‚Â¡pido.

- Badge cuenta atrÃƒÆ’Ã‚Â¡s mudanza en tarjeta bÃƒÆ’Ã‚Âºsqueda.

- ScoreBar mÃƒÆ’Ã‚Â¡s visible en detalle.

### Verification

```powershell

npm.cmd run typecheck

npm.cmd run test

```

## Session 38 - Imagen compartible + tipografÃƒÆ’Ã‚Â­a (2026-06-14)

### Instalado

- `react-native-view-shot`, `@expo-google-fonts/dm-sans`

### Nuevo

- `shareViewCapture` + **Compartir imagen** en Ranking y `/decision`.

- `DecisionShareCard` - tarjeta visual Ãƒâ€šÃ‚Â«Mi elecciÃƒÆ’Ã‚Â³nÃƒâ€šÃ‚Â».

- `FontBootstrap` + DM Sans en tipografÃƒÆ’Ã‚Â­a y botones.

### Verification

typecheck + test OK.

## Session 39 - ColaboraciÃƒÆ’Ã‚Â³n + animaciones ranking (2026-06-14)

### ColaboraciÃƒÆ’Ã‚Â³n

- Import **Combinar** vs **Reemplazar** (`mergeRentalOptions`, `ImportModeChips`).

- Card **Decidir en conjunto** en MÃƒÆ’Ã‚Â¡s: invitaciÃƒÆ’Ã‚Â³n WhatsApp con instrucciones + backup.

- Vista previa import: nuevas/actualizadas/activas resultantes.

### Animaciones

- `LayoutAnimation` al reordenar ranking (Opciones, Ranking, Prioridades).

- `AnimatedRankingRow` - pulso suave al cambiar posiciÃƒÆ’Ã‚Â³n.

### Verification

typecheck + test OK.

## Session 40 - Re-auditorÃƒÆ’Ã‚Â­a (2026-06-14)

### Gates

| Gate | Resultado |

|---|---|

| typecheck | OK |

| test (dominio + merge) | OK |

| lint | 0 errores, 10 warnings |

### Fix

- `decision.tsx`: `useRef` antes del early return (react-hooks error).

### Gaps

Lint warnings, sin tests store merge, E2E pendiente, fotos backup no portables.

## Session 41 - Fixes auditorÃƒÆ’Ã‚Â­a + mejoras (2026-06-14)

### Fixes

- ColaboraciÃƒÆ’Ã‚Â³n: invitaciÃƒÆ’Ã‚Â³n corta + backup en 2Ãƒâ€šÃ‚Âº mensaje (`shareCollaborationPack`).

- Aviso fotos al exportar/compartir backup.

- `FontBootstrap` con loading visible (no pantalla en blanco).

- `resolveImportedChosenOptionId` extraÃƒÆ’Ã‚Â­do y testeado.

- Lint: 10 ÃƒÂ¢Ã‚â€ Ã‚â€™ 1 warning (OCR require).

- BotÃƒÆ’Ã‚Â³n **Invitar a comparar** en Ranking.

- Hint merge: mantiene tu elecciÃƒÆ’Ã‚Â³n marcada.

### Verification

typecheck + test + lint (1 warning) OK.

## Session 42 - OpiniÃƒÆ’Ã‚Â³n pareja + E2E (2026-06-15)

### OpiniÃƒÆ’Ã‚Â³n rÃƒÆ’Ã‚Â¡pida pareja/compaÃƒÆ’Ã‚Â±ero

- Campos opcionales `partnerFeelingRating` y `partnerNote` en `RentalOption`.

- `PartnerOpinionCard`: chips Poco/Bien/Mucho (4/7/9), nota opcional, quitar opiniÃƒÆ’Ã‚Â³n.

- Integrado en detalle de alquiler (`app/rental/[id]/index.tsx`) y comparar A/B compact (`app/compare.tsx`).

- Insight Ãƒâ€šÃ‚Â«OpiniÃƒÆ’Ã‚Â³n pareja/compaÃƒÆ’Ã‚Â±eroÃƒâ€šÃ‚Â» en comparaciÃƒÆ’Ã‚Â³n (`src/domain/compare.ts`).

- Sanitize en import backup (`export-import.ts`).

- Hint en MÃƒÆ’Ã‚Â¡s: Ãƒâ€šÃ‚Â«OpiniÃƒÆ’Ã‚Â³n rÃƒÆ’Ã‚Â¡pida pareja/compaÃƒÆ’Ã‚Â±ero en detalle y compararÃƒâ€šÃ‚Â».

### Verification

| Gate | Resultado |

|---|---|

| typecheck | OK |

| test (dominio + merge + backup-import) | OK |

| lint | 0 errores, 1 warning (OCR require) |

| E2E (`ELIGR_E2E_RESET=1`) | **Bloqueado** - sin emulador/dispositivo Android conectado |

### E2E

Comando intentado:

```powershell

$env:ELIGR_E2E_RESET="1"; npm.cmd run test:e2e

```

Error: `No hay emulador/dispositivo Android. Arranca uno con: npm run android:dev`

Para ejecutar E2E completo: arrancar emulador o conectar dispositivo, Metro activo (`npm run metro:connect`), luego el comando anterior.

## Session 43 - AVD API 35 (2026-06-15)

### Problema

`Pixel_6` (API 34) dejÃƒÆ’Ã‚Â³ de arrancar: imagen `android-34/google_apis/x86_64` borrada al limpiar espacio en Android Studio.

### SoluciÃƒÆ’Ã‚Â³n (opciÃƒÆ’Ã‚Â³n B)

- Nuevo AVD **`Eligr_Pixel_35`** con imagen `android-35/google_apis_playstore/x86_64-3`.

- Script `scripts/create-eligr-avd.ps1` + `npm run avd:create`.

- Default de `android-dev.ps1` cambiado de `Pixel_6` ÃƒÂ¢Ã‚â€ Ã‚â€™ `Eligr_Pixel_35`.

### Verification

- `emulator -list-avds` incluye `Eligr_Pixel_35`.

- `adb`: `emulator-5554`, API 35, boot completo.

## Session 44 - E2E Eligr_Pixel_35 + Metro (2026-06-22)

### Entorno

- Emulador: `Eligr_Pixel_35` (`emulator-5554`, API 35). Arrancado de nuevo tras desconexiÃƒÆ’Ã‚Â³n adb durante la sesiÃƒÆ’Ã‚Â³n.

- Metro: `node node_modules/expo/bin/cli start --port 8081` (sin `--localhost`; ver fix abajo).

- SDK: `C:\Users\User\AppData\Local\Android\Sdk`

### Comandos que funcionaron

```powershell

cd E:\Eligr

npm.cmd run start:clear          # o start (tras fix start-metro.ps1)

npm.cmd run metro:connect

& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 install -r android\app\build\outputs\apk\debug\app-debug.apk

cd android; $env:GRADLE_USER_HOME="$env:USERPROFILE\.gradle"; .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=x86_64

$env:ELIGR_E2E_RESET="1"; npm.cmd run test:e2e

```

### E2E (`ELIGR_E2E_RESET=1`) - resumen por flujo

| Flujo | Run 1 (adb inestable tras 01) | Run 2 (fix-adb al inicio) | Run 3 (boot.yaml actualizado) |

|---|---|---|---|

| 01-smoke | **PASS** | FAIL (onboarding timing) | (preflight abort) |

| 02-rental-detail | FAIL adb/Maestro | FAIL | - |

| 03-ranking | FAIL adb | FAIL adb | - |

| 04-add-option | FAIL | FAIL | - |

| 05-premium | FAIL adb | **PASS** | - |

| 06-visit-assistant | FAIL adb | FAIL adb | - |

| 07-quick-add | FAIL adb | FAIL | - |

| 08-onboarding-skip | FAIL texto obsoleto | FAIL | - |

**Mejor resultado:** 1/8 (run 1) y 1/8 (run 2). Suite completa **no verde** en esta sesiÃƒÆ’Ã‚Â³n.

### Causas / bloqueadores

1. **APK + Metro:** `pm list packages` vacÃƒÆ’Ã‚Â­o en AVD nuevo ÃƒÂ¢Ã‚â€ Ã‚â€™ Maestro no podÃƒÆ’Ã‚Â­a lanzar app hasta `adb install` / `gradlew installDebug`.

2. **Metro `--localhost`:** `scripts/start-metro.ps1` pasaba `--localhost`; el cliente intentaba `10.0.2.2:8081` ÃƒÂ¢Ã‚â€ Ã‚â€™ redbox "Unable to load script". Quitado `--localhost` en `start-metro.ps1`; Metro manual sin ese flag + `adb reverse` cargÃƒÆ’Ã‚Â³ la UI.

3. **Maestro + adb:** `io.grpc.StatusRuntimeException: UNAVAILABLE`, `Command failed (tcp:ÃƒÂ¢Ã‚â‚¬Ã‚Â¦): closed`, fallos instalando `maestro-server` (`Connection reset`, `INSTALL_FAILED_PACKAGE_CHANGED` tras `pm clear`). Cerrar Maestro Studio y evitar `ELIGR_FIX_ADB=1` al inicio salvo necesidad (mata adb durante boot).

4. **Onboarding:** Tras reset, `boot.yaml` a veces no veÃƒÆ’Ã‚Â­a `onboarding-skip` a tiempo ÃƒÂ¢Ã‚â€ Ã‚â€™ assert `tab-options` fallaba.

5. **Flujo 08:** copy cambiÃƒÆ’Ã‚Â³ a "Pega tus anuncios" (ya no "Guarda tus opciones").

### Cambios en repo (esta sesiÃƒÆ’Ã‚Â³n)

- `.maestro/subflows/boot.yaml` - `extendedWaitUntil` + tap opcional onboarding/banner antes de `tab-options`.

- `.maestro/flows/08-onboarding-skip.yaml` - assert "Pega tus anuncios", timeouts 60s.

- `scripts/start-metro.ps1` - `expo start --port` sin `--localhost` (emulador + adb reverse).

- `scripts/maestro-test.ps1` - ya no usa `--no-reinstall-driver`; helpers `Launch-EligrApp` / `Get-AppWaitSeconds`; reintento con `fix-adb`; reset solo al inicio + `pm clear` antes de `08-onboarding-skip`.

### PrÃƒÆ’Ã‚Â³ximo paso recomendado

1. Cerrar Maestro Studio; emulador estable; `npm run start:clear` + `npm run metro:connect`.

2. `gradlew app:installDebug` si el AVD es nuevo.

3. `$env:ELIGR_E2E_RESET="1"; npm.cmd run test:e2e` (sin `ELIGR_FIX_ADB=1` salvo reintento).

4. Si persisten fallos adb: reiniciar emulador y repetir; considerar regla firewall entrante 8081 (requiere admin).

## Session 45 - Full verification loop (Cursor subagent, 2026-06-22)

### Context

- Read sessions 42ÃƒÂ¢Ã‚â‚¬Ã‚â€œ44 in this file (`Eligr_Pixel_35`, Metro 8081, Maestro E2E).

- Goal: clean rerun of typecheck / unit test / lint / full `ELIGR_E2E_RESET=1` suite.

### Environment

| Check | Result |

|---|---|

| `adb devices` | `emulator-5554` - inicialmente **offline**; `npm run adb:fix` ÃƒÂ¢Ã‚â€ Ã‚â€™ **device**; cold boot AVD una vez |

| `sys.boot_completed` | `1` |

| Metro `:8081` | **OK** (`packager-status:running`); `npm run metro:connect` OK |

| APK `com.anonymous.eligr` | **instalado** en emulador |

### Static gates

```powershell

cd E:\Eligr

npm.cmd run typecheck   # OK

npm.cmd run test        # OK (domain tests)

npm.cmd run lint        # OK - 0 errors, 1 warning (screenshot-ocr require)

```

### E2E (`$env:ELIGR_E2E_RESET="1"; npm.cmd run test:e2e`)

| Flujo | Resultado | Notas |

|---|---|---|

| preflight `boot.yaml` | mixto | 1.er run: OK en reintento; runs posteriores: driver timeout o `tab-options` no visible tras `pm clear` |

| 01-smoke | **FAIL** | `UNAVAILABLE` / adb socket closed en boot subflow |

| 02-rental-detail | **FAIL** | assert "Notas rÃƒÆ’Ã‚Â¡pidas" (scroll); fix aplicado: `visit-quick-notes` + scroll en YAML (no re-verificado en verde) |

| 03-ranking | **PASS** | ÃƒÆ’Ã‚Âºnico flujo estable en run completo 1/8 |

| 04-add-option | **FAIL** | adb/Maestro `UNAVAILABLE` |

| 05-premium | **FAIL** | adb/Maestro `UNAVAILABLE` |

| 06-visit-assistant | **FAIL** | adb/Maestro `UNAVAILABLE` |

| 07-quick-add | **FAIL** | `tab-options` no visible tras reset |

| 08-onboarding-skip | **FAIL** | Maestro Android driver startup timeout |

**Mejor suite completa:** **1/8** (solo `03-ranking`). Runs adicionales abortaron en preflight o no mejoraron el score.

### Fixes aplicados en este loop (sin commit)

- `scripts/maestro-test.ps1` - `MAESTRO_DRIVER_STARTUP_TIMEOUT` antes de preflight; reset E2E al inicio; waits mÃƒÆ’Ã‚Â¡s largos con `ELIGR_E2E_RESET`; reintento por flujo tras `fix-adb` (script ya evolucionado vs sesiÃƒÆ’Ã‚Â³n 44).

- `src/components/VisitChecklistCard.tsx` - `testID="visit-quick-notes"` en tarjeta de notas rÃƒÆ’Ã‚Â¡pidas.

- `.maestro/flows/02-rental-detail.yaml` - `scrollUntilVisible` + assert por `visit-quick-notes`.

### Bloqueadores (acciÃƒÆ’Ã‚Â³n usuario)

1. **Maestro ÃƒÂ¢Ã‚â€ Ã‚â€ adb inestable** en Windows (`UNAVAILABLE`, `tcp:ÃƒÂ¢Ã‚â‚¬Ã‚Â¦ closed`, driver startup timeout). Cerrar Maestro Studio; no usar `ELIGR_FIX_ADB=1` al arrancar salvo reintento; reiniciar emulador si `authorizing`/offline.

2. Tras `pm clear`, la app a veces no llega a `tab-options` en preflight (Metro/JS o onboarding) - probar `npm run start:clear` + `metro:connect` y relanzar suite.

3. Suite **no verde**; repetir E2E cuando adb/Maestro estÃƒÆ’Ã‚Â©n estables (ver pasos sesiÃƒÆ’Ã‚Â³n 44).

### Comandos ejecutados

`adb:fix`, `metro:connect`, `typecheck`, `test`, `lint`, `test:e2e` (ÃƒÆ’Ã‚â€”3 con variaciones), cold boot `Eligr_Pixel_35`, boot preflight Maestro aislado (timeout).

## Session 46 - E2E after hydration/onboarding fixes (Cursor subagent, 2026-06-22)

### Context

- Fixes: `EXPO_PUBLIC_ELIGR_E2E=1` in `Start-MetroForE2e`; `useStoreHydration` auto-completes onboarding + dismisses sample banner in E2E; `00-onboarding-skip.yaml` waits for `tab-options`/`options-screen` (no tap).

- Maestro runner (`scripts/maestro-test.ps1`): `Disable-PackageVerifier` (adb `package_verifier_enable` / `verifier_verify_adb_installs`); `--udid emulator-5554`; retry via `fix-adb.ps1` + `--reinstall-driver`; `Prepare-DeviceForMaestro` wake/unlock.

### Commands

```powershell

cd E:\Eligr

Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force

$adb="C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe"

& $adb -s emulator-5554 shell settings put global package_verifier_enable 0

& $adb -s emulator-5554 shell settings put global verifier_verify_adb_installs 0

Remove-Item Env:ELIGR_FIX_ADB -ErrorAction SilentlyContinue

$env:ELIGR_E2E_RESET="1"

$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"

npm.cmd run test:e2e

```

### Results

| Gate | Result |

|---|---|

| `typecheck` (prior) | **OK** (`tsc --noEmit`) |

| E2E suite (`test:e2e`) | **FAIL 7/8** (exit 1; script retry 0/8) |

| Driver started | **yes** (Run 1; no `INSTALL_FAILED_VERIFICATION_FAILURE`) |

### E2E detail (`emulator-5554`, ~46 min total)

- Preflight: Android ready, package verifier disabled, APK installed, Metro 8081 + `EXPO_PUBLIC_ELIGR_E2E=1`, `adb reverse`, `pm clear` + 15s, bundle + app UI warmup OK.

- **Run 1 (8 flows):** `00`Ã‚â€“`03`, `05`Ã‚â€“`07` **passed**; **first failure** `04-add-option` Ã‚â€” `No visible element found: id: options-add-button` (~2m 5s). **7/8.**

- **Script retry** (`fix-adb`, `pm clear`, `--reinstall-driver`): emulator briefly `authorizing` after adb restart; all 8 flows failed `Assertion is false: id: tab-options is visible` (~3m each). **0/8** on retry (environmental; not driver-only).

- Smoke fallback not run (failure was app assertion on Run 1, not driver install).

### Notes

- `Disable-PackageVerifier` unblocked Maestro driver install vs prior session `INSTALL_FAILED_VERIFICATION_FAILURE`.

- Onboarding E2E path OK on Run 1 (`00-onboarding-skip` 4s).

- Suite retry after partial failure still runs `fix-adb` + full re-run; may destabilize emulator Ã‚â€” consider skipping retry when Run 1 fails on a single flow only.

### Next step

- Fix `04-add-option` / options screen so `options-add-button` is visible (or flow navigation after prior tests).

- Re-run `test:e2e` after cold AVD if retry `tab-options` flakes persist; optionally disable suite retry on non-driver failures.

### Session 46 verification Ã‚â€” flow 04 fix (Cursor subagent, 2026-06-22)

**Changes under test:** .maestro/subflows/scroll-to-add.yaml (scroll UP only to options-add-button); .maestro/flows/04-add-option.yaml (extendedWaitUntil before tap); scripts/maestro-test.ps1 (retry only on driver failures, not partial flow failures).

**Step 1 Ã‚â€” quick test (no reset, keep Metro):**

`powershell

$env:ELIGR_E2E_FLOWS="04-add-option"

$env:ELIGR_E2E_SKIP_METRO_RESTART="1"

$env:ELIGR_E2E_RESET="0"

npm.cmd run test:e2e

`

| Result | Detail |

|---|---|

| **04-add-option** | **FAIL** (boot subflow, ~4.5 min) |

| Failure | `Assert that id: tab-options is visible` in `../subflows/boot.yaml` |

| Notes | Optional `onboarding-skip` / `Saltar` **WARNED**; never reached add-option / `options-add-button` |

| Maestro artifacts | `C:\Users\User\.maestro\tests\2026-06-22_153503` |

**Step 2 - full suite (ELIGR_E2E_RESET=1):** **run** (Cursor subagent, 2026-06-22).

```powershell

cd E:\Eligr

Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force

Remove-Item Env:ELIGR_E2E_FLOWS -ErrorAction SilentlyContinue

Remove-Item Env:ELIGR_E2E_SKIP_METRO_RESTART -ErrorAction SilentlyContinue

Remove-Item Env:ELIGR_FIX_ADB -ErrorAction SilentlyContinue

$env:ELIGR_E2E_RESET="1"

$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"

npm.cmd run test:e2e

```

| Result | Detail |

|---|---|

| **Suite score** | **0/8 passed** (8/8 failed; exit 1) |

| **Total runtime** | **~27.6 min** (~1654 s wall clock) |

| **First failure** | `00-onboarding-skip` - `Assertion is false: id: tab-options is visible` (~3m 16s) |

| **04-add-option** | **FAIL** (same `tab-options`; scroll-to-add fix **not exercised**) |

| **Flows 01-07** | All failed `tab-options` (~3m each) |

| **Script retry** | Not triggered (driver-only retry policy) |

Preflight OK (Android, verifier, Metro `EXPO_PUBLIC_ELIGR_E2E=1`, `pm clear`, bundle + UI warmup) but Maestro could not see `tab-options` on any flow - boot regression vs Run 1 (**7/8**). **04 / `options-add-button` fix unverified** until boot stable.

### Session 46 Run 3 - synchronous E2E onboarding skip (Cursor subagent, 2026-06-22)

**Changes under test:** `useEligrStore` `defaultAppMeta` sets `hasCompletedOnboarding` / `dismissedSampleBanner` true when `EXPO_PUBLIC_ELIGR_E2E=1`; `normalizePersistedSlice` forces same on rehydrate; `app/(tabs)/index.tsx` never shows `OnboardingModal` in E2E mode.

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item Env:ELIGR_E2E_FLOWS -ErrorAction SilentlyContinue
Remove-Item Env:ELIGR_E2E_SKIP_METRO_RESTART -ErrorAction SilentlyContinue
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 0/8** (exit 1) |
| **Total runtime** | **~28.0 min** (~1677 s wall clock) |
| **First failure** | `00-onboarding-skip` - `Assertion is false: id: tab-options is visible` (~3m 19s) |
| **04-add-option** | **FAIL** (same `tab-options`; add-button / scroll fix **not exercised**) |
| **Flows 01-07** | All failed `tab-options` (~3m each) |
| **Script retry** | Not triggered (driver-only retry policy) |

Preflight OK (Android, verifier, Metro `EXPO_PUBLIC_ELIGR_E2E=1`, `pm clear`, bundle + app UI warmup reported OK) but Maestro still could not see `tab-options` on any flow. Synchronous onboarding defaults did not unblock boot assertions in this run.

### Session 46 Run 4 - Metro cmd E2E env + ensure-options-tab subflow (Cursor subagent, 2026-06-22)

**Changes under test:** Metro started via `cmd.exe` with explicit `EXPO_PUBLIC_ELIGR_E2E=1`; `app.config.js` `extra.eligrE2e`; Maestro `ensure-options-tab.yaml` subflow (onboarding dismiss + `tab-options`); preflight requires `tab-options` when `ELIGR_E2E_RESET=1`.

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 0/8** (exit 1) |
| **Total runtime** | **~30.3 min** (~1818 s wall clock) |
| **First failure** | `00-onboarding-skip` - `Assertion is false: id: tab-options is visible` (~3m 29s) |
| **04-add-option** | **FAIL** (same `tab-options`; add-button / scroll fix **not exercised**) |
| **Flows 01-07** | All failed `tab-options` (~3m each) |
| **Script retry** | Not triggered (driver-only retry policy) |

Preflight OK through `tab-options` during app UI warmup (`OK tab-options visible`) but Maestro session still failed `tab-options` on every flow Ã‚â€” preflight vs Maestro boot state mismatch persists.

### Session 46 Run 5 - no launchApp + Opciones text + monkey launch (Cursor subagent, 2026-06-22)

**Changes under test:** `00-onboarding-skip.yaml` and `boot.yaml` have **no** `launchApp` (app warmed by script preflight); `ensure-options-tab.yaml` asserts visible text **"Opciones"** (not `tab-options` testID); `Start-EligrActivity` uses **monkey** launcher (not `force-stop`).

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 0/8** (exit 1) |
| **Total runtime** | **~33.2 min** (~1993 s wall clock) |
| **First failure** | `00-onboarding-skip` - `Assertion is false: "Opciones" is visible` (~3m 15s) |
| **04-add-option** | **FAIL** (same `"Opciones"`; add-button / scroll fix **not exercised**) |
| **Flows 01-07** | All failed `"Opciones"` (~3m each) |
| **Script retry** | Not triggered (driver-only retry policy) |

Preflight OK (`OK tab Opciones visible`; monkey launch; no `launchApp` in flows) but Maestro session still could not see **"Opciones"** on any flow - preflight vs Maestro boot state mismatch persists (assertion target changed from `tab-options` to label text).



### Session 46 Run 6 - Maestro cold start + options-screen 240s + reinstall-driver (Cursor subagent, 2026-06-22)

**Changes under test:** No `Launch-EligrAndWait` preflight (Maestro owns cold start via `00` `launchApp` `stopApp: true`); `ensure-options-tab.yaml` waits `options-screen` (240s); first `Invoke-Maestro` uses `--reinstall-driver`.

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 0/8** (exit 1) |
| **Total runtime** | **~7.2 min** (~432 s wall clock) |
| **First failure** | Maestro driver reinstall - `Failed to install apk` ... `cmd: Can't find service: package` (before `00-onboarding-skip` assertions) |
| **04-add-option** | **FAIL** (not exercised; suite aborted on driver install) |
| **Flows 00-07** | Not run (Maestro session failed at `--reinstall-driver`) |
| **Script retry** | Not observed in log (driver failure; no second suite attempt reported) |

Preflight warned Android may not be fully ready (`cmd: Can't find service: input/window/settings`); bundle warmup OK; no `Launch-EligrAndWait` (Maestro cold start). **`00-onboarding-skip` did not pass quickly** (unlike Run 1 ~4s) - flows never started.


### Session 46 Run 7 - restored Run 1 winning config (Cursor subagent, 2026-06-22)

**Changes under test:** `Launch-EligrAndWait` after `pm clear`; `00`/`boot` `launchApp` `stopApp: false` + `tab-options`; first `Invoke-Maestro` **without** `--reinstall-driver` (retry only on driver failure); `Wait-ForPackageManager` before settings/Maestro; `04` scroll fix unchanged (`scroll-to-add.yaml` / `extendedWaitUntil`).

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 7/8** (exit 1) |
| **Total runtime** | **~46.9 min** (~2816 s wall clock, successful attempt after emulator reboot) |
| **00-onboarding-skip** | **PASS** (**37s**; Run 1 was ~4s) |
| **First failure** | `04-add-option` — `No visible element found: id: options-add-button` (**2m 6s**) |
| **04-add-option** | **FAIL** (scroll fix exercised; add button not visible) |
| **Flows 01–03, 05–07** | **PASS** |
| **Script retry** | Not triggered (driver-only retry policy) |

**Infra note:** First `test:e2e` attempt (~8.3 min) aborted in `ensure-e2e-apk.ps1` (`cmd: Can't find service: package` / settings) while emulator showed `device` but PM not ready. `adb reboot` + wait until `pm path android` OK; second attempt ran full suite.

Preflight OK (Android + package service, verifier, Metro `EXPO_PUBLIC_ELIGR_E2E=1`, `pm clear`, bundle + `Launch-EligrAndWait` → `OK tab Opciones visible`). Restored Run 1 boot path stable again vs Runs 2–6; **04 regression matches Run 1** (`options-add-button`).


### Session 46 Run 8 - 04 scroll-up + tap "Añadir" + PM reboot hook (Cursor subagent, 2026-06-22)

**Changes under test:** Removed `options-visible` wait (scrolled past add button); `04` scroll UP to `"Opciones guardadas"` then tap text `"Añadir"`; `maestro-test.ps1` `adb reboot` when package service not ready.

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 7/8** (exit **1**) |
| **Total runtime** | **~10.2 min** (**610.5 s** wall clock) |
| **00-onboarding-skip** | **PASS** (**36s**) |
| **First failure** | `04-add-option` - `Element not found: Text matching regex: Añadir` (**1m 9s**) |
| **04-add-option** | **FAIL** (text tap; `Añadir` not found) |
| **Flows 01-03, 05-07** | **PASS** (01 **48s**, 02 **53s**, 03 **47s**, 05 **52s**, 06 **1m 23s**, 07 **1m 4s**) |
| **Script retry** | Not triggered |

Preflight OK (Android + package service on first attempt, verifier, Metro, `pm clear`, bundle + `Launch-EligrAndWait` → `OK tab Opciones visible`). No `adb reboot` needed this run.


### Session 46 Run 9 - Añadir before Rápido + 04 boot pattern (Cursor subagent, 2026-06-22)

**Changes under test:** Swapped "Añadir" before "Rápido" in `index.tsx` + `flexShrink` on `addActions`; `04-add-option` mirrors `07` pattern: boot + `options-visible` + tap `options-add-button`.

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **FAIL 7/8** (exit **1**) |
| **Total runtime** | **~9.0 min** (**~539 s** wall clock) |
| **00-onboarding-skip** | **PASS** (**37s**) |
| **First failure** | `07-quick-add` - `Element not found: Id matching regex: options-quick-add-button` (**54s**) |
| **04-add-option** | **PASS** (**45s**; `options-add-button` after boot + `options-visible`) |
| **Flows 00-03, 05-06** | **PASS** (01 **48s**, 02 **54s**, 03 **50s**, 05 **53s**, 06 **1m 24s**) |
| **07-quick-add** | **FAIL** (`options-quick-add-button` not found) |
| **Script retry** | Not triggered |

Preflight OK (Android + package service, verifier, Metro, `pm clear`, bundle + `Launch-EligrAndWait` -> `OK tab Opciones visible`). No `adb reboot` needed.



### Session 46 Run 10 - addActions column + quick-add-fab (Cursor subagent, 2026-06-22)

**Changes under test:** `addActions` column layout (both header buttons visible); `07-quick-add` uses `quick-add-fab` instead of `options-quick-add-button`; `04` unchanged (passed Run 9).

```powershell
cd E:\Eligr
npm.cmd run typecheck
Get-Process maestro -ErrorAction SilentlyContinue | Stop-Process -Force
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** (`tsc --noEmit`) |
| E2E suite (`test:e2e`) | **PASS 8/8** (exit **0**) |
| **Total runtime** | **~9.0 min** (**~539 s** wall clock; Maestro flows **7m 15s**) |
| **00-onboarding-skip** | **PASS** (**36s**) |
| **First failure** | *(none)* |
| **04-add-option** | **PASS** (**45s**; unchanged from Run 9) |
| **07-quick-add** | **PASS** (**1m 5s**; `quick-add-fab`) |
| **Flows 00-03, 05-06** | **PASS** (01 **48s**, 02 **54s**, 03 **48s**, 05 **54s**, 06 **1m 25s**) |
| **Script retry** | Not triggered |

Preflight OK (Android + package service, verifier, Metro PID restart on 8081, `pm clear`, bundle + `Launch-EligrAndWait` -> `OK tab Opciones visible`). No `adb reboot` needed.

**Session 46 final suite scores:** Run 1 **7/8** (04 `options-add-button`); quick isolated 04 **0/1** (`tab-options`); Run 2 full reset **0/8** (`tab-options`); Run 3 full reset **0/8** (`tab-options`); Run 4 full reset **0/8** (`tab-options`, preflight saw `tab-options`); Run 5 full reset **0/8** (`"Opciones"`, preflight saw Opciones); Run 6 full reset **0/8** (Maestro driver `package` service / `--reinstall-driver`, flows not started); Run 7 full reset **7/8** (04 `options-add-button`, boot restored); Run 8 full reset **7/8** (04 `Añadir` text not found); Run 9 full reset **7/8** (04 **PASS**, 07 `options-quick-add-button`); Run 10 full reset **8/8** (addActions column + `quick-add-fab`).

## Session 47 - E2E suite estable 8/8 (Cursor, 2026-06-28)

### Root causes found

1. **APK corrupta / ABI incorrecta** — emulador x86_64 con instalación rota (`libreactnative.so` missing → "Eligr keeps stopping"). Solución: reinstalar `android/app/build/outputs/apk/debug/app-debug.apk` (ABI **x86_64**).
2. **Diálogos del sistema** — ANR "Digital Wellbeing isn't responding" bloqueaba la UI. Script ahora deshabilita wellbeing y cierra diálogos ANR.
3. **Maestro `--reinstall-driver` en primer intento** — provocaba "Unable to launch app" en todos los flujos; eliminado del primer pase (solo en reintento por driver).
4. **Flujo 07** — tras quick-add debe esperar `"Piso prueba E2E"`, no la tarjeta demo de Delicias.

### Changes

- **Maestro**: `ensure-options-tab.yaml` ancla en texto `"Habitacion luminosa en Delicias"` + `rental-card-rental-1`; tabs por etiqueta (`"Opciones"`, `"Ranking"`, `"Más"`, `"Prioridades"`); `launchApp: stopApp: false` en subflow.
- **App**: `Screen.tsx` expone `testID` en `SafeAreaView`; `GuardedTabBarButton` + `_layout.tsx` con `accessibilityLabel` en tabs.
- **Runner** (`maestro-test.ps1`): salud Android (`Ensure-AndroidHealthy`, `Dismiss-BlockingDialogs`, `Clear-EligrAppData`), reintentos separados driver vs UI, `Launch-EligrAndWait` 3 intentos, timeout driver 600s.
- **ensure-e2e-apk.ps1**: detecta ABI, prueba arranque (`Test-EligrLaunchable`), reinstala si la app no abre.

### Verification

```powershell
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `test` (domain) | **OK** |
| E2E (`test:e2e`) | **PASS 8/8** (exit **0**, **~8m 56s**) |

**Nota:** Si el emulador muestra "keeps stopping", ejecutar `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` (debe ser **x86_64** para `Eligr_Pixel_35`). Cold boot si `package` service falla.

## Session 48 - UX polish (Cursor, 2026-06-28)

### Changes
- **Opciones** (`index.tsx`): búsqueda colapsable (`CollapsibleSection`), aviso trayecto dentro de búsqueda, asistente colapsado con ≥2 opciones, eliminado nudge ranking duplicado, un solo botón «Añadir» (rápido = FAB), pill plan solo si premium o límite.
- **Más** (`premium.tsx`): toggle premium solo en `__DEV__` o E2E (`src/utils/dev.ts`); en release muestra «Premium próximamente».

### Verification
- `typecheck` OK
- `npm test` OK

## Session 49 - Onboarding, fechas, visita, backup (Cursor, 2026-06-28)

### Changes
- **Onboarding**: 2 pasos (antes 3); atajo «Pegar anuncio» en paso 1.
- **DateField**: calendario mensual + presets (sin dependencia nueva).
- **Detalle visita**: hint checklist solo lectura; subtítulo sección visita dinámico.
- **VisitChecklistCard**: textos UTF-8 corregidos; banner hint si 0 ítems revisados.
- **Backup (Más)**: aviso persistente si hay fotos; alertas de export más claras.

### Verification
- `typecheck` OK
- `npm test` OK

## Session 50 - Primera sesión real (pegar anuncio) (Cursor, 2026-06-28)

### Changes
- **Sin opciones activas** → `/rental/new` abre directo en pegar (sin pantalla de modos).
- **Flujo express**: pegar → analizar → confirmar (2 pasos) → guardar con valoración neutral.
- Botón «Probar con ejemplo», badges de datos detectados, enlace a flujo completo.
- Toast tras primera opción guardada.
- Copy en Opciones vacío orientado a pegar anuncio.

### Verification
- `typecheck` OK
- `npm test` OK
- E2E 04 sin cambios (usa demo con 3 opciones → sigue viendo `intake-start-card`).

## Session 51 - Segunda opción y nudges de comparación (Cursor, 2026-06-14)

### Changes
- **Dominio** (`decision-hints.ts`, `assistant-journey.ts`): hints distintos para 1 opción («Falta una para comparar») y 2 («Listo para comparar»); eliminado bloque muerto `< 3`.
- **Nueva opción** (`rental/new.tsx`): `expressPaste` cuando `activeCount < 2` (2.ª opción también flujo pegar rápido); tras guardar 2.ª → ranking + toast.
- **Añadir rápido** (`rental/quick.tsx`): misma redirección a ranking al guardar la 2.ª opción.
- **Opciones** (`index.tsx`): tarjetas nudge «1 de 2» y «Ya puedes comparar» (ocultas con demo/onboarding).
- **Ranking** (`ranking.tsx`): CTA «Añadir segunda opción» cuando solo hay una activa.

### Verification
- `typecheck` OK
- `npm test` OK
- E2E no re-ejecutado (último 8/8 en Session 47; flow 04 con demo no usa express paste).

## Session 52 - Compare vacío y nudges 1→2 (Cursor, 2026-06-28)

### Changes
- **Comparar** (`compare.tsx`): estados distintos para 0 opciones (`EmptyState` con pasos + pegar anuncio) y 1 opción (nudge «1 de 2», añadir segunda/rápido, enlace a ranking orientativo).
- **Ranking** (`ranking.tsx`): CTA de 1 opción alineado con Opciones («Añadir segunda» + «Rápido»).
- **Visitas** (`visit/index.tsx`): aviso breve cuando solo hay un piso activo.

### Verification
```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
Set-Location e:\Eligr; npm.cmd test
```
| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | **OK** (domain) |
| E2E | No re-ejecutado (último 8/8 Session 47) |

## Session 53 - Prioridades nudge y copy unificado (Cursor, 2026-06-14)

### Changes
- **Prioridades** (`priorities.tsx`): nudge «Ranking orientativo» con 1 opción activa + CTAs «Añadir segunda» / «Rápido».
- **Copy**: `decision-hints.ts` y `assistant-journey.ts` usan «Añadir segunda» (alineado con Opciones, Ranking, Comparar).

### Verification
- `typecheck` OK
- `npm test` OK
## Session 54 - E2E verificación post UX (Cursor, 2026-06-28)

### Context
- Re-ejecutar suite Maestro tras Sessions 48-53 (onboarding 2 pasos, express paste, nudges 1→2).
- Último verde estable: Session 47 (8/8).

### Changes
- **`scripts/maestro-test.ps1`**: `Wait-ForAppUiReady` con `ELIGR_E2E_RESET=1` ahora acepta UI tras `pm clear` (onboarding `onboarding-*`, copy "Pega y compara" / "Pegar anuncio", `intake-start-card`) además de tab Opciones / demo Delicias — evita precalentado colgado ~12+ min cuando el reset muestra onboarding vacío antes de demo E2E.
- Reintento suite ya distingue fallos driver (`Unable to launch app`, `UNAVAILABLE`, tcp) vs aserciones UI; segundo pase recuperó la suite.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck; npm.cmd test
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` (domain) | **OK** |
| E2E run 1 | **3/8** — 00-02 PASS; 03-ranking FAIL (~1m24s); 04-07 `Unable to launch app` (cascada tras 03) |
| E2E run 2 (reintento automático script) | **8/8 PASS** (~9m 45s) — 00 **52s**, 01 **1m7s**, 02 **1m11s**, 03 **1m8s**, 04 **1m2s**, 05 **1m6s**, 06 **1m52s**, 07 **1m27s** |
| **E2E final (exit script)** | **8/8** |

Preflight: `OK tab Opciones visible` tras parche (antes: UI vacía / Metro lento y timeouts 240s×3).

### Notas / incidentes
- Emulador `emulator-5554` (Eligr_Pixel_35); `scripts/fix-adb.ps1` útil si Maestro devuelve `UNAVAILABLE` / grpc tcp cerrado.
- No se añadió flujo Maestro express paste (0→1→2): los 8 flujos demo siguen válidos con `EXPO_PUBLIC_ELIGR_E2E=1` y datos sample tras reset.
- Flakiness residual: primer pase 03-ranking + launch app; si vuelve, priorizar reintento con `--reinstall-driver` o cold boot.

### Recommended next
- Opcional: endurecer `03-ranking.yaml` (timeouts / `extendedWaitUntil` en `ranking-share-button`) para evitar cascada `Unable to launch app`.
- Flujo Maestro express paste solo si se quiere cubrir journey sin demo (flujo separado, no mezclar con `ensure-options-tab`).

## Session 55 - E2E 8/8 con FoodRanker en paralelo (Cursor, 2026-06-29)

### Changes
- **`scripts/maestro-test.ps1`**: no usa el primer `adb device` si no es `Eligr_Pixel_35`; arranca el AVD de Eligr sin cerrar otros (p. ej. FoodRanker_Test). Aviso si el puerto 8081 está ocupado. Reintento UI incluye fallo `Piso prueba E2E`.
- **`.maestro/flows/07-quick-add.yaml`**: tras guardar, espera salir de quick-add, scroll hasta «Piso prueba E2E» (queda abajo en lista por score).

### Verification
```powershell
Set-Location e:\Eligr; npm.cmd run typecheck; npm.cmd test
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm.cmd run test:e2e
```
| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | **OK** |
| E2E | **8/8** (~8m 36s), `emulator-5556` (Eligr_Pixel_35), FoodRanker en `emulator-5554` sin cerrar |

### Notas
- E2E reinicia Metro en **8081** (~10 min); puede interrumpir hot reload de otra app RN en el mismo puerto.
- Usar `Remove-Item Env:ELIGR_E2E_FLOWS` si quedó filtro de un flujo suelto en la terminal.

## Session 56 - Ranking, plan y visitas (Cursor, 2026-06-29)

### Changes
- **Ranking**: tarjeta «Tu elección» si hay favorita marcada; nudge con 2 opciones (comparar + compartir top); vacío orientado a pegar anuncio.
- **Opciones**: pill `X/5` siempre visible en plan gratis (antes solo al límite).
- **Visitas**: vacío con CTAs pegar / rápido.

### Verification
- `typecheck` OK
- `npm test` OK
- E2E no re-ejecutado (último 8/8 Session 55)

## Session 57 - Decisión, informes HTML y E2E express (Cursor, 2026-06-29)

### Changes
- **`app/decision.tsx`**: vacío con pasos y CTAs a ranking/opciones; visita (impresión + siguiente paso); botones compartir agrupados.
- **`report-html.ts`**: ranking con caja resumen, pros/contras top 3, fecha; decisión con visita y mejor maquetación.
- **`ChosenOptionCard`**: en modo compacto, enlace «Resumen completo» → `/decision`.
- **E2E express** (opcional, separado del 8/8 demo):
  - `08-express-paste.yaml` — journey 0→1→2 pegando anuncios.
  - `EXPO_PUBLIC_ELIGR_E2E_EXPRESS=1` + store vacío tras reset.
  - Flujo 08 excluido de la suite por defecto (`^08-`).
  - `options-empty-paste` testID en Opciones vacío.

### Verification
- `typecheck` OK
- `npm test` OK

```powershell
$env:ELIGR_E2E_EXPRESS="1"
$env:ELIGR_E2E_FLOWS="08-express-paste"
$env:ELIGR_E2E_RESET="1"
$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"
npm run test:e2e
```

## Session 58 - Detalle, búsqueda y Más (Cursor, 2026-06-29)

### Changes
- **`app/rental/[id]/index.tsx`**: comparar solo con otras activas; nudge «Añadir otra» si hay &lt;2 activas; botón «Resumen de decisión» si es la elección; toast al marcar con pista de compartir.
- **`app/search/edit.tsx`**: botón volver; aviso si ciudad/destino siguen en «Por definir».
- **`app/(tabs)/index.tsx`**: aviso en tarjeta búsqueda si falta ciudad o destino del trayecto.
- **`app/(tabs)/premium.tsx`**: tarjeta «Tu elección» con acceso a `/decision` cuando hay favorita marcada.

### Verification
- `typecheck` OK
- E2E no re-ejecutado (último 8/8 Session 55)

## Session 59 - Comparar y visitas (Cursor, 2026-06-29)

### Changes
- **`app/compare.tsx`**: `testID` en pantalla, vacío y compartir; tarjeta accent para elegir B con «Usar rival del ranking»; nudge post-comparación (ranking / decisión); copy unificado.
- **`app/visit/index.tsx`**: vacío con icono, pasos y `testID`; nudges 1 y 2 opciones (añadir segunda / comparar dos).
- **`app/visit/[id].tsx`**: vacío orientado si falta el piso; enlace a ficha; tarjeta de notas previas al re-editar.
- **`src/components/EmptyState.tsx`**: prop opcional `testID` en la tarjeta.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (último 8/8 Session 55) |

## Session 60 - Quick add y nueva opción (Cursor, 2026-06-29)

### Changes
- **`app/rental/quick.tsx`**: cabecera dinámica 0→1→2; pill `X/5`; tarjetas accent con nudges primera/segunda opción; enlaces a pegar anuncio; `testID` en pantalla, formulario, nudges y CTAs.
- **`app/rental/new.tsx`**: `testID="rental-new-screen"`; nudges accent (primer anuncio, segunda opción, ranking disponible); pill plan free; enlace a añadir rápido; copy alineado con Opciones/Visitas.
- **`src/components/RentalIntakeWizard.tsx`**: `testID` en contenedor (`intake-wizard`) y enlace rápido (`intake-quick-link`).

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (último 8/8 Session 55; flujo 08 express compatible con testIDs existentes) |

### Recommended next
- Pantallas restantes del flujo de edición (`app/rental/[id]/edit.tsx`, `app/rental/form.tsx`) o prioridades si el usuario sigue con polish UX.

## Session 61 - Editar opción y formulario completo (Cursor, 2026-06-29)

### Changes
- **`app/rental/[id]/edit.tsx`**: cabecera dinámica si trayecto estimado; nudges accent (trayecto ~75 min), visita y ranking (máx. uno secundario); toast al guardar; `testID` en pantalla, not-found, back y nudges.
- **`app/rental/form.tsx`**: pill `X/5`; nudges a asistente / añadir rápido; hint segunda opción; `FreeLimitCard`; toasts alineados con `new.tsx`; `testID` en pantalla y CTAs.
- **`src/components/RentalForm.tsx`**: tarjeta accent de validación tras submit fallido; `testID` en formulario, secciones, campos clave, chips de tipo y botón guardar; placeholder en trayecto.
- **`app/rental/[id]/index.tsx`**: `testID="rental-detail-edit-button"` en botón Editar.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (último 8/8 Session 55) |

### Recommended next
- Prioridades (`app/priorities.tsx`) o polish restante en listado de opciones si el usuario sigue con UX.

## Session 62 - Prioridades y listado opciones (Cursor, 2026-06-29)

### Changes
- **`app/(tabs)/priorities.tsx`**: tarjeta «Cómo afectan los pesos»; hint de plantilla con copy de perfil; nudge 2+ opciones con enlaces a ranking/comparar; botón «Ranking completo» en vista previa; toast al guardar si hay ≥2 activas; `testID` en pantalla, ayuda, plantilla, nudges, vacío, preview, footer y CTAs.
- **`app/(tabs)/index.tsx`**: `testID` en vacíos por filtro; copy swipe «Desliza a la izquierda: favorito o descartar».
- **`src/components/ListFilterChips.tsx`**: `testID` por chip (`options-filter-*`).

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (último 8/8 Session 55) |

### Recommended next
- Formulario de búsqueda (`app/search/edit.tsx`) o flujo visitas si el usuario sigue con polish UX; opcional Maestro para tab Prioridades.

## Session 63 - Ranking, onboarding y decisión (Cursor, 2026-06-29)

### Changes
- **`app/(tabs)/ranking.tsx`**: `testID="ranking-screen"`; vacío con icono, pasos y CTAs (`ranking-empty-*`); aviso búsqueda incompleta; nudges 3+ sin elección (detalle top / visitas) y enlace a prioridades; `testID` en nudges, recomendación y botones existentes; enlace «Resumen de decisión» si el top es la favorita.
- **`src/components/OnboardingModal.tsx`**: `testID` en modal, pantalla, tarjeta de paso y botón «Pegar anuncio» del paso 1; copy paso 2 menciona ranking.
- **`app/decision.tsx`**: `testID` en pantalla vacía, empty state y acciones; nudge visita si falta impresión; `testID` en volver y CTA visita.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (último 8/8 Session 55; testIDs ranking compatibles con `03-ranking.yaml`) |

### Recommended next
- Polish restante en búsqueda (`app/search/edit.tsx`) o Maestro tab Prioridades / ranking vacío si el usuario sigue con UX.

## Session 64 - Maestro E2E y polish búsqueda/import (Cursor, 2026-06-30)

### Changes
- **Maestro (sessions 58–63 testIDs)**:
  - `01-smoke.yaml`, `03-ranking.yaml`, `05-premium.yaml`: tabs por `testID` (`tab-ranking`, `tab-priorities`, `tab-premium`, `tab-options`); aserciones `ranking-screen`, `priorities-screen`, `compare-screen`.
  - `03-ranking.yaml`: subflow `scroll-to-ranking-share.yaml`; scroll antes de `ranking-share-button` / `ranking-compare-button` (nudges empujan acciones).
  - `04-add-option.yaml`, `06-visit-assistant.yaml`: vuelta a Opciones vía `tab-options`.
  - `05-premium.yaml`: scroll a `premium-backup-card` + `import-mode-merge`.
- **`app/(tabs)/ranking.tsx`**: `testID="ranking-compare-button"` en CTA Comparar dos del footer.
- **`app/search/edit.tsx`**: `search-edit-screen`, `search-edit-back`, `search-setup-hint`.
- **`src/components/SearchForm.tsx`**: `search-form-submit`.
- **`app/(tabs)/premium.tsx`**: `premium-chosen-card`, `premium-go-decision`, `premium-backup-card`, `import-paste-toggle`, `import-backup-input`, `import-backup-button`, `import-confirm-file-button`; copy backup menciona modo Combinar.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|---|---|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | **8/8 OK** — Session 65 (~8m 52s, `emulator-5554`). |

### Recommended next
- Opcional: `npm run test:e2e:express` (`08-express-paste`) o smoke ranking vacío (`ranking-empty-*`).

## Session 65 - Validación E2E post-Session 64 (Cursor, 2026-06-30)

### Commands

```powershell
Set-Location e:\Eligr
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:ELIGR_E2E_RESET = "1"
npm.cmd run test:e2e
```

### Results
- **8/8 OK** en **8m 52s** (`emulator-5554`, AVD `Eligr_Pixel_35` arrancado por script).
- Flujos: `00-onboarding-skip` … `07-quick-add` (sin `08-express`).
- Flujos Maestro Session 64 (tabs por testID, scroll ranking share/compare, premium backup) validados en dispositivo.

### Notes
- Script arrancó `Eligr_Pixel_35` automáticamente; puerto adb puede ser `5554` u otro según emuladores ya abiertos.
- Metro reiniciado en 8081 para E2E (puede afectar otra app RN en el mismo puerto).

## Session 66 - Express E2E 08 validado (Cursor, 2026-06-30)

### Changes
- **`app.config.js`**: `eligrE2eExpress` en `extra` para journey vacío en E2E express.
- **`useEligrStore`**: express empty start robusto (sin demo, array vacío o sample ids); estado inicial vacío en express.
- **`AssistantPanel`**: `testID="assistant-paste-button"` en CTA pegar/añadir (`/rental/new`).
- **`app/rental/new.tsx`**: `key={intake-${activeCount}}` remonta wizard entre 1ª y 2ª opción.
- **`app/(tabs)/index.tsx`**: `testID="options-add-second-button"` en nudge 1→2.
- **Maestro**: `ensure-express-empty.yaml`, scroll intake save/second nudge; `08-express-paste` usa assistant + quick-add FAB para 2ª opción.

### Verification

```powershell
Set-Location e:\Eligr
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:ELIGR_E2E_RESET = "1"
npm.cmd run test:e2e:express
```

| Gate | Result |
|------|--------|
| `typecheck` | **OK** |
| E2E express `08-express-paste` | **1/1 OK** |

## Session 67 - Premium, decisión, comparar y búsqueda (Cursor, 2026-06-30)

### Changes
- **`app/(tabs)/premium.tsx`**: nudge «¿Ya tienes favorita?» (≥2 opciones sin elección); tarjeta colaboración con pasos numerados, copy de dos ventanas de compartir y guard si no hay opciones; toast si se cancela invitación; `testID` en colaboración, backup export/import y nudge ranking.
- **`app/decision.tsx`**: sección compartir en tarjeta accent con copy contextual (con/sin visita); `testID="decision-share-section"`.
- **`app/compare.tsx`**: `testID` en vacío (`compare-screen-empty`), 1 opción (`compare-screen-single`), volver y CTA opciones; nudge «¿Te quedas con alguna?» post-comparación con enlace al ganador.
- **`app/search/edit.tsx`**: tarjeta muted «Búsqueda configurada» con CTA añadir primer anuncio o revisar prioridades según estado.
- **`src/domain/collaboration.ts`**: instrucciones invitación alineadas con ruta Más → Backup → Combinar.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|------|--------|
| `typecheck` | **OK** |
| E2E | No re-ejecutado (8/8 Session 65 + 1/1 express Session 66) |

### Recommended next
- Polish restante en detalle de alquiler o Maestro vacíos (`compare-screen-empty`, `decision-share-section`) si el usuario sigue con UX.

## Session 68 - Detalle de alquiler y Maestro Session 67 (Cursor, 2026-07-01)

### Changes
- **`app/rental/[id]/index.tsx`**: `testID` en pantalla, not-found y volver; tarjeta accent para marcar elección; nudges accent (trayecto estimado, visita) y muted (ranking/comparar sin elección); tarjeta accent «Comparte tu decisión» si es la favorita; `testID` en comparar, añadir segunda, decisión y nudges.
- **Maestro**:
  - `02-rental-detail.yaml`: aserciones por `rental-detail-screen` / `rental-detail-ranking-nudge`; subflow `assert-decision-share` → `decision-share-section`.
  - `03-ranking.yaml`: scroll + `compare-choose-nudge` tras comparar desde ranking.
  - `05-premium.yaml`: scroll a `premium-collaboration-card` + `collaboration-invite-button`.
  - `08-express-paste.yaml`: subflow `open-compare-empty` (`eligr://compare` → `compare-screen-empty`).
  - Nuevos subflows: `assert-decision-share.yaml`, `open-compare-empty.yaml`.

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|------|--------|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (emulador `emulator-5554` disponible; flujos 02/03/05/08 actualizados en YAML) |

### Recommended next
- Formulario de búsqueda restante o flujo visitas si el usuario sigue con polish UX; re-ejecutar suite E2E completa tras cambios Maestro.

## Session 69 - Validación E2E Session 68 + fixes Maestro (Cursor, 2026-07-01)

### Maestro fixes (primer run 2/3 falló)
- **`assert-decision-share.yaml`**: scroll UP a `mark-choice-button`; scroll DOWN a `decision-share-section` en pantalla decisión.
- **`02-rental-detail.yaml`**: orden visita → decisión (scroll UP desde notas).
- **`03-ranking.yaml`**: `compare-share-button` en lugar de `compare-choose-nudge` (02 marca elección antes en la misma sesión).
- **`05-premium.yaml`**: scroll a `premium-toggle-button` y `premium-share-backup-button`.

### Verification

```powershell
Set-Location e:\Eligr
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:ELIGR_E2E_RESET = "1"
$env:ELIGR_E2E_FLOWS = "02-rental-detail,03-ranking,05-premium"
npm.cmd run test:e2e
$env:ELIGR_E2E_EXPRESS = "1"
npm.cmd run test:e2e:express
```

| Gate | Result |
|------|--------|
| E2E `02,03,05` | **3/3 OK** (~3m 54s, `emulator-5556` Eligr_Pixel_35) |
| E2E express `08` | **1/1 OK** (incl. `open-compare-empty`) |

### Recommended next
- Re-ejecutar suite demo completa 8/8 si se quiere regresión total; polish visitas o formulario búsqueda.

## Session 70 - Regresión E2E demo 8/8 (Cursor, 2026-07-01)

### Maestro fixes (primer run 6/8)
- **`01-smoke.yaml`**: scroll a `premium-toggle-button` (tarjetas nuevas empujan el toggle).
- **`06-visit-assistant.yaml`**: scroll a `visit-checklist-assistant-button` tras abrir checklist.

### Verification

```powershell
Set-Location e:\Eligr
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:ELIGR_E2E_RESET = "1"
npm.cmd run test:e2e
```

| Gate | Result |
|------|--------|
| E2E demo `00–07` | **8/8 OK** (~9m 38s, `emulator-5556`) |
| E2E express `08` | **1/1 OK** (Session 69) |

### Recommended next
- Polish visitas o formulario búsqueda; beta Play Store checklist.

## Session 71 - Visitas, búsqueda y checklist beta Play (Cursor, 2026-07-02)

### Changes — UX visitas y búsqueda
- **`app/visit/index.tsx`**: copy post-visita; `testID` en volver, nudges (comparar, añadir rápido) y vacío (`visit-empty-quick`).
- **`app/visit/[id].tsx`**: alerta al guardar más clara; `testID="visit-debrief-back"`.
- **`src/components/VisitDebriefWizard.tsx`**: `visit-debrief-wizard`, checklist issue, inputs impresión/siguiente paso, cancelar.
- **`app/search/edit.tsx`**: título/copy; nudge «Registrar visita» con 1 opción activa (`search-go-visit`); copy contextual por recuento.
- **`src/components/SearchForm.tsx`**: tarjeta validación, secciones y campos con `testID` (`search-form-*`), ayuda trayecto.
- **`src/ui/DateField.tsx`**: prop opcional `testID` en trigger (usado por `search-form-move-in`).

### Changes — Beta Play Store (mínimo)
- **`app.json`**: `description`, `android.versionCode: 1`, `ios.bundleIdentifier`.
- **`app.config.js`**: sincroniza `version` desde `package.json` y `android.versionCode`.
- **`eas.json`** (nuevo): perfiles `development` / `preview` (APK interno) y `production` (AAB + autoIncrement).

### Checklist beta Play Store (pendiente manual)

| Ítem | Estado | Acción |
|------|--------|--------|
| `applicationId` / `package` | `com.anonymous.eligr` | Cambiar a ID definitivo **antes** del primer upload (p. ej. `com.eligr.app`); requiere `expo prebuild --clean` o regenerar `android/`. |
| Firma release | Debug keystore en `build.gradle` | Generar keystore de producción; configurar `credentials.json` (EAS) o `signingConfigs.release` en Gradle. |
| `versionCode` | `1` en `app.json` | Incrementar en cada subida a Play (`eas build` production con `autoIncrement` o manual). |
| Política de privacidad | Falta URL pública | Publicar página (GitHub Pages / web) y enlazarla en Play Console. |
| Ficha Play Console | No creada | Título corto, descripción, capturas (teléfono), icono 512×512, clasificación de contenido. |
| Prueba interna | No configurada | `eas init` + `eas build -p android --profile preview` **o** APK local `npm run build:apk` + testers por enlace/lista. |
| Data safety | Pendiente | Declarar datos locales (AsyncStorage), permisos foto/notificaciones ya en plugins. |
| Cuenta Google Play | Desconocida | Cuota única ~25 USD; verificar acceso del propietario del proyecto. |

**Ruta rápida sin EAS (ya validada):** `npm run build:apk` → `dist/Eligr-0.1.0-release-arm64.apk` → distribución directa a testers (no sustituye Play Internal Testing para feedback en ficha).

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|------|--------|
| `typecheck` | **OK** |
| `npm test` | No ejecutado (sin cambios en domain) |
| E2E | No re-ejecutado (testIDs visit/search compatibles con `06-visit-assistant.yaml`) |

### Recommended next
- Definir `applicationId` definitivo y keystore antes de primer build Play; opcional Maestro flujo `search-edit` con nuevos `testID`.

## Session 72 - Maestro search-edit y prep beta Play (Cursor, 2026-07-02)

### Changes — Maestro E2E
- **`.maestro/flows/09-search-edit.yaml`** (nuevo): abre `eligr://search/edit`, aserta `search-edit-screen` y `search-form-*`; hints condicionales (`search-setup-hint` vs `search-ready-hint` + CTAs `search-go-priorities` / `search-go-visit` / `search-go-add`); guarda con `search-form-submit` y vuelve a Opciones.
- **`.maestro/subflows/open-search-edit.yaml`**: deep link reutilizable a edición de búsqueda.

### Changes — Beta Play Store (sin renombrar package)
- **`scripts/generate-keystore.ps1`** + **`npm run keystore:generate`**: plantilla `keytool` para keystore de firma release (PKCS12, alias `eligr-upload`).
- **`scripts/keystore.properties.example`**: plantilla Gradle local (`android/keystore.properties`, gitignored con carpeta `android/`).
- **`scripts/build-apk.ps1`**: nombre de APK y log usan `package.json` `version` y `app.json` `android.versionCode` (alineado con `0.1.0` / `1`).
- **`docs/privacy-policy.md`**: stub mínimo local-first para URL en Play Console (sustituir responsable y contacto antes de publicar).

### Alineación versiones (verificado)

| Fuente | version | versionCode |
|--------|---------|-------------|
| `package.json` | `0.1.0` | — |
| `app.json` / `app.config.js` | `0.1.0` (sync) | `1` |
| `android/app/build.gradle` (prebuild) | `0.1.0` | `1` |
| `eas.json` production | local + `autoIncrement` en EAS | — |

`applicationId` sigue `com.anonymous.eligr` (sin cambio; pendiente aprobación explícita del usuario).

### Verification

```powershell
Set-Location e:\Eligr; npm.cmd run typecheck
```

| Gate | Result |
|------|--------|
| `typecheck` | **OK** |
| E2E `09-search-edit` | **No ejecutado** (sin emulador/dispositivo conectado en `adb devices`) |

Para validar el flujo nuevo cuando haya emulador:

```powershell
Set-Location e:\Eligr
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:ELIGR_E2E_RESET = "1"
$env:ELIGR_E2E_FLOWS = "09-search-edit"
npm.cmd run test:e2e
```

Suite demo completa (incluye `09`): omitir `ELIGR_E2E_FLOWS` tras confirmar `09` aislado.

### Recommended next
- Aprobar `applicationId` definitivo y ejecutar `npm run keystore:generate` + `eas credentials` o firma Gradle release.
- Publicar `docs/privacy-policy.md` (GitHub Pages u host) y enlazar en Play Console.
- Re-ejecutar E2E `09-search-edit` o suite `00–09` con emulador `Eligr_Pixel_35`.

## Session 73 - APK release para prueba en móvil (Cursor, 2026-07-02)

### Acciones
- Eliminadas APKs antiguas en `dist/` (`debug-arm64`, `release-arm64` y `release` de junio).
- Generada nueva release: **`dist/Eligr-0.1.0-release-arm64.apk`** (41.2 MB, `versionCode` 1).

### Instalación en móvil

```powershell
# USB + depuración activada
adb install -r "E:\Eligr\dist\Eligr-0.1.0-release-arm64.apk"
```

O copia el archivo al teléfono (Drive, cable, etc.) y ábrelo desde el gestor de archivos (permite «orígenes desconocidos» si Android lo pide).

**Nota:** release instalable sin PC/Metro. Es build de prueba con keystore debug hasta definir firma Play.

## Session 74 - Git inicial y push dual Gitea + GitHub (Cursor, 2026-07-03)

### Git setup
- `git init` + commit inicial `13fdf89` (`Initial commit: Eligr MVP local-first (Expo RN + TypeScript).`, 180 archivos).
- `.gitignore` ampliado: excluye `node_modules`, `dist/`, `android/`, `ios/`, `.expo/`, temporales, IDE.
- Rama local: **`master`**.

### Remotos configurados

| Remote | URL |
|--------|-----|
| `gitea` | `http://192.168.1.19:3000/sdelapenya/Eligr.git` |
| `github` | `https://github.com/sdelapenya/Eligr.git` |

Push inicial OK en ambos (Gitea vía Git Credential Manager OAuth; GitHub HTTPS).
Upstream local actual: `github/master`.

### Política acordada con el usuario
- Tras cambios **importantes** de sesión, el agente hace push a **gitea** y **github** cuando el usuario lo pida ("sube los cambios", "handoff + push", "commit y push").
- Commit solo con petición explícita del usuario.
- Regla fijada en `.cursor/rules/eligr.mdc` (sección Git remotes and push).

### Comandos de push habituales

```powershell
Set-Location e:\Eligr
git push gitea master
git push github master
```

### Recommended next
- Probar APK `dist/Eligr-0.1.0-release-arm64.apk` en móvil real y anotar fricciones UX.
- Definir `applicationId` definitivo antes de Play Internal Testing.

## Session 75 - Gitea por SSH y sincronización dual (Codex, 2026-08-18)

### Diagnóstico
- El servidor `192.168.1.19` estaba accesible y Gitea activo, pero Docker publicaba `127.0.0.1:3000->3000`; por eso la URL HTTP histórica fallaba desde la LAN.
- Git SSH sí está publicado en `0.0.0.0:222->22` y reconoce la clave `sergio-windows` como usuario Gitea `sdelapenya`.

### Configuración local actual

```powershell
git remote set-url gitea ssh://git@192.168.1.19:222/sdelapenya/Eligr.git
git config --local core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe -o BatchMode=yes"
```

No se modificó Docker ni se expuso la interfaz web de Gitea. `master` quedó sincronizada en GitHub y Gitea, incluido el commit funcional `992654c`.

## Session 76 - Primer AAB de producción verificado (Codex, 2026-08-19)

### EAS y firma
- Cuenta `sdelapenya`, organización `sdelapenya-apps` y proyecto `@sdelapenya-apps/eligr` (`aa4c4cf5-bf2f-4e05-959a-3b3ada08830b`).
- EAS generó y conserva el keystore de subida Android; queda exportar una copia segura fuera del repositorio.
- El build inicial `0.1.0 (2)` era válido, pero se descartó al detectar permisos opcionales de plantilla que Eligr no usa.
- `app.json` bloquea `SYSTEM_ALERT_WINDOW` y `WRITE_EXTERNAL_STORAGE`; `expo-image-picker` bloquea cámara y micrófono porque la app solo usa la fototeca.

### Candidato Play
- Build EAS: `a26873c0-3294-4db3-9786-d03d385d9a03`.
- AAB: `dist/Eligr-0.1.0-build3-production.aab` (ignorado por Git), `com.sdelapenya.eligr`, `0.1.0 (3)`.
- SHA-256: `1C08E5D15AD3FF9F34B5D1B6B6768CC61EA18F992764FA78A70967A05D614E92`.
- `bundletool 1.18.1 validate` y `jarsigner -verify`: OK.
- Manifiesto final sin `SYSTEM_ALERT_WINDOW`, `WRITE_EXTERNAL_STORAGE`, `CAMERA` ni `RECORD_AUDIO`.

### Recommended next
- Exportar/guardar el keystore EAS de forma segura.
- Crear la ficha de Eligr en Play Console y subir el build 3 a Internal Testing.

