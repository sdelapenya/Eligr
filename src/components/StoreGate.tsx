import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useStoreHydration } from "@/store/useStoreHydration";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export function StoreGate({ children }: PropsWithChildren) {
  const { colors } = useThemeColors();
  const ready = useStoreHydration();

  if (!ready) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text variant="subtitle">Cargando tu comparación...</Text>
        <Text variant="caption">Recuperando búsqueda y opciones guardadas.</Text>
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
