# HANDOFF — Eligr (Play Store)

**Actualizado:** 2026-08-18
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
- **Estabilización 2026-08-17:** eliminada la apertura insegura tras 4 s durante la hidratación. La app mantiene bloqueado el estado local, informa si tarda o falla y permite reintentar sin sustituir datos. `tsx` queda declarado para que los tests sean reproducibles. Tests de dominio, typecheck y lint pasan.
- **Dependencias 2026-08-17:** `npm audit fix` compatible (sin `--force`) elimina la vulnerabilidad crítica y reduce el informe de 28 a 22 avisos. Los restantes dependen del toolchain Expo/Metro y algunos solo se resuelven saltando de Expo 54 a Expo 57; no se fuerza esa migración en la RC.
- **Tooling Android 2026-08-17:** `android/` se resincronizó con `app.json`; antes conservaba `com.anonymous.eligr` aunque la configuración pública ya usaba `com.sdelapenya.eligr`. `ensure-e2e-apk.ps1` ahora valida el package dentro del APK, verifica la instalación, espera ADB estable, usa `.gradle-local`, fija `NODE_ENV=development`, pasa ABI correctamente, limita Gradle a dos workers y limpia cachés CMake con rutas antiguas. Maestro arranca el AVD sin cargar snapshot.
- **E2E Android 2026-08-17:** recreado `Eligr_Pixel_35`, compilado e instalado el APK correcto y validados todos los flujos existentes: estándar `00–07` + `09` (**9/9 por cobertura final**) y express `08` (**1/1**), total **10/10**. Los falsos fallos del lote conjunto procedían de ejecutar varios YAML en paralelo contra una sola app; el runner ahora los serializa, conserva los aprobados y reintenta solo los fallidos hasta tres veces ante caídas del driver. El lote principal cerró seis estándar y la tanda complementaria restante terminó 3/3; el mecanismo de recuperación quedó ejercitado en esa tanda.
- **Smoke físico 2026-08-18:** release arm64 actual compilada e instalada en Xiaomi `M2101K7BNY` (Android 13). Arranque frío autónomo, onboarding, ranking/compartir, backup JSON, alta rápida, cierre/reinicio con persistencia, detalle, visita completa y selector de fotos verificados por ADB y capturas, sin crash de Eligr. Se creó `Prueba móvil` como cuarta opción y se guardó una visita de prueba en el teléfono. Detectada y corregida una ambigüedad visual del alta rápida: los placeholders ahora llevan `Ej.` para no parecer valores ya introducidos. La APK instalada precede a este ajuste de copy; regenerar solo para la siguiente entrega.

## Qué NO está hecho

- [ ] `eas login` + credentials Android + `eas build --profile production` (AAB) — **requiere login de Sergio**
- [ ] Subida Play Internal Testing
- [x] README raíz actualizado (2026-08-17)
- [ ] CV/portfolio que diga Kotlin para Eligr → corregir cuando se toque empleo-remoto
- [x] Carrera de hidratación resuelta sin desbloquear datos iniciales (2026-08-17)
- [x] `npm run lint` pasa sin errores ni avisos (el primer recorrido en frío puede tardar varios minutos)
- [ ] Quedan 22 avisos transitivos de npm (10 moderate, 12 high) ligados principalmente a Expo/Metro; reevaluar al planificar la migración de SDK, sin `npm audit fix --force`
- [ ] Gitea está tres commits por detrás de GitHub/local; sincronizar cuando se vaya a publicar este bloque
- [x] Smoke Maestro `01-smoke` completado; AVD recreado y APK `com.sdelapenya.eligr` instalado correctamente (2026-08-17).

## Próximo paso

1. Smoke manual en móvil/emulador (alta rápida, 2 opciones, visita, desglose, compartir, borrar foto, backup y reinicio).
2. Commit/push a GitHub y Gitea cuando Sergio lo autorice.
3. EAS AAB cuando Sergio haga login (`docs/PLAY-SIGNING.md`).

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
