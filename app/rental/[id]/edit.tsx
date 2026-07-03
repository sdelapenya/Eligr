import { Href, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { normalizeFormValues, RentalForm, RentalFormValues } from "@/components/RentalForm";
import { getActiveOptions } from "@/domain/filters";
import { DEFAULT_COMMUTE_MINUTES, usesEstimatedCommute } from "@/domain/rental-costs";
import { getVisitChecklistProgress } from "@/domain/visit-checklist";
import { useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { normalizeRouteId } from "@/utils/route";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function EditRentalScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = normalizeRouteId(rawId);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const option = rentalOptions.find((item) => item.id === id);
  const updateRentalOption = useEligrStore((state) => state.updateRentalOption);
  const activeCount = getActiveOptions(rentalOptions).length;
  const hasRanking = activeCount >= 2;

  const save = (values: RentalFormValues) => {
    if (!id || !option) return;
    updateRentalOption(id, normalizeFormValues(values));
    showToast("Cambios guardados. El ranking se actualiza.");
    router.back();
  };

  if (!option) {
    return (
      <Screen testID="rental-edit-not-found">
        <Card>
          <Text variant="subtitle">Opción no encontrada</Text>
          <Text>Puede que se haya eliminado o que el enlace esté desactualizado.</Text>
          <Button label="Volver" icon="arrow-back-outline" onPress={() => router.back()} testID="rental-edit-back" />
        </Card>
      </Screen>
    );
  }

  const estimatedCommute = usesEstimatedCommute(option);
  const visitProgress = getVisitChecklistProgress(option.visitChecklist);
  const needsVisit = visitProgress.reviewed === 0 && option.status !== "discarded";
  const showVisitNudge = needsVisit && !estimatedCommute;
  const showRankingNudge = hasRanking && !estimatedCommute && !needsVisit;

  return (
    <Screen testID="rental-edit-screen">
      <ScreenHeader
        eyebrow="Editar"
        title={option.title}
        description={
          estimatedCommute
            ? `Ajusta precio, zona y trayecto. Ahora el ranking usa ~${DEFAULT_COMMUTE_MINUTES} min estimados hasta que indiques los reales.`
            : "Ajusta precio, zona, trayecto y notas. El ranking se recalcula al guardar."
        }
      />
      <Button
        label="Volver al detalle"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="rental-edit-back"
      />

      {estimatedCommute ? (
        <Card variant="accent" style={styles.nudge} testID="rental-edit-commute-nudge">
          <Text variant="subtitle">Trayecto estimado en el scoring</Text>
          <Text>
            Pon los minutos reales hasta tu destino (trabajo, universidad…). Sin ellos, Eligr asume ~{DEFAULT_COMMUTE_MINUTES}{" "}
            min y la puntuación es menos fiable.
          </Text>
        </Card>
      ) : null}

      {showVisitNudge ? (
        <Card variant="muted" style={styles.nudge} testID="rental-edit-visit-nudge">
          <Text variant="subtitle">¿Ya la visitaste?</Text>
          <Text>Registra impresión y checklist en el asistente de visita. También puedes anotarlo en notas abajo.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Asistente de visita"
              variant="secondary"
              icon="footsteps-outline"
              onPress={() => router.push(`/visit/${option.id}` as Href)}
              testID="rental-edit-visit-link"
            />
          </View>
        </Card>
      ) : null}

      {showRankingNudge ? (
        <Card variant="muted" style={styles.nudge} testID="rental-edit-ranking-hint">
          <Text variant="subtitle">Ranking activo</Text>
          <Text>Tras guardar, revisa si sigue ganando según tus prioridades.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Ver ranking"
              icon="podium-outline"
              onPress={() => router.push("/ranking")}
              testID="rental-edit-ranking-link"
            />
          </View>
        </Card>
      ) : null}

      <RentalForm initialValues={option} submitLabel="Guardar cambios" onSubmit={save} />
    </Screen>
  );
}

function createStyles(_colors: ColorPalette) {
  return StyleSheet.create({
    nudge: {
      gap: spacing.sm,
    },
    nudgeActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
  });
}
