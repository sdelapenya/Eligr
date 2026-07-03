import { router } from "expo-router";
import { useRef } from "react";
import { Image, StyleSheet, View } from "react-native";

import { ChosenOptionCard } from "@/components/ChosenOptionCard";
import { DecisionShareCard } from "@/components/DecisionShareCard";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getActiveOptions, getScoringPool } from "@/domain/filters";
import { getScoreContext } from "@/domain/score-context";
import { buildChosenOptionSummary } from "@/domain/summary";
import { buildDecisionReportHtml } from "@/domain/report-html";
import { scoreRental } from "@/domain/scoring";
import { useEligrStore } from "@/store/useEligrStore";
import { showAlert } from "@/utils/alert";
import { shareContent } from "@/utils/share-content";
import { shareHtmlReport } from "@/utils/share-report";
import { shareViewCapture } from "@/utils/share-view-image";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";

export default function DecisionScreen() {
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);
  const option = rentalOptions.find((item) => item.id === chosenOptionId);
  const activeCount = getActiveOptions(rentalOptions).length;
  const shareCardRef = useRef<View>(null);

  if (!option) {
    return (
      <Screen testID="decision-screen-empty">
        <ScreenHeader
          eyebrow="Decisión"
          title="Aún no has cerrado tu elección."
          description="Marca tu favorita en el detalle de un alquiler cuando tengas claro cuál te quedas."
        />
        <EmptyState
          icon="heart-outline"
          title="Sin elección marcada"
          body="Abre un piso, revisa pros y contras, y pulsa «Esta es mi elección» para generar un resumen compartible."
          steps={["Compara en ranking", "Visita si puedes", "Marca tu elección en el detalle"]}
          testID="decision-empty"
          actions={[
            {
              label: "Ver ranking",
              onPress: () => router.push("/ranking"),
              icon: "podium-outline",
              testID: "decision-empty-ranking",
            },
            {
              label: "Ver opciones",
              onPress: () => router.push("/"),
              variant: "secondary",
              icon: "home-outline",
              testID: "decision-empty-options",
            },
            ...(activeCount < 2
              ? [
                  {
                    label: "Añadir opción",
                    onPress: () => router.push("/rental/new"),
                    variant: "ghost" as const,
                    icon: "add-outline" as const,
                    testID: "decision-empty-add",
                  },
                ]
              : []),
          ]}
        />
      </Screen>
    );
  }

  const pool = getScoringPool(rentalOptions);
  const score = scoreRental(option, pool, search.priorities, getScoreContext(search));
  const hasVisitNotes = Boolean(option.visitImpression?.trim() || option.visitNextAction?.trim());

  const shareDecision = async () => {
    await shareContent({
      message: buildChosenOptionSummary(search, option, score),
      title: "Mi elección Eligr",
    });
  };

  const exportDecisionReport = async () => {
    const html = buildDecisionReportHtml(search, option, score);
    const result = await shareHtmlReport(html, "eligr-decision");
    if (result === "unavailable") {
      showAlert("No disponible", "Tu dispositivo no permite compartir el informe.");
    } else if (result === "error") {
      showAlert("Error", "No se pudo exportar el informe. Inténtalo de nuevo.");
    }
  };

  const shareDecisionImage = async () => {
    const result = await shareViewCapture(shareCardRef, "Mi elección Eligr");
    if (result === "unavailable") {
      showAlert("No disponible", "Compartir imagen no está disponible aquí. Usa captura de pantalla o comparte texto.");
    } else if (result === "error") {
      showAlert("Error", "No se pudo generar la imagen. Inténtalo de nuevo.");
    }
  };

  return (
    <Screen testID="decision-screen">
      <ScreenHeader
        eyebrow="Decisión"
        title="Resumen de tu elección"
        description="Comparte este resumen con quien te ayude a decidir o para recordar por qué elegiste esta opción."
      />
      <Button
        label="Volver"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="decision-back-button"
      />

      {!option.visitImpression?.trim() ? (
        <Card variant="accent" testID="decision-visit-nudge">
          <Text variant="subtitle">¿Ya visitaste este piso?</Text>
          <Text variant="caption">
            Añade impresiones y el siguiente paso en la ficha de visita. El resumen compartible quedará más completo.
          </Text>
          <Button
            label="Registrar visita"
            variant="secondary"
            icon="walk-outline"
            onPress={() => router.push(`/visit/${option.id}`)}
            testID="decision-go-visit"
          />
        </Card>
      ) : null}

      {option.photoUri ? (
        <Image source={{ uri: option.photoUri }} style={styles.hero} resizeMode="cover" accessibilityLabel={`Foto de ${option.title}`} />
      ) : null}

      <ChosenOptionCard option={option} showSummaryLink={false} />

      <DecisionShareCard ref={shareCardRef} search={search} option={option} score={score} />

      <Card>
        <Text variant="subtitle">Por qué esta opción</Text>
        <Text>{score.explanation}</Text>
      </Card>

      {option.visitImpression?.trim() ? (
        <Card variant="muted">
          <Text variant="subtitle">Impresión de la visita</Text>
          <Text>{option.visitImpression.trim()}</Text>
        </Card>
      ) : null}

      {option.visitNextAction?.trim() ? (
        <Card variant="muted">
          <Text variant="subtitle">Siguiente paso</Text>
          <Text>{option.visitNextAction.trim()}</Text>
        </Card>
      ) : null}

      {score.pros.length > 0 ? (
        <Card variant="muted">
          <Text variant="subtitle">Pros</Text>
          {score.pros.map((item) => (
            <Text key={item}>• {item}</Text>
          ))}
        </Card>
      ) : null}

      {score.cons.length > 0 ? (
        <Card variant="muted">
          <Text variant="subtitle">Contras</Text>
          {score.cons.map((item) => (
            <Text key={item}>• {item}</Text>
          ))}
        </Card>
      ) : null}

      {score.warnings.length > 0 ? (
        <Card variant="muted">
          <Text variant="subtitle">Avisos</Text>
          {score.warnings.map((item) => (
            <Text key={item}>• {item}</Text>
          ))}
        </Card>
      ) : null}

      <View style={styles.shareActions}>
        <Card variant="accent" style={styles.shareCard} testID="decision-share-section">
          <Text variant="subtitle">Compartir resumen</Text>
          <Text variant="caption">
            {hasVisitNotes
              ? "Imagen para WhatsApp, texto para un mensaje rápido o informe HTML para imprimir como PDF."
              : "Imagen o texto listos ahora. Añade impresiones de visita arriba para un resumen más completo."}
          </Text>
          <Button label="Compartir imagen" icon="image-outline" onPress={shareDecisionImage} testID="decision-share-image-button" />
          <Button label="Compartir resumen" icon="share-outline" onPress={shareDecision} testID="decision-share-text-button" />
          <Button
            label="Exportar informe HTML"
            variant="secondary"
            icon="document-text-outline"
            onPress={exportDecisionReport}
            testID="decision-export-html-button"
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    height: 200,
    width: "100%",
  },
  shareActions: {
    gap: spacing.sm,
  },
  shareCard: {
    gap: spacing.sm,
  },
});
