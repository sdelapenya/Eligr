import { PropsWithChildren, useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { radius, shadows, spacing } from "./theme";
import { useThemeColors } from "./theme-context";

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
  variant?: "default" | "muted" | "accent" | "elevated";
  testID?: string;
}>;

export function Card({ children, style, variant = "default", testID }: CardProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          gap: spacing.md,
          padding: spacing.lg,
        },
        default: {},
        muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        accent: { backgroundColor: colors.accentMuted, borderColor: colors.accent, borderWidth: 1 },
        elevated: { backgroundColor: colors.surface, borderColor: "transparent" },
      }),
    [colors],
  );
  const shadow = variant === "elevated" ? shadows.cardLifted : shadows.card;

  return (
    <View testID={testID} style={[styles.card, variant !== "default" ? styles[variant] : null, shadow, style]}>
      {children}
    </View>
  );
}
