import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ListSortMode, listSortLabels, listSortOrder } from "@/domain/list-sort";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type ListSortChipsProps = {
  value: ListSortMode;
  onChange: (mode: ListSortMode) => void;
};

export function ListSortChips({ value, onChange }: ListSortChipsProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {listSortOrder.map((mode) => {
        const active = value === mode;
        return (
          <Pressable key={mode} onPress={() => onChange(mode)} style={[styles.chip, active && styles.chipActive]}>
            <Text variant="caption" style={active ? styles.chipTextActive : undefined}>
              {listSortLabels[mode]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    chipTextActive: {
      color: colors.accentDeep,
      fontWeight: "700",
    },
  });
}
