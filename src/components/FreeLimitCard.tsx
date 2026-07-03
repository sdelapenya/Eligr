import { Href, router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { FREE_TIER_LIMITS } from "@/domain/limits";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";

type FreeLimitCardProps = {
  activeCount: number;
  onViewDiscarded?: () => void;
};

export function FreeLimitCard({ activeCount, onViewDiscarded }: FreeLimitCardProps) {
  return (
    <Card variant="muted" testID="free-limit-card">
      <Text variant="subtitle">Límite free alcanzado</Text>
      <Text>
        Tienes {activeCount} de {FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna, recupera una
        descartada o activa el preview premium para seguir añadiendo.
      </Text>
      <View style={styles.actions}>
        {onViewDiscarded ? (
          <Button label="Ver descartadas" variant="secondary" icon="archive-outline" onPress={onViewDiscarded} />
        ) : null}
        <Button
          label="Ver premium"
          variant="secondary"
          icon="sparkles-outline"
          onPress={() => router.push("/(tabs)/premium" as Href)}
          testID="free-limit-premium-button"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
