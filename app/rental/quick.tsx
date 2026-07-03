import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { FreeLimitCard } from "@/components/FreeLimitCard";
import { RentalPhotoPicker } from "@/components/RentalPhotoPicker";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getActiveOptions } from "@/domain/filters";
import { buildQuickAddRental } from "@/domain/quick-add";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { showAlert } from "@/utils/alert";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function QuickAddRentalScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const addRentalOption = useEligrStore((state) => state.addRentalOption);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const maxBudget = useEligrStore((state) => state.search.maxBudget);
  const isPremium = useEligrStore((state) => state.search.isPremium);
  const activeCount = getActiveOptions(rentalOptions).length;
  const blocked = !isPremium && activeCount >= FREE_TIER_LIMITS.rentalOptions;
  const firstSession = activeCount === 0;
  const needsSecond = activeCount === 1;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(String(maxBudget));
  const [zone, setZone] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const save = () => {
    const trimmedTitle = title.trim();
    const trimmedZone = zone.trim();
    const monthlyPrice = Number(price);

    if (trimmedTitle.length < 3) {
      showAlert("Título corto", "Pon un título reconocible (mínimo 3 caracteres).");
      return;
    }
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      showAlert("Precio inválido", "El precio mensual debe ser mayor que 0.");
      return;
    }
    if (trimmedZone.length < 2) {
      showAlert("Zona requerida", "Añade barrio o zona (mínimo 2 caracteres).");
      return;
    }

    const countBefore = activeCount;
    const added = addRentalOption(
      buildQuickAddRental({
        title: trimmedTitle,
        monthlyPrice,
        locationLabel: trimmedZone,
        photoUri,
      }),
    );
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
    <Screen testID="quick-add-screen">
      <View style={styles.topBar}>
        <ScreenHeader
          eyebrow="Añadir rápido"
          title={
            firstSession
              ? "Tu primera opción en un minuto"
              : needsSecond
                ? "Segunda opción al vuelo"
                : "Solo lo esencial"
          }
          description={
            firstSession
              ? "Título, precio y zona bastan para empezar. Podrás pegar anuncios o completar trayecto y visita después."
              : needsSecond
                ? "Un dato más y tendrás ranking. Si tienes el texto del portal, pegar anuncio detecta más campos."
                : "Título, precio, zona y foto opcional. El trayecto se estima (~75 min) hasta que lo edites."
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

      <Button label="Volver" variant="ghost" icon="arrow-back-outline" onPress={() => router.back()} testID="quick-add-back" />

      {firstSession ? (
        <Card variant="accent" style={styles.nudge} testID="quick-add-first-nudge">
          <Text variant="subtitle">0 → 1 → 2 opciones</Text>
          <Text>Guarda esta opción y repite con otra. Con dos activas Eligr muestra ranking, pros y contras.</Text>
          <Button
            label="Prefiero pegar anuncio"
            variant="secondary"
            icon="clipboard-outline"
            onPress={() => router.replace("/rental/new")}
            testID="quick-add-paste-link"
          />
        </Card>
      ) : null}

      {needsSecond ? (
        <Card variant="accent" style={styles.nudge} testID="quick-add-second-nudge">
          <Text variant="subtitle">1 de 2 para comparar</Text>
          <Text>Esta será tu segunda opción. Al guardar iremos al ranking para ver quién va ganando.</Text>
          <Button
            label="Pegar anuncio en su lugar"
            variant="secondary"
            icon="clipboard-outline"
            onPress={() => router.replace("/rental/new")}
            testID="quick-add-paste-link"
          />
        </Card>
      ) : null}

      {blocked ? (
        <FreeLimitCard activeCount={activeCount} />
      ) : (
        <Card style={styles.form} testID="quick-add-form-card">
          <RentalPhotoPicker value={photoUri} onChange={setPhotoUri} />
          <Input label="Título" value={title} onChangeText={setTitle} placeholder="Habitación en Chamberí" testID="quick-add-title" />
          <Input
            label="Precio (€/mes)"
            value={price}
            onChangeText={setPrice}
            placeholder="750"
            keyboardType="numeric"
            testID="quick-add-price"
          />
          <Input label="Zona" value={zone} onChangeText={setZone} placeholder="Chamberí, Madrid" testID="quick-add-zone" />
          <Text variant="caption">El trayecto se estimará (~75 min) hasta que lo edites. El resto usa valores razonables.</Text>
          <Button label="Guardar opción" icon="checkmark-outline" onPress={save} testID="quick-add-save" />
          <Button
            label="Pegar anuncio completo"
            variant="secondary"
            icon="clipboard-outline"
            onPress={() => router.replace("/rental/new")}
            testID="quick-add-full-paste"
          />
        </Card>
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
    form: {
      gap: spacing.md,
    },
  });
}
