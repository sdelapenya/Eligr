import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, View, Image } from "react-native";

import { getBudgetFit, getBudgetFitLabel } from "@/domain/budget";
import { isDiscarded } from "@/domain/filters";
import { statusLabels } from "@/domain/labels";
import { ScoreContribution } from "@/domain/score-breakdown";
import { getVisitChecklistSummary } from "@/domain/visit-checklist";
import { DEFAULT_COMMUTE_MINUTES, getMonthlyTotal, getMoveInCost, usesEstimatedCommute } from "@/domain/rental-costs";
import { RentalOption, RentalScore } from "@/domain/types";
import { useEligrStore } from "@/store/useEligrStore";
import { showRentalQuickActions } from "@/utils/rental-quick-actions";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export type RentalCardProps = {
  option: RentalOption;
  score: RentalScore;
  rank?: number;
  maxBudget?: number;
  scoreContributions?: ScoreContribution[];
  compact?: boolean;
};

function RentalCardComponent({ option, score, rank, maxBudget, scoreContributions, compact = false }: RentalCardProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const setStatus = useEligrStore((state) => state.setStatus);
  const scoreTone = score.overallScore >= 75 ? colors.scoreHigh : score.overallScore >= 55 ? colors.scoreMid : colors.warning;
  const discarded = isDiscarded(option);
  const budgetFit = maxBudget ? getBudgetFit(option, maxBudget) : null;
  const estimatedCommute = usesEstimatedCommute(option);

  const openQuickActions = () => {
    showRentalQuickActions(option, { setStatus });
  };

  return (
    <Pressable
      testID={`rental-card-${option.id}`}
      onPress={() => router.push(`/rental/${option.id}`)}
      onLongPress={compact ? openQuickActions : undefined}
      delayLongPress={400}
      accessibilityHint={compact ? "Mantén pulsado para acciones rápidas" : undefined}
    >
      {({ pressed }) => (
        <Card
          style={{
            ...(pressed ? styles.pressed : undefined),
            ...(discarded ? styles.discarded : undefined),
            ...(rank === 1 ? styles.topRank : undefined),
          }}
        >
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              {option.photoUri ? (
                <Image source={{ uri: option.photoUri }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
              ) : null}
              {rank ? (
                <View style={[styles.rankBadge, rank === 1 && styles.rankBadgeTop]}>
                  <Text variant="caption" style={rank === 1 ? styles.rankBadgeTopText : undefined}>
                    #{rank}
                  </Text>
                </View>
              ) : null}
              <Text variant="subtitle" numberOfLines={2}>
                {option.title}
              </Text>
              <Text variant="caption">
                {option.locationLabel} · {statusLabels[option.status]} · {getVisitChecklistSummary(option.visitChecklist)}
              </Text>
            </View>
            <View style={[styles.scorePill, score.orientative && styles.scorePillOrientative, { backgroundColor: score.orientative ? colors.inkSoft : scoreTone }]}>
              <Text variant="caption" style={score.orientative ? styles.scoreLabelMuted : styles.scoreLabel}>
                {score.orientative ? "Orientativo" : "Puntos"}
              </Text>
              <Text variant="subtitle" style={score.orientative ? styles.scoreTextMuted : styles.scoreText}>
                {score.orientative ? "—" : score.overallScore}
              </Text>
            </View>
          </View>
          <View style={styles.metaGrid}>
            <Metric colors={colors} icon="cash-outline" label={`${getMonthlyTotal(option)} €/mes`} />
            <Metric colors={colors} icon="key-outline" label={`${getMoveInCost(option)} € inicial`} />
            <Metric
              colors={colors}
              icon="train-outline"
              label={estimatedCommute ? `~${DEFAULT_COMMUTE_MINUTES} min est.` : `${option.commuteMinutes} min`}
            />
          </View>
          <View style={styles.badges}>
            {estimatedCommute ? <Badge label="Trayecto estimado" tone="warning" /> : null}
            {budgetFit === "over" ? <Badge label={getBudgetFitLabel(budgetFit)} tone="warning" /> : null}
            {discarded ? <Badge label="Descartado" tone="neutral" /> : null}
            {!compact
              ? score.badges.map((badge) => (
                  <Badge
                    key={badge}
                    label={badge}
                    tone={badge === "Revisar" ? "warning" : badge === "Orientativo" ? "neutral" : "good"}
                  />
                ))
              : score.badges.includes("Revisar") ? (
                  <Badge label="Revisar" tone="warning" />
                ) : null}
          </View>
          {!compact && scoreContributions && scoreContributions.length > 0 ? (
            <View style={styles.contributions}>
              <Text variant="caption">Top criterios</Text>
              <View style={styles.contributionRow}>
                {scoreContributions.map((item) => (
                  <Badge key={item.key} label={`${item.label} +${item.weightedPoints}`} tone="neutral" />
                ))}
              </View>
            </View>
          ) : null}
          {!compact ? <Text numberOfLines={3}>{score.explanation}</Text> : null}
          {!compact ? (
            <View style={styles.footer}>
              <Text variant="caption">Ver detalle</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          ) : null}
        </Card>
      )}
    </Pressable>
  );
}

function Metric({
  colors,
  icon,
  label,
}: {
  colors: ColorPalette;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderLight,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.sm,
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
      }}
    >
      <Ionicons name={icon} size={15} color={colors.accent} />
      <Text variant="caption" style={{ color: colors.text }}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.995 }],
    },
    discarded: {
      opacity: 0.72,
    },
    topRank: {
      borderColor: colors.accentSoft,
      borderWidth: 1,
    },
    rankBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    rankBadgeTop: {
      backgroundColor: colors.accentMuted,
    },
    rankBadgeTopText: {
      color: colors.accentDeep,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    titleWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    thumb: {
      borderRadius: radius.sm,
      height: 56,
      marginBottom: spacing.xs,
      width: 56,
    },
    scorePill: {
      alignItems: "center",
      borderRadius: radius.sm,
      justifyContent: "center",
      minHeight: 52,
      minWidth: 58,
      paddingHorizontal: spacing.sm,
    },
    scorePillOrientative: {
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
    },
    scoreLabel: {
      color: "rgba(255,255,255,0.82)",
      fontSize: 10,
    },
    scoreLabelMuted: {
      color: colors.muted,
      fontSize: 10,
    },
    scoreText: {
      color: colors.surface,
    },
    scoreTextMuted: {
      color: colors.text,
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    contributions: {
      gap: spacing.xs,
    },
    contributionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      justifyContent: "flex-end",
    },
  });
}

export const RentalCard = memo(RentalCardComponent);
