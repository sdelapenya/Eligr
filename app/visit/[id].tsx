import { Href, router, useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { showAlert } from "@/utils/alert";
import { VisitDebriefWizard } from "@/components/VisitDebriefWizard";
import { rentalTypeLabels } from "@/domain/labels";
import { useEligrStore } from "@/store/useEligrStore";
import { normalizeRouteId } from "@/utils/route";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";

export default function VisitDebriefScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = normalizeRouteId(rawId);
  const option = useEligrStore((state) => state.rentalOptions.find((item) => item.id === id));
  const completeVisitDebrief = useEligrStore((state) => state.completeVisitDebrief);
  const activeCount = useEligrStore((state) => state.rentalOptions.filter((o) => o.status !== "discarded").length);
  const hasPriorVisit = Boolean(option?.visitImpression?.trim() || option?.visitNextAction?.trim());

  if (!option) {
    return (
      <Screen testID="visit-debrief-missing">
        <ScreenHeader
          eyebrow="Post-visita"
          title="Opción no encontrada"
          description="Puede que se haya eliminado o que el enlace no sea válido."
        />
        <EmptyState
          icon="alert-circle-outline"
          title="No encontramos este piso"
          body="Vuelve al listado y elige otra opción para registrar la visita."
          testID="visit-debrief-not-found"
          actions={[
            { label: "Elegir piso", onPress: () => router.replace("/visit" as Href), icon: "list-outline" },
            { label: "Ir a opciones", onPress: () => router.replace("/(tabs)"), variant: "secondary", icon: "home-outline" },
          ]}
        />
      </Screen>
    );
  }

  const onSaved = () => {
    const buttons: { text: string; onPress?: () => void; style?: "cancel" }[] = [
      { text: "Ver ranking", onPress: () => router.replace("/ranking") },
    ];
    if (activeCount >= 2) {
      buttons.push({
        text: "Comparar",
        onPress: () => router.replace({ pathname: "/compare", params: { a: option.id } }),
      });
    }
    buttons.push({ text: "Listo", style: "cancel", onPress: () => router.replace("/(tabs)") });
    showAlert(
      "Visita registrada",
      "Notas guardadas. Tu ranking y comparación ya reflejan lo que viste.",
      buttons,
    );
  };

  return (
    <Screen testID="visit-debrief-screen">
      <ScreenHeader
        eyebrow="Asistente de visita"
        title={option.title}
        description={`${rentalTypeLabels[option.rentalType]} · ${option.locationLabel}`}
      />
      <Button
        label="Volver"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="visit-debrief-back"
      />
      <Button
        label="Ver ficha del piso"
        variant="secondary"
        icon="open-outline"
        onPress={() => router.push(`/rental/${option.id}`)}
        testID="visit-debrief-open-detail"
      />

      {hasPriorVisit ? (
        <Card variant="muted" style={{ gap: spacing.sm }} testID="visit-debrief-prior-notes">
          <Text variant="subtitle">Notas anteriores</Text>
          {option.visitImpression?.trim() ? <Text>Impresión: {option.visitImpression.trim()}</Text> : null}
          {option.visitNextAction?.trim() ? <Text>Siguiente paso: {option.visitNextAction.trim()}</Text> : null}
          <Text variant="caption">Puedes actualizarlas con el asistente de abajo.</Text>
        </Card>
      ) : null}

      <VisitDebriefWizard
        option={option}
        onCancel={() => router.back()}
        onComplete={(payload) => {
          completeVisitDebrief(option.id, payload);
          onSaved();
        }}
      />
    </Screen>
  );
}
