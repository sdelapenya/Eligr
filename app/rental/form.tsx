import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { FreeLimitCard } from "@/components/FreeLimitCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getActiveOptions } from "@/domain/filters";
import { showAlert } from "@/utils/alert";
import { normalizeFormValues, RentalForm, RentalFormValues } from "@/components/RentalForm";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function FullRentalFormScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const addRentalOption = useEligrStore((state) => state.addRentalOption);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const activeCount = getActiveOptions(rentalOptions).length;
  const isPremium = useEligrStore((state) => state.search.isPremium);
  const blocked = !isPremium && activeCount >= FREE_TIER_LIMITS.rentalOptions;
  const needsSecond = activeCount === 1;

  const save = (values: RentalFormValues) => {
    const countBefore = activeCount;
    const added = addRentalOption(normalizeFormValues(values));
    if (!added) {
      showAlert(
        "Límite alcanzado",
        `El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna o activa premium.`,
      );
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
    <Screen testID="rental-full-form-screen">
      <View style={styles.topBar}>
        <ScreenHeader
          eyebrow="Formulario completo"
          title="Todos los campos en una pantalla"
          description="Úsalo si prefieres editar todo de golpe. Para pegar anuncios, el asistente guiado está en «Nueva opción»."
        />
        {!isPremium ? (
          <View style={styles.planPill}>
            <Text variant="caption">
              {activeCount}/{FREE_TIER_LIMITS.rentalOptions}
            </Text>
          </View>
        ) : null}
      </View>

      <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="rental-full-form-back" />

      {!blocked ? (
        <Card variant="accent" style={styles.nudge} testID="rental-full-form-wizard-nudge">
          <Text variant="subtitle">¿Tienes el texto del anuncio?</Text>
          <Text>En «Nueva opción» pegas Idealista, Fotocasa o WhatsApp y detectamos precio y zona automáticamente.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Ir al asistente"
              variant="secondary"
              icon="clipboard-outline"
              onPress={() => router.replace("/rental/new")}
              testID="rental-full-form-wizard-link"
            />
            <Button
              label="Añadir rápido"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.replace("/rental/quick")}
              testID="rental-full-form-quick-link"
            />
          </View>
        </Card>
      ) : null}

      {needsSecond && !blocked ? (
        <Card variant="muted" style={styles.nudge} testID="rental-full-form-second-hint">
          <Text variant="subtitle">1 de 2 para comparar</Text>
          <Text>Al guardar la segunda opción iremos al ranking para ver quién va ganando.</Text>
        </Card>
      ) : null}

      {blocked ? (
        <FreeLimitCard activeCount={activeCount} />
      ) : (
        <RentalForm submitLabel="Guardar opción" onSubmit={save} />
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
