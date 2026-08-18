# Eligr — Guion demo (presentación académica)

Guion manual de ~8–12 minutos. Requiere la app en emulador o dispositivo con build de desarrollo (`npm run android:dev`).

## Antes de empezar

1. Abre Metro: `npm run start:clear` (terminal 1).
2. Conecta emulador: `npm run metro:connect` o `npm run android:dev`.
3. Si quieres estado limpio: **Más** → **Restaurar demo** (o borra datos de la app).
4. Cierra el modal de bienvenida con **Saltar** o recorre los 3 pasos.

## 1. Mi búsqueda (1–2 min)

**Objetivo:** mostrar que no es un marketplace; el usuario define su contexto.

1. En la pestaña **Opciones**, localiza el banner «Estás viendo datos de ejemplo».
2. Pulsa **Mi búsqueda** → confirma → la lista queda vacía con búsqueda «Mi búsqueda».
3. Pulsa **Editar** en la tarjeta «Búsqueda activa».
4. Rellena: título (ej. «Piso en Valencia»), ciudad, presupuesto máximo, destino del trayecto.
5. Guarda y vuelve a Opciones.

**Qué decir:** «Eligr no busca anuncios por ti; tú importas lo que ya encontraste y la app te ayuda a decidir.»

## 2. Tres opciones (2–3 min)

**Objetivo:** flujo manual + atajo rápido.

1. Pulsa **Añadir rápido** → título, precio, zona → guardar (repetir 3 veces con datos distintos).
   - Alternativa: **Añadir** → asistente (pegar texto / captura / preguntas).
2. Comprueba que aparecen 3 tarjetas con puntuación orientativa o numérica.
3. Toca una tarjeta → detalle con desglose de puntuación.

**Qué decir:** «Tres opciones bastan para que el ranking deje de ser orientativo y pase a comparación real.»

## 3. Prioridades (1–2 min)

1. Pestaña **Prioridades**.
2. Mueve 2–3 sliders (precio, trayecto, contrato…).
3. Señala la ayuda bajo cada slider y la **vista previa** del top 3.
4. Pulsa **Guardar** (si hay cambios sin guardar, el tab muestra alerta).

**Qué decir:** «El scoring es determinista: pesos × criterios normalizados, sin caja negra.»

## 4. Ranking (2 min)

1. Pestaña **Ranking**.
2. Lee la tarjeta **Recomendación** y los quick picks (más barato, menos alertas…).
3. Señala en cada tarjeta las **2 criterios que más aportan** al score.
4. Pulsa **Comparar dos** o **Compartir top** (share nativo).

**Qué decir:** «No solo ordena: explica pros, contras, alertas y tradeoffs.»

## 5. Visita (2–3 min)

1. Desde detalle de una opción → **Registrar visita con asistente** (o Opciones → asistente → visita).
2. Checklist: marca al menos un ítem (ruido, luz…).
3. Impresión: «Me gustó, encaja con lo que busco».
4. Próximo paso: «Pedir copia del contrato» → **Guardar**.
5. Vuelve al detalle: estado y notas actualizados; ranking puede cambiar.

**Qué decir:** «Tras la visita, el debrief alimenta el scoring y el estado del pipeline.»

## 6. Favorito / descartar (1 min)

1. En detalle, chips de estado → **Favorito**.
2. Opciones → filtro **Favoritas** → aparece la opción.
3. Otra opción → **Descartado** → filtro **Descartadas**; ranking activo ya no la incluye.

**Qué decir:** «Las descartadas liberan hueco en el plan free (5 activas).»

## Cierre (30 s)

- Resume: búsqueda → opciones → prioridades → ranking explicado → visita → decisión.
- Menciona freemium preparado (pestaña **Más**) sin pagos reales en el MVP.

## E2E automatizado (opcional)

```powershell
npm run metro:connect
npm run test:e2e
# Solo algunos flujos:
$env:ELIGR_E2E_FLOWS="07-quick-add,08-onboarding-skip"; npm run test:e2e
# Estado limpio antes de onboarding:
$env:ELIGR_E2E_RESET="1"; npm run test:e2e
```

Estado 2026-08-17: todos los flujos existentes han pasado (`00–07`, `09` y el express `08`: cobertura 10/10). El AVD fue recreado y el APK usa `com.sdelapenya.eligr`. El runner ejecuta ahora los YAML secuencialmente para que no compartan y modifiquen el mismo estado en paralelo, conserva los aprobados y reintenta solo los fallidos hasta tres veces cuando cae el driver. Si E2E falla por Maestro, este guion manual sigue siendo el respaldo para la demostración.

## Checklist rápido pre-clase

- [ ] Metro en 8081, adb reverse hecho
- [ ] App abre en pestaña Opciones sin crash
- [ ] Onboarding cerrado o recorrido
- [ ] 3 opciones activas (demo o propias)
- [ ] Prioridades guardadas al menos una vez
- [ ] Una visita registrada (opcional pero impactante)
