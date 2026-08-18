import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useStoreHydration } from "@/store/useStoreHydration";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export function StoreGate({ children }: PropsWithChildren) {
  const { colors } = useThemeColors();
  const { phase, error, retry } = useStoreHydration();

  if (phase !== "ready") {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text variant="subtitle">{error ? "No pudimos recuperar tus datos" : "Cargando tu comparación..."}</Text>
        <Text variant="caption">
          {error
            ? "Tus datos no se han sustituido. Reintenta la lectura antes de continuar."
            : phase === "slow"
              ? "Está tardando más de lo normal. Puedes reintentar sin perder los datos guardados."
              : "Recuperando búsqueda y opciones guardadas."}
        </Text>
        {phase === "error" || phase === "slow" ? (
          <Button label="Reintentar" variant="secondary" onPress={retry} />
        ) : null}
      </View>
    );
  }

  return <View style={[styles.ready, { backgroundColor: colors.background }]} testID="store-gate-ready">{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  ready: {
    flex: 1,
  },
});
