import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { getActiveOptions } from "@/domain/filters";

import { RentalIntakeWizard } from "@/components/RentalIntakeWizard";
import { FreeLimitCard } from "@/components/FreeLimitCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { showAlert } from "@/utils/alert";
import { normalizeFormValues, RentalFormValues } from "@/components/RentalForm";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function NewRentalScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const addRentalOption = useEligrStore((state) => state.addRentalOption);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const maxBudget = useEligrStore((state) => state.search.maxBudget);
  const activeCount = getActiveOptions(rentalOptions).length;
  const isPremium = useEligrStore((state) => state.search.isPremium);
  const blocked = !isPremium && activeCount >= FREE_TIER_LIMITS.rentalOptions;
  const firstSession = activeCount === 0;
  const needsSecond = activeCount === 1;
  const hasRanking = activeCount >= 2;
  const expressPaste = activeCount < 2;

  const save = (values: RentalFormValues) => {
    const countBefore = activeCount;
    const added = addRentalOption(normalizeFormValues(values));
    if (!added) {
      showAlert("Límite alcanzado", `El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna o activa premium.`);
      return;
    }
    if (countBefore === 0) {
      showToast("Primera opción guardada. Añade otra para ver el ranking.");
      router.back();
      return;
    }
    if (countBefore === 1) {
      showToast("¡Dos opciones! Mira quién va ganando.");
      router.replace("/ranking");
      return;
    }
    showToast("Opción guardada");
    router.back();
  };

  return (
    <Screen testID="rental-new-screen">
      <View style={styles.topBar}>
        <ScreenHeader
          eyebrow="Nueva opción"
          title={
            firstSession
              ? "Pega tu primer anuncio"
              : needsSecond
                ? "Añade la segunda opción"
                : hasRanking
                  ? "Otra opción más"
                  : "Asistente para guardar un alquiler"
          }
          description={
            firstSession
              ? "Copia el texto de Idealista, Fotocasa, Badi o WhatsApp. Detectamos precio y zona; puedes guardar en un minuto."
              : needsSecond
                ? "Pega otro anuncio para activar el ranking. Mismo flujo rápido: analizar y guardar."
                : hasRanking
                  ? "Ya tienes ranking activo. Pega un anuncio o responde preguntas para ampliar la comparación."
                  : "Pega el anuncio o responde unas preguntas. El ranking usará estos datos de forma transparente."
          }
        />
        {!isPremium ? (
          <View style={styles.planPill}>
            <Text variant="caption">
              {activeCount}/{FREE_TIER_LIMITS.rentalOptions}
            </Text>
          </View>
        ) : null}
      </View>

      <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="rental-new-back" />

      {firstSession && !blocked ? (
        <Card variant="accent" style={styles.nudge} testID="rental-new-first-nudge">
          <Text variant="subtitle">Empieza en 3 pasos</Text>
          <Text>1. Pega el anuncio · 2. Revisa datos detectados · 3. Guarda y añade otra para ver el ranking.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Solo título y precio"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.replace("/rental/quick")}
              testID="rental-new-quick-link"
            />
          </View>
        </Card>
      ) : null}

      {needsSecond && !blocked ? (
        <Card variant="accent" style={styles.nudge} testID="rental-new-second-nudge">
          <Text variant="subtitle">1 de 2 para comparar</Text>
          <Text>Pega otro anuncio o usa añadir rápido. Al guardar la segunda iremos al ranking.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Añadir rápido"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.replace("/rental/quick")}
              testID="rental-new-quick-link"
            />
          </View>
        </Card>
      ) : null}

      {hasRanking && !blocked && !expressPaste ? (
        <Card variant="muted" style={styles.nudge} testID="rental-new-ranking-hint">
          <Text variant="subtitle">Ranking disponible</Text>
          <Text>Puedes seguir añadiendo opciones o revisar quién va ganando según tus prioridades.</Text>
          <View style={styles.nudgeActions}>
            <Button label="Ver ranking" icon="podium-outline" onPress={() => router.push("/ranking")} testID="rental-new-ranking-link" />
            <Button label="Añadir rápido" variant="secondary" icon="flash-outline" onPress={() => router.replace("/rental/quick")} />
          </View>
        </Card>
      ) : null}

      {blocked ? (
        <FreeLimitCard activeCount={activeCount} />
      ) : (
        <RentalIntakeWizard
          key={`intake-${activeCount}`}
          defaultMonthlyPrice={maxBudget}
          expressPaste={expressPaste}
          onSave={save}
        />
      )}
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    topBar: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    planPill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
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
