import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type ScoreBarProps = {
  label: string;
  /** Valor de la barra (normalmente 0–100 del criterio). */
  value: number;
  max?: number;
  /** Texto a la derecha, p.ej. "70 → +14 pts". */
  detail?: string;
};

export function ScoreBar({ label, value, max = 100, detail }: ScoreBarProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percent = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 4;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
        <Text variant="caption">{detail ?? String(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.xs,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    label: {
      flex: 1,
    },
    track: {
      backgroundColor: colors.inkSoft,
      borderRadius: radius.sm,
      height: 10,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: colors.accentDeep,
      borderRadius: radius.sm,
      height: 8,
    },
  });
}
