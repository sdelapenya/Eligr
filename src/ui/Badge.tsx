import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { radius, spacing } from "./theme";
import { useThemeColors } from "./theme-context";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          alignSelf: "flex-start",
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        neutral: { backgroundColor: colors.inkSoft },
        good: { backgroundColor: colors.accentSoft },
        warning: { backgroundColor: colors.warningSoft },
        danger: { backgroundColor: colors.dangerSoft },
        goodText: { color: colors.accent },
        warningText: { color: colors.warning, fontWeight: "700" },
        dangerText: { color: colors.danger, fontWeight: "700" },
      }),
    [colors],
  );

  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text
        variant="caption"
        style={
          tone === "good"
            ? styles.goodText
            : tone === "warning"
              ? styles.warningText
              : tone === "danger"
                ? styles.dangerText
                : undefined
        }
      >
        {label}
      </Text>
    </View>
  );
}
