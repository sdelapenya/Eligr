import { PropsWithChildren, useMemo } from "react";
import { StyleSheet, Text as RNText, TextProps as RNTextProps } from "react-native";

import { typography } from "./theme";
import { useThemeColors } from "./theme-context";

type TextProps = PropsWithChildren<RNTextProps & { variant?: "title" | "subtitle" | "body" | "caption" | "label" }>;

export function Text({ variant = "body", style, children, ...props }: TextProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: { color: colors.text },
        title: { ...typography.title, color: colors.text },
        subtitle: { ...typography.subtitle, color: colors.text },
        body: { ...typography.body, color: colors.textSecondary },
        caption: { ...typography.caption, color: colors.muted },
        label: { ...typography.label, color: colors.muted, textTransform: "uppercase" },
      }),
    [colors],
  );

  return (
    <RNText {...props} style={[styles.base, styles[variant], style]}>
      {children}
    </RNText>
  );
}
