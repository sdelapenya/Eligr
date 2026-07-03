import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { getActiveOptions, getScoringPool } from "@/domain/filters";
import { getBackupImportPreview, countOptionsWithPhotos } from "@/domain/export-import";
import type { ImportBackupMode } from "@/domain/collaboration";
import { shareCollaborationPack } from "@/utils/share-collaboration";
import { ImportModeChips } from "@/components/ImportModeChips";
import { buildRankingReportHtml } from "@/domain/report-html";
import { getScoreContext } from "@/domain/score-context";
import { rankRentals } from "@/domain/scoring";
import { ensureVisitReminderPermissions } from "@/domain/visit-reminders";
import { SectionHeader } from "@/components/SectionHeader";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { showAlert, showDestructiveConfirm } from "@/utils/alert";
import { shareHtmlReport } from "@/utils/share-report";
import { shareContent } from "@/utils/share-content";
import { showDevPremiumToggle } from "@/utils/dev";
import { isExpoGo } from "@/utils/runtime";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ThemeMode, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const freeFeatures = [
  "1 búsqueda activa",
  `Hasta ${FREE_TIER_LIMITS.rentalOptions} opciones activas`,
  "Scoring, ranking y comparación",
  "Plantillas de prioridades (estudiante, pareja, teletrabajo)",
  "Checklist y notas de visita",
  "Compartir top 3 y comparación de 2",
  "Informe HTML (top 3)",
  "Exportar / importar backup (archivo o texto)",
  "Decidir en conjunto: compartir e importar con «Combinar»",
  "Opinión rápida pareja/compañero en detalle y comparar",
  "Recordatorios tras visita (2 h y 24 h)",
];

const premiumFeatures = [
  "Opciones activas ilimitadas",
  "Compartir ranking completo",
  "Informe HTML ranking completo",
];

