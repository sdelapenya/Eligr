import { useMemo } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { Text } from "./Text";
import { radius, spacing } from "./theme";
import { useThemeColors } from "./theme-context";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: { gap: spacing.xs },
        input: {
          backgroundColor: colors.inkSoft,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          color: colors.text,
          fontSize: 15,
          minHeight: 44,
          paddingHorizontal: spacing.md,
        },
        inputError: { borderColor: colors.danger },
        error: { color: colors.danger },
      }),
    [colors],
  );

  return (
    <View style={styles.field}>
      {label ? <Text variant="caption">{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : undefined, style]}
      />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
