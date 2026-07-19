# HANDOFF — Eligr (Play Store)

**Actualizado:** 2026-07-19  
**Código:** `/home/sergio/lab/apps/Eligr`  
**GitHub:** https://github.com/sdelapenya/Eligr  
**También:** copia en disco duro portátil del PC (no en este servidor) — sync vía GitHub push/pull  
**Auditoría:** `/home/sergio/lab/marca-personal/apps-android/AUDITORIA-PLAY-2026-07-18.md`  
**Firma:** `docs/PLAY-SIGNING.md`

## Qué funciona

- Flujo completo local-first: onboarding → opciones → prioridades → ranking → visitas → backup/share HTML
- Scoring determinista, límite free 5 opciones, paste listing, OCR (build nativo), tema claro/oscuro
- Stack: **Expo 54 + React Native + TypeScript + Zustand** (no Kotlin)
- **Package:** `com.sdelapenya.eligr` (Android + iOS)
- **Iconos Play:** `assets/icon-1024.png`, `adaptive-icon.png`, `splash-icon.png` (1024×1024)
- **Privacy HTTPS:** https://sergio.sdelapenya.dev/eligr/privacy/ (+ enlace en Más)
- Maestro/scripts actualizados al nuevo package
- **Producto 2026-07-18:** alta rápida/express ya no inventa contrato/fianza/ratings; avisos de datos faltantes; scoring relativo explicado en Ranking; etiquetas Claras («Contrato / papeles», «Visita planificada»); CTA 2ª opción reforzada; free-limit sin “preview premium” mentiroso
- **Producto (2ª pasada):** impresión de visita no auto-marca Favorito/Descartado (solo chips explícitos de «Próximo paso»); desglose detalle muestra nota 0–100 + puntos aportados; Ranking comparte vía un menú «Compartir» (menos botones)
- **Bugs de código 2026-07-19:** `roomQuality` acotado a 0-100; pesos de prioridades y `search` sanitizados al importar backup (antes un JSON manipulado podía distorsionar el ranking); fotos huérfanas se borran del disco al quitar/reemplazar/borrar opción; notas de visita/pareja con debounce (ya no escriben en AsyncStorage por tecla); `syncAllVisitReminders` (existía, no se llamaba) ahora corre tras hidratar/importar. Detalle: `lab/marca-personal/docs/journal/2026-07-19-cursor-eligr-bugs-codigo.md`

## Qué NO está hecho

- [ ] `eas login` + credentials Android + `eas build --profile production` (AAB) — **requiere login de Sergio**
- [ ] Subida Play Internal Testing
- [ ] README raíz desactualizado
- [ ] CV/portfolio que diga Kotlin para Eligr → corregir cuando se toque empleo-remoto
- [ ] Carrera de hidratación (fallback 4s en `useStoreHydration.ts`) sin resolver — pendiente de decidir comportamiento junto a Sergio
- [ ] Push a GitHub de los commits `84efb18` y `477033f` — este servidor no tiene credenciales git, lo hace Sergio desde otro sitio

## Próximo paso

1. Sergio: `git push` desde un entorno con credenciales (servidor no tiene ninguna configurada)
2. Smoke en dispositivo (alta rápida, 2 opciones, visita, desglose, Compartir, borrar foto)
3. EAS AAB cuando Sergio haga login (`docs/PLAY-SIGNING.md`)
4. FoodRanker: producto (ciudad / cold start) cuando toque

## Decisiones

- Eligr sale **antes** que FoodRanker.
- Billing/RevenueCat fuera de v1.
- Apex `sdelapenya.dev` da 522; privacy en **sergio.sdelapenya.dev**.
- Confianza de datos > features nuevas.

## Journal

- `lab/marca-personal/docs/journal/2026-07-18-cursor-auditoria-apps-play.md`
- `lab/marca-personal/docs/journal/2026-07-18-cursor-eligr-p0-play.md`
- `lab/marca-personal/docs/journal/2026-07-18-cursor-eligr-confianza-producto.md`
- `lab/marca-personal/docs/journal/2026-07-19-cursor-eligr-bugs-codigo.md`