export default function PremiumScreen() {
  const isPremium = useEligrStore((state) => state.search.isPremium);
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const activeCount = getActiveOptions(rentalOptions).length;
  const togglePremiumPreview = useEligrStore((state) => state.togglePremiumPreview);
  const resetToSampleData = useEligrStore((state) => state.resetToSampleData);
  const exportBackupJson = useEligrStore((state) => state.exportBackupJson);
  const importBackupJson = useEligrStore((state) => state.importBackupJson);
  const visitRemindersEnabled = useEligrStore((state) => state.appMeta.visitRemindersEnabled);
  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);
  const chosenOption = rentalOptions.find((item) => item.id === chosenOptionId);
  const setVisitRemindersEnabled = useEligrStore((state) => state.setVisitRemindersEnabled);
  const themeMode = useEligrStore((state) => state.appMeta.themeMode ?? "system");
  const setThemeMode = useEligrStore((state) => state.setThemeMode);
  const { colors, isDark } = useThemeColors();
  const [importText, setImportText] = useState("");
  const [pendingFileImport, setPendingFileImport] = useState<string | null>(null);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
  const [importMode, setImportMode] = useState<ImportBackupMode>("merge");

  const previewSource = pendingFileImport ?? importText;
  const importPreview = useMemo(
    () => (previewSource.trim() ? getBackupImportPreview(previewSource, isPremium, rentalOptions, importMode) : null),
    [previewSource, isPremium, rentalOptions, importMode],
  );

  const resetData = () => {
    showDestructiveConfirm("Restablecer datos", "Volverás a la búsqueda y opciones de ejemplo. Tus cambios locales se perderán.", resetToSampleData);
  };

  const photoCount = useMemo(() => countOptionsWithPhotos(rentalOptions), [rentalOptions]);

  const shareBackup = async () => {
    const json = exportBackupJson();
    await shareContent({ message: json, title: "Backup Eligr" });
  };

  const shareBackupWithPhotoNotice = () => {
    if (photoCount > 0) {
      showAlert(
        "Fotos no incluidas en el backup",
        `Tienes ${photoCount} foto${photoCount === 1 ? "" : "s"} en opciones guardadas. No se exportan: solo texto y datos. En otro móvil tendrás que añadirlas de nuevo en cada piso.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Compartir igual", onPress: () => void shareBackup() },
        ],
      );
      return;
    }
    void shareBackup();
  };

  const shareCollaborationInvite = async () => {
    if (activeCount === 0) {
      showAlert(
        "Sin opciones para compartir",
        "Añade al menos un alquiler antes de invitar. El backup incluye tus pisos y prioridades.",
        [{ text: "Añadir opción", onPress: () => router.push("/rental/new") }, { text: "Cancelar", style: "cancel" }],
      );
      return;
    }
    await shareCollaborationPack(search, exportBackupJson);
    showToast("Si cancelaste el primer mensaje, vuelve a pulsar Invitar.");
  };

  const exportBackupFile = async () => {
    const runExport = async () => {
      try {
        const { exportBackupToFile } = await import("@/domain/backup-files");
        const result = await exportBackupToFile(exportBackupJson());
        if (result === "unavailable") {
          showAlert("No disponible", "Tu dispositivo no permite guardar archivos. Usa compartir texto.");
        }
      } catch {
        showAlert("Requiere rebuild", "Ejecuta npm run android:dev para activar backup por archivo en este dispositivo.");
      }
    };

    if (photoCount > 0) {
      showAlert(
        "Fotos no incluidas en el archivo",
        `El backup no lleva las ${photoCount} foto${photoCount === 1 ? "" : "s"} de tus opciones. Solo datos y texto.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Guardar igual", onPress: () => void runExport() },
        ],
      );
      return;
    }
    await runExport();
  };

  const applyImport = (raw: string) => {
    const result = importBackupJson(raw, importMode);
    if (result === "imported") {
      setImportText("");
      setPendingFileImport(null);
      showAlert(
        "Importado",
        importMode === "merge"
          ? "Se han combinado las opciones del backup con las tuyas."
          : "Tu búsqueda y opciones se han restaurado.",
      );
    } else if (result === "limit_exceeded") {
      showAlert(
        "Límite del plan gratis",
        `El backup tiene más de ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Activa premium o edita el archivo.`,
      );
    } else {
      showAlert("Error", "El backup no es válido. Debe ser un archivo exportado por Eligr.");
    }
  };

  const confirmImport = (raw: string) => {
    showDestructiveConfirm(
      importMode === "merge" ? "Combinar backup" : "Importar backup",
      importMode === "merge"
        ? "Se añadirán o actualizarán opciones del backup. Tu búsqueda y prioridades se mantienen."
        : "Se reemplazarán tu búsqueda y todas las opciones guardadas.",
      () => applyImport(raw),
    );
  };

  const importFromFile = async () => {
    let raw: string | null = null;
    try {
      const { pickBackupFileContent } = await import("@/domain/backup-files");
      raw = await pickBackupFileContent();
    } catch {
      showAlert("Requiere rebuild", "Ejecuta npm run android:dev para activar importar archivo en este dispositivo.");
      return;
    }
    if (!raw) return;
    setPendingFileImport(raw);
    setImportText("");
    setShowAdvancedImport(true);
  };

  const importFromText = () => {
    if (!importText.trim()) return;
    confirmImport(importText);
  };

  const importFromPreview = () => {
    if (!previewSource.trim() || !importPreview?.valid) return;
    confirmImport(previewSource);
  };

  const clearPendingImport = () => {
    setPendingFileImport(null);
  };

  const exportRankingReport = async () => {
    const pool = getScoringPool(rentalOptions);
    const active = getActiveOptions(rentalOptions);
    if (active.length === 0) {
      showAlert("Sin opciones", "Añade alquileres activos para exportar un informe.");
      return;
    }
    const ranking = rankRentals(pool, search.priorities, getScoreContext(search));
    const limit = isPremium ? ranking.length : 3;
    const html = buildRankingReportHtml(search, ranking.slice(0, limit));
    const result = await shareHtmlReport(html, "eligr-ranking");
    if (result === "unavailable") {
      showAlert("No disponible", "Tu dispositivo no permite compartir el informe.");
    } else if (result === "error") {
      showAlert("Error", "No se pudo exportar el informe. Inténtalo de nuevo.");
    }
  };

  const handleRemindersToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensureVisitReminderPermissions();
      if (!granted) {
        showAlert(
          "Permiso necesario",
          "Activa las notificaciones de Eligr en los ajustes del móvil para usar recordatorios de visita.",
        );
        return;
      }
    }
    setVisitRemindersEnabled(enabled);
  };

  return (
    <Screen testID="premium-screen">
      <SectionHeader
        title="Más"
        detail="Plan, datos locales y ajustes de la app"
      />

      {activeCount >= 2 && !chosenOption ? (
        <Card variant="accent" style={styles.planCard} testID="premium-choose-nudge">
          <Text variant="subtitle">¿Ya tienes favorita?</Text>
          <Text>
            Marca «Esta es mi elección» en el detalle de un piso para generar el resumen compartible desde aquí.
          </Text>
          <Button
            label="Ver ranking"
            icon="podium-outline"
            onPress={() => router.push("/ranking")}
            testID="premium-go-ranking"
          />
        </Card>
      ) : null}

      {chosenOption ? (
        <Card variant="accent" style={styles.planCard} testID="premium-chosen-card">
          <Text variant="subtitle">Tu elección</Text>
          <Text>{chosenOption.title}</Text>
          <Text variant="caption">{chosenOption.locationLabel}</Text>
          <Text variant="caption">Comparte el resumen con quien te ayude a decidir.</Text>
          <Button
            label="Resumen de decisión"
            icon="document-text-outline"
            onPress={() => router.push("/decision")}
            testID="premium-go-decision"
          />
        </Card>
      ) : null}

      <Card variant="accent" style={styles.planCard}>
        <View style={styles.row}>
          <Text variant="subtitle">Pase de decisión</Text>
          <Badge label={isPremium ? "Premium" : "Gratis"} tone={isPremium ? "good" : "neutral"} />
        </View>
        <Text>
          {isPremium
            ? `Tienes ${activeCount} opción${activeCount === 1 ? "" : "es"} activa${activeCount === 1 ? "" : "s"} sin límite.`
            : `Plan gratis: ${activeCount}/${FREE_TIER_LIMITS.rentalOptions} opciones activas. Las descartadas no cuentan.`}
        </Text>
        <FeatureList items={isPremium ? premiumFeatures : freeFeatures} tone={isPremium ? "accent" : "default"} />
        {showDevPremiumToggle ? (
          <Button
            label={isPremium ? "Volver a gratis" : "Activar preview premium"}
            icon={isPremium ? "lock-closed-outline" : "sparkles-outline"}
            onPress={togglePremiumPreview}
            testID="premium-toggle-button"
          />
        ) : (
          <Text variant="caption">
            Premium próximamente: opciones ilimitadas y exportación completa del ranking.
          </Text>
        )}
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={styles.toggleCopy}>
            <Text variant="subtitle">Recordatorios de visita</Text>
            <Text>
              Te avisamos a las 2 h y 24 h si marcas una visita y aún no registras impresiones.
              {isExpoGo() ? " En Expo Go no funciona: usa npm run android:dev." : " Requiere la app de desarrollo instalada."}
            </Text>
          </View>
          <Switch
            value={visitRemindersEnabled}
            onValueChange={handleRemindersToggle}
            trackColor={{ false: colors.border, true: colors.accentSoft }}
            thumbColor={visitRemindersEnabled ? colors.accentDeep : colors.surface}
          />
        </View>
      </Card>

      <Card>
        <Text variant="subtitle">Apariencia</Text>
        <Text variant="caption">{isDark ? "Modo oscuro activo" : "Modo claro activo"}</Text>
        <View style={styles.themeRow}>
          {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
            <Button
              key={mode}
              label={mode === "system" ? "Sistema" : mode === "light" ? "Claro" : "Oscuro"}
              variant={themeMode === mode ? "primary" : "secondary"}
              onPress={() => setThemeMode(mode)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="subtitle">Informes</Text>
        <Text>Exporta un informe HTML del ranking. En el navegador puedes imprimirlo como PDF.</Text>
        <Button
          label={isPremium ? "Exportar ranking completo" : "Exportar top 3"}
          variant="secondary"
          icon="document-text-outline"
          onPress={exportRankingReport}
          testID="premium-export-report-button"
        />
      </Card>

      <Card variant="accent" testID="premium-collaboration-card">
        <Text variant="subtitle">Decidir en conjunto</Text>
        <Text>
          Comparte con pareja o compañero de piso. Verás dos ventanas de compartir: primero las instrucciones y después el
          backup.
        </Text>
        <View style={styles.steps}>
          <Text variant="caption">1. Tú envías invitación + backup (dos mensajes).</Text>
          <Text variant="caption">2. La otra persona: Más → Backup → «Combinar» → importar archivo o pegar JSON.</Text>
        </View>
        <Button
          label="Invitar (instrucciones + backup)"
          icon="people-outline"
          onPress={shareCollaborationInvite}
          testID="collaboration-invite-button"
        />
        <Button
          label="Compartir solo backup"
          variant="secondary"
          icon="share-outline"
          onPress={shareBackupWithPhotoNotice}
          testID="premium-share-backup-button"
        />
      </Card>

      <Card testID="premium-backup-card">
        <Text variant="subtitle">Backup</Text>
        <Text>Guarda o restaura tu búsqueda y opciones en este dispositivo u otro. Usa «Combinar» si importas el backup de otra persona.</Text>
        {photoCount > 0 ? (
          <Card variant="muted" style={styles.photoNotice}>
            <Text variant="subtitle">Las fotos no viajan en el backup</Text>
            <Text>
              Tienes {photoCount} foto{photoCount === 1 ? "" : "s"} guardada{photoCount === 1 ? "" : "s"} en este móvil.
              El JSON y el archivo solo incluyen texto y datos: al importar en otro dispositivo tendrás que volver a
              añadir las imágenes en cada opción.
            </Text>
          </Card>
        ) : null}
        <ImportModeChips value={importMode} onChange={setImportMode} />
        <Button
          label="Guardar archivo"
          variant="secondary"
          icon="document-outline"
          onPress={exportBackupFile}
          testID="premium-export-file-button"
        />
        <Button
          label="Compartir texto"
          variant="secondary"
          icon="share-outline"
          onPress={shareBackupWithPhotoNotice}
          testID="premium-share-text-button"
        />
        <Button
          label="Importar archivo"
          variant="secondary"
          icon="folder-open-outline"
          onPress={importFromFile}
          testID="premium-import-file-button"
        />
        <Button
          label={showAdvancedImport ? "Ocultar pegado manual" : "Pegar backup JSON"}
          variant="ghost"
          onPress={() => setShowAdvancedImport((current) => !current)}
          testID="import-paste-toggle"
        />
        {showAdvancedImport ? (
          <>
            <Input
              label="Backup JSON"
              value={importText}
              onChangeText={(value) => {
                setImportText(value);
                if (pendingFileImport) setPendingFileImport(null);
              }}
              placeholder='{"version":1,...}'
              multiline
              style={styles.importInput}
              testID="import-backup-input"
            />
            {importPreview ? <ImportPreviewCard preview={importPreview} fromFile={Boolean(pendingFileImport)} /> : null}
            {pendingFileImport ? (
              <Button label="Cancelar archivo" variant="ghost" onPress={clearPendingImport} />
            ) : (
              <Button
                label="Importar backup"
                variant="secondary"
                onPress={importFromText}
                disabled={!importText.trim() || !importPreview?.valid || importPreview.limitExceeded}
                testID="import-backup-button"
              />
            )}
            {pendingFileImport && importPreview?.valid ? (
              <Button
                label="Confirmar importación"
                variant="danger"
                icon="cloud-upload-outline"
                onPress={importFromPreview}
                disabled={importPreview.limitExceeded}
                testID="import-confirm-file-button"
              />
            ) : null}
          </>
        ) : null}
      </Card>

      <Card variant="muted">
        <Text variant="subtitle">Datos locales</Text>
        <Text>Todo se guarda en el dispositivo. Puedes restablecer la demo si quieres ver el ejemplo otra vez.</Text>
        <Button label="Restablecer demo" variant="danger" icon="refresh-outline" onPress={resetData} />
      </Card>
    </Screen>
  );
}

function ImportPreviewCard({
  preview,
  fromFile,
}: {
  preview: ReturnType<typeof getBackupImportPreview>;
  fromFile: boolean;
}) {
  const { colors } = useThemeColors();

  if (!preview.valid) {
    return (
      <Card variant="muted" style={styles.previewCard}>
        <Text variant="subtitle">Backup no válido</Text>
        <Text variant="caption">El texto no es un backup exportado por Eligr.</Text>
      </Card>
    );
  }

  return (
    <Card variant="accent" style={styles.previewCard} testID="import-preview-card">
      <Text variant="subtitle">Vista previa del backup</Text>
      <Text>{fromFile ? "Archivo listo para importar." : "Revisa antes de confirmar."}</Text>
      <View style={styles.previewRow}>
        <Text variant="caption">Búsqueda</Text>
        <Text variant="subtitle">{preview.searchTitle}</Text>
      </View>
      <View style={styles.previewRow}>
        <Text variant="caption">Opciones</Text>
        <Text variant="subtitle">{preview.totalOptions} total · {preview.activeOptions} activas</Text>
      </View>
      {preview.limitExceeded ? (
        <Text variant="caption" style={{ color: colors.danger }}>
          Supera el límite gratis ({FREE_TIER_LIMITS.rentalOptions} activas). Activa premium o edita el backup.
        </Text>
      ) : null}
      {preview.photoCount > 0 ? (
        <Text variant="caption" style={{ color: colors.warning }}>
          Incluye {preview.photoCount} foto{preview.photoCount === 1 ? "" : "s"}. Las imágenes no se transfieren entre dispositivos; tendrás que volver a añadirlas.
        </Text>
      ) : null}
      {preview.hasChosenOption ? (
        <Text variant="caption">Incluye elección marcada en el backup.</Text>
      ) : null}
      {preview.mode === "merge" && preview.valid ? (
        <>
          <View style={styles.previewRow}>
            <Text variant="caption">Al combinar</Text>
            <Text variant="subtitle">
              +{preview.newOptions} nueva{preview.newOptions === 1 ? "" : "s"}
              {preview.updatedOptions > 0 ? ` · ${preview.updatedOptions} actualizada${preview.updatedOptions === 1 ? "" : "s"}` : ""}
            </Text>
          </View>
          <Text variant="caption">Quedarán {preview.resultingActive} opciones activas en total.</Text>
        </>
      ) : null}
    </Card>
  );
}

function FeatureList({ items, tone = "default" }: { items: string[]; tone?: "default" | "accent" }) {
  const { colors } = useThemeColors();
  return (
    <View style={styles.features}>
      {items.map((feature) => (
        <View key={feature} style={styles.featureRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: tone === "accent" ? colors.accentDeep : colors.accent },
            ]}
          />
          <Text>{feature}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  planCard: {
    gap: spacing.md,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  features: {
    gap: spacing.sm,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  importInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  previewCard: {
    gap: spacing.sm,
  },
  previewRow: {
    gap: spacing.xs,
  },
  photoNotice: {
    gap: spacing.sm,
  },
  steps: {
    gap: spacing.xs,
  },
});
