import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { getMonthlyTotal } from "@/domain/rental-costs";
import { RentalScore, RentalSearch, RentalOption } from "@/domain/types";
import { EligrLogo } from "@/components/EligrLogo";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type RankedOption = { option: RentalOption; score: RentalScore };

type RankingShareCardProps = {
  search: RentalSearch;
  ranking: RankedOption[];
  limit?: number;
};

const medals = ["🥇", "🥈", "🥉"] as const;

export const RankingShareCard = forwardRef<View, RankingShareCardProps>(function RankingShareCard(
  { search, ranking, limit = 3 },
  ref,
) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slice = ranking.slice(0, limit);

  if (slice.length === 0) return null;

  return (
    <View ref={ref} collapsable={false} testID="ranking-share-card-wrap">
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <EligrLogo size="sm" />
          <Text variant="caption">Top {slice.length} · {search.city}</Text>
        </View>
        <Text variant="subtitle">{search.title}</Text>
        <Text variant="caption">Presupuesto {search.maxBudget} €/mes</Text>

        <View style={styles.list}>
          {slice.map(({ option, score }, index) => (
            <View key={option.id} style={styles.row}>
              <Text style={styles.medal}>{medals[index] ?? `${index + 1}.`}</Text>
              <View style={styles.rowCopy}>
                <Text numberOfLines={2}>{option.title}</Text>
                <Text variant="caption">
                  {score.orientative ? "Orientativo" : `${score.overallScore}/100`} · {getMonthlyTotal(option)} €/mes
                </Text>
              </View>
              {score.warnings.length > 0 ? (
                <Badge label={`${score.warnings.length}`} tone="warning" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
              )}
            </View>
          ))}
        </View>

        {slice[0] ? (
          <View style={styles.recommendation}>
            <Text variant="caption">Recomendación</Text>
            <Text numberOfLines={3}>{slice[0].score.explanation}</Text>
          </View>
        ) : null}

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
    list: {
      gap: spacing.sm,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    medal: {
      fontSize: 20,
      width: 28,
    },
    rowCopy: {
      flex: 1,
      gap: 2,
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
