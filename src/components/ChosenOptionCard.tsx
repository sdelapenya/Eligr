import { Href, router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

import { getScoringPool } from "@/domain/filters";
import { getMonthlyTotal, getMoveInCost } from "@/domain/rental-costs";
import { getScoreContext } from "@/domain/score-context";
import { buildChosenOptionSummary } from "@/domain/summary";
import { scoreRental } from "@/domain/scoring";
import { RentalOption } from "@/domain/types";
import { useEligrStore } from "@/store/useEligrStore";
import { shareContent } from "@/utils/share-content";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";

type ChosenOptionCardProps = {
  option: RentalOption;
  compact?: boolean;
  showSummaryLink?: boolean;
};

export function ChosenOptionCard({ option, compact = false, showSummaryLink = true }: ChosenOptionCardProps) {
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const clearChosenOption = useEligrStore((state) => state.clearChosenOption);
  const pool = getScoringPool(rentalOptions);
  const score = scoreRental(option, pool, search.priorities, getScoreContext(search));

  const shareDecision = async () => {
    await shareContent({
      message: buildChosenOptionSummary(search, option, score),
      title: "Mi elección Eligr",
    });
  };

  return (
    <Card variant="accent" testID="chosen-option-card">
      <Text variant="label">Tu elección</Text>
      <View style={styles.row}>
        {option.photoUri ? (
          <Image source={{ uri: option.photoUri }} style={styles.thumb} resizeMode="cover" accessibilityLabel={`Foto de ${option.title}`} />
        ) : null}
        <View style={styles.copy}>
          <Text variant="subtitle">{option.title}</Text>
          <Text variant="caption">{option.locationLabel}</Text>
          {!compact ? (
            <>
              <Text>
                {getMonthlyTotal(option)} €/mes · {getMoveInCost(option)} € inicial
                {score.orientative ? "" : ` · ${score.overallScore}/100`}
              </Text>
              {score.warnings.length > 0 ? <Badge label={`${score.warnings.length} aviso${score.warnings.length === 1 ? "" : "s"}`} tone="warning" /> : null}
            </>
          ) : null}
        </View>
      </View>
      {!compact && option.visitNextAction ? <Text variant="caption">Siguiente paso: {option.visitNextAction}</Text> : null}
      <View style={styles.actions}>
        <Button label="Ver detalle" variant="secondary" icon="open-outline" onPress={() => router.push(`/rental/${option.id}`)} />
        {compact ? (
          <Button label="Resumen completo" variant="secondary" icon="document-text-outline" onPress={() => router.push("/decision" as Href)} />
        ) : null}
        {!compact ? (
          <Button label="Compartir decisión" variant="secondary" icon="share-outline" onPress={shareDecision} testID="share-decision-button" />
        ) : null}
        {!compact && showSummaryLink ? (
          <Button label="Resumen completo" variant="ghost" icon="document-text-outline" onPress={() => router.push("/decision" as Href)} />
        ) : null}
        {!compact ? <Button label="Quitar elección" variant="ghost" onPress={clearChosenOption} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  thumb: {
    borderRadius: radius.sm,
    height: 72,
    width: 72,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
