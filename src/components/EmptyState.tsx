import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type EmptyStateAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
};

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  steps?: string[];
  actionLabel?: string;
  onAction?: () => void;
  actions?: EmptyStateAction[];
  testID?: string;
};

export function EmptyState({ title, body, icon = "albums-outline", steps, actionLabel, onAction, actions, testID }: EmptyStateProps) {
  const { colors } = useThemeColors();
  const resolvedActions =
    actions ??
    (actionLabel && onAction ? [{ label: actionLabel, onPress: onAction, variant: "primary" as const, icon: "add-outline" as const }] : []);

  return (
    <Card variant="elevated" style={styles.card} testID={testID}>
      <View style={[styles.iconRing, { borderColor: colors.accentSoft, backgroundColor: colors.accentMuted }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={32} color={colors.accentDeep} />
        </View>
      </View>
      <Text variant="subtitle" style={styles.title}>
        {title}
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
      {steps && steps.length > 0 ? (
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.accent }]}>
                <Text variant="caption" style={{ color: colors.surface }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {resolvedActions.length > 0 ? (
        <View style={styles.actions}>
          {resolvedActions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              onPress={action.onPress}
              variant={action.variant ?? "primary"}
              icon={action.icon}
              testID={action.testID}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.md,
  },
  iconRing: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: spacing.xs,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  title: {
    textAlign: "center",
  },
  body: {
    textAlign: "center",
  },
  steps: {
    alignSelf: "stretch",
    gap: spacing.sm,
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: spacing.xs,
  },
  stepText: {
    flex: 1,
    paddingTop: 2,
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.sm,
  },
});
