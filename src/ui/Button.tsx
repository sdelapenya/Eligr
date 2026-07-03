import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { useMemo } from "react";

import { Text } from "./Text";
import { radius, spacing } from "./theme";
import { useThemeColors } from "./theme-context";

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
};

export function Button({ label, onPress, icon, variant = "primary", style, disabled, testID }: ButtonProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          alignItems: "center",
          borderRadius: radius.lg,
          flexDirection: "row",
          gap: spacing.sm,
          justifyContent: "center",
          minHeight: 50,
          paddingHorizontal: spacing.lg,
        },
        primary: { backgroundColor: colors.accentDeep },
        secondary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        ghost: { backgroundColor: "transparent" },
        danger: { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderWidth: StyleSheet.hairlineWidth },
        pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
        disabled: { opacity: 0.45 },
        label: { fontSize: 15, fontWeight: "800", color: colors.text, fontFamily: "DMSans_700Bold" },
        primaryLabel: { color: colors.surface, fontFamily: "DMSans_700Bold" },
        dangerLabel: { color: colors.danger, fontFamily: "DMSans_700Bold" },
      }),
    [colors],
  );

  const iconColor = variant === "primary" ? colors.surface : variant === "danger" ? colors.danger : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
      <Text style={[styles.label, variant === "primary" && styles.primaryLabel, variant === "danger" && styles.dangerLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}
