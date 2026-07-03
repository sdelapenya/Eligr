import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { getAssistantFocus, getJourneySteps } from "@/domain/assistant-journey";
import { RentalOption, RentalSearch } from "@/domain/types";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type AssistantPanelProps = {
  search: RentalSearch;
  rentalOptions: RentalOption[];
  nextStep?: ReactNode;
  defaultCollapsed?: boolean;
};

export function AssistantPanel({ search, rentalOptions, nextStep, defaultCollapsed = false }: AssistantPanelProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const steps = getJourneySteps(search, rentalOptions);
  const focus = getAssistantFocus(search, rentalOptions);
  const currentIndex = steps.findIndex((s) => s.current);
  const progress = currentIndex >= 0 ? (currentIndex + 1) / steps.length : 0;
  const phaseLabel = steps.find((s) => s.current)?.label ?? "Eligr";

  return (
    <Card variant="accent" style={styles.card} testID="assistant-panel">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.headerRow}
      >
        <View style={styles.headerCopy}>
          <Text variant="label">Tu asistente</Text>
          {!expanded ? <Text variant="caption">{focus.title}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          <View style={styles.phasePill}>
            <Text variant="caption" style={styles.phaseText}>
              {phaseLabel}
            </Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.accentDeep} />
        </View>
      </Pressable>

      {expanded ? (
        <>
          <Text variant="subtitle">{focus.title}</Text>
          <Text>{focus.body}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View style={styles.steps}>
            {steps.map((step) => (
              <View key={step.id} style={styles.step}>
                <View style={[styles.dot, step.done && styles.dotDone, step.current && styles.dotCurrent]} />
                <Text variant="caption" style={step.current ? styles.stepLabelCurrent : undefined} numberOfLines={1}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              label={focus.primaryLabel}
              icon={
                focus.primaryRoute === "/visit"
                  ? "footsteps-outline"
                  : focus.primaryRoute === "/ranking"
                    ? "podium-outline"
                    : focus.primaryRoute === "/rental/new"
                      ? "clipboard-outline"
                      : "sparkles-outline"
              }
              onPress={() => router.push(focus.primaryRoute as Href)}
              testID={focus.primaryRoute === "/rental/new" ? "assistant-paste-button" : undefined}
            />
            {focus.secondaryLabel && focus.secondaryRoute ? (
              <Button
                label={focus.secondaryLabel}
                variant="secondary"
                icon={
                  focus.secondaryRoute === "/compare"
                    ? "git-compare-outline"
                    : focus.secondaryRoute === "/rental/quick"
                      ? "flash-outline"
                      : "add-outline"
                }
                onPress={() => router.push(focus.secondaryRoute! as Href)}
              />
            ) : null}
          </View>

          {nextStep ? (
            <View style={styles.nextStepSection}>
              <View style={styles.nextStepDivider} />
              {nextStep}
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
      paddingRight: spacing.sm,
    },
    headerActions: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    phasePill: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    phaseText: {
      color: colors.accentDeep,
      fontWeight: "700",
    },
    progressTrack: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      height: 6,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: colors.accentDeep,
      height: "100%",
    },
    steps: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    step: {
      alignItems: "center",
      flex: 1,
      gap: spacing.xs,
    },
    dot: {
      backgroundColor: colors.border,
      borderRadius: radius.pill,
      height: 8,
      width: 8,
    },
    dotDone: {
      backgroundColor: colors.accent,
    },
    dotCurrent: {
      backgroundColor: colors.accentDeep,
      height: 10,
      width: 10,
    },
    stepLabelCurrent: {
      color: colors.accentDeep,
      fontWeight: "700",
    },
    actions: {
      gap: spacing.sm,
    },
    nextStepSection: {
      gap: spacing.md,
    },
    nextStepDivider: {
      backgroundColor: colors.borderLight,
      height: StyleSheet.hairlineWidth,
    },
  });
}
