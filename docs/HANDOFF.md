# HANDOFF — Eligr (Play Store)

**Actualizado:** 2026-07-18  
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

## Qué NO está hecho

- [ ] `eas login` + credentials Android + `eas build --profile production` (AAB) — **requiere login de Sergio**
- [ ] Subida Play Internal Testing
- [ ] README raíz desactualizado
- [ ] CV/portfolio que diga Kotlin para Eligr → corregir cuando se toque empleo-remoto

## Próximo paso

1. Smoke en dispositivo (alta rápida, 2 opciones, visita, desglose, Compartir)
2. EAS AAB cuando Sergio haga login (`docs/PLAY-SIGNING.md`)
3. FoodRanker: producto (ciudad / cold start) cuando toque

## Decisiones

- Eligr sale **antes** que FoodRanker.
- Billing/RevenueCat fuera de v1.
- Apex `sdelapenya.dev` da 522; privacy en **sergio.sdelapenya.dev**.
- Confianza de datos > features nuevas.

## Journal

- `lab/marca-personal/docs/journal/2026-07-18-cursor-auditoria-apps-play.md`
- `lab/marca-personal/docs/journal/2026-07-18-cursor-eligr-p0-play.md`
- `lab/marca-personal/docs/journal/2026-07-18-cursor-eligr-confianza-producto.md`
