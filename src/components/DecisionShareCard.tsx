import { forwardRef, useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

import { getMonthlyTotal, getMoveInCost } from "@/domain/rental-costs";
import { RentalScore, RentalSearch, RentalOption } from "@/domain/types";
import { EligrLogo } from "@/components/EligrLogo";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type DecisionShareCardProps = {
  search: RentalSearch;
  option: RentalOption;
  score: RentalScore;
};

export const DecisionShareCard = forwardRef<View, DecisionShareCardProps>(function DecisionShareCard(
  { search, option, score },
  ref,
) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View ref={ref} collapsable={false} testID="decision-share-card-wrap">
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <EligrLogo size="sm" />
          <Badge label="Mi elección" tone="good" />
        </View>
        <Text variant="subtitle">{option.title}</Text>
        <Text variant="caption">
          {search.title} · {search.city}
        </Text>

        {option.photoUri ? (
          <Image source={{ uri: option.photoUri }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : null}

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text variant="caption">Puntuación</Text>
            <Text variant="subtitle">{score.orientative ? "Orientativa" : `${score.overallScore}/100`}</Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption">Mensual</Text>
            <Text variant="subtitle">{getMonthlyTotal(option)} €</Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption">Inicial</Text>
            <Text variant="subtitle">{getMoveInCost(option)} €</Text>
          </View>
        </View>

        <View style={styles.recommendation}>
          <Text variant="caption">Por qué esta opción</Text>
          <Text numberOfLines={4}>{score.explanation}</Text>
        </View>

        <Text variant="caption" style={styles.footer}>
          Compara alquileres. Decide mejor. · Eligr
        </Text>
      </Card>
    </View>
  );
});

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 1,
      gap: spacing.md,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    photo: {
      borderRadius: radius.md,
      height: 140,
      width: "100%",
    },
    metrics: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    metric: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.sm,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.sm,
    },
    recommendation: {
      backgroundColor: colors.accentMuted,
      borderRadius: radius.md,
      gap: spacing.xs,
      padding: spacing.md,
    },
    footer: {
      color: colors.muted,
      textAlign: "center",
    },
  });
}
