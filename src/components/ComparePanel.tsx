import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { CompareInsight, RentalComparison } from "@/domain/compare";
import { RentalOption } from "@/domain/types";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type ComparePanelProps = {
  optionA: RentalOption;
  optionB: RentalOption;
  comparison: RentalComparison;
};

export function ComparePanel({ optionA, optionB, comparison }: ComparePanelProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap} testID="compare-panel" accessibilityLabel="Resultado de la comparación">
      <Card variant="accent">
        <Text variant="subtitle">Veredicto</Text>
        <Text>{comparison.headline}</Text>
        <View style={styles.scoreRow}>
          <ScorePill styles={styles} title={optionA.title} score={comparison.scoreA} highlight={comparison.winner === "a"} />
          <Text variant="caption">vs</Text>
          <ScorePill styles={styles} title={optionB.title} score={comparison.scoreB} highlight={comparison.winner === "b"} />
        </View>
      </Card>

      <View style={styles.insights}>
        {comparison.insights.map((insight) => (
          <InsightRow key={insight.label} styles={styles} insight={insight} titleA={optionA.title} titleB={optionB.title} />
        ))}
      </View>
    </View>
  );
}

function ScorePill({
  styles,
  title,
  score,
  highlight,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  score: number;
  highlight: boolean;
}) {
  return (
    <View style={[styles.scorePill, highlight && styles.scorePillHighlight]}>
      <Text variant="caption" numberOfLines={2}>
        {title}
      </Text>
      <Text variant="title">{score}</Text>
    </View>
  );
}

function InsightRow({
  styles,
  insight,
  titleA,
  titleB,
}: {
  styles: ReturnType<typeof createStyles>;
  insight: CompareInsight;
  titleA: string;
  titleB: string;
}) {
  return (
    <Card variant="muted">
      <View style={styles.insightHeader}>
        <Text variant="subtitle">{insight.label}</Text>
        {insight.winner !== "tie" ? (
          <Badge label={insight.winner === "a" ? "Gana A" : "Gana B"} tone="good" />
        ) : (
          <Badge label="Empate" />
        )}
      </View>
      <View style={styles.values}>
        <ValueCell styles={styles} label={titleA} value={insight.detailA} winner={insight.winner === "a"} />
        <ValueCell styles={styles} label={titleB} value={insight.detailB} winner={insight.winner === "b"} />
      </View>
      <Text variant="caption">{insight.summary}</Text>
    </Card>
  );
}

function ValueCell({
  styles,
  label,
  value,
  winner,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  winner: boolean;
}) {
  return (
    <View style={[styles.valueCell, winner && styles.valueCellWinner]}>
      <Text variant="caption" numberOfLines={2}>
        {label}
      </Text>
      <Text variant="subtitle">{value}</Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
    },
    scoreRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    scorePill: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    scorePillHighlight: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    insights: {
      gap: spacing.sm,
    },
    insightHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    values: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    valueCell: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.sm,
    },
    valueCellWinner: {
      backgroundColor: colors.accentSoft,
    },
  });
}
